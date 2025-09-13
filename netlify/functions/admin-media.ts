import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';

// ============================================================================
// ADMIN MEDIA BROWSER
// ============================================================================
// This function provides admin access to browse and manage all media
// - View all media across all tables
// - Delete media
// - View media statistics
// - Filter and search media
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
      }
    };
  }

  try {
    // Admin authentication check
    const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (event.httpMethod === 'GET') {
      // Get all media with pagination and filtering
      const { limit = '50', offset = '0', type, status, search } = event.queryStringParameters || {}
      
      // Ensure valid numbers
      const limitNum = Math.max(1, Math.min(1000, parseInt(limit) || 50));
      const offsetNum = Math.max(0, parseInt(offset) || 0);
      
      console.log('🔍 [Admin] Fetching media with filters:', { limit: limitNum, offset: offsetNum, type, status, search })
      
      // Build dynamic query based on filters
      let whereClause = "WHERE 1=1"
      const queryParams: any[] = []
      let paramIndex = 1

      if (type && type !== 'all') {
        whereClause += ` AND type = $${paramIndex}`
        queryParams.push(type)
        paramIndex++
      }

      if (status && status !== 'all') {
        whereClause += ` AND status = $${paramIndex}`
        queryParams.push(status)
        paramIndex++
      }

      if (search) {
        whereClause += ` AND (prompt ILIKE $${paramIndex} OR user_id ILIKE $${paramIndex})`
        queryParams.push(`%${search}%`)
        paramIndex++
      }

      // Get media from all tables
      const media = await q(`
        WITH all_media AS (
          SELECT 'neo_glitch' as type, id::text, user_id, image_url as "finalUrl", source_url, preset, status, created_at, prompt, likes_count, metadata FROM neo_glitch_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'presets' as type, id::text, user_id, image_url as "finalUrl", source_url, preset, status, created_at, prompt, likes_count, metadata FROM presets_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'unreal_reflection' as type, id::text, user_id, image_url as "finalUrl", source_url, preset, status, created_at, prompt, likes_count, metadata FROM unreal_reflection_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'ghibli_reaction' as type, id::text, user_id, image_url as "finalUrl", source_url, preset, status, created_at, prompt, likes_count, metadata FROM ghibli_reaction_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'custom_prompt' as type, id::text, user_id, image_url as "finalUrl", source_url, preset, status, created_at, prompt, likes_count, metadata FROM custom_prompt_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'edit' as type, id::text, user_id, image_url as "finalUrl", source_url, null as preset, status, created_at, prompt, 0 as likes_count, metadata FROM edit_media WHERE status = 'completed' AND image_url IS NOT NULL
        )
        SELECT * FROM all_media
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...queryParams, limitNum, offsetNum]);

      // Get total count
      const totalCount = await q(`
        WITH all_media AS (
          SELECT 'neo_glitch' as type, id::text, user_id, image_url as "finalUrl", source_url, preset, status, created_at, prompt, likes_count, metadata FROM neo_glitch_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'presets' as type, id::text, user_id, image_url as "finalUrl", source_url, preset, status, created_at, prompt, likes_count, metadata FROM presets_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'unreal_reflection' as type, id::text, user_id, image_url as "finalUrl", source_url, preset, status, created_at, prompt, likes_count, metadata FROM unreal_reflection_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'ghibli_reaction' as type, id::text, user_id, image_url as "finalUrl", source_url, preset, status, created_at, prompt, likes_count, metadata FROM ghibli_reaction_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'custom_prompt' as type, id::text, user_id, image_url as "finalUrl", source_url, preset, status, created_at, prompt, likes_count, metadata FROM custom_prompt_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'edit' as type, id::text, user_id, image_url as "finalUrl", source_url, null as preset, status, created_at, prompt, 0 as likes_count, metadata FROM edit_media WHERE status = 'completed' AND image_url IS NOT NULL
        )
        SELECT COUNT(*) as total FROM all_media
        ${whereClause}
      `, queryParams);

      // Get media statistics
      const stats = await q(`
        SELECT 
          COUNT(*) as total_media,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN type = 'neo_glitch' THEN 1 END) as neo_glitch_count,
          COUNT(CASE WHEN type = 'presets' THEN 1 END) as presets_count,
          COUNT(CASE WHEN type = 'unreal_reflection' THEN 1 END) as unreal_reflection_count,
          COUNT(CASE WHEN type = 'ghibli_reaction' THEN 1 END) as ghibli_reaction_count,
          COUNT(CASE WHEN type = 'custom_prompt' THEN 1 END) as custom_prompt_count,
          COUNT(CASE WHEN type = 'edit' THEN 1 END) as edit_count
        FROM (
          SELECT 'neo_glitch' as type, user_id FROM neo_glitch_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'presets' as type, user_id FROM presets_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'unreal_reflection' as type, user_id FROM unreal_reflection_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'ghibli_reaction' as type, user_id FROM ghibli_reaction_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'custom_prompt' as type, user_id FROM custom_prompt_media WHERE status = 'completed' AND image_url IS NOT NULL
          UNION ALL
          SELECT 'edit' as type, user_id FROM edit_media WHERE status = 'completed' AND image_url IS NOT NULL
        ) all_media
      `);

      console.log(`✅ [Admin] Retrieved ${media.length} media items`)
      
      return json({
        media,
        total: totalCount[0]?.total || 0,
        stats: stats[0] || {},
        limit: limitNum,
        offset: offsetNum,
        timestamp: new Date().toISOString()
      })

    } else if (event.httpMethod === 'DELETE') {
      // Delete media
      const body = JSON.parse(event.body || '{}')
      const { id, type } = body

      if (!id || !type) {
        return json({ error: 'Media ID and type are required' }, { status: 400 })
      }

      console.log(`🗑️ [Admin] Deleting media: ${type} - ${id}`)

      let deleteResult
      switch (type) {
        case 'neo_glitch':
          deleteResult = await q(`DELETE FROM neo_glitch_media WHERE id = $1`, [id])
          break
        case 'presets':
          deleteResult = await q(`DELETE FROM presets_media WHERE id = $1`, [id])
          break
        case 'unreal_reflection':
          deleteResult = await q(`DELETE FROM unreal_reflection_media WHERE id = $1`, [id])
          break
        case 'ghibli_reaction':
          deleteResult = await q(`DELETE FROM ghibli_reaction_media WHERE id = $1`, [id])
          break
        case 'custom_prompt':
          deleteResult = await q(`DELETE FROM custom_prompt_media WHERE id = $1`, [id])
          break
        case 'edit':
          deleteResult = await q(`DELETE FROM edit_media WHERE id = $1`, [id])
          break
        default:
          return json({ error: 'Invalid media type' }, { status: 400 })
      }

      console.log(`✅ [Admin] Deleted media: ${type} - ${id}`)
      
      return json({
        success: true,
        message: 'Media deleted successfully'
      })

    } else {
      return json({ error: 'Method not allowed' }, { status: 405 })
    }

  } catch (error: any) {
    console.error('💥 [Admin Media] Error:', error?.message || error)
    return json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}
