-- Debug Feed Issue: Check database state
-- This script will help identify why the feed is not showing

-- 1. Check if users exist
SELECT 'USERS' as table_name, COUNT(*) as count FROM users;

-- 2. Check if user_settings exist and share_to_feed status
SELECT 'USER_SETTINGS' as table_name, COUNT(*) as total_count FROM user_settings;
SELECT 'SHARE_TO_FEED_ENABLED' as status, COUNT(*) as count FROM user_settings WHERE share_to_feed = true;
SELECT 'SHARE_TO_FEED_DISABLED' as status, COUNT(*) as count FROM user_settings WHERE share_to_feed = false;

-- 3. Check if media tables have completed items
SELECT 'NEO_GLITCH_MEDIA' as table_name, COUNT(*) as total, 
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' THEN 1 END) as valid_urls
FROM neo_glitch_media;

SELECT 'PRESETS_MEDIA' as table_name, COUNT(*) as total, 
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' THEN 1 END) as valid_urls
FROM presets_media;

SELECT 'EMOTION_MASK_MEDIA' as table_name, COUNT(*) as total, 
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' THEN 1 END) as valid_urls
FROM emotion_mask_media;

SELECT 'GHIBLI_REACTION_MEDIA' as table_name, COUNT(*) as total, 
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' THEN 1 END) as valid_urls
FROM ghibli_reaction_media;

SELECT 'CUSTOM_PROMPT_MEDIA' as table_name, COUNT(*) as total, 
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%' THEN 1 END) as valid_urls
FROM custom_prompt_media;

-- 4. Test the actual feed query
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
SELECT 'FEED_QUERY_RESULT' as status, COUNT(*) as count FROM feed f JOIN allowed_users u ON u.user_id = f.user_id;

-- 5. Sample some actual data
SELECT 'SAMPLE_NEO_GLITCH' as source, id, user_id, preset, status, image_url, created_at FROM neo_glitch_media WHERE status = 'completed' LIMIT 3;
SELECT 'SAMPLE_USER_SETTINGS' as source, user_id, share_to_feed, media_upload_agreed FROM user_settings LIMIT 5;
