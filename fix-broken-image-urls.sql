-- Fix broken image_url entries in media tables
-- This script will clean up broken URLs and mark them as failed

-- First, let's see what we're dealing with
SELECT 'BEFORE FIX - Total broken records' as status,
       COUNT(*) as total_broken
FROM (
  SELECT id, image_url FROM neo_glitch_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
  UNION ALL
  SELECT id, image_url FROM ghibli_reaction_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
  UNION ALL
  SELECT id, image_url FROM presets_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
  UNION ALL
  SELECT id, image_url FROM emotion_mask_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
  UNION ALL
  SELECT id, image_url FROM custom_prompt_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
) broken_records;

-- OPTION 1: Mark broken records as failed (RECOMMENDED)
-- This prevents them from showing in the feed while preserving the data

UPDATE neo_glitch_media 
SET status = 'failed', 
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || '{"error": "Broken image URL detected during cleanup", "original_status": "completed"}'::jsonb
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%');

UPDATE ghibli_reaction_media 
SET status = 'failed', 
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || '{"error": "Broken image URL detected during cleanup", "original_status": "completed"}'::jsonb
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%');

UPDATE presets_media 
SET status = 'failed', 
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || '{"error": "Broken image URL detected during cleanup", "original_status": "completed"}'::jsonb
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%');

UPDATE emotion_mask_media 
SET status = 'failed', 
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || '{"error": "Broken image URL detected during cleanup", "original_status": "completed"}'::jsonb
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%');

UPDATE custom_prompt_media 
SET status = 'failed', 
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || '{"error": "Broken image URL detected during cleanup", "original_status": "completed"}'::jsonb
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%');

-- OPTION 2: Delete broken records entirely (UNCOMMENT IF YOU WANT TO REMOVE THEM)
-- WARNING: This will permanently delete the broken records
/*
DELETE FROM neo_glitch_media 
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%');

DELETE FROM ghibli_reaction_media 
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%');

DELETE FROM presets_media 
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%');

DELETE FROM emotion_mask_media 
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%');

DELETE FROM custom_prompt_media 
WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%');
*/

-- Verify the fix
SELECT 'AFTER FIX - Remaining broken records' as status,
       COUNT(*) as total_broken
FROM (
  SELECT id, image_url FROM neo_glitch_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
  UNION ALL
  SELECT id, image_url FROM ghibli_reaction_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
  UNION ALL
  SELECT id, image_url FROM presets_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
  UNION ALL
  SELECT id, image_url FROM emotion_mask_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
  UNION ALL
  SELECT id, image_url FROM custom_prompt_media WHERE status = 'completed' AND (image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%')
) broken_records;

-- Show summary of current status
SELECT 'neo_glitch_media' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
       COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing
FROM neo_glitch_media;

SELECT 'ghibli_reaction_media' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
       COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing
FROM ghibli_reaction_media;

SELECT 'presets_media' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
       COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing
FROM presets_media;

SELECT 'emotion_mask_media' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
       COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing
FROM emotion_mask_media;

SELECT 'custom_prompt_media' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
       COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing
FROM custom_prompt_media;
