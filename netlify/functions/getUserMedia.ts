// netlify/functions/getUserMedia.ts
import { createClient } from '@supabase/supabase-js';
import { initCloudinary } from './_cloudinary';

const ok=(b:any)=>({statusCode:200,body:JSON.stringify(b)});
const err=(s:number,m:string)=>({statusCode:s,body:JSON.stringify({error:m})});

function base64urlToJson(b64url:string){
  const raw = b64url.replace(/-/g,'+').replace(/_/g,'/');
  const pad = raw.length % 4 ? raw + '='.repeat(4 - (raw.length % 4)) : raw;
  return JSON.parse(Buffer.from(pad,'base64').toString('utf8'));
}
function getJwt(event:any){
  const h = event.headers?.authorization || event.headers?.Authorization;
  const m = h && String(h).match(/^Bearer\s+(.+)/i);
  return m ? m[1] : null;
}
function decodeClaims(jwt:string|null){
  if (!jwt) return null;
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    return base64urlToJson(parts[1]) || null;
  } catch { return null; }
}
function pickUuidClaim(claims:any){
  for (const k of ['sub','uid','user_id','userId','id']) {
    const v = claims?.[k];
    if (/^[0-9a-f-]{36}$/i.test(v)) return String(v);
  }
  return null;
}

export const handler = async (event:any) => {
  if (process.env.NO_DB_MODE === 'true') {
    try {
      const cloudinary = initCloudinary();
      const qpUserId = event.queryStringParameters?.userId || '';
      let userId = qpUserId;
      if (!userId) {
        const jwt = getJwt(event);
        const claims = decodeClaims(jwt) || {};
        userId = pickUuidClaim(claims) || '';
      }
      if (!userId) return ok({ ok:true, items: [] });

      const exprUserTag = `tags=\"stefna\" AND tags=\"type:output\" AND tags=\"user:${userId}\"`;
      const exprContext = `tags=\"stefna\" AND tags=\"type:output\" AND context.user_id=\"${userId}\"`;
      const expr = `(${exprUserTag}) OR (${exprContext})`;

      const res = await cloudinary.search
        .expression(expr)
        .sort_by('created_at','desc')
        .max_results(100)
        .execute();

      const items = (res?.resources || []).map((r: any) => ({
        id: r.public_id,
        user_id: r.context?.custom?.user_id || userId,
        resource_type: r.resource_type,
        url: r.secure_url,
        result_url: r.secure_url,
        created_at: r.created_at,
        visibility: (r.tags || []).includes('public') ? 'public' : 'private',
        allow_remix: r.context?.custom?.allow_remix === 'true',
        prompt: null,
        mode: null,
        meta: r.context?.custom || {},
      }));

      return ok({ ok:true, items });
    } catch (e:any) {
      console.error('[getUserMedia] error', e);
      return err(500, e?.message || 'Internal server error');
    }
  }

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return err(500, 'Supabase credentials not configured');
    }

    const jwt = getJwt(event);
    if (!jwt) return ok({ items: [] }); // guests see nothing

    const claims = decodeClaims(jwt) || {};
    const tokenUserId = pickUuidClaim(claims);
    if (!tokenUserId) return ok({ items: [] }); // invalid token = guest

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from('media_assets')
      .select(`
        id, user_id, visibility, allow_remix, created_at, env, prompt, model, mode,
        url, result_url, meta
      `)
      .eq('user_id', tokenUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getUserMedia] Supabase error:', error);
      return err(500, 'Database error');
    }

    return ok({ items: data || [] });
  } catch (e: any) {
    console.error('[getUserMedia] Unexpected error:', e);
    return err(500, e?.message || 'Internal server error');
  }
};
