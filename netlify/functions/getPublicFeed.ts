// netlify/functions/getPublicFeed.ts
import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!)

export const handler: Handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const limit = Number(url.searchParams.get('limit') ?? 50);

    // Get public media directly from assets table to include both Cloudinary and Replicate images
    // Note: We removed tier system, so users table only has basic fields - UPDATED
    const media = await sql`
      SELECT 
        a.id,
        a.user_id,
        u.email AS user_email, -- Use email instead of name since we removed tier system
        a.cloudinary_public_id,
        a.media_type AS resource_type,
        a.prompt,
        a.created_at AS published_at,
        a.is_public AS visibility,
        a.allow_remix,
        a.final_url,
        a.meta
      FROM assets a
      LEFT JOIN app_users u ON a.user_id = u.id
      WHERE a.is_public = true 
        AND a.status = 'ready'
        AND a.created_at IS NOT NULL
        AND (a.cloudinary_public_id IS NOT NULL OR a.final_url IS NOT NULL)
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `;

    const data = media.map((item: any) => {
      // Determine provider and construct proper URL
      let url: string | null = null;
      let provider: 'cloudinary' | 'replicate' | 'unknown' = 'unknown';
      
      if (item.final_url && item.final_url.includes('replicate.delivery')) {
        // Replicate image - use final_url directly
        url = item.final_url;
        provider = 'replicate';
      } else if (item.cloudinary_public_id) {
        // Cloudinary image - construct URL
        url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${item.cloudinary_public_id}`;
        provider = 'cloudinary';
      }
      
      // Extract preset info from meta if available
      let presetKey = null;
      if (item.meta && typeof item.meta === 'object') {
        presetKey = item.meta.presetId || item.meta.preset_key || null;
      }
      
      return {
        id: item.id,
        cloudinary_public_id: item.cloudinary_public_id,
        media_type: item.resource_type === 'video' ? 'video' : 'image',
        published_at: item.published_at,
        preset_key: presetKey,
        source_public_id: null, // Can be added later if needed
        user_id: item.user_id,
        user_name: item.user_email?.split('@')[0] || 'User', // Generate display name from email
        user_avatar: null, // No avatar system in simplified structure
        prompt: item.prompt,
        url: url,
        provider: provider,
        allow_remix: item.allow_remix
      };
    });

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
