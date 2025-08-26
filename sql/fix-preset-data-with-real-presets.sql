-- Fix preset data to use REAL preset IDs instead of generic values
-- This will make the frontend display proper preset names like "Joy + Sadness", "Tears", etc.

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
-- STEP 2: Map to REAL preset IDs based on prompt content
-- ========================================
-- For Emotion Mask: Map prompts to actual preset IDs
UPDATE media_assets 
SET 
    preset_key = CASE 
        -- Emotion Mask presets based on prompt content
        WHEN prompt ILIKE '%bittersweet%' OR prompt ILIKE '%smiling with teary eyes%' THEN 'joy_sadness'
        WHEN prompt ILIKE '%inner strength%' OR prompt ILIKE '%vulnerability%' THEN 'strength_vulnerability'
        WHEN prompt ILIKE '%nostalgic%' OR prompt ILIKE '%nostalgia%' OR prompt ILIKE '%reflective%' THEN 'nostalgia_distance'
        WHEN prompt ILIKE '%peace%' OR prompt ILIKE '%fear%' OR prompt ILIKE '%calm%' THEN 'peace_fear'
        
        -- Ghibli presets based on prompt content
        WHEN prompt ILIKE '%tears%' OR prompt ILIKE '%glistening%' OR prompt ILIKE '%emotional intensity%' THEN 'ghibli_tears'
        WHEN prompt ILIKE '%shocked%' OR prompt ILIKE '%widened anime-style eyes%' OR prompt ILIKE '%parted lips%' THEN 'ghibli_shock'
        WHEN prompt ILIKE '%sparkles%' OR prompt ILIKE '%whimsical%' OR prompt ILIKE '%soft blush%' THEN 'ghibli_sparkle'
        
        -- Professional presets based on prompt content
        WHEN prompt ILIKE '%cinematic%' OR prompt ILIKE '%cinematic%' THEN 'cinematic'
        WHEN prompt ILIKE '%portrait%' OR prompt ILIKE '%close-up%' THEN 'portrait'
        WHEN prompt ILIKE '%landscape%' OR prompt ILIKE '%nature%' THEN 'landscape'
        WHEN prompt ILIKE '%artistic%' OR prompt ILIKE '%creative%' THEN 'artistic'
        WHEN prompt ILIKE '%vintage%' OR prompt ILIKE '%retro%' OR prompt ILIKE '%35mm%' THEN 'vintage'
        WHEN prompt ILIKE '%modern%' OR prompt ILIKE '%contemporary%' THEN 'modern'
        WHEN prompt ILIKE '%dramatic%' OR prompt ILIKE '%dramatic%' THEN 'dramatic'
        WHEN prompt ILIKE '%soft%' OR prompt ILIKE '%gentle%' THEN 'soft'
        WHEN prompt ILIKE '%bold%' OR prompt ILIKE '%strong%' THEN 'bold'
        WHEN prompt ILIKE '%elegant%' OR prompt ILIKE '%sophisticated%' THEN 'elegant'
        
        ELSE preset_key
    END
WHERE (preset_key IS NULL OR preset_key = 'unknown' OR preset_key = '')
   AND prompt IS NOT NULL;

-- Check results after step 2
SELECT 'After Step 2 (Real Preset IDs)' as step, COUNT(*) as updated_records
FROM media_assets 
WHERE preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '';

-- ========================================
-- STEP 3: Update based on existing preset_id field
-- ========================================
-- If preset_id exists, use it directly
UPDATE media_assets 
SET 
    preset_key = preset_id
WHERE (preset_key IS NULL OR preset_key = 'unknown' OR preset_key = '')
   AND preset_id IS NOT NULL;

-- Check results after step 3
SELECT 'After Step 3 (preset_id field)' as step, COUNT(*) as updated_records
FROM media_assets 
WHERE preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '';

-- ========================================
-- STEP 4: Update based on meta JSON preset data
-- ========================================
-- Extract preset information from meta JSON
UPDATE media_assets 
SET 
    preset_key = COALESCE(
        meta->>'presetId',
        meta->>'presetKey',
        preset_key
    )
WHERE (preset_key IS NULL OR preset_key = 'unknown' OR preset_key = '')
   AND meta IS NOT NULL
   AND (meta->>'presetId' IS NOT NULL OR meta->>'presetKey' IS NOT NULL);

-- Check results after step 4
SELECT 'After Step 4 (meta JSON)' as step, COUNT(*) as updated_records
FROM media_assets 
WHERE preset_key IS NOT NULL AND preset_key != 'unknown' AND preset_key != '';

-- ========================================
-- STEP 5: Final fallback for remaining records
-- ========================================
-- Set any remaining corrupted records to custom
UPDATE media_assets 
SET 
    preset_key = 'custom'
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

-- Show sample of fixed records with real preset IDs
SELECT 
    id,
    prompt,
    mode,
    preset_id,
    preset_key,
    created_at
FROM media_assets 
ORDER BY created_at DESC
LIMIT 15;
