-- Neon Database Schema Migration
-- Run this on your Neon database to ensure proper schema

-- 1. Create required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id text PRIMARY KEY,
  display_name text,
  avatar_url text,
  plan text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create media table with proper schema
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  url text NOT NULL,                                    -- REQUIRED: AIML generated image URL
  media_type text NOT NULL DEFAULT 'image',             -- 'image' | 'video'
  cloudinary_public_id text,                            -- Cloudinary upload ID
  source_public_id text,                                -- Source image ID
  source_url text,                                      -- Original source URL
  variation_urls jsonb DEFAULT '[]'::jsonb NOT NULL,   -- All variations
  preset_id text,                                       -- Preset used for generation
  request_id uuid,                                      -- Generation request ID
  idempotency_key text UNIQUE,                          -- Prevent duplicate saves
  prompt text,                                          -- User prompt
  final_url text,                                       -- Final processed URL
  meta jsonb DEFAULT '{}'::jsonb,                      -- Additional metadata
  run_id text,                                          -- Generation run ID
  batch_id text,                                        -- Batch processing ID
  width int,                                            -- Image dimensions
  height int,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create media_batches table for batch processing
CREATE TABLE IF NOT EXISTS media_batches (
  batch_id text PRIMARY KEY,
  user_id text NOT NULL,
  run_id text,
  idempotency_key text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 5. Create credits_ledger table for user credits
CREATE TABLE IF NOT EXISTS credits_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  amount integer NOT NULL,                              -- Positive for credits added, negative for usage
  description text NOT NULL,                            -- Reason for credit change
  reference_id text,                                    -- Related media ID or transaction
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_media_user_created ON media (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_user_run ON media (user_id, run_id);
CREATE INDEX IF NOT EXISTS idx_media_idempotency ON media (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_media_url ON media (url);
CREATE INDEX IF NOT EXISTS idx_media_user_idem ON media (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 7. Create unique constraint for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS media_user_idem_unique ON media (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 8. Verify the schema
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name IN ('profiles', 'media', 'media_batches', 'credits_ledger')
ORDER BY table_name, ordinal_position;

-- 9. Check if url column is properly set as NOT NULL
SELECT 
  column_name, 
  is_nullable, 
  column_default,
  CASE 
    WHEN column_name = 'url' AND is_nullable = 'NO' THEN '✅ REQUIRED COLUMN - MUST BE NOT NULL'
    WHEN column_name = 'url' AND is_nullable = 'YES' THEN '❌ WARNING: url should be NOT NULL'
    ELSE 'NEW COLUMN'
  END as status
FROM information_schema.columns
WHERE table_name = 'media' 
  AND column_name IN ('url', 'media_type', 'idempotency_key', 'user_id')
ORDER BY column_name;
