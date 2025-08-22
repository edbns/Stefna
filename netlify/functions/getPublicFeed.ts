// netlify/functions/getPublicFeed.ts
import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!)

export const handler: Handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const limit = Number(url.searchParams.get('limit') ?? 50);

    // Get public media from database using the correct public_feed view
    // Note: We removed tier system, so users table only has basic fields
    const media = await sql`
      SELECT 
        pf.id,
        pf.user_id,
        u.email AS user_email, -- Use email instead of name since we removed tier system
        pf.final_url, -- Use final_url for Replicate images, cloudinary_public_id for Cloudinary
        pf.cloudinary_public_id,
        pf.media_type AS resource_type,
        pf.prompt,
        pf.created_at AS published_at,
        pf.is_public AS visibility,
        pf.allow_remix
      FROM public_feed pf
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
      user_name: item.user_email?.split('@')[0] || 'User', // Generate display name from email
      user_avatar: null, // No avatar system in simplified structure
      prompt: item.prompt,
      url: item.final_url, // Use final_url for Replicate images
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
