// netlify/functions/getUserMedia.ts
// User media function - fetches user's media assets using raw SQL
// Provides user-specific media data

import type { Handler } from '@netlify/functions';
import { json } from './_lib/http';
import { q } from './_db';

// Helper function to create consistent response headers
function createResponseHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };
}



export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return json('', { 
      status: 200,
      headers: createResponseHeaders()
    });
  }

  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, { 
      status: 405,
      headers: createResponseHeaders()
    });
  }

  try {
    // Get query parameters
    const url = new URL(event.rawUrl);
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'userId parameter is required' })
      };
    }

    console.log('🔍 [getUserMedia] Fetching media for user:', {
      userId,
      limit,
      offset
    });

    // Debug: Check if user exists
    const userExists = await q(`SELECT id FROM users WHERE id = $1`, [userId]);
    console.log('🔍 [getUserMedia] User exists:', !!userExists[0]);

    // Debug: Check neo_glitch_media specifically
    const neoGlitchCount = await q(`SELECT COUNT(*) as count FROM neo_glitch_media WHERE user_id = $1`, [userId]);
    console.log('🔍 [getUserMedia] Neo glitch items for user:', neoGlitchCount[0]?.count || 0);

    // Get total count for accurate pagination
    const countSql = `
      SELECT COUNT(*) as total FROM (
        SELECT id FROM ghibli_reaction_media WHERE user_id = $1
        UNION ALL
        SELECT id FROM emotion_mask_media WHERE user_id = $1
        UNION ALL
        SELECT id FROM presets_media WHERE user_id = $1
        UNION ALL
        SELECT id FROM custom_prompt_media WHERE user_id = $1
        UNION ALL
        SELECT id FROM neo_glitch_media WHERE user_id = $1
      ) as combined_media
    `;

    // Get total count first
    const totalCountResult = await q(countSql, [userId]);
    const totalCount = totalCountResult[0]?.total || 0;
    console.log('🔍 [getUserMedia] Total items available:', totalCount);

    // Unified query with proper pagination
    const unifiedSql = `
      SELECT * FROM (
        SELECT id, user_id, image_url, prompt, preset, created_at, run_id, fal_job_id, 'ghibli_reaction' as media_type FROM ghibli_reaction_media WHERE user_id = $1
        UNION ALL
        SELECT id, user_id, image_url, prompt, preset, created_at, run_id, fal_job_id, 'emotion_mask' as media_type FROM emotion_mask_media WHERE user_id = $1
        UNION ALL
        SELECT id, user_id, image_url, prompt, preset, created_at, run_id, fal_job_id, 'presets' as media_type FROM presets_media WHERE user_id = $1
        UNION ALL
        SELECT id, user_id, image_url, prompt, preset, created_at, run_id, fal_job_id, 'custom_prompt' as media_type FROM custom_prompt_media WHERE user_id = $1
        UNION ALL
        SELECT id, user_id, image_url, prompt, preset, created_at, run_id, fal_job_id, 'neo_glitch' as media_type FROM neo_glitch_media WHERE user_id = $1
      ) as combined_media
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const allMediaItems = await q(unifiedSql, [userId, limit, offset]);

    console.log('✅ [getUserMedia] Retrieved user media:', {
      totalItems: allMediaItems.length,
      totalAvailable: totalCount
    });

    // Transform unified media items
    const transformedItems = allMediaItems.map(item => {
      return {
        id: item.id,
        userId: item.user_id,
        finalUrl: item.image_url,
        mediaType: 'image',
        prompt: item.prompt,
        presetKey: item.preset,
        status: 'ready',
        isPublic: false,
        createdAt: item.created_at,
        runId: item.run_id, // Add runId for polling detection
        falJobId: item.fal_job_id, // Add falJobId for Fal.ai generations
        type: item.media_type,
        // Let frontend calculate aspect ratio - default to 1:1 for square images
        aspectRatio: 1,
        metadata: {
          presetKey: item.preset,
          presetType: item.media_type,
          quality: 'high',
          generationTime: 0,
          modelVersion: '1.0'
        }
      };
    });

    return json({
      success: true,
      items: transformedItems,
      total: totalCount,
      hasMore: offset + limit < totalCount
    });

  } catch (error: any) {
    console.error('💥 [getUserMedia] Media fetch error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        error: 'MEDIA_FETCH_FAILED',
        message: error.message,
        status: 'failed'
      })
    };
  } finally {
    
  }
};
