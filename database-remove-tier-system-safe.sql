-- Safe Tier System Removal Migration
-- This migration safely removes the tier system by handling dependencies first
-- Date: 2025-08-19

-- Step 1: Check current dependencies (run this first to see what needs updating)
-- Run the database-check-tier-dependencies.sql script first to see what's using tier

-- Step 2: Drop any views that reference the tier column
-- (You'll need to recreate these views without tier references)
DROP VIEW IF EXISTS public_feed CASCADE;
DROP VIEW IF EXISTS public_feed_v2 CASCADE;
DROP VIEW IF EXISTS public_feed_working CASCADE;
DROP VIEW IF EXISTS app_media CASCADE;
DROP VIEW IF EXISTS app_users CASCADE;

-- Step 3: Drop any functions that reference the tier column
-- (These will be recreated by your updated Netlify functions)

-- Step 4: Drop any indexes on the tier column
DROP INDEX IF EXISTS users_tier_idx;
DROP INDEX IF EXISTS users_tier_created_at_idx;

-- Step 5: Now safely remove the tier column
ALTER TABLE users DROP COLUMN IF EXISTS tier;

-- Step 6: Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Step 7: Test that users table still works
SELECT id, email, external_id, created_at, updated_at 
FROM users 
LIMIT 5;

-- Step 8: Use the comprehensive view fix script
-- Run database-fix-all-views.sql after this migration to recreate all views properly
-- This ensures all views work without tier, name, or avatar_url references

-- Step 9: Verify the tier column is gone
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
