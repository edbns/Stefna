-- sql/quick-diagnostic.sql
-- Quick diagnostic to check what's in the database

SELECT '=== QUICK DIAGNOSTIC ===' as phase;

-- Check what tables exist
SELECT 
    'Existing tables' as check_type,
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%media%'
ORDER BY table_name;

-- Check data counts in each table
SELECT 
    'Data counts' as check_type,
    'ghibli_reaction_media' as table_name,
    COUNT(*) as count 
FROM ghibli_reaction_media
UNION ALL
SELECT 
    'Data counts' as check_type,
    'emotion_mask_media' as table_name,
    COUNT(*) as count 
FROM emotion_mask_media
UNION ALL
SELECT 
    'Data counts' as check_type,
    'presets_media' as table_name,
    COUNT(*) as count 
FROM presets_media
UNION ALL
SELECT 
    'Data counts' as check_type,
    'custom_prompt_media' as table_name,
    COUNT(*) as count 
FROM custom_prompt_media
UNION ALL
SELECT 
    'Data counts' as check_type,
    'neo_glitch_media' as table_name,
    COUNT(*) as count 
FROM neo_glitch_media;

-- Check if old table still exists
SELECT 
    'Old table check' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'media_assets'
    ) THEN 'media_assets STILL EXISTS' 
    ELSE 'media_assets REMOVED' END as result;
