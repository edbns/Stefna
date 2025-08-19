-- Remove Tier System Migration
-- This migration removes all tier-related complexity from the database
-- Date: 2025-08-19

-- Remove tier column from users table
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "tier";

-- Remove any tier-related indexes (if they exist)
DROP INDEX IF EXISTS "users_tier_idx";
DROP INDEX IF EXISTS "users_tier_created_at_idx";

-- Update notification types to remove tier references
UPDATE "public"."notifications" 
SET "type" = 'generation_complete' 
WHERE "type" = 'tier_upgrade';

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
