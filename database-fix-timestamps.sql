-- Fix Database Timestamps
-- This script checks and fixes any corrupted timestamps

-- Step 1: Check current timestamps
SELECT 'Current timestamps in assets:' as info;
SELECT id, user_id, created_at, updated_at 
FROM assets 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'Current timestamps in media_assets:' as info;
SELECT id, user_id, created_at, updated_at 
FROM media_assets 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 2: Check for any timestamps that are today at 2:29 PM
SELECT 'Assets with suspicious timestamps:' as info;
SELECT id, user_id, created_at, updated_at 
FROM assets 
WHERE DATE(created_at) = CURRENT_DATE 
AND EXTRACT(HOUR FROM created_at) = 14 
AND EXTRACT(MINUTE FROM created_at) = 29;

SELECT 'Media assets with suspicious timestamps:' as info;
SELECT id, user_id, created_at, updated_at 
FROM media_assets 
WHERE DATE(created_at) = CURRENT_DATE 
AND EXTRACT(HOUR FROM created_at) = 14 
AND EXTRACT(MINUTE FROM created_at) = 29;

-- Step 3: If we find corrupted timestamps, we need to restore them
-- This would require backup data or manual correction
-- For now, let's just log what we find

-- Step 4: Verify the user_all_media view is working
SELECT 'Testing user_all_media view:' as info;
SELECT COUNT(*) as total_items FROM user_all_media;

-- Step 5: Check for any recent media that might be missing
SELECT 'Recent media_assets (last 24 hours):' as info;
SELECT id, user_id, created_at, prompt, result_url 
FROM media_assets 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Step 6: Check for any recent assets (last 24 hours)
SELECT 'Recent assets (last 24 hours):' as info;
SELECT id, user_id, created_at, url 
FROM assets 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

