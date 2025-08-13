import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const id = body?.id as string | undefined
    const reason = (body?.reason as string | undefined) || 'client finalized after watchdog'

    if (!id) {
      return { statusCode: 400, body: 'missing id' }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await supabase
      .from('ai_generations')
      .update({ status: 'timeout', error: reason })
      .eq('id', id)
      .in('status', ['queued', 'processing'])

    if (error) {
      return { statusCode: 500, body: `db error: ${error.message}` }
    }

    return { statusCode: 200, body: 'ok' }
  } catch (e: any) {
    return { statusCode: 400, body: e?.message || 'bad request' }
  }
}


