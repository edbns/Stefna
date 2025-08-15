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

  // Defensive URL handling - accept both objects and strings
  function coerceUrl(v: any): string | null {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') return v.url || v.image_url || v.resultUrl || null;
    return null;
  }

  const raw = Array.isArray(body.variations) ? body.variations : [];
  const urls = raw.map(coerceUrl).filter(Boolean);

  if (!urls.length) {
    return err('No valid variation urls found')
  }

  // Validate all URLs are HTTPS
  for (const url of urls) {
    if (!url) continue; // Skip null/undefined
    try {
      const proto = new URL(url).protocol;
      if (proto !== 'https:') {
        return err(`Variation url must be https, got: ${proto} ${url}`)
      }
    } catch {
      return err(`Invalid URL format: ${url}`)
    }
  }

  // Use Netlify's built-in authentication
  const authUser = context.clientContext?.user;
  const userId = authUser?.sub;

  console.log('🔐 Auth context:', { userId, authUser });

  // A stable folder for assets (groups by user if available)
  const runId = body.runId || crypto.randomUUID()
  const folderParts = ['stefna', 'outputs']
  if (userId) folderParts.push(userId)
  folderParts.push(runId)
  const folder = folderParts.join('/')

  // ---- Upload each variation to Cloudinary (by remote URL) ----
  // Note: Cloudinary auto-detects resource type if `resource_type: 'auto'`.
  const uploaded: CanonicalItem[] = []
  for (const url of urls) {
    if (!url) continue; // Skip null/undefined

    try {
      const res = await cloudinary.uploader.upload(url, {
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
        meta: { url }, // Store the original URL as metadata
      })
    } catch (e: any) {
      return err('Cloudinary upload failed', 500, { detail: String(e?.message || e) })
    }
  }

  // ---- DB write (if authorized) ----
  let dbResult: any = { skipped: true }
  if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })

      // First, ensure user exists in users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: authUser.email || `user-${userId}@placeholder.com`,
          name: `User ${userId}`,
          tier: 'registered',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (userError) {
        console.error('Failed to upsert user:', userError);
        // Continue with media insert even if user upsert fails
      }

      // Insert media assets with proper owner_id
      const assetRows = uploaded.map((u) => ({
        user_id: userId, // This ties the media to the authenticated user
        run_id: runId,
        preset_id: body.presetId || null,
        public_id: u.cloudinary_public_id,
        url: u.secure_url, // This maps to the main URL
        result_url: u.secure_url, // Add result_url for generated content
        resource_type: u.resource_type,
        width: u.width,
        height: u.height,
        bytes: u.bytes,
        tags: body.tags || [],
        visibility: body.allowPublish ? 'public' : 'private',
        allow_remix: false, // Default to false, can be updated later
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...u.meta,
          presetId: body.presetId,
          runId: runId,
          source: body.source?.url || null,
          extra: body.extra || {}
        }
      }))

      const { data, error } = await supabase
        .from('media_assets')
        .insert(assetRows)
        .select()

      if (error) throw error
      dbResult = { skipped: false, inserted: data?.length || 0 }
      console.log('✅ Media assets saved to DB:', { userId, count: data?.length });
	} catch (e: any) {
      // We deliberately do NOT fail the whole request if DB insert fails.
      // Client can still proceed (feed uses Cloudinary), and you see the error here.
      console.error('❌ DB insert failed:', e);
      dbResult = { skipped: true, error: String(e?.message || e) }
    }
  } else {
    console.log('⚠️ Skipping DB insert - no userId or DB config');
  }

  // ---- Response ----
  return ok({
    ok: true,
    runId,
    folder,
    items: uploaded,
    db: dbResult,
    media: uploaded.map(item => ({
      id: item.cloudinary_public_id,
      url: item.secure_url,
      resource_type: item.resource_type,
      width: item.width,
      height: item.height,
      bytes: item.bytes,
      created_at: new Date().toISOString()
    }))
  })
}

export { handler }
