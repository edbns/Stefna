const { getUserJwt, getSubUnsafe, supabaseForUser } = require('../lib/supabaseUser')

const ok  = (b)=>({ statusCode: 200, body: JSON.stringify(b) })
const err = (s,m)=>({ statusCode: s, body: JSON.stringify({ error: m }) })

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return err(405, 'Method Not Allowed')

    const jwt = getUserJwt(event)
    if (!jwt) return err(401, 'Sign in to like')

    const sub = getSubUnsafe(jwt)
    if (!sub || !/^[0-9a-f-]{36}$/i.test(sub)) return err(401, 'Invalid user token')

    const { mediaId } = JSON.parse(event.body || '{}')
    if (!mediaId) return err(400, 'mediaId is required')

    const supa = supabaseForUser(jwt)

    // Does a like exist for THIS user? RLS ensures we only see our own rows
    const { data: existing, error: selErr } = await supa
      .from('media_likes')
      .select('id')
      .eq('media_id', mediaId)
      .maybeSingle()

    if (selErr) return err(500, 'Failed to check existing like')

    if (existing) {
      const { error: delErr } = await supa.from('media_likes').delete().eq('id', existing.id)
      if (delErr) return err(500, delErr.message)
    } else {
      const { error: insErr } = await supa.from('media_likes').insert({ media_id: mediaId, user_id: sub })
      if (insErr) return err(500, insErr.message)
    }

    // Get updated like count
    const { count, error: countErr } = await supa
      .from('media_likes')
      .select('*', { count: 'exact', head: true })
      .eq('media_id', mediaId)

    if (countErr) return err(500, 'Failed to get like count')

    return ok({ likeCount: count || 0, liked: !existing })
  } catch (e) {
    return err(500, e?.message || 'toggleLike failed')
  }
}
