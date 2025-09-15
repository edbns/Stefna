-- ============================================================================
-- CLEANUP MIGRATION: Remove old columns from likes table
-- ============================================================================
-- This migration cleans up the temporary columns left from the edit_media
-- schema standardization migration that are causing NOT NULL constraint errors.
-- ============================================================================

-- Step 1: Check if old columns exist and remove them
DO $$
BEGIN
    -- Drop old_media_id column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'likes' AND column_name = 'old_media_id'
    ) THEN
        ALTER TABLE likes DROP COLUMN old_media_id;
        RAISE NOTICE 'Dropped old_media_id column from likes table';
    END IF;
    
    -- Drop old_id column from edit_media if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'edit_media' AND column_name = 'old_id'
    ) THEN
        ALTER TABLE edit_media DROP COLUMN old_id;
        RAISE NOTICE 'Dropped old_id column from edit_media table';
    END IF;
END $$;

-- Step 2: Verify the cleanup worked
SELECT 
    'likes' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'likes' 
ORDER BY column_name;

SELECT 
    'edit_media' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'edit_media' 
ORDER BY column_name;

-- Step 3: Test that edit media likes work
-- This should not cause any constraint errors
SELECT COUNT(*) as total_likes FROM likes WHERE media_type = 'edit';
