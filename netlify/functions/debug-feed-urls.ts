import type { Handler } from "@netlify/functions";
import { q } from './_db';
import { json } from './_lib/http';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.info('🔍 [debug-feed-urls] Checking feed URLs...');
    
    // Check each table for completed items and their URLs
    const results = {
      neo_glitch: await q(`
        SELECT id, user_id, image_url, source_url, preset, status, created_at
        FROM neo_glitch_media 
        WHERE status = 'completed' 
        LIMIT 5
      `),
      presets: await q(`
        SELECT id, user_id, image_url, source_url, preset, status, created_at
        FROM presets_media 
        WHERE status = 'completed' 
        LIMIT 5
      `),
      emotion_mask: await q(`
        SELECT id, user_id, image_url, source_url, preset, status, created_at
        FROM emotion_mask_media 
        WHERE status = 'completed' 
        LIMIT 5
      `),
      ghibli_reaction: await q(`
        SELECT id, user_id, image_url, source_url, preset, status, created_at
        FROM ghibli_reaction_media 
        WHERE status = 'completed' 
        LIMIT 5
      `),
      custom_prompt: await q(`
        SELECT id, user_id, image_url, source_url, preset, status, created_at
        FROM custom_prompt_media 
        WHERE status = 'completed' 
        LIMIT 5
      `)
    };

    // Count total completed items and null/empty URLs
    const totalStats = await q(`
      SELECT 
        'total_completed' as stat_type,
        COUNT(*) as count
      FROM (
        SELECT image_url FROM neo_glitch_media WHERE status = 'completed'
        UNION ALL
        SELECT image_url FROM presets_media WHERE status = 'completed'
        UNION ALL
        SELECT image_url FROM emotion_mask_media WHERE status = 'completed'
        UNION ALL
        SELECT image_url FROM ghibli_reaction_media WHERE status = 'completed'
        UNION ALL
        SELECT image_url FROM custom_prompt_media WHERE status = 'completed'
      ) all_media
    `);

    const nullUrlStats = await q(`
      SELECT 
        'null_or_empty_urls' as stat_type,
        COUNT(*) as count
      FROM (
        SELECT image_url FROM neo_glitch_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '')
        UNION ALL
        SELECT image_url FROM presets_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '')
        UNION ALL
        SELECT image_url FROM emotion_mask_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '')
        UNION ALL
        SELECT image_url FROM ghibli_reaction_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '')
        UNION ALL
        SELECT image_url FROM custom_prompt_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '')
      ) null_urls
    `);

    const debugInfo = {
      message: 'Feed URL debugging complete',
      timestamp: new Date().toISOString(),
      sampleData: results,
      statistics: {
        totalCompleted: totalStats[0]?.count || 0,
        nullOrEmptyUrls: nullUrlStats[0]?.count || 0
      }
    };

    console.info('🔍 [debug-feed-urls] Debug info:', debugInfo);

    return json(debugInfo);

  } catch (error) {
    console.error('💥 [debug-feed-urls] Error:', error);
    return json({ 
      error: 'DEBUG_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
