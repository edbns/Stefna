import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { initCloudinary } from './_cloudinary'

function ok(body: any) { return { statusCode: 200, body: JSON.stringify(body) } }
function bad(status: number, message: string) { return { statusCode: status, body: JSON.stringify({ ok:false, error: message }) } }

export const handler: Handler = async (event) => {
  try {
    const method = event.httpMethod
    if (method !== 'GET' && method !== 'POST') return bad(405, 'Method Not Allowed')

    const params = method === 'GET' ? (event.queryStringParameters || {}) : JSON.parse(event.body || '{}')
    const jobId = params.id || params.job_id
    const persist = String(params.persist || '').toLowerCase() === 'true'
    if (!jobId) return bad(400, 'job_id required')

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: job, error } = await supabase.from('ai_generations').select('*').eq('id', jobId).single()
    if (error || !job) return bad(404, 'Job not found')

    // Auto-fail stale jobs (no heartbeat)
    const STALE_MS = 6 * 60 * 1000
    const updatedAtMs = job.updated_at ? new Date(job.updated_at as any).getTime() : Date.now()
    if ((job.status === 'queued' || job.status === 'running') && Date.now() - updatedAtMs > STALE_MS) {
      await supabase.from('video_jobs').update({ status: 'failed', error: 'stalled' }).eq('id', jobId)
      return ok({ ok:false, job_id: jobId, status: 'failed', error: 'stalled' })
    }

    // Map statuses to contract
    if (job.status === 'queued') return ok({ ok:true, job_id: jobId, status: 'processing', progress: job.progress || 0 })
    if (job.status === 'processing') return ok({ ok:true, job_id: jobId, status: 'processing', progress: job.progress || 0 })
    if (job.status === 'failed' || job.status === 'canceled') return ok({ ok:false, job_id: jobId, status: 'failed', error: job.error || 'failed' })

    // succeeded: ensure we have result_url; optionally persist to Cloudinary and DB
    let resultUrl: string | null = job.output_url || null
    let cloudinaryPublicId: string | null = null
    let durationMs: number | null = job.duration_ms || null

    if (persist && resultUrl && !job.provider_persisted) {
      // Upload to Cloudinary and tag for feed
      const cloudinary = initCloudinary()
      const tags = ['stefna','type:output', `user:${job.user_id}`].concat((job.visibility||'public')==='public' ? ['public'] : [])
      const up = await (cloudinary as any).uploader.upload(resultUrl, {
        resource_type: 'video',
        folder: `stefna/outputs/${job.user_id}`,
        tags,
        context: { user_id: job.user_id, job_id: job.id },
        overwrite: true,
        invalidate: true
      })
      cloudinaryPublicId = up.public_id
      resultUrl = up.secure_url
      durationMs = Math.round((up.duration ?? 0) * 1000)

      // Save DB media row for All-media
      const { data: assetRow, error: aerr } = await supabase.from('media_assets').insert({
        user_id: job.user_id,
        url: resultUrl,
        result_url: resultUrl,
        source_url: job.source_url,
        public_id: up.public_id,
        resource_type: 'video',
        env: 'prod',
        mode: 'preset',
        prompt: job.prompt,
        model: job.model,
        visibility: job.visibility || 'public',
        allow_remix: (job.visibility || 'public')==='public' ? !!job.allow_remix : false,
        meta: { job_id: job.id }
      }).select('id').single()
      if (aerr) return bad(500, aerr.message)

      // Mark job persisted
      await supabase.from('video_jobs').update({ provider_persisted: true, result_url: resultUrl }).eq('id', jobId)
    }

    // Stable envelope
    if (persist) {
      return ok({ ok:true, status: 'completed', job_id: jobId, record: {
        id: (assetRow as any)?.id || null,
        type: 'video',
        resultUrl: resultUrl,
        publicId: cloudinaryPublicId,
        duration: durationMs || undefined,
      } })
    }
    return ok({ ok:true, status: 'completed', job_id: jobId, record: {
      id: null,
      type: 'video',
      resultUrl: resultUrl,
      publicId: cloudinaryPublicId
    } })
  } catch (e:any) {
    return bad(500, e?.message || 'poll-v2v error')
  }
}


