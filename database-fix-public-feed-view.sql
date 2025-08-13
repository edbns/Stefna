-- Quick fix for public_feed view
-- This ensures the view has all required columns and proper filtering

-- Drop and recreate the public_feed view with correct columns
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

-- Grant access to the view
GRANT SELECT ON public.public_feed TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the view works
SELECT 'View created successfully' as status, count(*) as total_items FROM public.public_feed;
