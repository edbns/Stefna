-- Unified Assets Table Schema Migration
-- This creates the single assets table for all media (preset + custom)

-- Create the unified assets table
CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cloudinary_public_id text,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'failed')),
  is_public boolean NOT NULL DEFAULT false,
  allow_remix boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  source_asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  preset_key text,
  prompt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_is_public ON public.assets(is_public);
CREATE INDEX IF NOT EXISTS idx_assets_published_at ON public.assets(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_media_type ON public.assets(media_type);
CREATE INDEX IF NOT EXISTS idx_assets_preset_key ON public.assets(preset_key);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public read access for published assets
DROP POLICY IF EXISTS public_read_assets ON public.assets;
CREATE POLICY public_read_assets
ON public.assets
FOR SELECT
TO anon, authenticated
USING (is_public = true AND status = 'ready');

-- Users can read their own assets
DROP POLICY IF EXISTS user_read_own_assets ON public.assets;
CREATE POLICY user_read_own_assets
ON public.assets
FOR SELECT
TO authenticated
USING (true); -- Allow authenticated users to read all assets for now

-- Users can insert their own assets
DROP POLICY IF EXISTS user_insert_own_assets ON public.assets;
CREATE POLICY user_insert_own_assets
ON public.assets
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow authenticated users to insert assets for now

-- Users can update their own assets
DROP POLICY IF EXISTS user_update_own_assets ON public.assets;
CREATE POLICY user_update_own_assets
ON public.assets
FOR UPDATE
TO authenticated
USING (true) -- Allow authenticated users to update all assets for now
WITH CHECK (true); -- Allow authenticated users to update all assets for now

-- Users can delete their own assets
DROP POLICY IF EXISTS user_delete_own_assets ON public.assets;
CREATE POLICY user_delete_own_assets
ON public.assets
FOR DELETE
TO authenticated
USING (true); -- Allow authenticated users to delete all assets for now

-- Trigger to set published_at when asset becomes public and ready
CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF NEW.is_public = true AND NEW.status = 'ready' AND OLD.published_at IS NULL THEN
    NEW.published_at = now();
  ELSIF NEW.is_public = false OR NEW.status != 'ready' THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_published_at ON public.assets;
CREATE TRIGGER trg_set_published_at
BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.set_published_at();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_update_updated_at ON public.assets;
CREATE TRIGGER trg_update_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Note: Feed views are created separately using database-create-feed-views.sql
-- to avoid conflicts with existing views

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
