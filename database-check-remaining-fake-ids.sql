-- Check for remaining fake cloudinary_public_id values
-- These are causing 404 errors when the frontend tries to load images

-- 1. Check all cloudinary_public_id values
SELECT 
  id,
  cloudinary_public_id,
  LENGTH(cloudinary_public_id) as id_length,
  media_type,
  status,
  created_at
FROM assets 
WHERE cloudinary_public_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- 2. Identify fake IDs (not starting with 'stefna/' and not valid URLs)
SELECT 
  id,
  cloudinary_public_id,
  CASE 
    WHEN cloudinary_public_id LIKE 'stefna/%' THEN 'VALID_STEFNA'
    WHEN cloudinary_public_id ~ '^[a-zA-Z0-9]{20,}$' THEN 'VALID_CLOUDINARY'
    ELSE 'FAKE_OR_INVALID'
  END as id_type,
  media_type,
  status,
  created_at
FROM assets 
WHERE cloudinary_public_id IS NOT NULL
ORDER BY created_at DESC;

-- 3. Count by type
SELECT 
  CASE 
    WHEN cloudinary_public_id LIKE 'stefna/%' THEN 'VALID_STEFNA'
    WHEN cloudinary_public_id ~ '^[a-zA-Z0-9]{20,}$' THEN 'VALID_CLOUDINARY'
    ELSE 'FAKE_OR_INVALID'
  END as id_type,
  COUNT(*) as count
FROM assets 
WHERE cloudinary_public_id IS NOT NULL
GROUP BY id_type
ORDER BY count DESC;

-- 4. Show specific fake IDs that need cleanup
SELECT 
  id,
  cloudinary_public_id,
  media_type,
  status,
  created_at
FROM assets 
WHERE cloudinary_public_id IS NOT NULL
  AND cloudinary_public_id NOT LIKE 'stefna/%'
  AND cloudinary_public_id !~ '^[a-zA-Z0-9]{20,}$'
ORDER BY created_at DESC;
