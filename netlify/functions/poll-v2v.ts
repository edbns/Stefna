import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

function ok(body: any) { return { statusCode: 200, body: JSON.stringify(body) } }
function bad(status: number, message: string) { return { statusCode: status, body: JSON.stringify({ ok:false, error: message }) } }

const MAX_PROCESSING_MIN = 4
const HEARTBEAT_STALE_SEC = 90

export const handler: Handler = async (event) => {
  try {
    const method = event.httpMethod
    if (method !== 'GET' && method !== 'POST') return bad(405, 'Method Not Allowed')

    const params = method === 'GET' ? (event.queryStringParameters || {}) : JSON.parse(event.body || '{}')
    const jobId = params.id || params.job_id
    if (!jobId) return bad(400, 'job_id required')

    // NO_DB_MODE: poll vendor directly and optionally persist
    if (process.env.NO_DB_MODE === 'true') {
      const { AIML_API_URL, AIML_API_KEY } = process.env as any
      if (!AIML_API_URL || !AIML_API_KEY) return bad(500, 'MISSING_AIML_CONFIG')

      const res = await fetch(`${AIML_API_URL.replace(/\/$/, '')}/v2v/${jobId}`, {
        headers: { Authorization: `Bearer ${AIML_API_KEY}` }
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        return ok({ ok:false, status:'failed', job_id: jobId, error: text || 'UPSTREAM_ERROR' })
      }
      const data = await res.json().catch(() => ({}))
      const status = String(data.status || data.state || '').toLowerCase()
      if (!['succeeded','done','failed','error'].includes(status)) {
        return ok({ ok:true, status:'processing', job_id: jobId, progress: data.progress ?? null })
      }
      if (['failed','error'].includes(status)) {
        return ok({ ok:false, status:'failed', job_id: jobId, error: data.error || data.message || 'failed' })
      }
      const resultUrl = data.result_url || data.video_url || data.url || null
      if (!resultUrl) return ok({ ok:false, status:'failed', job_id: jobId, error: 'NO_RESULT_URL' })
      return ok({ ok:true, status:'completed', job_id: jobId, data: { mediaType: 'video', resultUrl, publicId: null } })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: job, error } = await supabase
      .from('ai_generations')
      .select('id,status,progress,output_url,error,created_at,updated_at,kind')
      .eq('id', jobId)
      .single()
    if (error || !job) return ok({ ok:false, status:'failed', job_id: jobId, error: 'not_found' })

    // finalize stale
    const created = new Date(job.created_at).getTime()
    const updated = new Date(job.updated_at || job.created_at).getTime()
    const now = Date.now()
    const tookMin = (now - created) / 60000
    const staleSec = (now - updated) / 1000

    if ((job.status === 'queued' || job.status === 'processing') && (tookMin > MAX_PROCESSING_MIN || staleSec > HEARTBEAT_STALE_SEC)) {
      await supabase.from('ai_generations').update({ status: 'timeout', error: `timed out after ${tookMin.toFixed(1)} min, stale ${staleSec}s` }).eq('id', jobId).in('status', ['queued','processing'])
      return ok({ ok:false, status:'timeout', job_id: jobId, error: 'timeout' })
    }

    if (job.status === 'queued' || job.status === 'processing') {
      return ok({ ok:true, status:'processing', job_id: jobId, progress: job.progress ?? null })
    }

    if (job.status === 'failed' || job.status === 'timeout') {
      return ok({ ok:false, status: job.status, job_id: jobId, error: job.error || job.status })
    }

    // completed
    const resultUrl = job.output_url || null
    return ok({ ok:true, status:'completed', job_id: jobId, data: {
      mediaType: job.kind || 'video',
      resultUrl,
      publicId: resultUrl ? null : null
    } })
  } catch (e:any) {
    return ok({ ok:false, status:'failed', error: e?.message || 'poll-v2v error' })
  }
}


