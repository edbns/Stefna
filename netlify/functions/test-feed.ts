// netlify/functions/test-feed.ts
// Simple test function to debug feed issues

import type { Handler } from '@netlify/functions';
import { q } from './_db';

// Helper function to create consistent response headers
function createResponseHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
}

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: createResponseHeaders(),
      body: ''
    };
  }

  try {
    console.log('🔍 [Test Feed] Starting feed diagnostics...');

    // 1. Check if users exist
    const usersCount = await q('SELECT COUNT(*) as count FROM users');
    console.log('👥 Users count:', usersCount[0]?.count);

    // 2. Check if user_settings exist
    const userSettingsCount = await q('SELECT COUNT(*) as count FROM user_settings');
    console.log('⚙️ User settings count:', userSettingsCount[0]?.count);

    // 3. Check share_to_feed status
    const shareToFeedCount = await q('SELECT COUNT(*) as count FROM user_settings WHERE share_to_feed = true');
    console.log('📤 Users with share_to_feed enabled:', shareToFeedCount[0]?.count);

    // 4. Check media tables
    const neoGlitchCount = await q('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed FROM neo_glitch_media');
    const presetsCount = await q('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed FROM presets_media');
    const emotionMaskCount = await q('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed FROM emotion_mask_media');
    const ghibliCount = await q('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed FROM ghibli_reaction_media');
    const customCount = await q('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed FROM custom_prompt_media');

    console.log('📊 Media counts:', {
      neoGlitch: neoGlitchCount[0],
      presets: presetsCount[0],
      emotionMask: emotionMaskCount[0],
      ghibli: ghibliCount[0],
      custom: customCount[0]
    });

    // 5. Test the actual feed query
    const feedQuery = `
      WITH allowed_users AS (
        SELECT user_id FROM user_settings WHERE share_to_feed = true
      ),
      feed AS (
        SELECT 'neo_glitch'      as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'neo-glitch' as "mediaType", preset as "presetKey", prompt FROM neo_glitch_media      WHERE status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
        UNION ALL
        SELECT 'presets'         as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'preset' as "mediaType", preset as "presetKey", prompt FROM presets_media         WHERE status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
        UNION ALL
        SELECT 'emotion_mask'    as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'emotionmask' as "mediaType", preset as "presetKey", prompt FROM emotion_mask_media    WHERE status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
        UNION ALL
        SELECT 'ghibli_reaction' as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'ghiblireact' as "mediaType", preset as "presetKey", prompt FROM ghibli_reaction_media WHERE status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
        UNION ALL
        SELECT 'custom_prompt'   as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'custom' as "mediaType", preset as "presetKey", prompt FROM custom_prompt_media   WHERE status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      )
      SELECT f.*
      FROM feed f
      JOIN allowed_users u ON u.user_id = f.user_id
      ORDER BY f.created_at DESC
      LIMIT 5
    `;

    const feedResult = await q(feedQuery);
    console.log('📰 Feed query result count:', feedResult.length);

    // 6. Sample some data
    const sampleNeoGlitch = await q('SELECT id, user_id, preset, status, image_url, created_at FROM neo_glitch_media WHERE status = \'completed\' LIMIT 1');
    const sampleUserSettings = await q('SELECT user_id, share_to_feed, media_upload_agreed FROM user_settings LIMIT 3');

    return {
      statusCode: 200,
      headers: createResponseHeaders(),
      body: JSON.stringify({
        diagnostics: {
          users: usersCount[0]?.count || 0,
          userSettings: userSettingsCount[0]?.count || 0,
          shareToFeedEnabled: shareToFeedCount[0]?.count || 0,
          media: {
            neoGlitch: neoGlitchCount[0],
            presets: presetsCount[0],
            emotionMask: emotionMaskCount[0],
            ghibli: ghibliCount[0],
            custom: customCount[0]
          },
          feedQueryResult: feedResult.length,
          sampleNeoGlitch: sampleNeoGlitch[0] || null,
          sampleUserSettings: sampleUserSettings || []
        }
      })
    };

  } catch (error: any) {
    console.error('💥 [Test Feed] Error:', error);
    return {
      statusCode: 500,
      headers: createResponseHeaders(),
      body: JSON.stringify({ 
        error: 'TEST_FAILED',
        message: error?.message || 'Unknown error',
        stack: error?.stack
      })
    };
  }
};
