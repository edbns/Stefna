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

// Resolve all possible user identifiers for legacy media lookup
async function resolveUserFromJWT(event: any, supabase: any) {
  const jwt = getJwt(event);
  if (!jwt) return { userId: null, identityId: null, email: null };

  const claims = decodeClaims(jwt) || {};
  const userId = pickUuidClaim(claims);
  const email = claims.email || claims.mail || null;
  
  // Try to get identity ID from profiles table
  let identityId = null;
  if (userId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      identityId = profile?.id || null;
    } catch (e) {
      // Profile might not exist yet
      console.log('No profile found for userId:', userId);
    }
  }

  return { userId, identityId, email };
}

// Try multiple user ID formats to find legacy media
async function findMediaWithFallback(supabase: any, primaryUserId: string, identityId: string | null, email: string | null) {
  let items = [];
  
  // Try primary user ID first
  if (primaryUserId) {
    const { data, error } = await supabase
      .from('media_assets')
      .select(`
        id, user_id, visibility, allow_remix, created_at, env, prompt, model, mode,
        url, result_url, meta
      `)
      .eq('user_id', primaryUserId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      items = data;
      console.log(`✅ Found ${items.length} media items for primary userId: ${primaryUserId}`);
    }
  }

  // Fallback 1: Try identity ID if different from primary
  if (items.length === 0 && identityId && identityId !== primaryUserId) {
    const { data, error } = await supabase
      .from('media_assets')
      .select(`
        id, user_id, visibility, allow_remix, created_at, env, prompt, model, mode,
        url, result_url, meta
      `)
      .eq('user_id', identityId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      items = data;
      console.log(`✅ Found ${items.length} media items for identityId: ${identityId}`);
      
      // Enqueue background job to update ownerId for future queries
      console.log(`🔄 Legacy media found under identityId ${identityId}, consider migrating to userId ${primaryUserId}`);
    }
  }

  // Fallback 2: Try email-based lookup for very legacy items
  if (items.length === 0 && email) {
    try {
      const { data, error } = await supabase
        .from('media_assets')
        .select(`
          id, user_id, visibility, allow_remix, created_at, env, prompt, model, mode,
          url, result_url, meta
        `)
        .eq('meta->>email', email) // Assuming email is stored in meta
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        items = data;
        console.log(`✅ Found ${items.length} media items for email: ${email}`);
        console.log(`🔄 Very legacy media found under email ${email}, consider migrating to userId ${primaryUserId}`);
      }
    } catch (e) {
      console.log('Email-based lookup not supported or failed:', e);
    }
  }

  return items;
}

export const handler = async (event:any) => {
  // Check if we have Supabase credentials first - prioritize database
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { userId, identityId, email } = await resolveUserFromJWT(event, supabase);
      if (!userId) return ok({ items: [] }); // invalid token = guest

      const items = await findMediaWithFallback(supabase, userId, identityId, email);
      console.log(`✅ Database query returned ${items.length} items for user ${userId}`);

      return ok({ items });
    } catch (e: any) {
      console.error('[getUserMedia] Database query error:', e);
      // Fall back to Cloudinary if database fails
    }
  }

  // Fallback to Cloudinary-only mode if no Supabase or database fails
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
        url: r.resource_type === 'video' ? r.secure_url : r.secure_url,
        result_url: r.secure_url,
        created_at: r.created_at,
        visibility: (r.tags || []).includes('public') ? 'public' : 'private',
        allow_remix: r.context?.custom?.allow_remix === 'true',
        prompt: r.context?.custom?.prompt || null,
        mode: r.context?.custom?.mode_meta ? JSON.parse(r.context?.custom?.mode_meta) : null,
        meta: r.context?.custom || {},
      }));

      return ok({ ok:true, items });
    } catch (e:any) {
      console.error('[getUserMedia] error', e);
      return err(500, e?.message || 'Internal server error');
    }
  }
};
