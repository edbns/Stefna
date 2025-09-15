-- ============================================================================
-- MIGRATION: Make edit_media exactly like custom_prompt_media
-- ============================================================================
-- This migration removes unnecessary columns and makes edit_media schema
-- exactly match custom_prompt_media - no more, no less.
-- ============================================================================

-- Step 1: Remove unnecessary columns that don't belong in edit_media
ALTER TABLE edit_media DROP COLUMN IF EXISTS stability_job_id;
ALTER TABLE edit_media DROP COLUMN IF EXISTS preset_week;
ALTER TABLE edit_media DROP COLUMN IF EXISTS preset_rotation_index;
ALTER TABLE edit_media DROP COLUMN IF EXISTS is_currently_available;

-- Step 2: Keep only the columns that custom_prompt_media has
-- (The remaining columns should match custom_prompt_media exactly)

-- Step 3: Verify the schema matches custom_prompt_media exactly
SELECT 
    'edit_media' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'edit_media' 
ORDER BY column_name;

-- Step 4: Compare with custom_prompt_media
SELECT 
    'custom_prompt_media' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'custom_prompt_media' 
ORDER BY column_name;

-- Step 5: Test that edit_media still works
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN preset = 'edit' THEN 1 END) as has_preset,
    COUNT(CASE WHEN likes_count IS NOT NULL THEN 1 END) as has_likes_count
FROM edit_media;
