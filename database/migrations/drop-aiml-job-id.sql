-- Drop aiml_job_id columns from all media tables
-- This prevents future confusion and ensures we use the correct job ID fields
-- 
-- 🎯 PURPOSE: Clean up old AIML job ID fields that are no longer used
-- 📅 DATE: 2025-01-XX
-- ⚠️ WARNING: This will permanently remove aiml_job_id columns

-- Drop aiml_job_id from custom_prompt_media table
ALTER TABLE custom_prompt_media 
DROP COLUMN IF EXISTS aiml_job_id;

-- Drop aiml_job_id from emotion_mask_media table  
ALTER TABLE emotion_mask_media 
DROP COLUMN IF EXISTS aiml_job_id;

-- Drop aiml_job_id from presets_media table
ALTER TABLE presets_media 
DROP COLUMN IF EXISTS aiml_job_id;

-- Drop aiml_job_id from ghibli_reaction_media table (already has fal_job_id)
ALTER TABLE ghibli_reaction_media 
DROP COLUMN IF EXISTS aiml_job_id;

-- Add fal_job_id to tables that don't have it yet
ALTER TABLE custom_prompt_media 
ADD COLUMN IF NOT EXISTS fal_job_id TEXT;

ALTER TABLE emotion_mask_media 
ADD COLUMN IF NOT EXISTS fal_job_id TEXT;

ALTER TABLE presets_media 
ADD COLUMN IF NOT EXISTS fal_job_id TEXT;

-- Add fal_job_id to Story Time tables for video generation tracking
ALTER TABLE story 
ADD COLUMN IF NOT EXISTS fal_job_id TEXT;

ALTER TABLE story_photo 
ADD COLUMN IF NOT EXISTS fal_job_id TEXT;

-- Add comments to clarify the purpose of each job ID field
COMMENT ON COLUMN custom_prompt_media.fal_job_id IS 'Fal.ai generation job ID for tracking and debugging';
COMMENT ON COLUMN emotion_mask_media.fal_job_id IS 'Fal.ai generation job ID for tracking and debugging';
COMMENT ON COLUMN presets_media.fal_job_id IS 'Fal.ai generation job ID for tracking and debugging';
COMMENT ON COLUMN ghibli_reaction_media.fal_job_id IS 'Fal.ai generation job ID for tracking and debugging';
COMMENT ON COLUMN neo_glitch_media.stability_job_id IS 'Stability.ai generation job ID for tracking and debugging';
COMMENT ON COLUMN story.fal_job_id IS 'Fal.ai video generation job ID for Story Time';
COMMENT ON COLUMN story_photo.fal_job_id IS 'Fal.ai video generation job ID for individual story photos';

-- Update existing records to have NULL fal_job_id (they were using aiml_job_id)
UPDATE custom_prompt_media 
SET fal_job_id = NULL
WHERE fal_job_id IS NULL;

UPDATE emotion_mask_media 
SET fal_job_id = NULL
WHERE fal_job_id IS NULL;

UPDATE presets_media 
SET fal_job_id = NULL
WHERE fal_job_id IS NULL;

-- Create indexes for the new fal_job_id columns
CREATE INDEX IF NOT EXISTS idx_custom_prompt_media_fal_job_id ON custom_prompt_media(fal_job_id);
CREATE INDEX IF NOT EXISTS idx_emotion_mask_media_fal_job_id ON emotion_mask_media(fal_job_id);
CREATE INDEX IF NOT EXISTS idx_presets_media_fal_job_id ON presets_media(fal_job_id);
CREATE INDEX IF NOT EXISTS idx_story_fal_job_id ON story(fal_job_id);
CREATE INDEX IF NOT EXISTS idx_story_photo_fal_job_id ON story_photo(fal_job_id);

-- Drop old indexes that are no longer needed
DROP INDEX IF EXISTS idx_custom_prompt_media_aiml_job_id;
DROP INDEX IF EXISTS idx_emotion_mask_media_aiml_job_id;
DROP INDEX IF EXISTS idx_ghibli_reaction_media_aiml_job_id;
DROP INDEX IF EXISTS idx_presets_media_aiml_job_id;

-- Verify the changes
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('custom_prompt_media', 'emotion_mask_media', 'presets_media', 'ghibli_reaction_media', 'neo_glitch_media', 'story', 'story_photo')
AND column_name LIKE '%job_id%'
ORDER BY table_name, column_name;
