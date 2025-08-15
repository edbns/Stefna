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

// ---- DB (Supabase example) ----
import { createClient } from '@supabase/supabase-js'

// ---- ENV ----
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
})

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

// Extremely light JWT decode (no verify). If you use your own issuer,
// swap this for proper verification with your secret/JWK.
function tryDecodeJwt(token?: string): { userId?: string; sub?: string } | null {
  if (!token) return null
  try {
    const [, payloadB64] = token.split('.')
    const json = Buffer.from(payloadB64, 'base64').toString('utf8')
    return JSON.parse(json)
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
    return err('Missing "variations" array')
  }

  const authHeader = event.headers.authorization || event.headers.Authorization
  const bearer = (authHeader || '').startsWith('Bearer ')
    ? (authHeader as string).slice(7)
    : undefined
  const decoded = tryDecodeJwt(bearer)
  const userId = (decoded?.userId || decoded?.sub) as string | undefined

  // A stable folder for assets (groups by user if available)
  const runId = body.runId || crypto.randomUUID()
  const folderParts = ['stefna', 'outputs']
  if (userId) folderParts.push(userId)
  folderParts.push(runId)
  const folder = folderParts.join('/')

  // ---- Upload each variation to Cloudinary (by remote URL) ----
  // Note: Cloudinary auto-detects resource type if `resource_type: 'auto'`.
  const uploaded: CanonicalItem[] = []
  for (const v of body.variations) {
    if (!v.url || !/^https?:\/\//i.test(v.url)) {
      return err(`Variation url must be https: ${v.url}`)
    }

    try {
      const res = await cloudinary.uploader.upload(v.url, {
        folder,
        resource_type: 'auto',
        // Optional: public_id strategy; here we let Cloudinary pick
        // public_id: crypto.randomUUID(),
        overwrite: false,
        unique_filename: true,
      })

      uploaded.push({
        cloudinary_public_id: res.public_id,
        secure_url: res.secure_url,
        resource_type: res.resource_type as 'image' | 'video' | 'raw',
        format: res.format,
        bytes: res.bytes,
        width: res.width,
        height: res.height,
        folder: res.folder,
        media_type: (res.resource_type === 'image'
          ? 'image'
          : res.resource_type === 'video'
          ? 'video'
          : 'raw') as CanonicalItem['media_type'],
        final: res.secure_url, // what your feed maps to
        meta: v.meta,
      })
    } catch (e: any) {
      return err('Cloudinary upload failed', 500, { detail: String(e?.message || e) })
    }
  }

  // ---- DB write (optional if authorized) ----
  let dbResult: any = { skipped: true }
  if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })

      // Upsert user if needed, then insert assets
      // Adjust table/columns to match your schema.
      const assetRows = uploaded.map((u) => ({
        owner_id: userId,
        run_id: runId,
        preset_id: body.presetId || null,
        public_id: u.cloudinary_public_id,
        url: u.secure_url,
        resource_type: u.resource_type,
        width: u.width,
        height: u.height,
        bytes: u.bytes,
        tags: body.tags || [],
        allow_publish: !!body.allowPublish,
        extra: body.extra || {},
        meta: u.meta || {},
      }))

      const { data, error } = await supabase
        .from('assets') // <--- your table
        .insert(assetRows)
        .select()

      if (error) throw error
      dbResult = { skipped: false, inserted: data?.length || 0 }
    } catch (e: any) {
      // We deliberately do NOT fail the whole request if DB insert fails.
      // Client can still proceed (feed uses Cloudinary), and you see the error here.
      dbResult = { skipped: true, error: String(e?.message || e) }
    }
  }

  // ---- Response ----
  return ok({
    ok: true,
    runId,
    folder,
    items: uploaded,
    db: dbResult,
  })
}

export { handler }
