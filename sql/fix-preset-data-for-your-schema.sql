-- Fix corrupted preset data in media_assets table - SPECIFIC TO YOUR SCHEMA
-- Your table has preset_key but not preset_type, and mode info is in meta JSON

-- ========================================
-- STEP 1: Check current state
-- ========================================
SELECT 
    'Current Status' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN preset_key IS NULL OR preset_key = 'unknown' OR preset_key = '' THEN 1 END) as corrupted_records,
    COUNT(CASE WHEN preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '' THEN 1 END) as good_records
FROM media_assets;

-- ========================================
-- STEP 2: Update preset_key based on meta->mode
-- ========================================
-- Extract mode from meta JSON and set appropriate preset_key
UPDATE media_assets 
SET 
    preset_key = CASE 
        WHEN meta->>'mode' = 'emotionmask' THEN 'emotion_custom'
        WHEN meta->>'mode' = 'ghiblireact' THEN 'ghibli_custom'
        WHEN meta->>'mode' = 'neotokyoglitch' THEN 'neo_tokyo_custom'
        WHEN meta->>'mode' = 'preset' THEN 'professional_custom'
        WHEN meta->>'mode' = 'custom' THEN 'custom_prompt'
        WHEN meta->>'mode' = 'i2i' THEN 'image_to_image'
        WHEN meta->>'mode' = 't2i' THEN 'text_to_image'
        WHEN meta->>'mode' = 'story' THEN 'story_mode'
        ELSE 'custom_prompt'
    END
WHERE (preset_key IS NULL OR preset_key = 'unknown' OR preset_key = '')
   AND meta IS NOT NULL
   AND meta->>'mode' IS NOT NULL;

-- Check results after step 2
SELECT 'After Step 2 (meta->mode)' as step, COUNT(*) as updated_records
FROM media_assets 
WHERE preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '';

-- ========================================
-- STEP 3: Update based on generationType in meta
-- ========================================
-- Use generationType if mode is not available
UPDATE media_assets 
SET 
    preset_key = CASE 
        WHEN meta->>'generationType' = 'emotionmask' THEN 'emotion_custom'
        WHEN meta->>'generationType' = 'ghiblireact' THEN 'ghibli_custom'
        WHEN meta->>'generationType' = 'neotokyoglitch' THEN 'neo_tokyo_custom'
        WHEN meta->>'generationType' = 'preset' THEN 'professional_custom'
        WHEN meta->>'generationType' = 'custom' THEN 'custom_prompt'
        WHEN meta->>'generationType' = 'aiml-ghibli' THEN 'ghibli_custom'
        WHEN meta->>'generationType' = 'replicate' THEN 'replicate_custom'
        ELSE 'custom_prompt'
    END
WHERE (preset_key IS NULL OR preset_key = 'unknown' OR preset_key = '')
   AND meta IS NOT NULL
   AND meta->>'generationType' IS NOT NULL
   AND meta->>'mode' IS NULL;

-- Check results after step 3
SELECT 'After Step 3 (generationType)' as step, COUNT(*) as updated_records
FROM media_assets 
WHERE preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '';

-- ========================================
-- STEP 4: Update based on prompt content patterns
-- ========================================
-- Use prompt content to infer preset type for remaining records
UPDATE media_assets 
SET 
    preset_key = CASE 
        WHEN prompt ILIKE '%ghibli%' OR prompt ILIKE '%anime%' OR prompt ILIKE '%studio ghibli%' THEN 'ghibli_custom'
        WHEN prompt ILIKE '%emotion%' OR prompt ILIKE '%mask%' OR prompt ILIKE '%expression%' THEN 'emotion_custom'
        WHEN prompt ILIKE '%neo%' OR prompt ILIKE '%tokyo%' OR prompt ILIKE '%glitch%' THEN 'neo_tokyo_custom'
        WHEN prompt ILIKE '%cinematic%' OR prompt ILIKE '%professional%' OR prompt ILIKE '%portrait%' THEN 'professional_custom'
        WHEN prompt ILIKE '%transform%' OR prompt ILIKE '%human face%' THEN 'face_transformation'
        ELSE 'custom_prompt'
    END
WHERE preset_key IS NULL 
   OR preset_key = 'unknown'
   OR preset_key = '';

-- Check results after step 4
SELECT 'After Step 4 (prompt patterns)' as step, COUNT(*) as updated_records
FROM media_assets 
WHERE preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '';

-- ========================================
-- STEP 5: Final fallback for remaining records
-- ========================================
-- Set any remaining corrupted records to custom
UPDATE media_assets 
SET 
    preset_key = 'custom_prompt'
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
    meta->>'mode' as extracted_mode,
    meta->>'generationType' as extracted_generation_type,
    preset_key,
    created_at
FROM media_assets 
ORDER BY created_at DESC
LIMIT 10;
