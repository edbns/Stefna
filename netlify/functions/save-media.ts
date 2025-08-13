// netlify/functions/save-media.ts
import { createClient } from '@supabase/supabase-js';

const ok  = (b:any)=>({ statusCode:200, body:JSON.stringify(b) });
const bad = (s:number,m:any)=>({ statusCode:s, body:JSON.stringify(typeof m==='string'?{error:m}:m) });

const isUuid = (s:string)=> /^[0-9a-f-]{36}$/i.test(s||'');
const isHttps = (s:string)=> /^https?:\/\//i.test(s||'');

// Extract Cloudinary public ID from various URL formats
function extractCloudinaryPublicId(url: string): string {
  try {
    // Handle AIML API URLs: https://cdn.aimlapi.com/eagle/files/koala/fdfMdi3HFx5vxm8EIDcZ6.jpeg
    if (url.includes('cdn.aimlapi.com')) {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return filename.split('.')[0]; // Remove extension
    }
    
    // Handle Cloudinary URLs: https://res.cloudinary.com/dw2xaqjmg/image/upload/v1755044530/users/mkkpxnuldynbmo1zbnet.png
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return filename.split('.')[0]; // Remove extension
    }
    
    // Fallback: generate a unique ID
    return `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  } catch (error) {
    console.error('Error extracting Cloudinary public ID:', error);
    return `fallback_${Date.now()}`;
  }
}

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

    // Extract Cloudinary public ID from the result URL
    const cloudinaryPublicId = extractCloudinaryPublicId(result_url);
    console.log(`[save-media] Extracted public ID: ${cloudinaryPublicId} from URL: ${result_url}`);
    
    // Determine media type from the result URL
    const finalType = result_url.includes('/video/') ? 'video' : 'image';
    
    // Save to the new unified assets table
    const assetRow = {
      user_id,
      cloudinary_public_id: cloudinaryPublicId,
      media_type: finalType,
      status: 'ready',
      is_public: visibility === 'public',
      allow_remix: visibility === 'public' ? !!allow_remix : false,
      published_at: visibility === 'public' ? new Date().toISOString() : null,
      source_asset_id: parent_asset_id,
      preset_key: null, // Will be set by the preset system
      prompt: prompt || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const q = supa.from('assets').insert(assetRow).select().single();

    const { data, error } = await q;
    if (error) {
      console.error(`[save-media] Database insert failed:`, error);
      return bad(400, { error: error.message, code: (error as any).code });
    }

    console.log(`[save-media] Successfully saved asset:`, data);
    return ok({ saved: data });
  }catch(e:any){
    return bad(500, e?.message || 'save-media crashed');
  }
};
