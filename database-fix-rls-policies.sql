-- Fix database constraints and policies
-- Run this once in your Supabase SQL editor

-- Add unique constraint for likes to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.likes'::regclass
      AND conname = 'likes_unique'
  ) THEN
    ALTER TABLE public.likes
      ADD CONSTRAINT likes_unique UNIQUE (asset_id, user_id);
  END IF;
END $$;

-- Note: The Netlify functions now use SERVICE_ROLE_KEY to bypass RLS issues
-- This is more reliable than complex RLS policies that can cause 502 errors

