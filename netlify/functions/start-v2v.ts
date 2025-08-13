import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { initCloudinary } from './_cloudinary'

function ok(body: any) { return { statusCode: 202, body: JSON.stringify(body) } }
function bad(status: number, message: string) { return { statusCode: status, body: JSON.stringify({ ok:false, error: message }) } }

function extractPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // Expect /video/upload/<public_id> or /auto/upload/<public_id>
    const parts = u.pathname.split('/')
    const idx = parts.findIndex(p => p === 'upload')
    if (idx >= 0 && parts[idx+1]) {
      return parts.slice(idx+1).join('/').replace(/^\//, '').replace(/\.(mp4|webm|mov)$/i, '')
    }
  } catch {}
  return null
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return bad(405, 'Method Not Allowed')

    // NO_DB_MODE: call vendor directly and return vendor job id
    if (process.env.NO_DB_MODE === 'true') {
      const { AIML_API_URL, AIML_API_KEY } = process.env as any
      if (!AIML_API_URL || !AIML_API_KEY) return bad(500, 'MISSING_AIML_CONFIG')

      const body = JSON.parse(event.body || '{}')
      const sourceUrl: string | undefined = body.source_url || body.video_url
      const prompt: string = String(body.prompt || '').trim()
      const useWebhook: boolean = !!body.webhook
      if (!sourceUrl) return bad(400, 'MISSING: video_url')

      const siteUrl = process.env.SITE_URL || process.env.URL || process.env.DEPLOY_URL || process.env.DEPLOY_PRIME_URL || ''
      const webhook_url = useWebhook && siteUrl ? `${siteUrl}/.netlify/functions/v2v-webhook` : undefined
      const payload: Record<string, any> = {
        video_url: sourceUrl,
        prompt,
      }
      if (webhook_url) payload.webhook_url = webhook_url
      if (webhook_url && process.env.V2V_WEBHOOK_SECRET) payload.webhook_secret = process.env.V2V_WEBHOOK_SECRET

      const res = await fetch(`${AIML_API_URL.replace(/\/$/, '')}/v2v/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AIML_API_KEY}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        return bad(res.status, text || 'UPSTREAM_ERROR')
      }
      const data = await res.json().catch(() => ({}))
      const id = data.id || data.request_id || data.job_id
      if (!id) return bad(502, 'NO_JOB_ID')
      return ok({ ok: true, job_id: id, status: 'queued' })
    }

    // Auth (decode JWT minimally)
    const auth = event.headers.authorization || ''
    const token = auth.replace(/^Bearer\s+/i, '')
    if (!token) return bad(401, 'Missing Authorization token')
    const claims = JSON.parse(Buffer.from((token.split('.')[1] || ''), 'base64').toString() || '{}')
    const userId = claims.sub || claims.uid || claims.user_id || claims.userId || claims.id
    if (!userId) return bad(401, 'Invalid user token')

    const body = JSON.parse(event.body || '{}')
    let { source_url, source_public_id, prompt, strength, visibility, allowRemix, model } = body

    if (!source_url && !source_public_id) return bad(400, 'Provide source_url or source_public_id')

    // Normalize source_public_id
    if (!source_public_id && typeof source_url === 'string') {
      source_public_id = extractPublicIdFromUrl(source_url) || null
    }

    // If neither is Cloudinary public_id form, try to upload the source into inputs folder
    if (!source_public_id && source_url) {
      const cloudinary = initCloudinary()
      const up = await (cloudinary as any).uploader.upload(source_url, {
        resource_type: 'video',
        folder: `stefna/inputs/${userId}`,
        tags: ['stefna','type:input', `user:${userId}`],
        overwrite: true,
      })
      source_public_id = up.public_id
      source_url = up.secure_url
    }

    if (!source_public_id) return bad(400, 'Could not resolve source_public_id')

    // Persist job row in Supabase (ai_generations)
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: job, error: jerr } = await supabase
      .from('ai_generations')
      .insert({
        user_id: userId,
        input_url: source_url || `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/${source_public_id}.mp4`,
        preset: String(prompt || 'stylize').trim(),
        kind: 'video',
        visibility: visibility === 'private' ? 'private' : 'public',
        status: 'queued',
        progress: 0
      })
      .select('id')
      .single()

    if (jerr || !job) return bad(400, jerr?.message || 'Failed to create job')

    // Kick existing worker (fire-and-forget) to talk to provider
    const base = process.env.URL || process.env.DEPLOY_URL || process.env.DEPLOY_PRIME_URL || (event.headers.host ? `https://${event.headers.host}` : '');
    if (base) {
      fetch(`${base}/.netlify/functions/video-job-worker`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-internal': '1' },
      body: JSON.stringify({ job_id: job.id })
      }).catch(() => {})
    }

    return ok({ ok:true, job_id: job.id, status: 'queued' })
  } catch (e:any) {
    return bad(500, e?.message || 'start-v2v error')
  }
}


