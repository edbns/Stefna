// netlify/functions/getPublicFeed.ts
// 🗄️ Public Feed using standardized _db helper
// Unified feed across all media tables

import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { q } from './_db';
import { handleCORS, getCORSHeaders } from './_lib/cors';

// Helper function to create consistent response headers
function createResponseHeaders(): Record<string, string> {
  return {
    ...getCORSHeaders(),
    'Content-Type': 'application/json'
  };
}



export const handler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: createResponseHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }


  const limit = Math.max(1, Math.min(200, Number(event.queryStringParameters?.limit ?? 100))); // Increased from 20 to 100, max 200
  const offset = Math.max(0, Number(event.queryStringParameters?.offset ?? 0));
  const userId = event.queryStringParameters?.userId; // Optional user ID for personalized sorting



  // Unified feed across your media tables, filtered by users who enabled share_to_feed
  // Only include items with valid image URLs to prevent broken feed items
  const sql = `
    with allowed_users as (
      select user_id from user_settings where share_to_feed = true
    ),
    feed as (
      select 'neo_glitch'      as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'neo_glitch' as "mediaType", preset as "presetKey", prompt, GREATEST(COALESCE(likes_count, 0), 0) as likes_count from neo_glitch_media      where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'presets'         as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'presets' as "mediaType", preset as "presetKey", prompt, GREATEST(COALESCE(likes_count, 0), 0) as likes_count from presets_media         where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'unreal_reflection'    as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'unreal_reflection' as "mediaType", preset as "presetKey", prompt, GREATEST(COALESCE(likes_count, 0), 0) as likes_count from unreal_reflection_media    where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'ghibli_reaction' as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'ghibli_reaction' as "mediaType", preset as "presetKey", prompt, GREATEST(COALESCE(likes_count, 0), 0) as likes_count from ghibli_reaction_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'custom_prompt'   as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'custom_prompt' as "mediaType", preset as "presetKey", prompt, GREATEST(COALESCE(likes_count, 0), 0) as likes_count from custom_prompt_media   where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'edit'            as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, null as preset, status, created_at, 'edit' as "mediaType", null as "presetKey", prompt, 0 as likes_count from edit_media            where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
    ),
    feed_with_user_likes as (
      select f.*, 
             case when $3::text is not null and exists(
               select 1 from likes l 
               where l.media_id = f.id 
               and l.media_type = f.type 
               and l.user_id = $3::text
             ) then 1 else 0 end as user_liked
      from feed f
      join allowed_users u on u.user_id = f.user_id
    )
    select *
    from feed_with_user_likes
    order by 
      user_liked desc,  -- User's liked media first
      likes_count desc,  -- Then by total likes count
      random()  -- Then shuffle the rest randomly
    limit $1 offset $2
  `;

  // Get total count for accurate pagination
  const countSql = `
    with allowed_users as (
      select user_id from user_settings where share_to_feed = true
    ),
    feed as (
      select 'neo_glitch'      as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'neo_glitch' as "mediaType", preset as "presetKey", prompt, obj_url, gltf_url, texture_url, model_3d_metadata from neo_glitch_media      where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'presets'         as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'presets' as "mediaType", preset as "presetKey", prompt, obj_url, gltf_url, texture_url, model_3d_metadata from presets_media         where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'unreal_reflection'    as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'unreal_reflection' as "mediaType", preset as "presetKey", prompt, obj_url, gltf_url, texture_url, model_3d_metadata from unreal_reflection_media    where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'ghibli_reaction' as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'ghibli_reaction' as "mediaType", preset as "presetKey", prompt, obj_url, gltf_url, texture_url, model_3d_metadata from ghibli_reaction_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'custom_prompt'   as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'custom_prompt' as "mediaType", preset as "presetKey", prompt, obj_url, gltf_url, texture_url, model_3d_metadata from custom_prompt_media   where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
      union all
      select 'edit'            as type, id::text, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, null as preset, status, created_at, 'edit' as "mediaType", null as "presetKey", prompt, obj_url, gltf_url, texture_url, model_3d_metadata from edit_media            where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
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
    
    const rows = await q(sql, [limit, offset, userId || null]);
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
      return {
        ...item,
        // Let frontend calculate aspect ratio - default to 1:1 for square images
        aspectRatio: 1
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
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
      },
      body: JSON.stringify({ 
        error: 'FEED_FETCH_FAILED',
        message: err?.message || 'Unknown error',
        status: 'failed',
      }),
    };
  }
};
