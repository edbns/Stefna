import { createClient } from '@supabase/supabase-js';

function json(status:number, body:any) {
  return { statusCode: status, headers: { 'content-type':'application/json' }, body: JSON.stringify(body) };
}
function fail(status:number, msg:string, extra:any={}) { return json(status, { error: msg, ...extra }); }
function getBearer(event:any) {
  const h = event.headers?.authorization || event.headers?.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(h); return m?.[1] || null;
}
function getJwtUserId(jwt:any): string | null {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1],'base64').toString());
    const candidates = [payload.sub, payload.uid, payload.user_id, payload.userId, payload.id].filter(Boolean);
    const uu = candidates.find((s:string)=>/^[0-9a-f-]{36}$/i.test(s));
    return uu || null;
  } catch { return null; }
}

export const handler = async (event:any) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const token = getBearer(event);
    if (!token) return fail(401, 'Missing Authorization');
    const userId = getJwtUserId(token);
    if (!userId) return fail(401, 'Invalid user token');

    const { asset_id } = JSON.parse(event.body || '{}');
    if (!asset_id || !/^[0-9a-f-]{36}$/i.test(asset_id)) return fail(400, 'asset_id must be a UUID');

    const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession:false } });

    // Is it already liked?
    const { data: existing, error: selErr } = await db
      .from('likes')
      .select('id')
      .eq('asset_id', asset_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (selErr) return fail(400, 'Select failed', { details: selErr.message });

    if (existing) {
      const { error: delErr } = await db.from('likes').delete().eq('id', existing.id);
      if (delErr) return fail(400, 'Delete failed', { details: delErr.message });
    } else {
      const { error: insErr } = await db.insert({ asset_id, user_id: userId });
      if (insErr) return fail(400, 'Insert failed', { details: insErr.message });
    }

    const { count } = await db.from('likes').select('id', { count: 'exact', head: true }).eq('asset_id', asset_id);
    return json(200, { ok: true, liked: !existing, like_count: count ?? 0 });
  } catch (e:any) {
    return fail(500, 'toggleLike crashed', { details: e?.message });
  }
};


