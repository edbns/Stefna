-- Check Cloudinary Public IDs in Database
-- This will help us understand why images are returning 404
-- Date: 2025-08-19

-- Check what cloudinary_public_id values exist
SELECT 
    id,
    cloudinary_public_id,
    media_type,
    status,
    is_public,
    created_at
FROM assets 
WHERE cloudinary_public_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Check for any malformed or invalid cloudinary_public_id values
SELECT 
    cloudinary_public_id,
    COUNT(*) as count,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM assets 
WHERE cloudinary_public_id IS NOT NULL
GROUP BY cloudinary_public_id
ORDER BY count DESC
LIMIT 10;

-- Check if any cloudinary_public_id values are empty strings or just whitespace
SELECT 
    id,
    cloudinary_public_id,
    LENGTH(cloudinary_public_id) as length,
    media_type,
    status
FROM assets 
WHERE cloudinary_public_id IS NULL 
   OR cloudinary_public_id = '' 
   OR TRIM(cloudinary_public_id) = '';

-- Check the URL construction logic
SELECT 
    id,
    cloudinary_public_id,
    CASE 
        WHEN cloudinary_public_id ~~ 'stefna/%'::text THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/'::text || cloudinary_public_id)
        WHEN cloudinary_public_id IS NOT NULL AND cloudinary_public_id !~ '^stefna/' THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/stefna/'::text || cloudinary_public_id)
        ELSE NULL::text 
    END AS constructed_url,
    final_url,
    media_type,
    status
FROM assets 
WHERE cloudinary_public_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
