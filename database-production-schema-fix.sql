-- Production Database Schema Fix - Backward Compatible
-- Run this on your production database to resolve the 500 errors
-- This script maintains the legacy 'url' column while adding new functionality

-- 1. Ensure the legacy 'url' column exists and is NOT NULL (for backward compatibility)
ALTER TABLE public.media 
  ADD COLUMN IF NOT EXISTS url text;

-- Make url NOT NULL if it isn't already
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'media' 
    AND column_name = 'url' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.media ALTER COLUMN url SET NOT NULL;
  END IF;
END $$;

-- 2. Add all new columns that our functions expect
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image','video')) DEFAULT 'image' NOT NULL,
  ADD COLUMN IF NOT EXISTS source_public_id text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS variation_urls jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS preset_id text,
  ADD COLUMN IF NOT EXISTS request_id uuid,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now() NOT NULL;

-- Add missing columns that our functions expect
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS prompt text,
  ADD COLUMN IF NOT EXISTS cloudinary_public_id text,
  ADD COLUMN IF NOT EXISTS final_url text,
  ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS run_id text,
  ADD COLUMN IF NOT EXISTS batch_id text;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS media_user_created_idx ON public.media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS media_user_run_idx ON public.media(user_id, run_id);
CREATE INDEX IF NOT EXISTS media_idempotency_idx ON public.media(idempotency_key);
CREATE INDEX IF NOT EXISTS media_url_idx ON public.media(url);

-- 4. Create unique index for idempotency (user_id + idempotency_key)
CREATE UNIQUE INDEX IF NOT EXISTS media_user_idem_idx 
  ON public.media(user_id, idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- 5. Create media_batches table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.media_batches (
  batch_id text PRIMARY KEY,
  user_id text NOT NULL,
  run_id text,
  idempotency_key text UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Ensure profiles table has expected columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';

-- 7. Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'media'
ORDER BY ordinal_position;

-- 8. Check if url column is properly set
SELECT 
  column_name, 
  is_nullable, 
  column_default,
  CASE WHEN column_name = 'url' THEN 'LEGACY COLUMN - MUST BE NOT NULL' ELSE 'NEW COLUMN' END as status
FROM information_schema.columns
WHERE table_name = 'media' 
  AND column_name IN ('url', 'media_type', 'final_url', 'idempotency_key')
ORDER BY column_name;
