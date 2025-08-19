// netlify/functions/getPublicFeed.ts
import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!)

export const handler: Handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const limit = Number(url.searchParams.get('limit') ?? 50);

    // Get public media from database using our new working view
    const media = await sql`
      SELECT 
        pf.id,
        pf.user_id,
        u.name AS user_name,
        u.avatar_url AS user_avatar,
        u.tier AS user_tier,
        pf.url,
        pf.cloudinary_public_id,
        pf.media_type AS resource_type,
        pf.prompt,
        pf.created_at AS published_at,
        pf.is_public AS visibility,
        pf.allow_remix
      FROM public_feed_working pf
      LEFT JOIN app_users u ON pf.user_id = u.id
      ORDER BY pf.created_at DESC
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
