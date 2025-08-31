-- Verify current database schema for privacy-first implementation
-- Don't assume anything - check what actually exists

-- 1. Check if user_settings table has the correct columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;

-- 2. Check if share_to_feed column actually exists and has correct type
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name = 'share_to_feed';

-- 3. Check actual values in user_settings to see what we're working with
SELECT 
    user_id,
    share_to_feed,
    media_upload_agreed,
    created_at,
    updated_at
FROM user_settings 
LIMIT 5;

-- 4. Check if media tables have the expected status columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN (
    'ghibli_reaction_media',
    'emotion_mask_media', 
    'presets_media',
    'custom_prompt_media',
    'neo_glitch_media'
)
AND column_name = 'status'
ORDER BY table_name;

-- 5. Check what status values actually exist in media tables
SELECT 
    'ghibli_reaction_media' as table_name,
    status,
    COUNT(*) as count
FROM ghibli_reaction_media 
GROUP BY status
UNION ALL
SELECT 
    'emotion_mask_media' as table_name,
    status,
    COUNT(*) as count
FROM emotion_mask_media 
GROUP BY status
UNION ALL
SELECT 
    'presets_media' as table_name,
    status,
    COUNT(*) as count
FROM presets_media 
GROUP BY status
UNION ALL
SELECT 
    'custom_prompt_media' as table_name,
    status,
    COUNT(*) as count
FROM custom_prompt_media 
GROUP BY status
UNION ALL
SELECT 
    'neo_glitch_media' as table_name,
    status,
    COUNT(*) as count
FROM neo_glitch_media 
GROUP BY status
ORDER BY table_name, count DESC;

-- 6. Check if getPublicFeed function is actually filtering correctly
-- Let's see what the current feed query would return
WITH allowed_users AS (
    SELECT user_id FROM user_settings WHERE share_to_feed = true
),
feed AS (
    SELECT 'neo_glitch' as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'neo-glitch' as "mediaType", preset as "presetKey", prompt FROM neo_glitch_media WHERE status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
    UNION ALL
    SELECT 'presets' as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'preset' as "mediaType", preset as "presetKey", prompt FROM presets_media WHERE status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
    UNION ALL
    SELECT 'emotion_mask' as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'emotionmask' as "mediaType", preset as "presetKey", prompt FROM emotion_mask_media WHERE status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
    UNION ALL
    SELECT 'ghibli_reaction' as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'ghiblireact' as "mediaType", preset as "presetKey", prompt FROM ghibli_reaction_media WHERE status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
    UNION ALL
    SELECT 'custom_prompt' as type, id, user_id, image_url as "finalUrl", image_url as "imageUrl", source_url, preset, status, created_at, 'custom' as "mediaType", preset as "presetKey", prompt FROM custom_prompt_media WHERE status = 'completed' AND image_url IS NOT NULL AND image_url != '' AND image_url LIKE 'http%'
)
SELECT 
    'feed_items_with_public_users' as query_type,
    COUNT(*) as count
FROM feed f
JOIN allowed_users u ON u.user_id = f.user_id
UNION ALL
SELECT 
    'total_feed_items' as query_type,
    COUNT(*) as count
FROM feed
UNION ALL
SELECT 
    'users_with_share_enabled' as query_type,
    COUNT(*) as count
FROM allowed_users;
