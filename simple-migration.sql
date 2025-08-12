-- Simple Database Migration for Stefna
-- Copy and paste this entire script into Supabase SQL Editor

-- Step 1: Fix media_assets user_id column type
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_assets') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'media_assets' 
      AND column_name = 'user_id' 
      AND data_type = 'uuid'
    ) THEN
      ALTER TABLE media_assets ALTER COLUMN user_id TYPE TEXT USING user_id::text;
      RAISE NOTICE 'Fixed user_id column type';
    END IF;
  END IF;
END $$;

-- Step 2: Add new columns to media_assets
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS result_url TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS job_id TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS mode TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS negative_prompt TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS strength NUMERIC(3,2);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS env TEXT DEFAULT 'prod';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS allow_remix BOOLEAN DEFAULT FALSE;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS parent_asset_id UUID REFERENCES media_assets(id);

-- Step 3: Create usage table
CREATE TABLE IF NOT EXISTS public.usage (
  user_id TEXT NOT NULL,
  day date NOT NULL,
  img_count int NOT NULL DEFAULT 0,
  vid_count int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- Step 4: Enable RLS on usage table
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Step 5: Create usage functions
CREATE OR REPLACE FUNCTION public.ensure_usage_row(u_user_id TEXT, u_day date)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.usage(user_id, day)
  VALUES (u_user_id, u_day)
  ON CONFLICT (user_id, day) DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.bump_usage(u_user_id TEXT, u_day date, u_kind text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF u_kind = 'img' THEN
    UPDATE public.usage 
    SET img_count = img_count + 1 
    WHERE user_id = u_user_id AND day = u_day;
  ELSE
    UPDATE public.usage 
    SET vid_count = vid_count + 1 
    WHERE user_id = u_user_id AND day = u_day;
  END IF;
END $$;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_mode ON media_assets(mode);
CREATE INDEX IF NOT EXISTS idx_media_assets_visibility ON media_assets(visibility);
CREATE INDEX IF NOT EXISTS usage_user_day_idx ON public.usage(user_id, day);

-- Step 7: Check results
SELECT 'Migration completed successfully!' as status;
