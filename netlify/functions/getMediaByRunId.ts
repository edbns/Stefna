import { Handler } from '@netlify/functions';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { runId } = event.queryStringParameters || {};

    if (!runId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          success: false,
          error: 'Missing runId parameter' 
        })
      };
    }

    console.log(`🔍 [getMediaByRunId] Searching for media with runId: ${runId}`);
    console.log(`🔍 [getMediaByRunId] RunId type: ${typeof runId}, length: ${runId?.length}`);

    // Search across all media tables for the exact runId
    const queries = [
      // Presets media
      `SELECT 'presets' as type, id, user_id, image_url, prompt, preset, run_id, created_at, status, metadata, GREATEST(COALESCE(likes_count, 0), 0) as likes_count 
       FROM presets_media 
       WHERE run_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      
      // Custom prompt media
      `SELECT 'custom_prompt' as type, id, user_id, image_url, prompt, run_id, created_at, status, metadata, GREATEST(COALESCE(likes_count, 0), 0) as likes_count 
       FROM custom_prompt_media 
       WHERE run_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      
      // Emotion mask media - use preset column instead of unreal_reflection_preset_id
      `SELECT 'unreal_reflection' as type, id, user_id, image_url, prompt, preset, run_id, created_at, status, metadata, GREATEST(COALESCE(likes_count, 0), 0) as likes_count 
       FROM unreal_reflection_media 
       WHERE run_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      
      // Ghibli reaction media - use preset column instead of ghibli_reaction_preset_id
      `SELECT 'ghibli_reaction' as type, id, user_id, image_url, prompt, preset, run_id, created_at, status, metadata, GREATEST(COALESCE(likes_count, 0), 0) as likes_count 
       FROM ghibli_reaction_media 
       WHERE run_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      
      // Neo glitch media
      `SELECT 'neo_glitch' as type, id, user_id, image_url, prompt, preset, run_id, created_at, status, metadata, GREATEST(COALESCE(likes_count, 0), 0) as likes_count 
       FROM neo_glitch_media 
       WHERE run_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      
      // Story media - use story_photo table for video_url, search by id since story table doesn't have run_id
      `SELECT 'story' as type, s.id, s.user_id, sp.video_url as image_url, s.title as prompt, s.preset, s.id as run_id, s.created_at, s.status, s.metadata, 0 as GREATEST(COALESCE(likes_count, 0), 0) as likes_count 
       FROM story s
       LEFT JOIN story_photo sp ON s.id = sp.story_id
       WHERE s.id = $1 
       ORDER BY s.created_at DESC 
       LIMIT 1`,
      
      // Edit media
      `SELECT 'edit' as type, id, user_id, image_url, prompt, 'edit' as preset, run_id, created_at, status, metadata, 0 as GREATEST(COALESCE(likes_count, 0), 0) as likes_count 
       FROM edit_media 
       WHERE run_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`
    ];

    let foundMedia = null;

    for (const query of queries) {
      try {
        const result = await pool.query(query, [runId]);
        
        if (result.rows.length > 0) {
          foundMedia = result.rows[0];
          console.log(`✅ [getMediaByRunId] Found media in ${foundMedia.type} table:`, {
            id: foundMedia.id,
            runId: foundMedia.run_id,
            createdAt: foundMedia.created_at,
            status: foundMedia.status
          });
          break;
        } else {
          console.log(`❌ [getMediaByRunId] No media found in ${query.split(' ')[1]} table for runId: ${runId}`);
        }
      } catch (error) {
        const tableName = query.split(' ')[1];
        console.warn(`⚠️ [getMediaByRunId] Error querying ${tableName} table:`, error);
        
        // If it's a connection error, throw it to stop processing
        if (error instanceof Error && (error.message.includes('connection') || error.message.includes('timeout'))) {
          console.error(`❌ [getMediaByRunId] Database connection error for ${tableName}:`, error);
          throw error;
        }
        
        // Continue to next table for other errors
      }
    }

    if (!foundMedia) {
      console.log(`❌ [getMediaByRunId] No media found with runId: ${runId}`);
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          success: false,
          error: 'Media not found',
          runId: runId
        })
      };
    }

    // Transform the media item to match the expected format
    const transformedMedia = {
      id: foundMedia.id,
      userId: foundMedia.user_id,
      type: foundMedia.type === 'story' ? 'video' : 'photo',
      url: foundMedia.image_url,
      prompt: foundMedia.prompt,
      presetKey: foundMedia.preset || foundMedia.unreal_reflection_preset_id || foundMedia.ghibli_reaction_preset_id || foundMedia.story_time_preset_id,
      runId: foundMedia.run_id,
      timestamp: foundMedia.created_at,
      status: foundMedia.status,
      GREATEST(COALESCE(likes_count, 0), 0) as likes_count: foundMedia.GREATEST(COALESCE(likes_count, 0), 0) as likes_count || 0,
      metadata: foundMedia.metadata ? 
        (typeof foundMedia.metadata === 'string' ? JSON.parse(foundMedia.metadata) : foundMedia.metadata) 
        : {},
      aspectRatio: 1, // Default aspect ratio
      width: 1024, // Default dimensions
      height: 1024,
      tokensUsed: 1,
      likes: foundMedia.GREATEST(COALESCE(likes_count, 0), 0) as likes_count || 0,
      isPublic: true,
      tags: []
    };

    console.log(`✅ [getMediaByRunId] Returning media:`, {
      id: transformedMedia.id,
      type: transformedMedia.type,
      runId: transformedMedia.runId,
      status: transformedMedia.status
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        media: transformedMedia,
        runId: runId
      })
    };

  } catch (error) {
    console.error('💥 [getMediaByRunId] Error:', error);
    
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
