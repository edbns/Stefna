// netlify/functions/save-media.ts
// One-stop "save + record" endpoint.
// - Accepts generated media variations (from AIML).
// - Uploads them to Cloudinary (by remote URL).
// - If Authorization present, records them in DB.
// - Returns canonical items used by feed + UI.
// Compatible with Netlify Functions v1/v2.

import type { Handler } from '@netlify/functions'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

// ---- Cloudinary ----
import { v2 as cloudinary } from 'cloudinary'

// ---- DB (Netlify DB/Neon) ----
import { neon } from '@neondatabase/serverless'

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

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!)

// ---- Helpers ----
function ok<T>(data: T, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(data),
  }
}

function err(message: string, status = 400, extra?: Record<string, any>) {
  return ok({ ok: false, error: message, ...extra }, status)
}

// ---- Auth helper ----
function requireUser(event: any) {
  const authHeader = event.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    return decoded as any
  } catch {
    return null
  }
}

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

const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return ok({ ok: true })
	}
	if (event.httpMethod !== 'POST') {
    return err('Method not allowed', 405)
  }

  // ---- Parse input ----
  let body: SaveMediaRequest
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return err('Invalid JSON body')
  }

  if (!body?.variations?.length) {
    return err('No variations provided')
  }

  // ---- Auth check ----
  const user = requireUser(event)
  if (!user) {
    return err('Unauthorized', 401)
  }

  // ---- Validate URLs ----
  const validVariations = body.variations.filter(v => {
    return v.url && v.url.startsWith('https://') && !v.url.startsWith('blob:')
  })

  if (!validVariations.length) {
    return err('No valid HTTPS URLs provided')
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

      // Save to database
      try {
        await sql`
          INSERT INTO media_assets (
            id, user_id, url, public_id, resource_type, 
            folder, bytes, width, height, meta, 
            created_at, updated_at, visibility, env
          ) VALUES (
            ${crypto.randomUUID()}, ${user.sub || user.id}, ${item.secure_url}, 
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
    return err('All uploads failed', 500, { errors })
  }

  return ok({
    ok: true,
    results,
    errors: errors.length > 0 ? errors : undefined,
  })
}

export { handler }
