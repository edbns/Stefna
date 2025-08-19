-- Clean Up Fake Cloudinary Images
-- This script removes fake cloudinary_public_id values and keeps only real images
-- Date: 2025-08-19

-- Step 1: Show what we're about to clean up
SELECT 'IMAGES TO BE CLEANED UP (fake cloudinary_public_id):' as info;

SELECT 
    id,
    cloudinary_public_id,
    media_type,
    status,
    is_public,
    created_at,
    CASE 
        WHEN cloudinary_public_id ~ '^[a-z0-9]{20}$' THEN 'FAKE_ID'
        WHEN cloudinary_public_id LIKE 'stefna/%' THEN 'REAL_CLOUDINARY'
        WHEN final_url IS NOT NULL AND final_url != '' THEN 'HAS_FINAL_URL'
        ELSE 'UNKNOWN'
    END as image_type
FROM assets 
WHERE cloudinary_public_id IS NOT NULL
ORDER BY created_at DESC;

-- Step 2: Keep only real images (with stefna/ prefix or valid final_url)
-- Delete fake images with short random cloudinary_public_id
DELETE FROM assets 
WHERE cloudinary_public_id ~ '^[a-z0-9]{20}$'  -- 20 character random strings
   OR (cloudinary_public_id IS NOT NULL 
       AND cloudinary_public_id !~ '^stefna/' 
       AND (final_url IS NULL OR final_url = ''));

-- Step 3: Show remaining images
SELECT 'REMAINING REAL IMAGES:' as info;

SELECT 
    id,
    cloudinary_public_id,
    media_type,
    status,
    is_public,
    final_url,
    created_at
FROM assets 
WHERE cloudinary_public_id IS NOT NULL
ORDER BY created_at DESC;

-- Step 4: Update final_url for stefna/ prefixed images
UPDATE assets 
SET final_url = 'https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/' || cloudinary_public_id
WHERE cloudinary_public_id LIKE 'stefna/%' 
   AND (final_url IS NULL OR final_url = '');

-- Step 5: Verify the cleanup
SELECT 'CLEANUP VERIFICATION:' as info;

SELECT 
    COUNT(*) as total_assets,
    COUNT(CASE WHEN cloudinary_public_id IS NOT NULL THEN 1 END) as with_cloudinary_id,
    COUNT(CASE WHEN final_url IS NOT NULL AND final_url != '' THEN 1 END) as with_final_url,
    COUNT(CASE WHEN cloudinary_public_id LIKE 'stefna/%' THEN 1 END) as real_cloudinary_images
FROM assets;

-- Step 6: Test the views after cleanup
SELECT 'VIEWS AFTER CLEANUP:' as info;

SELECT 'public_feed_working' as view_name, COUNT(*) as row_count FROM public_feed_working
UNION ALL
SELECT 'public_feed' as view_name, COUNT(*) as row_count FROM public_feed
UNION ALL
SELECT 'app_media' as view_name, COUNT(*) as row_count FROM app_media;

SELECT 'CLEANUP COMPLETE!' as info;
