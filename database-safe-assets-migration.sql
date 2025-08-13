-- Safe Assets Migration - Adapts to your current schema
-- Run the diagnostic script first, then this one

-- Step 1: Create the assets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cloudinary_public_id text,
  media_type text CHECK (media_type IN ('image', 'video')),
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

-- Step 2: Add missing columns if they don't exist
DO $$
BEGIN
  -- Add cloudinary_public_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'cloudinary_public_id') THEN
    ALTER TABLE public.assets ADD COLUMN cloudinary_public_id text;
  END IF;
  
  -- Add media_type if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'media_type') THEN
    ALTER TABLE public.assets ADD COLUMN media_type text;
  END IF;
  
  -- Add status if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'status') THEN
    ALTER TABLE public.assets ADD COLUMN status text DEFAULT 'queued';
  END IF;
  
  -- Add is_public if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'is_public') THEN
    ALTER TABLE public.assets ADD COLUMN is_public boolean DEFAULT false;
  END IF;
  
  -- Add allow_remix if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'allow_remix') THEN
    ALTER TABLE public.assets ADD COLUMN allow_remix boolean DEFAULT false;
  END IF;
  
  -- Add published_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'published_at') THEN
    ALTER TABLE public.assets ADD COLUMN published_at timestamptz;
  END IF;
  
  -- Add source_asset_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'source_asset_id') THEN
    ALTER TABLE public.assets ADD COLUMN source_asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL;
  END IF;
  
  -- Add preset_key if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'preset_key') THEN
    ALTER TABLE public.assets ADD COLUMN preset_key text;
  END IF;
  
  -- Add prompt if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'prompt') THEN
    ALTER TABLE public.assets ADD COLUMN prompt text;
  END IF;
  
  -- Add updated_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'updated_at') THEN
    ALTER TABLE public.assets ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_is_public ON public.assets(is_public);
CREATE INDEX IF NOT EXISTS idx_assets_published_at ON public.assets(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_media_type ON public.assets(media_type);
CREATE INDEX IF NOT EXISTS idx_assets_preset_key ON public.assets(preset_key);

-- Step 4: Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
DROP POLICY IF EXISTS public_read_assets ON public.assets;
CREATE POLICY public_read_assets
ON public.assets
FOR SELECT
TO anon, authenticated
USING (is_public = true AND status = 'ready');

DROP POLICY IF EXISTS user_read_own_assets ON public.assets;
CREATE POLICY user_read_own_assets
ON public.assets
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_insert_own_assets ON public.assets;
CREATE POLICY user_insert_own_assets
ON public.assets
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_update_own_assets ON public.assets;
CREATE POLICY user_update_own_assets
ON public.assets
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_delete_own_assets ON public.assets;
CREATE POLICY user_delete_own_assets
ON public.assets
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Step 6: Create triggers
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

-- Step 7: Create the public_feed view
DROP VIEW IF EXISTS public.public_feed;
CREATE OR REPLACE VIEW public.public_feed AS
SELECT 
  id,
  user_id,
  cloudinary_public_id,
  media_type,
  status,
  is_public,
  allow_remix,
  published_at,
  source_asset_id,
  preset_key,
  prompt,
  created_at
FROM public.assets
WHERE is_public = true 
  AND status = 'ready'
  AND published_at IS NOT NULL
  AND cloudinary_public_id IS NOT NULL
  AND media_type IS NOT NULL
ORDER BY published_at DESC;

-- Step 8: Grant access
GRANT SELECT ON public.public_feed TO anon, authenticated;

-- Step 9: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 10: Verify everything works
SELECT 'Migration completed successfully' as status;
SELECT 'Assets table columns:' as info, count(*) as column_count FROM information_schema.columns WHERE table_name = 'assets' AND table_schema = 'public';
SELECT 'Public feed items:' as info, count(*) as item_count FROM public.public_feed;
