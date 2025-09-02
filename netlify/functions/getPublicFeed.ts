// netlify/functions/getPublicFeed.ts
// 🗄️ Public Feed using standardized _db helper
// Unified feed across all media tables

import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
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
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: createResponseHeaders(),
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: createResponseHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const limit = Math.max(1, Math.min(200, Number(event.queryStringParameters?.limit ?? 100))); // Increased from 20 to 100, max 200
  const offset = Math.max(0, Number(event.queryStringParameters?.offset ?? 0));



  // Unified feed across your media tables, filtered by users who enabled share_to_feed
  // Only include items with valid image URLs to prevent broken feed items
  const sql = `
    with allowed_users as (
      select user_id from user_settings where share_to_feed = true
    ),
    feed as (
      select 'neo_glitch'      as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, width, height, 'neo-glitch' as "mediaType", preset as "presetKey", prompt from neo_glitch_media      where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'presets'         as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, width, height, 'preset' as "mediaType", preset as "presetKey", prompt from presets_media         where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'emotion_mask'    as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, width, height, 'emotionmask' as "mediaType", preset as "presetKey", prompt from emotion_mask_media    where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'ghibli_reaction' as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, width, height, 'ghiblireact' as "mediaType", preset as "presetKey", prompt from ghibli_reaction_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'custom_prompt'   as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, width, height, 'custom' as "mediaType", preset as "presetKey", prompt from custom_prompt_media   where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
    )
    select f.*
    from feed f
    join allowed_users u on u.user_id = f.user_id
    order by f.created_at desc
    limit $1 offset $2
  `;

  // Get total count for accurate pagination
  const countSql = `
    with allowed_users as (
      select user_id from user_settings where share_to_feed = true
    ),
    feed as (
      select 'neo_glitch'      as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, width, height, 'neo-glitch' as "mediaType", preset as "presetKey", prompt from neo_glitch_media      where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'presets'         as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, width, height, 'preset' as "mediaType", preset as "presetKey", prompt from presets_media         where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'emotion_mask'    as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, width, height, 'emotionmask' as "mediaType", preset as "presetKey", prompt from emotion_mask_media    where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'ghibli_reaction' as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, width, height, 'ghiblireact' as "mediaType", preset as "presetKey", prompt from ghibli_reaction_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'custom_prompt'   as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, width, height, 'custom' as "mediaType", preset as "presetKey", prompt from custom_prompt_media   where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
    )
    select count(*) as total
    from feed f
    join allowed_users u on u.user_id = f.user_id
  `;

  try {
    console.info('🔒 [getPublicFeed] Fetching feed with limit:', limit, 'offset:', offset);
    
    // First check if we have any users with share_to_feed enabled
    const allowedUsersCount = await q(`SELECT COUNT(*) as count FROM user_settings WHERE share_to_feed = true`);
    console.info('🔒 [getPublicFeed] Users with share_to_feed enabled:', allowedUsersCount[0]?.count || 0);
    
    // Get total count for accurate pagination
    const totalCountResult = await q(countSql);
    const totalCount = totalCountResult[0]?.total || 0;
    console.info('🔒 [getPublicFeed] Total items available:', totalCount);
    
    const rows = await q(sql, [limit, offset]);
    console.info('🔒 [getPublicFeed] Feed items found:', rows.length);
    
    // Debug: Log first few items to see their structure
    if (rows.length > 0) {
      console.info('🔍 [getPublicFeed] Sample item structure:', {
        firstItem: rows[0],
        hasImageUrl: !!rows[0]?.imageUrl,
        imageUrlValue: rows[0]?.imageUrl,
        totalItems: rows.length
      });
    }

    // Field names are now properly aliased in SQL, no processing needed
    const processedRows = rows.map(item => {
      // Calculate aspect ratio from width and height
      const width = item.width || 1024; // Default width
      const height = item.height || 1024; // Default height
      const aspectRatio = width / height;
      
      return {
        ...item,
        width: width,
        height: height,
        aspectRatio: aspectRatio
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ 
        items: processedRows || [], 
        limit, 
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount,
        totalUsers: allowedUsersCount[0]?.count || 0,
        message: processedRows.length > 0 ? `Found ${processedRows.length} items` : 'No public items available yet'
      }),
    };
  } catch (err: any) {
    console.error('💥 [getPublicFeed] Error:', err?.message || err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'FEED_FETCH_FAILED',
        message: err?.message || 'Unknown error',
        status: 'failed',
      }),
    };
  }
};
