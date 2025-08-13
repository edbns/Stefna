-- Create Feed Views Migration
-- This script creates the public feed views for the new feed structure

-- First, drop any existing views to avoid conflicts
DROP VIEW IF EXISTS public.public_feed CASCADE;
DROP VIEW IF EXISTS public.public_feed_v2 CASCADE;

-- Create the original public_feed view (for backward compatibility)
CREATE VIEW public.public_feed AS
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

-- Create the new public_feed_v2 view with only the six exposed fields
-- This view has no user_id/prompt leaks for security
CREATE VIEW public.public_feed_v2 AS
SELECT 
  id,
  cloudinary_public_id,
  media_type,
  published_at,
  source_asset_id,
  preset_key
FROM public.assets
WHERE is_public = true 
  AND status = 'ready'
  AND published_at IS NOT NULL
  AND cloudinary_public_id IS NOT NULL
  AND media_type IS NOT NULL
ORDER BY published_at DESC;

-- Grant access to both views
GRANT SELECT ON public.public_feed TO anon, authenticated;
GRANT SELECT ON public.public_feed_v2 TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the views were created successfully
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE viewname IN ('public_feed', 'public_feed_v2')
ORDER BY viewname;
