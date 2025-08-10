const { verifyAuth } = require('./_auth')
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }, body: '' }
    }
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Method Not Allowed' }
    }

    const { userId } = verifyAuth(event)

    // Validate UUID; if not a UUID (e.g., custom/legacy id), return safe defaults
    const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    if (!isUuid(userId)) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_used: 0, daily_limit: 30, weekly_used: 0, weekly_limit: 150 })
      }
    }

    const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supa.rpc('get_quota', { p_user_id: userId })
    if (error) {
      console.error('get_quota error:', error)
      return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to fetch quota' }) }
    }

    const row = Array.isArray(data) ? data[0] : data
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        daily_used: row?.daily_used ?? 0,
        daily_limit: row?.daily_limit ?? 0,
        weekly_used: row?.weekly_used ?? 0,
        weekly_limit: row?.weekly_limit ?? 0,
      })
    }
  } catch (e) {
    // Fallback to safe defaults instead of hard 500s
    const status = e && e.message === 'no_bearer' ? 401 : 200
    const body = status === 200
      ? { daily_used: 0, daily_limit: 30, weekly_used: 0, weekly_limit: 150 }
      : { error: e.message || 'Unauthorized' }
    return { statusCode: status, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  }
}


