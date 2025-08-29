// netlify/functions/getPublicFeed.ts
// 🗄️ Public Feed using standardized _db helper
// Unified feed across all media tables

import type { Handler } from '@netlify/functions';
import { q } from './_db';



export const handler: Handler = async (event) => {
  const limit = Math.max(1, Math.min(100, Number(event.queryStringParameters?.limit ?? 20)));
  const offset = Math.max(0, Number(event.queryStringParameters?.offset ?? 0));



  // Unified feed across your media tables, filtered by users who enabled share_to_feed
  const sql = `
    with allowed_users as (
      select user_id from user_settings where share_to_feed = true
    ),
    feed as (
      select 'neo_glitch'      as type, id, user_id, image_url, source_url, preset, status, created_at from neo_glitch_media      where status = 'completed'
      union all
      select 'presets'         as type, id, user_id, image_url, source_url, preset, status, created_at from presets_media         where status = 'completed'
      union all
      select 'emotion_mask'    as type, id, user_id, image_url, source_url, preset, status, created_at from emotion_mask_media    where status = 'completed'
      union all
      select 'ghibli_reaction' as type, id, user_id, image_url, source_url, preset, status, created_at from ghibli_reaction_media where status = 'completed'
      union all
      select 'custom_prompt'   as type, id, user_id, image_url, source_url, preset, status, created_at from custom_prompt_media   where status = 'completed'
    )
    select f.*
    from feed f
    join allowed_users u on u.user_id = f.user_id
    order by f.created_at desc
    limit $1 offset $2
  `;

  try {
    console.info('🔒 [getPublicFeed] Fetching feed with limit:', limit, 'offset:', offset);
    const rows = await q(sql, [limit, offset]);

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: rows, limit, offset }),
    };
  } catch (err: any) {
    console.error('💥 [getPublicFeed] Error:', err?.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'FEED_FETCH_FAILED',
        message: err?.message || 'Unknown error',
        status: 'failed',
      }),
    };
  }
};
