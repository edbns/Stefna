-- Fix corrupted preset data in existing media_assets records - STEP BY STEP
-- Run each section separately and check results before proceeding

-- ========================================
-- STEP 1: Check current state
-- ========================================
-- Run this first to see what we're working with
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN preset_key IS NULL OR preset_key = 'unknown' OR preset_key = '' THEN 1 END) as corrupted_records,
    COUNT(CASE WHEN preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '' THEN 1 END) as good_records
FROM media_assets;

-- ========================================
-- STEP 2: Update based on mode field
-- ========================================
-- This is the safest update - only affects records with clear mode information
UPDATE media_assets 
SET 
    preset_key = CASE 
        WHEN mode = 'emotionmask' THEN COALESCE(preset_id, 'emotion_custom')
        WHEN mode = 'ghiblireact' THEN COALESCE(preset_id, 'ghibli_custom')
        WHEN mode = 'neotokyoglitch' THEN COALESCE(preset_id, 'neo_tokyo_custom')
        WHEN mode = 'preset' THEN COALESCE(preset_id, 'professional_custom')
        WHEN mode = 'custom' THEN COALESCE(preset_id, 'custom_prompt')
        ELSE COALESCE(preset_id, mode)
    END,
    preset_type = CASE 
        WHEN mode = 'emotionmask' THEN 'emotion'
        WHEN mode = 'ghiblireact' THEN 'ghibli'
        WHEN mode = 'neotokyoglitch' THEN 'neo-tokyo'
        WHEN mode = 'preset' THEN 'professional'
        WHEN mode = 'custom' THEN 'custom'
        ELSE 'media-asset'
    END
WHERE preset_key IS NULL 
   OR preset_key = 'unknown'
   OR preset_key = '';

-- Check results after step 2
SELECT 'After Step 2' as step, COUNT(*) as updated_records
FROM media_assets 
WHERE preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '';

-- ========================================
-- STEP 3: Update based on meta JSON data
-- ========================================
-- Only update records that have useful meta information
UPDATE media_assets 
SET 
    preset_key = COALESCE(
        meta->>'presetKey',
        meta->>'presetId',
        meta->>'generationType',
        'custom'
    ),
    preset_type = CASE 
        WHEN meta->>'generationType' = 'emotionmask' THEN 'emotion'
        WHEN meta->>'generationType' = 'ghiblireact' THEN 'ghibli'
        WHEN meta->>'generationType' = 'neotokyoglitch' THEN 'neo-tokyo'
        WHEN meta->>'generationType' = 'preset' THEN 'professional'
        WHEN meta->>'generationType' = 'custom' THEN 'custom'
        WHEN meta->>'mode' = 'emotionmask' THEN 'emotion'
        WHEN meta->>'mode' = 'ghiblireact' THEN 'ghibli'
        WHEN meta->>'mode' = 'neotokyoglitch' THEN 'neo-tokyo'
        WHEN meta->>'mode' = 'preset' THEN 'professional'
        WHEN meta->>'mode' = 'custom' THEN 'custom'
        ELSE 'media-asset'
    END
WHERE (preset_key IS NULL OR preset_key = 'unknown' OR preset_key = '')
   AND meta IS NOT NULL
   AND (meta->>'presetKey' IS NOT NULL OR meta->>'presetId' IS NOT NULL OR meta->>'generationType' IS NOT NULL);

-- Check results after step 3
SELECT 'After Step 3' as step, COUNT(*) as updated_records
FROM media_assets 
WHERE preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '';

-- ========================================
-- STEP 4: Update based on prompt patterns
-- ========================================
-- Use prompt content to infer preset type for remaining records
UPDATE media_assets 
SET 
    preset_key = CASE 
        WHEN prompt ILIKE '%ghibli%' OR prompt ILIKE '%anime%' OR prompt ILIKE '%studio ghibli%' THEN 'ghibli_custom'
        WHEN prompt ILIKE '%emotion%' OR prompt ILIKE '%mask%' OR prompt ILIKE '%expression%' THEN 'emotion_custom'
        WHEN prompt ILIKE '%neo%' OR prompt ILIKE '%tokyo%' OR prompt ILIKE '%glitch%' THEN 'neo_tokyo_custom'
        WHEN prompt ILIKE '%cinematic%' OR prompt ILIKE '%professional%' OR prompt ILIKE '%portrait%' THEN 'professional_custom'
        ELSE 'custom_prompt'
    END,
    preset_type = CASE 
        WHEN prompt ILIKE '%ghibli%' OR prompt ILIKE '%anime%' OR prompt ILIKE '%studio ghibli%' THEN 'ghibli'
        WHEN prompt ILIKE '%emotion%' OR prompt ILIKE '%mask%' OR prompt ILIKE '%expression%' THEN 'emotion'
        WHEN prompt ILIKE '%neo%' OR prompt ILIKE '%tokyo%' OR prompt ILIKE '%glitch%' THEN 'neo-tokyo'
        WHEN prompt ILIKE '%cinematic%' OR prompt ILIKE '%professional%' OR prompt ILIKE '%portrait%' THEN 'professional'
        ELSE 'custom'
    END
WHERE preset_key IS NULL 
   OR preset_key = 'unknown'
   OR preset_key = '';

-- Check results after step 4
SELECT 'After Step 4' as step, COUNT(*) as updated_records
FROM media_assets 
WHERE preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '';

-- ========================================
-- STEP 5: Final fallback for remaining records
-- ========================================
-- Set any remaining corrupted records to custom
UPDATE media_assets 
SET 
    preset_key = 'custom_prompt',
    preset_type = 'custom'
WHERE preset_key IS NULL 
   OR preset_key = 'unknown'
   OR preset_key = '';

-- ========================================
-- FINAL VERIFICATION
-- ========================================
-- Check final state
SELECT 
    'Final State' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN preset_key IS NULL OR preset_key = 'unknown' OR preset_key = '' THEN 1 END) as corrupted_records,
    COUNT(CASE WHEN preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '' THEN 1 END) as good_records
FROM media_assets;

-- Show sample of fixed records
SELECT 
    id,
    prompt,
    mode,
    preset_key,
    preset_type,
    created_at
FROM media_assets 
ORDER BY created_at DESC
LIMIT 10;
