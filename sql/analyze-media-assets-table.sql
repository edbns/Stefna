-- sql/analyze-media-assets-table.sql
-- Comprehensive analysis of the media_assets table to understand migration needs

-- 1. Basic table structure and counts
SELECT '=== MEDIA_ASSETS TABLE ANALYSIS ===' as info;

-- Check total count
SELECT 
    'Total media_assets count' as metric,
    COUNT(*) as value
FROM media_assets;

-- Check by user distribution
SELECT 
    'Media count by user' as metric,
    COUNT(*) as media_count,
    COUNT(DISTINCT user_id) as unique_users
FROM media_assets;

-- 2. Analyze preset types and generation patterns
SELECT '=== PRESET TYPE ANALYSIS ===' as info;

-- Check what preset types exist
SELECT 
    preset_key,
    preset_id,
    COUNT(*) as count,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM media_assets 
WHERE preset_key IS NOT NULL OR preset_id IS NOT NULL
GROUP BY preset_key, preset_id
ORDER BY count DESC;

-- Check media without preset info
SELECT 
    'Media without preset info' as metric,
    COUNT(*) as count
FROM media_assets 
WHERE (preset_key IS NULL OR preset_key = '') 
  AND (preset_id IS NULL OR preset_id = '');

-- 3. Analyze resource types and media formats
SELECT '=== RESOURCE TYPE ANALYSIS ===' as info;

SELECT 
    resource_type,
    COUNT(*) as count,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM media_assets 
GROUP BY resource_type
ORDER BY count DESC;

-- 4. Analyze visibility and sharing patterns
SELECT '=== VISIBILITY ANALYSIS ===' as info;

SELECT 
    visibility,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM media_assets), 2) as percentage
FROM media_assets 
GROUP BY visibility
ORDER BY count DESC;

-- 5. Analyze prompt patterns and content
SELECT '=== PROMPT ANALYSIS ===' as info;

-- Check prompt lengths
SELECT 
    'Prompt length analysis' as metric,
    COUNT(*) as total_media,
    ROUND(AVG(LENGTH(prompt)), 2) as avg_prompt_length,
    MIN(LENGTH(prompt)) as min_prompt_length,
    MAX(LENGTH(prompt)) as max_prompt_length
FROM media_assets 
WHERE prompt IS NOT NULL AND prompt != '';

-- Check for common prompt patterns
SELECT 
    'Common prompt patterns' as metric,
    LEFT(prompt, 50) as prompt_start,
    COUNT(*) as count
FROM media_assets 
WHERE prompt IS NOT NULL AND prompt != ''
GROUP BY LEFT(prompt, 50)
ORDER BY count DESC
LIMIT 10;

-- 6. Analyze metadata and JSON fields
SELECT '=== METADATA ANALYSIS ===' as info;

-- Check what's in the meta JSON field
SELECT 
    'Meta field analysis' as metric,
    COUNT(*) as total_media,
    COUNT(meta) as has_meta,
    COUNT(meta->>'mode') as has_mode,
    COUNT(meta->>'generation_type') as has_generation_type
FROM media_assets;

-- Check specific meta patterns
SELECT 
    meta->>'mode' as mode,
    meta->>'generation_type' as generation_type,
    COUNT(*) as count
FROM media_assets 
WHERE meta IS NOT NULL 
  AND (meta->>'mode' IS NOT NULL OR meta->>'generation_type' IS NOT NULL)
GROUP BY meta->>'mode', meta->>'generation_type'
ORDER BY count DESC;

-- 7. Analyze URL patterns to understand generation sources
SELECT '=== URL PATTERN ANALYSIS ===' as info;

-- Check URL sources
SELECT 
    CASE 
        WHEN url LIKE '%cdn.aimlapi.com%' THEN 'AIML API'
        WHEN url LIKE '%res.cloudinary.com%' THEN 'Cloudinary'
        WHEN url LIKE '%replicate.com%' THEN 'Replicate'
        ELSE 'Other/Unknown'
    END as url_source,
    COUNT(*) as count
FROM media_assets 
GROUP BY 
    CASE 
        WHEN url LIKE '%cdn.aimlapi.com%' THEN 'AIML API'
        WHEN url LIKE '%res.cloudinary.com%' THEN 'Cloudinary'
        WHEN url LIKE '%replicate.com%' THEN 'Replicate'
        ELSE 'Other/Unknown'
    END
ORDER BY count DESC;

-- 8. Analyze recent vs old media
SELECT '=== TIMELINE ANALYSIS ===' as info;

-- Check creation timeline
SELECT 
    'Media creation timeline' as metric,
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as media_created
FROM media_assets 
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC
LIMIT 30;

-- 9. Check for potential duplicates or issues
SELECT '=== DATA QUALITY ANALYSIS ===' as info;

-- Check for duplicate URLs
SELECT 
    'Potential duplicate URLs' as metric,
    COUNT(*) as duplicate_count
FROM (
    SELECT url, COUNT(*) as url_count
    FROM media_assets 
    WHERE url IS NOT NULL
    GROUP BY url
    HAVING COUNT(*) > 1
) as duplicates;

-- Check for media without URLs
SELECT 
    'Media without URLs' as metric,
    COUNT(*) as count
FROM media_assets 
WHERE url IS NULL OR url = '';

-- 10. Summary and migration recommendations
SELECT '=== MIGRATION RECOMMENDATIONS ===' as info;

-- Count media that can be migrated to each new table
SELECT 
    'Migration mapping summary' as metric,
    CASE 
        WHEN preset_key LIKE '%ghibli%' OR preset_key LIKE '%ghibli_reaction%' THEN 'ghibli_reaction_media'
        WHEN preset_key LIKE '%emotion%' OR preset_key LIKE '%emotion_mask%' THEN 'emotion_mask_media'
        WHEN preset_key LIKE '%preset%' OR preset_key LIKE '%professional%' THEN 'presets_media'
        WHEN preset_key LIKE '%custom%' OR preset_key LIKE '%user_prompt%' THEN 'custom_prompt_media'
        WHEN preset_key LIKE '%neo%' OR preset_key LIKE '%tokyo%' OR preset_key LIKE '%glitch%' THEN 'neo_glitch_media'
        ELSE 'unknown_type'
    END as target_table,
    COUNT(*) as media_count
FROM media_assets 
GROUP BY 
    CASE 
        WHEN preset_key LIKE '%ghibli%' OR preset_key LIKE '%ghibli_reaction%' THEN 'ghibli_reaction_media'
        WHEN preset_key LIKE '%emotion%' OR preset_key LIKE '%emotion_mask%' THEN 'emotion_mask_media'
        WHEN preset_key LIKE '%preset%' OR preset_key LIKE '%professional%' THEN 'presets_media'
        WHEN preset_key LIKE '%custom%' OR preset_key LIKE '%user_prompt%' THEN 'custom_prompt_media'
        WHEN preset_key LIKE '%neo%' OR preset_key LIKE '%tokyo%' OR preset_key LIKE '%glitch%' THEN 'neo_glitch_media'
        ELSE 'unknown_type'
    END
ORDER BY media_count DESC;
