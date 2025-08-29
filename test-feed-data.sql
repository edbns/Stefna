-- Test script to see what's actually in the feed tables
-- Run this to debug the "no valid URL from backend" issue

-- Check neo_glitch_media table
SELECT 
  'neo_glitch' as table_name,
  id,
  user_id,
  image_url,
  source_url,
  preset,
  status,
  created_at
FROM neo_glitch_media 
WHERE status = 'completed' 
LIMIT 5;

-- Check presets_media table
SELECT 
  'presets' as table_name,
  id,
  user_id,
  image_url,
  source_url,
  preset,
  status,
  created_at
FROM presets_media 
WHERE status = 'completed' 
LIMIT 5;

-- Check emotion_mask_media table
SELECT 
  'emotion_mask' as table_name,
  id,
  user_id,
  image_url,
  source_url,
  preset,
  status,
  created_at
FROM emotion_mask_media 
WHERE status = 'completed' 
LIMIT 5;

-- Check ghibli_reaction_media table
SELECT 
  'ghibli_reaction' as table_name,
  id,
  user_id,
  image_url,
  source_url,
  preset,
  status,
  created_at
FROM ghibli_reaction_media 
WHERE status = 'completed' 
LIMIT 5;

-- Check custom_prompt_media table
SELECT 
  'custom_prompt' as table_name,
  id,
  user_id,
  image_url,
  source_url,
  preset,
  status,
  created_at
FROM custom_prompt_media 
WHERE status = 'completed' 
LIMIT 5;

-- Check if any completed items have NULL image_url
SELECT 
  'NULL image_url check' as check_type,
  COUNT(*) as total_completed,
  COUNT(CASE WHEN image_url IS NULL THEN 1 END) as null_image_url,
  COUNT(CASE WHEN image_url = '' THEN 1 END) as empty_image_url
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
) all_media;
