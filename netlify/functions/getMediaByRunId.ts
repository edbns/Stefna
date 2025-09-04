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

    // Search across all media tables for the exact runId
    const queries = [
      // Presets media
      `SELECT 'presets' as type, id, user_id, image_url, prompt, preset, run_id, created_at, status, metadata, likes_count 
       FROM presets_media 
       WHERE run_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      
      // Custom prompt media
      `SELECT 'custom_prompt' as type, id, user_id, image_url, prompt, run_id, created_at, status, metadata, likes_count 
       FROM custom_prompt_media 
       WHERE run_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      
      // Emotion mask media
      `SELECT 'emotion_mask' as type, id, user_id, image_url, prompt, emotion_mask_preset_id, run_id, created_at, status, metadata, likes_count 
       FROM emotion_mask_media 
       WHERE run_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      
      // Ghibli reaction media
      `SELECT 'ghibli_reaction' as type, id, user_id, image_url, prompt, ghibli_reaction_preset_id, run_id, created_at, status, metadata, likes_count 
       FROM ghibli_reaction_media 
       WHERE run_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      
      // Neo glitch media
      `SELECT 'neo_glitch' as type, id, user_id, image_url, prompt, preset, run_id, created_at, status, metadata, likes_count 
       FROM neo_glitch_media 
       WHERE run_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      
      // Story media
      `SELECT 'story' as type, id, user_id, video_url as image_url, prompt, story_time_preset_id, run_id, created_at, status, metadata, likes_count 
       FROM story 
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
        }
      } catch (error) {
        console.warn(`⚠️ [getMediaByRunId] Error querying ${query.split(' ')[1]} table:`, error);
        // Continue to next table
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
      presetKey: foundMedia.preset || foundMedia.emotion_mask_preset_id || foundMedia.ghibli_reaction_preset_id || foundMedia.story_time_preset_id,
      runId: foundMedia.run_id,
      timestamp: foundMedia.created_at,
      status: foundMedia.status,
      likes_count: foundMedia.likes_count || 0,
      metadata: foundMedia.metadata ? JSON.parse(foundMedia.metadata) : {},
      aspectRatio: 1, // Default aspect ratio
      width: 1024, // Default dimensions
      height: 1024,
      tokensUsed: 1,
      likes: foundMedia.likes_count || 0,
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
  } finally {
    await pool.end();
  }
};
