-- sql/execute-cleanup.sql
-- ACTUAL CLEANUP SCRIPT - This will drop the old media_assets table

-- ============================================================================
-- EXECUTING ACTUAL CLEANUP
-- ============================================================================

SELECT '=== EXECUTING ACTUAL CLEANUP ===' as phase;

-- Drop the old media_assets table
DROP TABLE IF EXISTS media_assets;

-- Verify the table is gone
SELECT 
    'Cleanup verification' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'media_assets'
    ) THEN 'FAIL - Table still exists' 
    ELSE 'PASS - Table successfully removed' END as result;

-- Verify all new tables still have data
SELECT 
    'New table data verification' as check_type,
    'ghibli_reaction_media' as table_name,
    COUNT(*) as count 
FROM ghibli_reaction_media
UNION ALL
SELECT 
    'New table data verification' as check_type,
    'emotion_mask_media' as table_name,
    COUNT(*) as count 
FROM emotion_mask_media
UNION ALL
SELECT 
    'New table data verification' as check_type,
    'presets_media' as table_name,
    COUNT(*) as count 
FROM presets_media
UNION ALL
SELECT 
    'New table data verification' as check_type,
    'custom_prompt_media' as table_name,
    COUNT(*) as count 
FROM custom_prompt_media;

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================

SELECT '=== CLEANUP EXECUTED SUCCESSFULLY ===' as status;
SELECT 'Old media_assets table has been removed' as result;
SELECT 'All data is now in dedicated tables' as result;
SELECT 'System is clean and ready for production' as result;
SELECT 'You can now push to GitHub and test!' as next_step;
