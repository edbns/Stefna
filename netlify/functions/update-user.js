const { createClient } = require('@supabase/supabase-js')
const { verifyAuth } = require('./_auth')

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'PUT') return { statusCode: 405, body: 'Method Not Allowed' }
    const { userId } = verifyAuth(event)
    const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    if (!isUuid(userId)) return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) }

    const body = JSON.parse(event.body || '{}')
    const updates = {}
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
    if (typeof body.avatar === 'string' && body.avatar.trim()) updates.avatar_url = body.avatar.trim()
    if (Object.keys(updates).length === 0) return { statusCode: 400, body: JSON.stringify({ error: 'No valid fields to update' }) }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, name, avatar_url')
      .single()

    if (error) return { statusCode: 400, body: JSON.stringify({ error: error.message }) }
    return { statusCode: 200, body: JSON.stringify({ user: data }) }
  } catch (e) {
    console.error('update-user error:', e)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}


