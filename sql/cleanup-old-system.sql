-- sql/cleanup-old-system.sql
-- Cleanup script to remove old system after successful migration
-- ONLY RUN AFTER VERIFYING ALL DATA WAS MIGRATED SUCCESSFULLY

-- ============================================================================
-- PHASE 1: FINAL VERIFICATION
-- ============================================================================

SELECT '=== FINAL VERIFICATION BEFORE CLEANUP ===' as phase;

-- Verify all new tables have data
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

-- Verify total count matches expected (should be 72)
SELECT 
    'Total migrated items verification' as check_type,
    (
        (SELECT COUNT(*) FROM ghibli_reaction_media) +
        (SELECT COUNT(*) FROM emotion_mask_media) +
        (SELECT COUNT(*) FROM presets_media) +
        (SELECT COUNT(*) FROM custom_prompt_media)
    ) as total_count,
    'Expected: 72' as expected;

-- Check if any items remain in old table
SELECT 
    'Remaining items in old table' as check_type,
    COUNT(*) as remaining_count
FROM media_assets;

-- ============================================================================
-- PHASE 2: SAFETY CHECK - CONFIRM CLEANUP
-- ============================================================================

-- IMPORTANT: Only proceed if the above verification shows:
-- 1. All new tables have data
-- 2. Total count = 72
-- 3. Old table has 0 remaining items

SELECT '=== SAFETY CHECK COMPLETE ===' as status;
SELECT 'If verification above shows success, proceed with cleanup' as instruction;

-- ============================================================================
-- PHASE 3: CLEANUP (COMMENTED OUT FOR SAFETY)
-- ============================================================================

-- UNCOMMENT THE LINES BELOW ONLY AFTER VERIFICATION SUCCESS

/*
-- Drop the old media_assets table
DROP TABLE IF EXISTS media_assets;

-- Drop the backup table (optional - keep if you want extra safety)
-- DROP TABLE IF EXISTS media_assets_backup;

-- Verify cleanup
SELECT '=== CLEANUP COMPLETE ===' as status;
SELECT 'Old media_assets table has been removed' as result;
SELECT 'All data is now in dedicated tables' as result;
SELECT 'System is clean and ready for production' as result;
*/

-- ============================================================================
-- PHASE 4: POST-CLEANUP VERIFICATION
-- ============================================================================

-- After running cleanup, verify these queries still work:
-- (These should work with the new dedicated tables)

SELECT '=== POST-CLEANUP VERIFICATION QUERIES ===' as phase;

-- Test querying from new tables
SELECT 
    'Post-cleanup verification' as check_type,
    'ghibli_reaction_media accessible' as test,
    CASE WHEN EXISTS (SELECT 1 FROM ghibli_reaction_media LIMIT 1) 
         THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 
    'Post-cleanup verification' as check_type,
    'emotion_mask_media accessible' as test,
    CASE WHEN EXISTS (SELECT 1 FROM emotion_mask_media LIMIT 1) 
         THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 
    'Post-cleanup verification' as check_type,
    'presets_media accessible' as test,
    CASE WHEN EXISTS (SELECT 1 FROM presets_media LIMIT 1) 
         THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 
    'Post-cleanup verification' as check_type,
    'custom_prompt_media accessible' as test,
    CASE WHEN EXISTS (SELECT 1 FROM custom_prompt_media LIMIT 1) 
         THEN 'PASS' ELSE 'FAIL' END as result;

-- ============================================================================
-- PHASE 5: CLEANUP COMPLETION
-- ============================================================================

SELECT '=== CLEANUP SCRIPT COMPLETE ===' as status;
SELECT 'Review verification results above before proceeding' as instruction;
SELECT 'If all checks pass, the old system is ready for removal' as next_step;
