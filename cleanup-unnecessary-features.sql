-- Cleanup Unnecessary Social Media Features
-- This script removes all the complexity you don't need for your simplified editing platform
-- Removes: tier, avatar_url, allow_remix, and other social media features
-- KEEPS: share_to_feed (important for user privacy control)

-- 1. Remove tier column from users table
ALTER TABLE users DROP COLUMN IF EXISTS tier;

-- 2. Remove tier index (no longer needed)
DROP INDEX IF EXISTS idx_users_tier;

-- 3. Remove avatar_url from users table (not needed for editing platform)
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;

-- 4. Remove allow_remix from user_settings (not needed for editing platform)
ALTER TABLE user_settings DROP COLUMN IF EXISTS allow_remix;

-- 5. Remove any other social media related columns that might exist
-- (These are commented out in case they don't exist, but will remove them if they do)

-- NOTE: share_to_feed is KEPT - it's important for user privacy control
-- Users need to control whether their generated content appears in public feed or stays private
-- This is NOT a social media feature, it's a privacy control feature

-- Remove any social media related indexes
DROP INDEX IF EXISTS idx_users_avatar_url;
DROP INDEX IF EXISTS idx_user_settings_allow_remix;
DROP INDEX IF EXISTS idx_user_settings_social;

-- 6. Fix user_credits table duplicate columns (if still exists)
-- First, backup the table
CREATE TABLE IF NOT EXISTS user_credits_backup AS SELECT * FROM user_credits;

-- Drop the problematic table
DROP TABLE IF EXISTS user_credits CASCADE;

-- Recreate with correct structure (no duplicate columns)
CREATE TABLE IF NOT EXISTS user_credits (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Add unique constraint on user_id
ALTER TABLE user_credits ADD CONSTRAINT user_credits_user_id_unique UNIQUE (user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Restore data if it exists (fixed to handle missing credits column)
INSERT INTO user_credits (id, user_id, balance, created_at, updated_at)
SELECT id, user_id, COALESCE(balance, 30), created_at, updated_at
FROM user_credits_backup
ON CONFLICT (user_id) DO NOTHING;

-- Drop backup table
DROP TABLE IF EXISTS user_credits_backup;

-- 7. Verify the cleaned up structure
SELECT '=== CLEANED UP USERS TABLE ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT '=== CLEANED UP USER_SETTINGS TABLE ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;

SELECT '=== CLEANED UP USER_CREDITS TABLE ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
ORDER BY ordinal_position;

-- 8. Test the cleaned up structure
SELECT '=== TESTING CLEANED UP STRUCTURE ===' as status;

-- Test user insertion (minimal fields only)
INSERT INTO users (id, email, name) 
VALUES ('test-cleanup-' || gen_random_uuid()::text, 'test-cleanup@example.com', 'Test Cleanup')
ON CONFLICT (email) DO NOTHING;

-- Test user settings insertion (minimal fields only)
INSERT INTO user_settings (user_id, media_upload_agreed, share_to_feed)
SELECT id, true, false FROM users WHERE email = 'test-cleanup@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- Test user credits insertion
INSERT INTO user_credits (user_id, balance)
SELECT id, 30 FROM users WHERE email = 'test-cleanup@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify the test data
SELECT '=== TEST DATA VERIFICATION ===' as info;
SELECT 
    u.id, 
    u.email, 
    u.name, 
    u.created_at,
    us.media_upload_agreed,
    us.share_to_feed,
    uc.balance
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
LEFT JOIN user_credits uc ON u.id = uc.user_id
WHERE u.email = 'test-cleanup@example.com';

-- Cleanup test data
DELETE FROM user_credits WHERE user_id IN (SELECT id FROM users WHERE email = 'test-cleanup@example.com');
DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE email = 'test-cleanup@example.com');
DELETE FROM users WHERE email = 'test-cleanup@example.com';

-- 9. Show final table counts
SELECT '=== FINAL TABLE COUNTS ===' as info;
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'user_settings', COUNT(*) FROM user_settings
UNION ALL
SELECT 'user_credits', COUNT(*) FROM user_credits;

-- 10. Final status
SELECT '=== CLEANUP COMPLETED SUCCESSFULLY! ===' as final_status;
SELECT '✅ Removed: tier, avatar_url, allow_remix' as removed_features;
SELECT '✅ Kept: share_to_feed (user privacy control)' as kept_features;
SELECT '✅ Simplified: users, user_settings, user_credits' as simplified_tables;
SELECT '✅ Focus: Pure editing platform with user privacy control' as platform_focus;
