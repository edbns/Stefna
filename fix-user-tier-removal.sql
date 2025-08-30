-- Fix User Tier Removal and Duplicate Columns
-- This script removes the unnecessary user tier system and fixes database issues

-- 1. Remove tier column from users table (not needed for simplified platform)
ALTER TABLE users DROP COLUMN IF EXISTS tier;

-- 2. Remove tier index (no longer needed)
DROP INDEX IF EXISTS idx_users_tier;

-- 3. Fix user_credits table duplicate columns
-- First, backup the table
CREATE TABLE IF NOT EXISTS user_credits_backup AS SELECT * FROM user_credits;

-- Drop the problematic table
DROP TABLE IF EXISTS user_credits CASCADE;

-- Recreate with correct structure
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

-- Restore data if it exists
INSERT INTO user_credits (id, user_id, balance, created_at, updated_at)
SELECT id, user_id, COALESCE(credits, balance, 30), created_at, updated_at
FROM user_credits_backup
ON CONFLICT (user_id) DO NOTHING;

-- Drop backup table
DROP TABLE IF EXISTS user_credits_backup;

-- 4. Verify the changes
SELECT 'Users table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT 'User credits table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
ORDER BY ordinal_position;

-- 5. Test basic operations
SELECT 'Testing basic operations...' as status;

-- Test user insertion without tier
INSERT INTO users (id, email, name) 
VALUES ('test-tier-removal-' || gen_random_uuid()::text, 'test-tier@example.com', 'Test Tier Removal')
ON CONFLICT (email) DO NOTHING;

-- Test user credits insertion
INSERT INTO user_credits (user_id, balance)
SELECT id, 30 FROM users WHERE email = 'test-tier@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify the test data
SELECT u.id, u.email, u.name, uc.balance
FROM users u
LEFT JOIN user_credits uc ON u.id = uc.user_id
WHERE u.email = 'test-tier@example.com';

-- Cleanup test data
DELETE FROM user_credits WHERE user_id IN (SELECT id FROM users WHERE email = 'test-tier@example.com');
DELETE FROM users WHERE email = 'test-tier@example.com';

SELECT 'User tier removal completed successfully!' as final_status;
