const { createClient } = require('@supabase/supabase-js')
const jwt = require('jsonwebtoken')

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }
    const auth = event.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { statusCode: 401, body: 'Missing token' }
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    const { userId } = payload

    const { incrementDaily = 0, incrementTotalPhotos = 0 } = JSON.parse(event.body || '{}')

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const updates = {}
    if (incrementDaily) updates.daily_usage = (incrementDaily === true ? 1 : Number(incrementDaily))
    if (incrementTotalPhotos) updates.total_photos = (incrementTotalPhotos === true ? 1 : Number(incrementTotalPhotos))

    // Use RPC or update with increments
    const { data, error } = await supabase.rpc('increment_user_usage', {
      p_user_id: userId,
      p_inc_daily: incrementDaily === true ? 1 : Number(incrementDaily),
      p_inc_total: incrementTotalPhotos === true ? 1 : Number(incrementTotalPhotos)
    })
    if (error) throw error
    return { statusCode: 200, body: JSON.stringify({ success: true, data }) }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}


