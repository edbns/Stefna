-- Remove Tier System Migration
-- This migration removes all tier-related complexity from the database
-- Date: 2025-08-19

-- Step 1: Remove tier column from users table
ALTER TABLE users DROP COLUMN IF EXISTS tier;

-- Step 2: Remove tier-related indexes (if they exist)
DROP INDEX IF EXISTS users_tier_idx;

-- Step 3: Update any existing users to remove tier references
-- (No data migration needed since we're removing the field entirely)

-- Step 4: Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Step 5: Test that users table still works without tier
SELECT id, email, external_id, created_at, updated_at 
FROM users 
LIMIT 5;
