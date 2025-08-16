// netlify/functions/save-media.ts
// One-stop "save + record" endpoint.
// - Accepts generated media variations (from AIML).
// - Uploads them to Cloudinary (by remote URL).
// - If Authorization present, records them in DB.
// - Returns canonical items used by feed + UI.
// Compatible with Netlify Functions v1/v2.

import type { Handler } from '@netlify/functions'
import crypto from 'crypto'

// ---- Cloudinary ----
import { v2 as cloudinary } from 'cloudinary'

// ---- DB (Netlify DB/Neon) ----
import { neon } from '@neondatabase/serverless'

// ---- Auth helper ----
import { requireUser, resp, handleCORS, sanitizeDatabaseUrl } from './_auth'

// ---- ENV ----
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  NETLIFY_DATABASE_URL,
} = process.env

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
})

// ---- Database connection with safe URL sanitization ----
const cleanDbUrl = sanitizeDatabaseUrl(NETLIFY_DATABASE_URL || '');
if (!cleanDbUrl) {
  throw new Error('NETLIFY_DATABASE_URL environment variable is required');
}
const sql = neon(cleanDbUrl);

type Variation = {
  url: string            // remote HTTPS URL from AIML or temp storage
  type?: 'image' | 'video' | 'gif' | string
  meta?: Record<string, any>
}

type SaveMediaRequest = {
  runId?: string
  presetId?: string
  allowPublish?: boolean
  source?: { url?: string }           // optional original
  variations: Variation[]             // REQUIRED
  tags?: string[]
  extra?: Record<string, any>
}

type CanonicalItem = {
  cloudinary_public_id: string
  secure_url: string
  resource_type: string
  format?: string
  bytes?: number
  width?: number
  height?: number
  folder?: string
  // convenient mirrors
  media_type: 'image' | 'video' | 'raw'
  final: string
  meta?: Record<string, any>
}

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'POST') {
    return resp(405, { error: 'Method not allowed' })
  }

  // ---- Parse input ----
  let body: SaveMediaRequest
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return resp(400, { error: 'Invalid JSON body' })
  }

  if (!body?.variations?.length) {
    return resp(400, { error: 'No variations provided' })
  }

  // ---- Auth check using new helper ----
  const user = requireUser(context)
  if (!user) {
    return resp(401, { error: 'Unauthorized' })
  }

  // ---- Validate URLs ----
  const validVariations = body.variations.filter(v => {
    return v.url && v.url.startsWith('https://') && !v.url.startsWith('blob:')
  })

  if (!validVariations.length) {
    return resp(400, { error: 'No valid HTTPS URLs provided' })
  }

  // ---- Process variations ----
  const results: CanonicalItem[] = []
  const errors: string[] = []

  for (const variation of validVariations) {
    try {
      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(variation.url, {
        folder: 'stefna',
        resource_type: 'auto',
        overwrite: false,
        unique_filename: true,
      })

      const item: CanonicalItem = {
        cloudinary_public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        resource_type: uploadResult.resource_type,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        folder: uploadResult.folder,
        media_type: uploadResult.resource_type as any,
        final: uploadResult.secure_url,
        meta: variation.meta,
      }

      results.push(item)

      // Save to database using new schema
      try {
        await sql`
          INSERT INTO media_assets (
            id, owner_id, url, public_id, resource_type, 
            folder, bytes, width, height, meta, 
            created_at, updated_at, visibility, env
          ) VALUES (
            ${crypto.randomUUID()}, ${user.id}, ${item.secure_url}, 
            ${item.cloudinary_public_id}, ${item.resource_type}, 
            ${item.folder || 'stefna'}, ${item.bytes || 0}, 
            ${item.width || 0}, ${item.height || 0}, 
            ${JSON.stringify(item.meta || {})}, 
            NOW(), NOW(), 'private', 'production'
          )
        `
      } catch (dbError) {
        console.error('Database error:', dbError)
        // Continue with upload even if DB save fails
      }

    } catch (uploadError) {
      console.error('Upload error for:', variation.url, uploadError)
      errors.push(`Failed to upload: ${variation.url}`)
    }
  }

  if (results.length === 0) {
    return resp(500, { error: 'All uploads failed', errors })
  }

  return resp(200, {
    ok: true,
    results,
    errors: errors.length > 0 ? errors : undefined,
  })
}
