// netlify/functions/save-media.ts
import { createClient } from '@supabase/supabase-js';

const ok  = (b:any)=>({ statusCode:200, body:JSON.stringify(b) });
const bad = (s:number,m:any)=>({ statusCode:s, body:JSON.stringify(typeof m==='string'?{error:m}:m) });

const isUuid = (s:string)=> /^[0-9a-f-]{36}$/i.test(s||'');
const isHttps = (s:string)=> /^https?:\/\//i.test(s||'');

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
    if (isUuid(v)) return String(v);
  }
  return null;
}

export const handler = async (event:any) => {
  console.log('[save-media]', { 
    method: event.httpMethod, 
    hasAuth: !!(event.headers?.authorization), 
    now: new Date().toISOString() 
  });
  
  try{
    if (event.httpMethod !== 'POST') return bad(405,'Method Not Allowed');

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NODE_ENV } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return bad(500,'Supabase service credentials not configured');

    // Use consistent env detection to match getPublicFeed and recordShare
    const APP_ENV = process.env.PUBLIC_APP_ENV || 'prod';
    console.log(`🌍 save-media using env: ${APP_ENV}`);

    const jwt = getJwt(event);
    if (!jwt) return bad(401,'Missing Authorization token');

    const claims = decodeClaims(jwt) || {};
    const tokenUserId = pickUuidClaim(claims);
    if (!tokenUserId) return bad(401,'Invalid user token'); // <- was failing here

    let body:any={};
    try { body = JSON.parse(event.body || '{}'); } catch { return bad(400,'Invalid JSON body'); }

    const {
      user_id, result_url, source_url,
      job_id = null,
      model = 'flux/dev/image-to-image',
      mode  = 'i2i',
      prompt = null,
      negative_prompt = null,
      strength = null,
      allow_remix = false,
      parent_asset_id = null,
      visibility = 'private',
      env = NODE_ENV === 'production' ? 'prod' : 'dev'
    } = body;

    if (!user_id || !isUuid(user_id)) return bad(400,'user_id must be a UUID');
    if (user_id !== tokenUserId) return bad(403,'Token/user mismatch');

    if (!result_url || !isHttps(result_url)) return bad(400,'result_url must be a full https URL');
    if (source_url && !isHttps(source_url)) return bad(400,'source_url must be https when provided');
    if (!['public','private','unlisted'].includes(visibility)) return bad(400,'visibility must be public|private|unlisted');

    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Ensure the user exists in app_users before saving media
    const email = claims.email || claims.user_email || undefined;
    await supa
      .from('app_users')
      .upsert({ id: user_id, email })
      .select('id')
      .single();

    const metaPayload = body.meta ?? { mode, model, prompt, negative_prompt, strength }; // use `meta`, not `metadata`

    const row = {
      job_id, user_id, result_url,
      url: result_url,                 // 👈 add this to satisfy NOT NULL constraint
      source_url: source_url ?? result_url,
      model, mode, prompt: prompt || '', 
      negative_prompt, strength,
      visibility, env: APP_ENV,        // <- SERVER decides env, not the client
      allow_remix: visibility === 'public' ? !!allow_remix : false,
      parent_asset_id,
      resource_type: 'image', // Required field with CHECK constraint
      meta: metaPayload               // ✅ write to `meta` (not `metadata`)
    };

    const q = job_id
      ? supa.from('media_assets').upsert(row, { onConflict: 'job_id', ignoreDuplicates: true }).select().maybeSingle()
      : supa.from('media_assets').insert(row).select().single();

    const { data, error } = await q;
    if (error) return bad(400, { error: error.message, code: (error as any).code });

    return ok({ saved: data });
  }catch(e:any){
    return bad(500, e?.message || 'save-media crashed');
  }
};
