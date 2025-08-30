-- Fix image_url constraints to allow null values when starting jobs
-- The image_url is only populated when the job completes

-- Neo glitch media table
ALTER TABLE neo_glitch_media ALTER COLUMN image_url DROP NOT NULL;

-- Presets media table  
ALTER TABLE presets_media ALTER COLUMN image_url DROP NOT NULL;

-- Emotion mask media table
ALTER TABLE emotion_mask_media ALTER COLUMN image_url DROP NOT NULL;

-- Ghibli reaction media table
ALTER TABLE ghibli_reaction_media ALTER COLUMN image_url DROP NOT NULL;

-- Custom prompt media table
ALTER TABLE custom_prompt_media ALTER COLUMN image_url DROP NOT NULL;

-- Add comments to explain the constraint change
COMMENT ON COLUMN neo_glitch_media.image_url IS 'Final generated image URL. Null when job is processing, populated when completed.';
COMMENT ON COLUMN presets_media.image_url IS 'Final generated image URL. Null when job is processing, populated when completed.';
COMMENT ON COLUMN emotion_mask_media.image_url IS 'Final generated image URL. Null when job is processing, populated when completed.';
COMMENT ON COLUMN ghibli_reaction_media.image_url IS 'Final generated image URL. Null when job is processing, populated when completed.';
COMMENT ON COLUMN custom_prompt_media.image_url IS 'Final generated image URL. Null when job is processing, populated when completed.';

-- Check Story Time tables for any constraint issues
-- Story Time tables should be fine since they create records with immediate data
-- but let's verify their structure

-- Verify Story Time table structure
SELECT 
  'story' as table_name,
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'story' 
ORDER BY ordinal_position;

SELECT 
  'story_photo' as table_name,
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'story_photo' 
ORDER BY ordinal_position;

SELECT 
  'video_jobs' as table_name,
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'video_jobs' 
ORDER BY ordinal_position;

-- Verify the changes
SELECT 
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name IN (
  'neo_glitch_media',
  'presets_media', 
  'emotion_mask_media',
  'ghibli_reaction_media',
  'custom_prompt_media'
) 
AND column_name = 'image_url'
ORDER BY table_name;
