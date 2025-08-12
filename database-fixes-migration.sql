-- Database Fixes Migration - Safe, Idempotent
-- Fixes preset/results mismatch, blob URL issues, feed queries, sharing/likes, toggle persistence

-- 2.1 media_assets base columns (only add missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='media_assets' AND column_name='metadata') THEN
    ALTER TABLE public.media_assets ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='media_assets' AND column_name='allow_remix') THEN
    ALTER TABLE public.media_assets ADD COLUMN allow_remix boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='media_assets' AND column_name='visibility') THEN
    ALTER TABLE public.media_assets ADD COLUMN visibility text NOT NULL DEFAULT 'private';
  END IF;

  -- Optional thumbnail; or just use url as fallback in code
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='media_assets' AND column_name='thumbnail_url') THEN
    ALTER TABLE public.media_assets ADD COLUMN thumbnail_url text;
  END IF;
END $$;

-- Enforce: remix only when public
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_assets_allow_remix_visibility_check') THEN
    ALTER TABLE public.media_assets
      ADD CONSTRAINT media_assets_allow_remix_visibility_check
      CHECK (allow_remix = false OR visibility = 'public');
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS media_assets_visibility_created_idx
  ON public.media_assets (visibility, created_at DESC);

-- 2.2 likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique by (asset,user)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'likes_unique_asset_user') THEN
    ALTER TABLE public.likes ADD CONSTRAINT likes_unique_asset_user UNIQUE (asset_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS likes_asset_idx ON public.likes (asset_id);
CREATE INDEX IF NOT EXISTS likes_user_idx ON public.likes (user_id);

-- 2.3 RLS (examples; adapt if you're using service role for writes anyway)
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Public can read public media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='media_assets' AND policyname='public_read_public_media'
  ) THEN
    CREATE POLICY public_read_public_media
      ON public.media_assets
      FOR SELECT
      USING (visibility = 'public');
  END IF;
END $$;

-- Owners can select/insert/update/delete their own media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='media_assets' AND policyname='owner_full_media'
  ) THEN
    CREATE POLICY owner_full_media
      ON public.media_assets
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Likes: users can read all for counts, and write their own rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='likes' AND policyname='likes_read_all'
  ) THEN
    CREATE POLICY likes_read_all ON public.likes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='likes' AND policyname='likes_user_write'
  ) THEN
    CREATE POLICY likes_user_write ON public.likes FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Let PostgREST/Supabase refresh schema cache (avoids PGRST204)
NOTIFY pgrst, 'reload schema';
