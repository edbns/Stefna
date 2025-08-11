const { getUserJwt, getSubUnsafe, supabaseForUser } = require('../lib/supabaseUser')

const ok  = (b)=>({ statusCode: 200, body: JSON.stringify(b) })
const err = (s,m)=>({ statusCode: s, body: JSON.stringify({ error: m }) })

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return err(405, 'Method Not Allowed')

    const jwt = getUserJwt(event)
    if (!jwt) return err(401, 'Sign in to change visibility')

    const sub = getSubUnsafe(jwt)
    if (!sub || !/^[0-9a-f-]{36}$/i.test(sub)) return err(401, 'Invalid user token')

    const { asset_id, mediaId, shareToFeed, allowRemix } = JSON.parse(event.body || '{}')
    const id = asset_id || mediaId
    if (!id) return err(400, 'asset_id or mediaId is required')

    const visibility  = shareToFeed ? 'public' : 'private'
    const allow_remix = shareToFeed ? !!allowRemix : false

    const supa = supabaseForUser(jwt)

    const { data, error } = await supa
      .from('media_assets')
      .update({ visibility, allow_remix })
      .eq('id', id)
      .select('id, visibility, allow_remix')
      .maybeSingle()

    if (error) {
      if ((error && error.code === 'PGRST116') || /violates row-level security/i.test(error.message || '')) {
        return err(403, 'Not allowed: you do not own this media')
      }
      return err(400, error.message)
    }

    if (!data) return err(404, 'Media not found')
    return ok({ asset: data })
  } catch (e) {
    return err(500, e?.message || 'recordShare failed')
  }
}
