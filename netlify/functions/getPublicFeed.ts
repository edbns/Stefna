// netlify/functions/getPublicFeed.ts
// Updated to use consolidated media_assets table structure
import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!)

export const handler: Handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const offset = Number(url.searchParams.get('offset') ?? 0);

    // Get public media from consolidated media_assets table
    // Simplified query to avoid JOIN issues
    const media = await sql`
      SELECT 
        ma.id,
        ma.user_id,
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
      WHERE ma.is_public = true 
        AND ma.status = 'ready'
        AND ma.created_at IS NOT NULL
        AND ma.final_url IS NOT NULL
      ORDER BY ma.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Check if there are more items after this page
    const hasMore = media.length === limit;
    
    const data = media.map((item: any) => {
      // Determine provider and use proper URL
      let url: string | null = null;
      let provider: 'cloudinary' | 'replicate' | 'aiml' | 'unknown' = 'unknown';
      
      if (item.final_url) {
        // Always use final_url as the primary source of truth
        url = item.final_url;
        
        // Determine provider based on URL
        if (item.final_url.includes('replicate.delivery')) {
          provider = 'replicate';
        } else if (item.final_url.includes('cdn.aimlapi.com')) {
          provider = 'aiml';
        } else if (item.final_url.includes('cloudinary.com')) {
          provider = 'cloudinary';
        } else {
          provider = 'unknown';
        }
      } else if (item.cloudinary_public_id) {
        // Fallback: construct Cloudinary URL if no final_url
        url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${item.cloudinary_public_id}`;
        provider = 'cloudinary';
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
        user_name: 'User', // Simplified - no email lookup
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
        hasMore,
        provider_breakdown: {
          replicate: data.filter(item => item.provider === 'replicate').length,
          cloudinary: data.filter(item => item.provider === 'cloudinary').length,
          aiml: data.filter(item => item.provider === 'aiml').length,
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
