-- Production Database Schema Fix
-- Run this on your production database to resolve the 500 errors

-- Fix media table schema for save-media and save-media-batch functions
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image','video')) DEFAULT 'image' NOT NULL,
  ADD COLUMN IF NOT EXISTS source_public_id text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS variation_urls jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS preset_id text,
  ADD COLUMN IF NOT EXISTS request_id uuid,
  ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE,
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS media_user_created_idx ON public.media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS media_user_run_idx ON public.media(user_id, run_id);
CREATE INDEX IF NOT EXISTS media_idempotency_idx ON public.media(idempotency_key);

-- Create media_batches table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.media_batches (
  batch_id text PRIMARY KEY,
  user_id text NOT NULL,
  run_id text,
  idempotency_key text UNIQUE,
  created_at timESTAMPTZ DEFAULT NOW()
);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'media'
ORDER BY ordinal_position;
