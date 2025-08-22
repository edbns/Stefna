// netlify/functions/getPublicFeed.ts
import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!)

export const handler: Handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const limit = Number(url.searchParams.get('limit') ?? 50);

    // Get public media from database using the media_assets table
    const media = await sql`
      SELECT 
        ma.id,
        ma.owner_id AS user_id,
        u.email AS user_email,
        ma.url,
        ma.public_id AS cloudinary_public_id,
        ma.resource_type,
        ma.prompt,
        ma.created_at AS published_at,
        ma.visibility,
        ma.allow_remix
      FROM public.media_assets ma
      LEFT JOIN public.users u ON ma.owner_id = u.id
      WHERE ma.visibility = 'public'
      ORDER BY ma.created_at DESC
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
      user_name: item.user_email?.split('@')[0] || 'User', // Generate display name from email
      user_avatar: null, // No avatar system in simplified structure
      prompt: item.prompt,
      url: item.url,
      allow_remix: item.allow_remix
    }));

    return { 
      statusCode: 200, 
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ 
        ok: true, 
        data,
        count: data.length,
        limit 
      })
    };

  } catch (error) {
    console.error('❌ getPublicFeed error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      })
    };
  }
};
