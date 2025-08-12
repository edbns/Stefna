const { createClient } = require('@supabase/supabase-js')

function getUserJwt(event) {
  const h = event.headers && (event.headers.authorization || event.headers.Authorization)
  if (!h) return null
  const m = String(h).match(/^Bearer\s+(.+)/i)
  return m ? m[1] : null
}

function getSubUnsafe(jwt) {
  if (!jwt) return null
  try {
    const parts = String(jwt).split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
    return String(payload.sub || payload.user_id || payload.uid || payload.id || '')
  } catch {
    return null
  }
}

function supabaseForUser(jwt) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} } }
  )
}

function supabaseService() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

module.exports = { getUserJwt, getSubUnsafe, supabaseForUser, supabaseService }
