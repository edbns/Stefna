// netlify/functions/getPublicFeed.ts
// 🔥 HOTFIX: Bypass Prisma for immediate relief from P6001 errors
// Uses pg directly with your Neon DATABASE_URL while we finish Prisma cleanup

import type { Handler } from '@netlify/functions';
import { Client as PgClient } from 'pg';

const redact = (u: string) => (u || '').replace(/:\/\/([^:]+):([^@]+)@/,'://$1:****@');

export const handler: Handler = async (event) => {
  const limit = Math.max(1, Math.min(100, Number(event.queryStringParameters?.limit ?? 20)));
  const offset = Math.max(0, Number(event.queryStringParameters?.offset ?? 0));

  const url = process.env.DATABASE_URL || '';
  if (!url) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'FEED_FETCH_FAILED', message: 'DATABASE_URL missing' }),
    };
  }

  const client = new PgClient({ connectionString: url });

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
    console.info('🔒 [getPublicFeed:pg] Connecting to Neon:', redact(url));
    await client.connect();
    const { rows } = await client.query(sql, [limit, offset]);
    await client.end();

        return {
          statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: rows, limit, offset }),
    };
  } catch (err: any) {
    console.error('💥 [getPublicFeed:pg] Error:', err?.message || err);
    try { await client.end(); } catch {}
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
