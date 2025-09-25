// netlify/functions/getUserMedia.ts
// User media function - fetches user's media assets using raw SQL
// Provides user-specific media data
// Updated for mobile/web platform separation - userId extracted from JWT

import type { Handler } from '@netlify/functions';
import { json } from './_lib/http';
import { q } from './_db';
import { requireAuth } from './_lib/auth';

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
    // Extract userId from JWT token (platform-aware authentication)
    const auth = requireAuth(event.headers?.authorization || event.headers?.Authorization);
    const userId = auth.userId;
    
    // Get query parameters (but not userId - it comes from JWT)
    const url = new URL(event.rawUrl);
    const getAll = url.searchParams.get('all') === 'true';
    const limit = getAll ? null : parseInt(url.searchParams.get('limit') || '50');
    const offset = getAll ? 0 : parseInt(url.searchParams.get('offset') || '0');

    console.log('🔐 [getUserMedia] Authenticated request:', {
      userId,
      platform: auth.platform,
      permissions: auth.permissions
    });

    console.log('🔍 [getUserMedia] Fetching media for user:', {
      userId,
      getAll,
      limit,
      offset
    });

    // Debug: Check if user exists
    const userExists = await q(`SELECT id FROM users WHERE id = $1`, [userId]);
    console.log('🔍 [getUserMedia] User exists:', !!userExists[0]);

    // Debug: Check cyber_siren_media specifically
    const cyberSirenCount = await q(`SELECT COUNT(*) as count FROM cyber_siren_media WHERE user_id = $1`, [userId]);
    console.log('🔍 [getUserMedia] Cyber Siren items for user:', cyberSirenCount[0]?.count || 0);

    // Get total count for accurate pagination
    const countSql = `
      SELECT COUNT(*) as total FROM (
        SELECT id::text FROM ghibli_reaction_media WHERE user_id = $1
        UNION ALL
        SELECT id::text FROM unreal_reflection_media WHERE user_id = $1
        UNION ALL
        SELECT id::text FROM presets_media WHERE user_id = $1
        UNION ALL
        SELECT id::text FROM custom_prompt_media WHERE user_id = $1
        UNION ALL
        SELECT id::text FROM cyber_siren_media WHERE user_id = $1
        UNION ALL
        SELECT id::text FROM edit_media WHERE user_id = $1
        UNION ALL
        SELECT id::text FROM parallel_self_media WHERE user_id = $1
      ) as combined_media
    `;

    // Get total count first
    const totalCountResult = await q(countSql, [userId]);
    const totalCount = totalCountResult[0]?.total || 0;
    console.log('🔍 [getUserMedia] Total items available:', totalCount);

    // Unified query with proper pagination and 3D fields including metadata
    const unifiedSql = `
      SELECT * FROM (
        SELECT id::text, user_id, image_url, prompt, preset, created_at, run_id, fal_job_id, 'ghibli_reaction' as media_type, obj_url, gltf_url, texture_url, model_3d_metadata, metadata FROM ghibli_reaction_media WHERE user_id = $1
        UNION ALL
        SELECT id::text, user_id, image_url, prompt, preset, created_at, run_id, fal_job_id, 'unreal_reflection' as media_type, obj_url, gltf_url, texture_url, model_3d_metadata, metadata FROM unreal_reflection_media WHERE user_id = $1
        UNION ALL
        SELECT id::text, user_id, image_url, prompt, preset, created_at, run_id, fal_job_id, 'presets' as media_type, obj_url, gltf_url, texture_url, model_3d_metadata, metadata FROM presets_media WHERE user_id = $1
        UNION ALL
        SELECT id::text, user_id, image_url, prompt, preset, created_at, run_id, fal_job_id, 'custom_prompt' as media_type, obj_url, gltf_url, texture_url, model_3d_metadata, metadata FROM custom_prompt_media WHERE user_id = $1
        UNION ALL
        SELECT id::text, user_id, image_url, prompt, preset, created_at, run_id, stability_job_id as fal_job_id, 'cyber_siren' as media_type, obj_url, gltf_url, texture_url, model_3d_metadata, metadata FROM cyber_siren_media WHERE user_id = $1
        UNION ALL
        SELECT id::text, user_id, image_url, prompt, 'edit' as preset, created_at, run_id, fal_job_id, 'edit' as media_type, obj_url, gltf_url, texture_url, model_3d_metadata, metadata FROM edit_media WHERE user_id = $1
        UNION ALL
        SELECT id::text, user_id, image_url, prompt, preset, created_at, run_id, fal_job_id, 'parallel_self' as media_type, obj_url, gltf_url, texture_url, model_3d_metadata, metadata FROM parallel_self_media WHERE user_id = $1
      ) as combined_media
      ORDER BY created_at DESC
      ${getAll ? '' : `LIMIT $2 OFFSET $3`}
    `;

    const allMediaItems = getAll 
      ? await q(unifiedSql, [userId])
      : await q(unifiedSql, [userId, limit!, offset]);

    console.log('✅ [getUserMedia] Retrieved user media:', {
      totalItems: allMediaItems.length,
      totalAvailable: totalCount
    });

    // Debug: Log metadata for first few items
    if (allMediaItems.length > 0) {
      console.log('🔍 [getUserMedia] Sample metadata:', {
        firstItem: {
          id: allMediaItems[0].id,
          metadata: allMediaItems[0].metadata,
          metadataType: typeof allMediaItems[0].metadata
        }
      });
    }

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
        stabilityJobId: item.fal_job_id, // For cyber_siren, fal_job_id is actually stability_job_id
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
      hasMore: getAll ? false : offset + limit! < totalCount
    });

  } catch (error: any) {
    console.error('💥 [getUserMedia] Error:', error);
    
    // Handle authentication errors specially
    if (error.statusCode === 401 || error.message?.includes('Authorization') || error.message?.includes('JWT')) {
      return {
        statusCode: 401,
        headers: createResponseHeaders(),
        body: JSON.stringify({
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Valid JWT token required in Authorization header'
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: createResponseHeaders(),
      body: JSON.stringify({
        error: 'MEDIA_FETCH_FAILED',
        message: error.message,
        status: 'failed'
      })
    };
  } finally {
    
  }
};
