// netlify/functions/getUserMedia.ts
import { neon } from '@neondatabase/serverless';
import { initCloudinary } from './_cloudinary';

const ok=(b:any)=>({statusCode:200,body:JSON.stringify(b)});
const err=(s:number,m:string)=>({statusCode:s,body:JSON.stringify({error:m})});

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!)

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

// Simplified user resolution for new database
async function resolveUserFromJWT(event: any) {
  const jwt = getJwt(event);
  if (!jwt) return { userId: null, email: null };

  const claims = decodeClaims(jwt) || {};
  const userId = pickUuidClaim(claims);
  const email = claims.email || claims.mail || null;
  
  return { userId, email };
}

// Get user media from new database
async function getUserMedia(userId: string) {
  try {
    const media = await sql`
      SELECT 
        id, user_id, visibility, allow_remix, created_at, env, prompt, model, mode,
        url, result_url, meta, public_id, resource_type, folder, bytes, width, height
      FROM media_assets 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    
    return media;
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify({ ok: true })
    };
  }

  if (event.httpMethod !== 'GET') {
    return err(405, 'Method not allowed');
  }

  try {
    // Resolve user from JWT
    const { userId, email } = await resolveUserFromJWT(event);
    
    if (!userId) {
      return err(401, 'Unauthorized - no valid user ID found');
    }

    // Get user media
    const media = await getUserMedia(userId);
    
    // Ensure user exists in users table
    try {
      await sql`
        INSERT INTO users (id, email, created_at, updated_at)
        VALUES (${userId}, ${email || `user-${userId}@placeholder.com`}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET 
          email = EXCLUDED.email,
          updated_at = NOW()
      `;
    } catch (userError) {
      console.error('Failed to upsert user:', userError);
      // Continue even if user upsert fails
    }

    return ok({
      ok: true,
      userId,
      media,
      count: media.length
    });

  } catch (error) {
    console.error('Handler error:', error);
    return err(500, 'Internal server error');
  }
};
