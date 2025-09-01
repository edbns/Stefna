-- 🔧 FIX SCHEMA ISSUES IN USER_SETTINGS TABLE
-- This script fixes the schema mismatches between code and database

-- Step 1: Check current structure of user_settings
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;

-- Step 2: Remove any mentions of 'allow_remix' column if it exists (it shouldn't be there)
-- First check if the column exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_settings' 
    AND column_name = 'allow_remix'
) as allow_remix_exists;

-- If it exists, drop it (UNCOMMENT TO EXECUTE)
-- ALTER TABLE user_settings DROP COLUMN IF EXISTS allow_remix;

-- Step 3: Ensure all required columns exist with correct defaults
-- Add missing columns if they don't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS media_upload_agreed BOOLEAN DEFAULT FALSE;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS share_to_feed BOOLEAN DEFAULT FALSE;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ(6) DEFAULT NOW();

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW();

-- Step 4: Fix any NULL values to respect privacy-first design
UPDATE user_settings 
SET media_upload_agreed = FALSE 
WHERE media_upload_agreed IS NULL;

UPDATE user_settings 
SET share_to_feed = FALSE 
WHERE share_to_feed IS NULL;

-- Step 5: Ensure all users have settings records (with privacy-first defaults)
INSERT INTO user_settings (user_id, media_upload_agreed, share_to_feed, created_at, updated_at)
SELECT 
    u.id,
    FALSE,  -- media_upload_agreed = false by default
    FALSE,  -- share_to_feed = false by default (privacy first!)
    NOW(),
    NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_settings us WHERE us.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 6: Verify the fixes
SELECT 
    'Users without settings' as check_type,
    COUNT(*) as count
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_settings us WHERE us.user_id = u.id
)
UNION ALL
SELECT 
    'Settings with share_to_feed = true' as check_type,
    COUNT(*) as count
FROM user_settings
WHERE share_to_feed = TRUE
UNION ALL
SELECT 
    'Settings with media_upload_agreed = true' as check_type,
    COUNT(*) as count
FROM user_settings
WHERE media_upload_agreed = TRUE;
