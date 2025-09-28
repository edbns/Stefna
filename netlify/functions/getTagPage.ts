import { Handler } from '@netlify/functions';
import { getCORSHeaders, handleCORS } from '../utils/cors';
import { qOne, qMany } from '../utils/database';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: getCORSHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const tag = event.queryStringParameters?.tag;
  if (!tag) {
    return {
      statusCode: 400,
      headers: getCORSHeaders(),
      body: JSON.stringify({ error: 'Tag parameter is required' })
    };
  }

  try {
    // Get media count for this tag
    const countSql = `
      with allowed_users as (
        select user_id from user_settings where share_to_feed = true
      ),
      feed as (
        select 'cyber_siren' as type, id::text, user_id, image_url, preset, prompt, created_at, likes_count from cyber_siren_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset = $1
        union all
        select 'presets' as type, id::text, user_id, image_url, preset, prompt, created_at, likes_count from presets_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset = $1
        union all
        select 'unreal_reflection' as type, id::text, user_id, image_url, preset, prompt, created_at, likes_count from unreal_reflection_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset = $1
        union all
        select 'parallel_self' as type, id::text, user_id, image_url, preset, prompt, created_at, likes_count from parallel_self_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset = $1
        union all
        select 'ghibli_reaction' as type, id::text, user_id, image_url, preset, prompt, created_at, likes_count from ghibli_reaction_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset = $1
        union all
        select 'custom_prompt' as type, id::text, user_id, image_url, preset, prompt, created_at, likes_count from custom_prompt_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset = $1
        union all
        select 'edit' as type, id::text, user_id, image_url, null as preset, prompt, created_at, likes_count from edit_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND prompt ILIKE '%' || $1 || '%'
      )
      select count(*) as total
      from feed f
      join allowed_users u on u.user_id = f.user_id
    `;

    const countResult = await qOne(countSql, [tag]);
    const totalCount = countResult?.total || 0;

    // Get sample media for this tag (limit 20 for SEO)
    const mediaSql = `
      with allowed_users as (
        select user_id from user_settings where share_to_feed = true
      ),
      feed as (
        select 'cyber_siren' as type, id::text, user_id, image_url, preset, prompt, created_at, likes_count from cyber_siren_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset = $1
        union all
        select 'presets' as type, id::text, user_id, image_url, preset, prompt, created_at, likes_count from presets_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset = $1
        union all
        select 'unreal_reflection' as type, id::text, user_id, image_url, preset, prompt, created_at, likes_count from unreal_reflection_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset = $1
        union all
        select 'parallel_self' as type, id::text, user_id, image_url, preset, prompt, created_at, likes_count from parallel_self_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset = $1
        union all
        select 'ghibli_reaction' as type, id::text, user_id, image_url, preset, prompt, created_at, likes_count from ghibli_reaction_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset = $1
        union all
        select 'custom_prompt' as type, id::text, user_id, image_url, preset, prompt, created_at, likes_count from custom_prompt_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset = $1
        union all
        select 'edit' as type, id::text, user_id, image_url, null as preset, prompt, created_at, likes_count from edit_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND prompt ILIKE '%' || $1 || '%'
      )
      select f.*, u.name as user_name, u.avatar as user_avatar
      from feed f
      join allowed_users au on au.user_id = f.user_id
      left join users u on u.id = f.user_id
      order by f.likes_count desc, f.created_at desc
      limit 20
    `;

    const mediaResults = await qMany(mediaSql, [tag]);

    // Get popular tags for related suggestions
    const popularTagsSql = `
      with allowed_users as (
        select user_id from user_settings where share_to_feed = true
      ),
      all_presets as (
        select preset from cyber_siren_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset IS NOT NULL
        union all
        select preset from presets_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset IS NOT NULL
        union all
        select preset from unreal_reflection_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset IS NOT NULL
        union all
        select preset from parallel_self_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset IS NOT NULL
        union all
        select preset from ghibli_reaction_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset IS NOT NULL
        union all
        select preset from custom_prompt_media where status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' AND preset IS NOT NULL
      )
      select preset, count(*) as count
      from all_presets
      where preset IS NOT NULL AND preset != ''
      group by preset
      order by count desc
      limit 10
    `;

    const popularTags = await qMany(popularTagsSql, []);

    return {
      statusCode: 200,
      headers: {
        ...getCORSHeaders(),
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      },
      body: JSON.stringify({
        success: true,
        tag,
        totalCount,
        media: mediaResults,
        popularTags: popularTags.map(t => ({ tag: t.preset, count: t.count }))
      })
    };

  } catch (error) {
    console.error('Error fetching tag page data:', error);
    return {
      statusCode: 500,
      headers: getCORSHeaders(),
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch tag data'
      })
    };
  }
};
