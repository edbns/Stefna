-- Remove the old/hotfixed feed item (803b...)
-- This will clean up the feed so only properly saved items appear

-- First, check what's in the feed currently
SELECT 
  id,
  status,
  is_public,
  published_at,
  cloudinary_public_id,
  media_type
FROM public.assets
WHERE is_public = true
ORDER BY published_at DESC
LIMIT 10;

-- Remove the problematic item (replace the ID with the actual 803b... ID)
-- This makes it private and removes it from the feed
UPDATE public.assets
SET is_public = false, published_at = null
WHERE id = '803bd504-34e4-4d16-80f4-e50b76ac2303';

-- Verify the item is no longer public
SELECT 
  id,
  status,
  is_public,
  published_at,
  cloudinary_public_id,
  media_type
FROM public.assets
WHERE id = '803bd504-34e4-4d16-80f4-e50b76ac2303';

-- Check the feed is now empty (should return 0 rows)
SELECT COUNT(*) FROM public.public_feed_v2;

-- This confirms the feed will be empty until your next save succeeds
