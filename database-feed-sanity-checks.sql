-- Feed Implementation Sanity Checks
-- Run these SQL snippets to verify the new feed implementation

-- 1. What the API returns now
SELECT * FROM public.public_feed_v2 LIMIT 20;

-- 2. No public+ready rows missing outputs (should be 0)
SELECT COUNT(*) AS public_ready_missing_output
FROM public.assets
WHERE is_public = true 
  AND status = 'ready'
  AND (cloudinary_public_id IS NULL OR media_type IS NULL);

-- 3. Recent assets to confirm new writes are correct
SELECT 
  id, 
  source_public_id, 
  source_media_type,
  cloudinary_public_id, 
  media_type, 
  status, 
  is_public, 
  published_at
FROM public.assets
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if public_feed_v2 view exists and has data
SELECT 
  COUNT(*) AS total_items,
  COUNT(CASE WHEN cloudinary_public_id IS NOT NULL THEN 1 END) AS with_public_id,
  COUNT(CASE WHEN media_type IS NOT NULL THEN 1 END) AS with_media_type,
  COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) AS with_published_at
FROM public.public_feed_v2;

-- 5. Verify the view structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'public_feed_v2' 
ORDER BY ordinal_position;
