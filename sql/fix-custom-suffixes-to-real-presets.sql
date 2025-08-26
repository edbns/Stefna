-- Fix preset data: Replace generic _custom suffixes with REAL preset IDs
-- This will make the frontend display proper preset names like "Joy + Sadness", "Tears", etc.

-- ========================================
-- STEP 1: Check current state
-- ========================================
SELECT 
    'Current Status' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN preset_key LIKE '%_custom' THEN 1 END) as custom_suffix_records,
    COUNT(CASE WHEN preset_key NOT LIKE '%_custom' AND preset_key IS NOT NULL THEN 1 END) as good_records
FROM media_assets;

-- ========================================
-- STEP 2: Map _custom suffixes to REAL preset IDs based on prompt content
-- ========================================
UPDATE media_assets 
SET 
    preset_key = CASE 
        -- Emotion Mask presets based on prompt content
        WHEN prompt ILIKE '%nostalgic%' OR prompt ILIKE '%nostalgia%' OR prompt ILIKE '%reflective%' OR prompt ILIKE '%faded warm backlight%' THEN 'nostalgia_distance'
        WHEN prompt ILIKE '%inner strength%' OR prompt ILIKE '%vulnerability%' OR prompt ILIKE '%emotional tension%' THEN 'strength_vulnerability'
        WHEN prompt ILIKE '%bittersweet%' OR prompt ILIKE '%smiling with teary eyes%' THEN 'joy_sadness'
        WHEN prompt ILIKE '%peace%' OR prompt ILIKE '%fear%' OR prompt ILIKE '%calm%' THEN 'peace_fear'
        
        -- Ghibli presets based on prompt content
        WHEN prompt ILIKE '%shocked%' OR prompt ILIKE '%widened anime-style eyes%' OR prompt ILIKE '%parted lips%' THEN 'ghibli_shock'
        WHEN prompt ILIKE '%tears%' OR prompt ILIKE '%glistening%' OR prompt ILIKE '%emotional intensity%' THEN 'ghibli_tears'
        WHEN prompt ILIKE '%sparkles%' OR prompt ILIKE '%whimsical%' OR prompt ILIKE '%soft blush%' THEN 'ghibli_sparkle'
        WHEN prompt ILIKE '%dreamy%' OR prompt ILIKE '%soft and dreamy%' THEN 'ghibli_dreamy'
        WHEN prompt ILIKE '%magical%' OR prompt ILIKE '%enchanting%' THEN 'ghibli_magical'
        
        -- Professional presets based on prompt content
        WHEN prompt ILIKE '%cinematic%' OR prompt ILIKE '%cinematic color grading%' THEN 'cinematic'
        WHEN prompt ILIKE '%retro%' OR prompt ILIKE '%35mm%' OR prompt ILIKE '%vintage%' OR prompt ILIKE '%faded tones%' THEN 'vintage'
        WHEN prompt ILIKE '%portrait%' OR prompt ILIKE '%close-up%' THEN 'portrait'
        WHEN prompt ILIKE '%landscape%' OR prompt ILIKE '%nature%' THEN 'landscape'
        WHEN prompt ILIKE '%artistic%' OR prompt ILIKE '%creative%' THEN 'artistic'
        WHEN prompt ILIKE '%modern%' OR prompt ILIKE '%contemporary%' THEN 'modern'
        WHEN prompt ILIKE '%dramatic%' OR prompt ILIKE '%dramatic%' THEN 'dramatic'
        WHEN prompt ILIKE '%soft%' OR prompt ILIKE '%gentle%' THEN 'soft'
        WHEN prompt ILIKE '%bold%' OR prompt ILIKE '%strong%' THEN 'bold'
        WHEN prompt ILIKE '%elegant%' OR prompt ILIKE '%sophisticated%' THEN 'elegant'
        
        ELSE preset_key
    END
WHERE preset_key LIKE '%_custom'
   AND prompt IS NOT NULL;

-- Check results after step 2
SELECT 'After Step 2 (Real Preset IDs)' as step, COUNT(*) as updated_records
FROM media_assets 
WHERE preset_key NOT LIKE '%_custom' AND preset_key IS NOT NULL;

-- ========================================
-- STEP 3: Update based on existing preset_id field
-- ========================================
-- If preset_id exists and is not null, use it directly
UPDATE media_assets 
SET 
    preset_key = preset_id
WHERE preset_key LIKE '%_custom'
   AND preset_id IS NOT NULL
   AND preset_id != '';

-- Check results after step 3
SELECT 'After Step 3 (preset_id field)' as step, COUNT(*) as updated_records
FROM media_assets 
WHERE preset_key NOT LIKE '%_custom' AND preset_key IS NOT NULL;

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
WHERE preset_key LIKE '%_custom'
   AND meta IS NOT NULL
   AND (meta->>'presetId' IS NOT NULL OR meta->>'presetKey' IS NOT NULL);

-- Check results after step 4
SELECT 'After Step 4 (meta JSON)' as step, COUNT(*) as updated_records
FROM media_assets 
WHERE preset_key NOT LIKE '%_custom' AND preset_key IS NOT NULL;

-- ========================================
-- STEP 5: Final cleanup for any remaining _custom values
-- ========================================
-- Set any remaining _custom records to 'custom' (without underscore)
UPDATE media_assets 
SET 
    preset_key = 'custom'
WHERE preset_key LIKE '%_custom';

-- ========================================
-- STEP 6: Final verification
-- ========================================
-- Show final results
SELECT 
    'Final Results' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN preset_key LIKE '%_custom' THEN 1 END) as remaining_custom_suffix,
    COUNT(CASE WHEN preset_key NOT LIKE '%_custom' AND preset_key IS NOT NULL THEN 1 END) as good_records
FROM media_assets;

-- Show sample of updated records
SELECT 
    id,
    LEFT(prompt, 100) as prompt_preview,
    mode,
    preset_key,
    created_at
FROM media_assets 
ORDER BY created_at DESC
LIMIT 15;
