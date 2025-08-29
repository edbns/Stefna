-- Fix user_settings table structure
-- This adds the missing columns and removes unnecessary ones

-- 1. Add missing columns
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS media_upload_agreed BOOLEAN DEFAULT FALSE;

-- 2. Remove the unnecessary 'id' column (user_id should be the primary key)
-- First drop any foreign key constraints that might reference the id column
-- Then drop the id column itself
ALTER TABLE user_settings DROP COLUMN IF EXISTS id;

-- 3. Make sure user_id is the primary key
-- (This should already be the case, but let's verify)
DO $$
BEGIN
    -- Check if user_id is already the primary key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_settings' 
        AND constraint_type = 'PRIMARY KEY'
        AND constraint_name LIKE '%user_id%'
    ) THEN
        -- Add primary key constraint if it doesn't exist
        ALTER TABLE user_settings ADD PRIMARY KEY (user_id);
    END IF;
END $$;

-- 4. Verify the final structure
SELECT '=== FINAL USER_SETTINGS STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;

-- 5. Check if we need to migrate existing data
SELECT '=== EXISTING DATA CHECK ===' as info;
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN media_upload_agreed IS NOT NULL THEN 1 END) as has_media_upload_agreed,
    COUNT(CASE WHEN share_to_feed IS NOT NULL THEN 1 END) as has_share_to_feed,
    COUNT(CASE WHEN allow_remix IS NOT NULL THEN 1 END) as has_allow_remix
FROM user_settings;
