// netlify/functions/getPublicFeed.ts
// Force redeploy - v3 (fix feed query and restore functionality)
import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!)

export const handler: Handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const limit = Number(url.searchParams.get('limit') ?? 50);

    // Get public media from database using assets table
    const media = await sql`
      SELECT 
        a.id,
        a.user_id,
        'User' AS user_name,
        null AS user_avatar,
        'free' AS user_tier,
        COALESCE(a.final_url, a.cloudinary_public_id) AS url,
        a.cloudinary_public_id,
        a.media_type AS resource_type,
        a.prompt,
        a.created_at AS published_at,
        a.is_public AS visibility,
        COALESCE(a.allow_remix, false) AS allow_remix
      FROM assets a
      WHERE a.is_public = true AND a.status = 'ready'
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `;

    const data = media.map((item: any) => ({
      id: item.id,
      cloudinary_public_id: item.cloudinary_public_id,
      media_type: item.resource_type === 'video' ? 'video' : 'image',
      published_at: item.published_at,
      preset_key: null, // Can be added later if needed
      source_public_id: null, // Can be added later if needed
      user_id: item.user_id,
      user_avatar: item.user_avatar,
      user_tier: item.user_tier,
      prompt: item.prompt,
      url: item.url,
      allow_remix: item.allow_remix
    }));

    return { 
      statusCode: 200, 
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify({ 
        ok: true, 
        source: 'database', 
        data,
        count: data.length
      }) 
    };
  } catch (e: any) {
    const msg = e?.message || e?.error?.message || e?.error || 'unknown error';
    const code = e?.code || 'UNKNOWN';
    console.error('[getPublicFeed] error', { code, msg, raw: e });
    return { 
      statusCode: 500, 
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        ok: false, 
        error: `${code}: ${msg}` 
      }) 
    };
  }
};
