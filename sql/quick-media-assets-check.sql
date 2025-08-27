-- sql/quick-media-assets-check.sql
-- Quick analysis of media_assets table for immediate insights

-- 1. Quick count and overview
SELECT 'QUICK OVERVIEW' as section;
SELECT COUNT(*) as total_media FROM media_assets;

-- 2. Check what preset types exist (this is what we need to migrate)
SELECT 'PRESET TYPES FOUND' as section;
SELECT 
    COALESCE(preset_key, 'NO_PRESET') as preset_key,
    COUNT(*) as count
FROM media_assets 
GROUP BY preset_key
ORDER BY count DESC;

-- 3. Check for media that might already be in new tables
SELECT 'POTENTIAL DUPLICATES WITH NEW TABLES' as section;
SELECT 
    'NeoGlitch duplicates' as check_type,
    COUNT(*) as count
FROM media_assets ma
WHERE EXISTS (
    SELECT 1 FROM neo_glitch_media ngm 
    WHERE ngm.imageUrl = ma.url
);

-- 4. Sample of recent media to see current state
SELECT 'RECENT MEDIA SAMPLE' as section;
SELECT 
    id,
    preset_key,
    LEFT(prompt, 30) as prompt_preview,
    created_at,
    visibility
FROM media_assets 
ORDER BY created_at DESC 
LIMIT 10;
