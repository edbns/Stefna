-- Simple verification script to check preset data status
-- Run this before and after the migration to see the difference

-- Check overall status
SELECT 
    'Current Status' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN preset_key IS NULL OR preset_key = 'unknown' OR preset_key = '' THEN 1 END) as corrupted_records,
    COUNT(CASE WHEN preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '' THEN 1 END) as good_records
FROM media_assets;

-- Show sample of corrupted records
SELECT 
    'Corrupted Records' as info,
    id,
    prompt,
    mode,
    preset_key,
    created_at
FROM media_assets 
WHERE preset_key IS NULL 
   OR preset_key = 'unknown'
   OR preset_key = ''
ORDER BY created_at DESC
LIMIT 5;

-- Show sample of good records
SELECT 
    'Good Records' as info,
    id,
    prompt,
    mode,
    preset_key,
    created_at
FROM media_assets 
WHERE preset_key IS NOT NULL 
   AND preset_key != 'unknown'
   AND preset_key != ''
ORDER BY created_at DESC
LIMIT 5;
