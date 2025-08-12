// netlify/functions/recordShare.ts
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

    const { asset_id, shareToFeed, allowRemix } = JSON.parse(event.body || '{}') as {
      asset_id?: string; shareToFeed?: boolean; allowRemix?: boolean;
    };
    if (!asset_id || !/^[0-9a-f-]{36}$/i.test(asset_id)) return fail(400, 'asset_id must be a UUID');

    // Use SERVICE KEY so we're immune to client-side RLS hiccups, but still check ownership ourselves.
    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession:false } });

    // Make sure the asset belongs to the caller
    const { data: asset, error: getErr } = await admin
      .from('media_assets')
      .select('id,user_id,visibility,env,allow_remix')
      .eq('id', asset_id)
      .single();

    if (getErr) return fail(404, 'Asset not found', { details: getErr.message });
    if (asset.user_id !== userId) return fail(403, 'Not your asset');

    // Compute new fields
    const nextVisibility = !!shareToFeed ? 'public' : 'private';
    const nextAllowRemix = !!shareToFeed && !!allowRemix; // force false when private
    const nextEnv = process.env.PUBLIC_APP_ENV || 'prod'; // use the same env as getPublicFeed

    const { data: updated, error: upErr } = await admin
      .from('media_assets')
      .update({
        visibility: nextVisibility,
        allow_remix: nextAllowRemix,
        env: nextEnv,
        updated_at: new Date().toISOString(),
      })
      .eq('id', asset_id)
      .select('id, visibility, allow_remix, env, updated_at')
      .single();

    if (upErr) return fail(400, 'Update failed', { details: upErr.message });

    return json(200, { ok: true, asset: updated });
  } catch (e:any) {
    return fail(500, 'recordShare crashed', { details: e?.message });
  }
};


