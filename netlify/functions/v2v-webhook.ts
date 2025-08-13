import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const SHARED_SECRET = process.env.V2V_WEBHOOK_SECRET || ''

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    // optional signature/secret check
    const secret = event.headers['x-webhook-secret'] || event.headers['x-signature']
    if (SHARED_SECRET && secret !== SHARED_SECRET) return { statusCode: 401, body: 'unauthorized' }

    const body = JSON.parse(event.body || '{}')
    const { jobId, state, outputUrl, error, progress } = body
    if (!jobId) return { statusCode: 400, body: 'jobId required' }

    const update: any = { updated_at: new Date().toISOString() }
    if (typeof progress === 'number') update.progress = Math.max(0, Math.min(100, progress))

    if (state === 'completed') {
      update.status = 'completed'
      update.output_url = outputUrl
      update.progress = 100
    } else if (state === 'failed') {
      update.status = 'failed'
      update.error = error || 'unknown error'
    } else if (state === 'processing' || state === 'queued') {
      update.status = 'processing'
    }

    const { error: uerr } = await supabase.from('ai_generations').update(update).eq('id', jobId)
    if (uerr) return { statusCode: 400, body: JSON.stringify({ error: uerr.message }) }
    return { statusCode: 200, body: 'ok' }
  } catch (e: any) {
    console.error('v2v-webhook error', e)
    return { statusCode: 400, body: 'bad payload' }
  }
}


