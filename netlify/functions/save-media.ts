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
import { requireJWTUser, resp, handleCORS, sanitizeDatabaseUrl } from './_auth'

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
  url?: string            // remote HTTPS URL from AIML or temp storage
  image_url?: string      // alternative field name from AIML
  type?: 'image' | 'video' | 'gif' | string
  media_type?: string     // alternative field name
  is_public?: boolean     // whether media should be public
  thumb_url?: string      // thumbnail URL
  thumbnail?: string      // alternative thumbnail field
  meta?: Record<string, any>
}

type SaveMediaRequest = {
  runId?: string
  presetId?: string
  allowPublish?: boolean
  source?: { url?: string }           // optional original
  variations?: Variation[]             // REQUIRED
  // Also accept single media item
  url?: string
  image_url?: string
  type?: string
  media_type?: string
  is_public?: boolean
  thumb_url?: string
  thumbnail?: string
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

  // ---- Auth check using JWT ----
  const user = requireJWTUser(event)
  if (!user) {
    return resp(401, { error: 'Unauthorized - Invalid or missing JWT token' })
  }

  // ---- Extract media items ----
  let mediaItems: Variation[] = []
  
  // Check if it's a single media item - accept both url and image_url
  if (body.url || body.image_url) {
    mediaItems = [{
      url: body.url || body.image_url,
      type: body.type || body.media_type || 'image',
      is_public: body.is_public ?? true,
      thumb_url: body.thumb_url || body.thumbnail,
      meta: body.extra || {}
    }]
  } else if (body.variations && body.variations.length > 0) {
    // Multiple variations
    mediaItems = body.variations.map(v => ({
      url: v.url || v.image_url,
      type: v.type || v.media_type || 'image',
      is_public: v.is_public ?? true,
      thumb_url: v.thumb_url || v.thumbnail,
      meta: v.meta || {}
    }))
  }

  if (!mediaItems.length) {
    return resp(400, { error: 'No media items provided. Send url/image_url or variations array.' })
  }

  // ---- Validate URLs ----
  const validItems = mediaItems.filter(item => {
    return item.url && item.url.startsWith('https://') && !item.url.startsWith('blob:')
  })

  if (!validItems.length) {
    return resp(400, { error: 'No valid HTTPS URLs provided. Blob URLs are not supported.' })
  }

  // ---- Process media items ----
  const results: CanonicalItem[] = []
  const errors: string[] = []

  for (const item of validItems) {
    try {
      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(item.url!, {
        folder: 'stefna',
        resource_type: 'auto',
        overwrite: false,
        unique_filename: true,
      })

      const canonicalItem: CanonicalItem = {
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
        meta: item.meta,
      }

      results.push(canonicalItem)

      // Save to database using the media_assets table (compatibility view is read-only)
      try {
        await sql`
          INSERT INTO media_assets (
            id, owner_id, url, public_id, resource_type, visibility, allow_remix, env, created_at, updated_at
          ) VALUES (
            ${crypto.randomUUID()}, ${user.userId}, ${uploadResult.secure_url},
            ${uploadResult.public_id}, ${item.type || 'image'}, 
            ${item.is_public ? 'public' : 'private'}, false, 'production', NOW(), NOW()
          )
        `
      } catch (dbError) {
        console.error('Database error:', dbError)
        // Continue with upload even if DB save fails
      }

    } catch (uploadError) {
      console.error('Upload error for:', item.url, uploadError)
      errors.push(`Failed to upload: ${item.url}`)
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
