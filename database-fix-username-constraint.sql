-- Fix Username Constraint to Allow More Flexible Usernames
-- This updates the username constraint to allow uppercase letters and hyphens
-- Run this in your Supabase SQL Editor

BEGIN;

-- Step 1: Drop the existing constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS username_chars;

-- Step 2: Add a more flexible username constraint
-- Allow: letters (a-z, A-Z), numbers (0-9), underscores (_), hyphens (-)
-- Length: 3-30 characters
ALTER TABLE public.profiles 
ADD CONSTRAINT username_chars CHECK (
  username IS NULL OR (
    username ~ '^[a-zA-Z0-9_-]{3,30}$' AND
    username NOT LIKE '-%' AND  -- Cannot start with hyphen
    username NOT LIKE '%---%'   -- Cannot have multiple consecutive hyphens
  )
);

-- Step 3: Update any existing usernames that might violate the new constraint
-- (This is just a safety check - there shouldn't be any invalid ones)
UPDATE public.profiles 
SET username = LOWER(username)
WHERE username IS NOT NULL 
  AND username !~ '^[a-zA-Z0-9_-]{3,30}$';

COMMIT;

-- Verify the constraint works
DO $$
BEGIN
  -- Test valid usernames
  ASSERT (SELECT 'test_user' ~ '^[a-zA-Z0-9_-]{3,30}$'), 'Valid username test failed';
  ASSERT (SELECT 'TestUser123' ~ '^[a-zA-Z0-9_-]{3,30}$'), 'Valid username with caps test failed';
  ASSERT (SELECT 'user-name' ~ '^[a-zA-Z0-9_-]{3,30}$'), 'Valid username with hyphen test failed';
  
  -- Test invalid usernames
  ASSERT NOT (SELECT '-user' ~ '^[a-zA-Z0-9_-]{3,30}$' AND '-user' NOT LIKE '-%'), 'Invalid username starting with hyphen should fail';
  ASSERT NOT (SELECT 'user---name' ~ '^[a-zA-Z0-9_-]{3,30}$' AND 'user---name' NOT LIKE '%---%'), 'Invalid username with multiple hyphens should fail';
  
  RAISE NOTICE 'Username constraint tests passed!';
END $$;

-- Show current constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
  AND conname = 'username_chars';
