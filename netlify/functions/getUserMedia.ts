// netlify/functions/getUserMedia.ts
import { createClient } from '@supabase/supabase-js';

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
  console.log('[getUserMedia]', { 
    method: event.httpMethod, 
    hasAuth: !!(event.headers?.authorization), 
    now: new Date().toISOString() 
  });
  
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

    // Use service role key to bypass RLS temporarily while we fix policies
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
