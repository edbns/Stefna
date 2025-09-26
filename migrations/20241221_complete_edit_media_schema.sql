-- ============================================================================
-- MIGRATION: Complete edit_media schema to match other media tables
-- ============================================================================
-- This migration adds all missing columns to edit_media table to ensure
-- complete schema consistency with other media tables and prevent future errors.
-- ============================================================================

-- Step 1: Add missing columns to edit_media table
ALTER TABLE edit_media ADD COLUMN IF NOT EXISTS preset TEXT DEFAULT 'edit';

-- Step 2: Add stability_job_id column (for cyber_siren compatibility)
ALTER TABLE edit_media ADD COLUMN IF NOT EXISTS stability_job_id TEXT;

-- Step 3: Add preset_week column (for presets compatibility)
ALTER TABLE edit_media ADD COLUMN IF NOT EXISTS preset_week INTEGER;

-- Step 4: Add preset_rotation_index column (for presets compatibility)
ALTER TABLE edit_media ADD COLUMN IF NOT EXISTS preset_rotation_index INTEGER;

-- Step 5: Add is_currently_available column (for presets compatibility)
ALTER TABLE edit_media ADD COLUMN IF NOT EXISTS is_currently_available BOOLEAN DEFAULT TRUE;

-- Step 6: Update existing records with default preset value
UPDATE edit_media SET preset = 'edit' WHERE preset IS NULL;

-- Step 7: Make preset column NOT NULL after setting defaults
ALTER TABLE edit_media ALTER COLUMN preset SET NOT NULL;

-- Step 8: Verify the schema is now complete
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'edit_media' 
ORDER BY column_name;

-- Step 9: Test that all columns exist
SELECT 
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name = 'preset' THEN 1 END) as has_preset,
    COUNT(CASE WHEN column_name = 'likes_count' THEN 1 END) as has_likes_count,
    COUNT(CASE WHEN column_name = 'stability_job_id' THEN 1 END) as has_stability_job_id,
    COUNT(CASE WHEN column_name = 'preset_week' THEN 1 END) as has_preset_week,
    COUNT(CASE WHEN column_name = 'preset_rotation_index' THEN 1 END) as has_preset_rotation_index,
    COUNT(CASE WHEN column_name = 'is_currently_available' THEN 1 END) as has_is_currently_available
FROM information_schema.columns 
WHERE table_name = 'edit_media';
