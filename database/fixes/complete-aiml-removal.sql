-- COMPLETE AIML REMOVAL AND DATABASE FIX SCRIPT
-- This script removes all AIML job ID references and standardizes the database
-- Run this to fix everything at once and complete the simpler system migration
-- 
-- 🎯 PURPOSE: Remove all AIML job ID references and standardize job tracking
-- 📅 DATE: 2025-01-XX
-- ⚠️ WARNING: This will permanently remove aiml_job_id columns

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. DROP ALL AIML JOB ID COLUMNS
-- ========================================

-- Drop aiml_job_id from custom_prompt_media table
ALTER TABLE custom_prompt_media 
DROP COLUMN IF EXISTS aiml_job_id;

-- Drop aiml_job_id from emotion_mask_media table  
ALTER TABLE emotion_mask_media 
DROP COLUMN IF EXISTS aiml_job_id;

-- Drop aiml_job_id from presets_media table
ALTER TABLE presets_media 
DROP COLUMN IF EXISTS aiml_job_id;

-- Drop aiml_job_id from ghibli_reaction_media table
ALTER TABLE ghibli_reaction_media 
DROP COLUMN IF EXISTS aiml_job_id;

-- ========================================
-- 2. ADD FAL.JOB_ID TO ALL TABLES THAT NEED IT
-- ========================================

-- Add fal_job_id to custom_prompt_media table
ALTER TABLE custom_prompt_media 
ADD COLUMN IF NOT EXISTS fal_job_id TEXT;

-- Add fal_job_id to emotion_mask_media table
ALTER TABLE emotion_mask_media 
ADD COLUMN IF NOT EXISTS fal_job_id TEXT;

-- Add fal_job_id to presets_media table
ALTER TABLE presets_media 
ADD COLUMN IF NOT EXISTS fal_job_id TEXT;

-- Add fal_job_id to ghibli_reaction_media table (if not already exists)
ALTER TABLE ghibli_reaction_media 
ADD COLUMN IF NOT EXISTS fal_job_id TEXT;

-- Add fal_job_id to Story Time tables for video generation tracking
ALTER TABLE story 
ADD COLUMN IF NOT EXISTS fal_job_id TEXT;

ALTER TABLE story_photo 
ADD COLUMN IF NOT EXISTS fal_job_id TEXT;

-- ========================================
-- 3. ADD COMMENTS FOR CLARITY
-- ========================================

-- Add comments to clarify the purpose of each job ID field
COMMENT ON COLUMN custom_prompt_media.fal_job_id IS 'Fal.ai generation job ID for tracking and debugging';
COMMENT ON COLUMN emotion_mask_media.fal_job_id IS 'Fal.ai generation job ID for tracking and debugging';
COMMENT ON COLUMN presets_media.fal_job_id IS 'Fal.ai generation job ID for tracking and debugging';
COMMENT ON COLUMN ghibli_reaction_media.fal_job_id IS 'Fal.ai generation job ID for tracking and debugging';
COMMENT ON COLUMN neo_glitch_media.stability_job_id IS 'Stability.ai generation job ID for tracking and debugging';
COMMENT ON COLUMN story.fal_job_id IS 'Fal.ai video generation job ID for Story Time';
COMMENT ON COLUMN story_photo.fal_job_id IS 'Fal.ai video generation job ID for individual story photos';

-- ========================================
-- 4. UPDATE EXISTING RECORDS
-- ========================================

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

UPDATE ghibli_reaction_media 
SET fal_job_id = NULL
WHERE fal_job_id IS NULL;

-- ========================================
-- 5. CREATE INDEXES FOR NEW FAL.JOB_ID COLUMNS
-- ========================================

-- Create indexes for the new fal_job_id columns
CREATE INDEX IF NOT EXISTS idx_custom_prompt_media_fal_job_id ON custom_prompt_media(fal_job_id);
CREATE INDEX IF NOT EXISTS idx_emotion_mask_media_fal_job_id ON emotion_mask_media(fal_job_id);
CREATE INDEX IF NOT EXISTS idx_presets_media_fal_job_id ON presets_media(fal_job_id);
CREATE INDEX IF NOT EXISTS idx_ghibli_reaction_media_fal_job_id ON ghibli_reaction_media(fal_job_id);
CREATE INDEX IF NOT EXISTS idx_story_fal_job_id ON story(fal_job_id);
CREATE INDEX IF NOT EXISTS idx_story_photo_fal_job_id ON story_photo(fal_job_id);

-- ========================================
-- 6. DROP OLD INDEXES THAT ARE NO LONGER NEEDED
-- ========================================

-- Drop old indexes that are no longer needed
DROP INDEX IF EXISTS idx_custom_prompt_media_aiml_job_id;
DROP INDEX IF EXISTS idx_emotion_mask_media_aiml_job_id;
DROP INDEX IF EXISTS idx_ghibli_reaction_media_aiml_job_id;
DROP INDEX IF EXISTS idx_presets_media_aiml_job_id;

-- ========================================
-- 7. FIX UUID GENERATION ISSUES
-- ========================================

-- Fix ghibli_reaction_media to use uuid_generate_v4() instead of gen_random_uuid()
ALTER TABLE ghibli_reaction_media 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- ========================================
-- 8. VERIFICATION QUERIES
-- ========================================

-- Verify the changes by checking all job ID columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('custom_prompt_media', 'emotion_mask_media', 'presets_media', 'ghibli_reaction_media', 'neo_glitch_media', 'story', 'story_photo')
AND column_name LIKE '%job_id%'
ORDER BY table_name, column_name;

-- Verify indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('custom_prompt_media', 'emotion_mask_media', 'presets_media', 'ghibli_reaction_media', 'neo_glitch_media', 'story', 'story_photo')
AND indexname LIKE '%job_id%'
ORDER BY tablename, indexname;

-- ========================================
-- 9. SUMMARY OF CHANGES
-- ========================================
-- 
-- ✅ REMOVED:
-- - aiml_job_id from custom_prompt_media
-- - aiml_job_id from emotion_mask_media  
-- - aiml_job_id from presets_media
-- - aiml_job_id from ghibli_reaction_media
-- - All old aiml_job_id indexes
--
-- ✅ ADDED:
-- - fal_job_id to custom_prompt_media
-- - fal_job_id to emotion_mask_media
-- - fal_job_id to presets_media
-- - fal_job_id to ghibli_reaction_media
-- - fal_job_id to story
-- - fal_job_id to story_photo
-- - All new fal_job_id indexes
--
-- ✅ FIXED:
-- - ghibli_reaction_media UUID generation
-- - Added proper comments for all job ID fields
--
-- ✅ STANDARDIZED:
-- - All generation functions now use consistent job ID fields
-- - neo_glitch_media uses stability_job_id (Stability.ai)
-- - All other tables use fal_job_id (Fal.ai)
-- ========================================
