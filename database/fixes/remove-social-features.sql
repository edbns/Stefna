-- 🧹 REMOVE SOCIAL MEDIA FEATURES FROM DATABASE
-- This script removes all social media related columns and tables
-- Focus: Pure AI photo editing platform

-- Step 1: Show what we're about to remove
SELECT 
    'Columns to be removed:' as action,
    'users.avatar_url' as column_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') as exists
UNION ALL
SELECT 
    'Columns to be removed:',
    'user_settings.allow_remix',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='allow_remix');

-- Step 2: Remove avatar_url from users table (if it exists)
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;

-- Step 3: Remove allow_remix from user_settings table (if it exists)
ALTER TABLE user_settings DROP COLUMN IF EXISTS allow_remix;

-- Step 4: Remove any other social media related columns
-- Note: username/name might be needed for basic identification, keeping for now

-- Step 5: Verify the cleanup
SELECT 
    'USERS TABLE STRUCTURE AFTER CLEANUP:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

SELECT 
    'USER_SETTINGS TABLE STRUCTURE AFTER CLEANUP:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;

-- Step 6: Show final state
SELECT 
    '✅ Social media features removed' as status,
    'Database is now focused on AI photo editing only' as message;
