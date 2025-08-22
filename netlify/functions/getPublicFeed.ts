// netlify/functions/getPublicFeed.ts
// Updated to use consolidated media_assets table structure
import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!)

export const handler: Handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const limit = Number(url.searchParams.get('limit') ?? 50);

    // Get public media from consolidated media_assets table
    // This now properly handles both Cloudinary and Replicate images
    // Fixed: Added proper type casting for UUID vs TEXT join
    const media = await sql`
      SELECT 
        ma.id,
        ma.user_id,
        u.email AS user_email,
        ma.cloudinary_public_id,
        COALESCE(ma.media_type, ma.resource_type) AS resource_type,
        ma.prompt,
        ma.created_at AS published_at,
        ma.is_public AS visibility,
        ma.allow_remix,
        ma.final_url,
        ma.status,
        ma.meta,
        ma.preset_key,
        ma.preset_id
      FROM media_assets ma
      LEFT JOIN users u ON ma.user_id::uuid = u.id
      WHERE ma.is_public = true 
        AND ma.status = 'ready'
        AND ma.created_at IS NOT NULL
        AND ma.final_url IS NOT NULL
      ORDER BY ma.created_at DESC
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
      } else if (item.final_url) {
        // Fallback: use final_url if available
        url = item.final_url;
        provider = 'unknown';
      }
      
      // Extract preset info from meta or preset fields
      let presetKey = null;
      if (item.meta && typeof item.meta === 'object') {
        presetKey = item.meta.presetId || item.meta.preset_key || null;
      }
      if (!presetKey) {
        presetKey = item.preset_key || item.preset_id || null;
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
        allow_remix: item.allow_remix,
        status: item.status
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
        limit,
        table_source: 'media_assets', // Indicate we're using the new structure
        provider_breakdown: {
          replicate: data.filter(item => item.provider === 'replicate').length,
          cloudinary: data.filter(item => item.provider === 'cloudinary').length,
          unknown: data.filter(item => item.provider === 'unknown').length
        }
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
