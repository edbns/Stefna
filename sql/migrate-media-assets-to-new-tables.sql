-- sql/migrate-media-assets-to-new-tables.sql
-- Comprehensive migration script to move all media from media_assets to new dedicated tables
-- Based on analysis: 72 total items to migrate

-- ============================================================================
-- PHASE 1: BACKUP AND VALIDATION
-- ============================================================================

-- Check for existing data in new tables
SELECT '=== CHECKING EXISTING DATA ===' as phase;

SELECT 
    'Existing data check' as check_type,
    'ghibli_reaction_media' as table_name,
    COUNT(*) as count 
FROM ghibli_reaction_media
UNION ALL
SELECT 
    'Existing data check' as check_type,
    'emotion_mask_media' as table_name,
    COUNT(*) as count 
FROM emotion_mask_media
UNION ALL
SELECT 
    'Existing data check' as check_type,
    'presets_media' as table_name,
    COUNT(*) as count 
FROM presets_media
UNION ALL
SELECT 
    'Existing data check' as check_type,
    'custom_prompt_media' as table_name,
    COUNT(*) as count 
FROM custom_prompt_media;

-- ============================================================================
-- PHASE 2: CLEANUP EXISTING DATA (OPTIONAL)
-- ============================================================================

-- Uncomment the lines below if you want to start fresh
-- WARNING: This will delete ALL existing data in new tables
/*
DELETE FROM ghibli_reaction_media;
DELETE FROM emotion_mask_media;
DELETE FROM presets_media;
DELETE FROM custom_prompt_media;
SELECT '=== EXISTING DATA CLEARED ===' as status;
*/

-- ============================================================================
-- PHASE 3: BACKUP AND VALIDATION
-- ============================================================================

-- Create backup of current media_assets table
CREATE TABLE IF NOT EXISTS media_assets_backup AS 
SELECT * FROM media_assets;

-- Verify backup was created
SELECT 'Backup created' as status, COUNT(*) as backup_count FROM media_assets_backup;

-- ============================================================================
-- PHASE 4: MIGRATE GHIBLI REACTION MEDIA (37 items)
-- ============================================================================

SELECT '=== MIGRATING GHIBLI REACTION MEDIA ===' as phase;

-- Insert into ghibli_reaction_media table
INSERT INTO ghibli_reaction_media (
    id,
    user_id,
    image_url,
    source_url,
    prompt,
    preset,
    run_id,
    aiml_job_id,
    created_at,
    status
)
SELECT 
    ma.id::text,
    ma.user_id::text,
    ma.url as image_url,
    COALESCE(ma.source_asset_id, ma.url) as source_url,
    ma.prompt,
    CASE 
        WHEN ma.preset_key LIKE '%ghibli%' THEN ma.preset_key
        WHEN ma.meta->>'mode' = 'ghiblireact' THEN 'ghibli_default'
        ELSE 'ghibli_unknown'
    END as preset,
    ma.id::text as run_id, -- Use media_assets id as run_id
    ma.id::text as aiml_job_id, -- Use media_assets id as aiml_job_id
    ma.created_at,
    'completed' as status
FROM media_assets ma
WHERE 
    (ma.preset_key LIKE '%ghibli%' 
    OR ma.meta->>'mode' = 'ghiblireact'
    OR ma.meta->>'generation_type' LIKE '%ghibli%')
    AND NOT EXISTS (
        SELECT 1 FROM ghibli_reaction_media grm WHERE grm.id = ma.id::text
    );

-- Verify Ghibli migration
SELECT 'Ghibli Reaction migrated' as status, COUNT(*) as count FROM ghibli_reaction_media;

-- ============================================================================
-- PHASE 5: MIGRATE EMOTION MASK MEDIA (20 items)
-- ============================================================================

SELECT '=== MIGRATING EMOTION MASK MEDIA ===' as phase;

-- Insert into emotion_mask_media table
INSERT INTO emotion_mask_media (
    id,
    user_id,
    image_url,
    source_url,
    prompt,
    preset,
    run_id,
    aiml_job_id,
    created_at,
    status
)
SELECT 
    ma.id::text,
    ma.user_id::text,
    ma.url as image_url,
    COALESCE(ma.source_asset_id, ma.url) as source_url,
    ma.prompt,
    CASE 
        WHEN ma.preset_key = 'nostalgia_distance' THEN 'nostalgia_distance'
        WHEN ma.preset_key = 'strength_vulnerability' THEN 'strength_vulnerability'
        WHEN ma.preset_key = 'peace_fear' THEN 'peace_fear'
        WHEN ma.meta->>'mode' = 'emotionmask' THEN 'emotion_default'
        ELSE ma.preset_key
    END as preset,
    ma.id::text as run_id,
    ma.id::text as aiml_job_id,
    ma.created_at,
    'completed' as status
FROM media_assets ma
WHERE 
    (ma.preset_key IN ('nostalgia_distance', 'strength_vulnerability', 'peace_fear')
    OR ma.meta->>'mode' = 'emotionmask'
    OR ma.meta->>'generation_type' LIKE '%emotion%')
    AND NOT EXISTS (
        SELECT 1 FROM emotion_mask_media emm WHERE emm.id = ma.id::text
    );

-- Verify Emotion Mask migration
SELECT 'Emotion Mask migrated' as status, COUNT(*) as count FROM emotion_mask_media;

-- ============================================================================
-- PHASE 6: MIGRATE PROFESSIONAL PRESETS MEDIA (17 items)
-- ============================================================================

SELECT '=== MIGRATING PROFESSIONAL PRESETS MEDIA ===' as phase;

-- Insert into presets_media table
INSERT INTO presets_media (
    id,
    user_id,
    image_url,
    source_url,
    prompt,
    preset,
    run_id,
    aiml_job_id,
    created_at,
    status
)
SELECT 
    ma.id::text,
    ma.user_id::text,
    ma.url as image_url,
    COALESCE(ma.source_asset_id, ma.url) as source_url,
    ma.prompt,
    CASE 
        WHEN ma.preset_key = 'landscape' THEN 'landscape'
        WHEN ma.preset_key = 'portrait' THEN 'portrait'
        WHEN ma.preset_key = 'vintage' THEN 'vintage'
        WHEN ma.preset_key = 'cinematic' THEN 'cinematic'
        WHEN ma.preset_key = 'soft' THEN 'soft'
        WHEN ma.meta->>'mode' = 'preset' THEN 'professional_default'
        ELSE ma.preset_key
    END as preset,
    ma.id::text as run_id,
    ma.id::text as aiml_job_id,
    ma.created_at,
    'completed' as status
FROM media_assets ma
WHERE 
    (ma.preset_key IN ('landscape', 'portrait', 'vintage', 'cinematic', 'soft')
    OR ma.meta->>'mode' = 'preset'
    OR ma.meta->>'generation_type' LIKE '%preset%')
    AND NOT EXISTS (
        SELECT 1 FROM presets_media pm WHERE pm.id = ma.id::text
    );

-- Verify Presets migration
SELECT 'Professional Presets migrated' as status, COUNT(*) as count FROM presets_media;

-- ============================================================================
-- PHASE 7: MIGRATE CUSTOM PROMPT MEDIA (19 items)
-- ============================================================================

SELECT '=== MIGRATING CUSTOM PROMPT MEDIA ===' as phase;

-- Insert into custom_prompt_media table
INSERT INTO custom_prompt_media (
    id,
    user_id,
    image_url,
    source_url,
    prompt,
    preset,
    run_id,
    aiml_job_id,
    created_at,
    status
)
SELECT 
    ma.id::text,
    ma.user_id::text,
    ma.url as image_url,
    COALESCE(ma.source_asset_id, ma.url) as source_url,
    ma.prompt,
    CASE 
        WHEN ma.preset_key = 'custom_prompt' THEN 'user_custom'
        WHEN ma.meta->>'mode' = 'custom' THEN 'user_custom'
        ELSE 'user_custom'
    END as preset,
    ma.id::text as run_id,
    ma.id::text as aiml_job_id,
    ma.created_at,
    'completed' as status
FROM media_assets ma
WHERE 
    (ma.preset_key = 'custom_prompt'
    OR ma.meta->>'mode' = 'custom'
    OR ma.meta->>'generation_type' LIKE '%custom%')
    AND NOT EXISTS (
        SELECT 1 FROM custom_prompt_media cpm WHERE cpm.id = ma.id::text
    );

-- Verify Custom Prompt migration
SELECT 'Custom Prompt migrated' as status, COUNT(*) as count FROM custom_prompt_media;

-- ============================================================================
-- PHASE 8: INVESTIGATE REMAINING ITEMS (7 items)
-- ============================================================================

SELECT '=== INVESTIGATING REMAINING ITEMS ===' as phase;

-- Show items that weren't migrated (should be 7)
SELECT 
    'Remaining unmigrated items' as status,
    COUNT(*) as count
FROM media_assets ma
WHERE NOT EXISTS (
    SELECT 1 FROM ghibli_reaction_media grm WHERE grm.id = ma.id::text
    UNION ALL
    SELECT 1 FROM emotion_mask_media emm WHERE emm.id = ma.id::text
    UNION ALL
    SELECT 1 FROM presets_media pm WHERE pm.id = ma.id::text
    UNION ALL
    SELECT 1 FROM custom_prompt_media cpm WHERE cpm.id = ma.id::text
);

-- Show details of remaining items
SELECT 
    'Remaining item details' as status,
    ma.id,
    ma.preset_key,
    ma.meta->>'mode' as mode,
    ma.meta->>'generation_type' as generation_type,
    LEFT(ma.prompt, 50) as prompt_preview
FROM media_assets ma
WHERE NOT EXISTS (
    SELECT 1 FROM ghibli_reaction_media grm WHERE grm.id = ma.id::text
    UNION ALL
    SELECT 1 FROM emotion_mask_media emm WHERE emm.id = ma.id::text
    UNION ALL
    SELECT 1 FROM presets_media pm WHERE pm.id = ma.id::text
    UNION ALL
    SELECT 1 FROM custom_prompt_media cpm WHERE cpm.id = ma.id::text
);

-- ============================================================================
-- PHASE 9: MIGRATION SUMMARY
-- ============================================================================

SELECT '=== MIGRATION SUMMARY ===' as phase;

-- Count total migrated items
SELECT 
    'Total migrated items' as metric,
    (
        (SELECT COUNT(*) FROM ghibli_reaction_media) +
        (SELECT COUNT(*) FROM emotion_mask_media) +
        (SELECT COUNT(*) FROM presets_media) +
        (SELECT COUNT(*) FROM custom_prompt_media)
    ) as count;

-- Count by table
SELECT 'Ghibli Reaction Media' as table_name, COUNT(*) as count FROM ghibli_reaction_media
UNION ALL
SELECT 'Emotion Mask Media' as table_name, COUNT(*) as count FROM emotion_mask_media
UNION ALL
SELECT 'Presets Media' as table_name, COUNT(*) as count FROM presets_media
UNION ALL
SELECT 'Custom Prompt Media' as table_name, COUNT(*) as count FROM custom_prompt_media;

-- ============================================================================
-- PHASE 10: VERIFICATION CHECKS
-- ============================================================================

SELECT '=== VERIFICATION CHECKS ===' as phase;

-- Check for any duplicate IDs across new tables
SELECT 
    'Duplicate ID check' as check_type,
    COUNT(*) as duplicate_count
FROM (
    SELECT id FROM ghibli_reaction_media
    UNION ALL
    SELECT id FROM emotion_mask_media
    UNION ALL
    SELECT id FROM presets_media
    UNION ALL
    SELECT id FROM custom_prompt_media
) all_ids
GROUP BY id
HAVING COUNT(*) > 1;

-- Check that all migrated items have required fields
SELECT 
    'Required fields check' as check_type,
    COUNT(*) as missing_fields_count
FROM (
    SELECT id FROM ghibli_reaction_media WHERE image_url IS NULL OR prompt IS NULL
    UNION ALL
    SELECT id FROM emotion_mask_media WHERE image_url IS NULL OR prompt IS NULL
    UNION ALL
    SELECT id FROM presets_media WHERE image_url IS NULL OR prompt IS NULL
    UNION ALL
    SELECT id FROM custom_prompt_media WHERE image_url IS NULL OR prompt IS NULL
) missing_fields;

-- ============================================================================
-- PHASE 11: CLEANUP PREPARATION (COMMENTED OUT FOR SAFETY)
-- ============================================================================

-- IMPORTANT: These commands are commented out for safety
-- Uncomment ONLY after verifying migration was successful

/*
-- After successful migration verification, you can run:

-- 1. Drop the backup table (optional)
-- DROP TABLE media_assets_backup;

-- 2. Drop the old media_assets table (ONLY after UI is updated)
-- DROP TABLE media_assets;

-- 3. Update any remaining references in the codebase
-- 4. Test the new system thoroughly
*/

SELECT '=== MIGRATION SCRIPT COMPLETED ===' as status;
SELECT 'Review results above before proceeding with cleanup' as next_step;
