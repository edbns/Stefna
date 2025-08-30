-- Diagnose image_url issues in media tables
-- Run this to see what's wrong with the feed URLs

-- Check NeoGlitch media
SELECT 'neo_glitch_media' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN image_url IS NULL THEN 1 END) as null_urls,
       COUNT(CASE WHEN image_url = '' THEN 1 END) as empty_urls,
       COUNT(CASE WHEN image_url NOT LIKE 'http%' THEN 1 END) as invalid_urls,
       COUNT(CASE WHEN image_url LIKE 'http%' THEN 1 END) as valid_urls
FROM neo_glitch_media
WHERE status = 'completed';

-- Check Ghibli Reaction media
SELECT 'ghibli_reaction_media' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN image_url IS NULL THEN 1 END) as null_urls,
       COUNT(CASE WHEN image_url = '' THEN 1 END) as empty_urls,
       COUNT(CASE WHEN image_url NOT LIKE 'http%' THEN 1 END) as invalid_urls,
       COUNT(CASE WHEN image_url LIKE 'http%' THEN 1 END) as valid_urls
FROM ghibli_reaction_media
WHERE status = 'completed';

-- Check Presets media
SELECT 'presets_media' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN image_url IS NULL THEN 1 END) as null_urls,
       COUNT(CASE WHEN image_url = '' THEN 1 END) as empty_urls,
       COUNT(CASE WHEN image_url NOT LIKE 'http%' THEN 1 END) as invalid_urls,
       COUNT(CASE WHEN image_url LIKE 'http%' THEN 1 END) as valid_urls
FROM presets_media
WHERE status = 'completed';

-- Check Emotion Mask media
SELECT 'emotion_mask_media' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN image_url IS NULL THEN 1 END) as null_urls,
       COUNT(CASE WHEN image_url = '' THEN 1 END) as empty_urls,
       COUNT(CASE WHEN image_url NOT LIKE 'http%' THEN 1 END) as invalid_urls,
       COUNT(CASE WHEN image_url LIKE 'http%' THEN 1 END) as valid_urls
FROM emotion_mask_media
WHERE status = 'completed';

-- Check Custom Prompt media
SELECT 'custom_prompt_media' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN image_url IS NULL THEN 1 END) as null_urls,
       COUNT(CASE WHEN image_url = '' THEN 1 END) as empty_urls,
       COUNT(CASE WHEN image_url NOT LIKE 'http%' THEN 1 END) as invalid_urls,
       COUNT(CASE WHEN image_url LIKE 'http%' THEN 1 END) as valid_urls
FROM custom_prompt_media
WHERE status = 'completed';

-- Sample broken URLs from each table
SELECT 'neo_glitch_media' as table_name, id, image_url, status, created_at
FROM neo_glitch_media
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
LIMIT 5;

SELECT 'ghibli_reaction_media' as table_name, id, image_url, status, created_at
FROM ghibli_reaction_media
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
LIMIT 5;

SELECT 'presets_media' as table_name, id, image_url, status, created_at
FROM presets_media
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
LIMIT 5;

SELECT 'emotion_mask_media' as table_name, id, image_url, status, created_at
FROM emotion_mask_media
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
LIMIT 5;

SELECT 'custom_prompt_media' as table_name, id, image_url, status, created_at
FROM custom_prompt_media
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
LIMIT 5;

-- Sample valid URLs to see the pattern
SELECT 'neo_glitch_media' as table_name, id, image_url, status, created_at
FROM neo_glitch_media
WHERE status = 'completed' AND image_url LIKE 'http%'
LIMIT 3;

SELECT 'ghibli_reaction_media' as table_name, id, image_url, status, created_at
FROM ghibli_reaction_media
WHERE status = 'completed' AND image_url LIKE 'http%'
LIMIT 3;
