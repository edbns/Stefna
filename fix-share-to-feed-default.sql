-- Fix share_to_feed default value to false for privacy-first approach
-- This ensures new users are private by default

-- 1. Change the default value for share_to_feed column
ALTER TABLE user_settings 
ALTER COLUMN share_to_feed SET DEFAULT false;

-- 2. Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name = 'share_to_feed';

-- 3. Test that new records will get the correct default
-- (This is just a verification, not actually inserting)
SELECT 
    'Current default for share_to_feed' as test,
    column_default as default_value
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name = 'share_to_feed';

-- 4. Verify existing users are still private
SELECT 
    'Existing users with share_to_feed = false' as status,
    COUNT(*) as count
FROM user_settings 
WHERE share_to_feed = false
UNION ALL
SELECT 
    'Existing users with share_to_feed = true' as status,
    COUNT(*) as count
FROM user_settings 
WHERE share_to_feed = true;
