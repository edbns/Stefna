-- Fix remaining custom_prompt values that should have specific preset IDs
-- This targets the few records that the main migration missed

-- ========================================
-- STEP 1: Check what we're fixing
-- ========================================
SELECT 
    'Records to Fix' as info,
    COUNT(*) as total_custom_prompt
FROM media_assets 
WHERE preset_key = 'custom_prompt';

-- Show the records we're about to fix
SELECT 
    id,
    LEFT(prompt, 100) as prompt_preview,
    mode,
    preset_key,
    created_at
FROM media_assets 
WHERE preset_key = 'custom_prompt'
ORDER BY created_at DESC;

-- ========================================
-- STEP 2: Fix specific records based on prompt content
-- ========================================
-- Fix retro/vintage records
UPDATE media_assets 
SET preset_key = 'vintage'
WHERE preset_key = 'custom_prompt'
  AND (prompt ILIKE '%retro%' OR prompt ILIKE '%35mm%' OR prompt ILIKE '%vintage%' OR prompt ILIKE '%faded tones%');

-- Fix cinematic records
UPDATE media_assets 
SET preset_key = 'cinematic'
WHERE preset_key = 'custom_prompt'
  AND prompt ILIKE '%cinematic%';

-- Fix ghibli style records
UPDATE media_assets 
SET preset_key = 'ghibli_dreamy'
WHERE preset_key = 'custom_prompt'
  AND prompt ILIKE '%ghibli style%';

-- Fix landscape/nature records
UPDATE media_assets 
SET preset_key = 'landscape'
WHERE preset_key = 'custom_prompt'
  AND (prompt ILIKE '%landscape%' OR prompt ILIKE '%nature%' OR prompt ILIKE '%hdr%');

-- Fix portrait records
UPDATE media_assets 
SET preset_key = 'portrait'
WHERE preset_key = 'custom_prompt'
  AND (prompt ILIKE '%portrait%' OR prompt ILIKE '%close-up%' OR prompt ILIKE '%professional photography%');

-- ========================================
-- STEP 3: Verify the fixes
-- ========================================
-- Show final results
SELECT 
    'Final Results' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN preset_key = 'custom_prompt' THEN 1 END) as remaining_custom_prompt,
    COUNT(CASE WHEN preset_key != 'custom_prompt' AND preset_key IS NOT NULL THEN 1 END) as good_records
FROM media_assets;

-- Show sample of all records with their new preset_key values
SELECT 
    id,
    LEFT(prompt, 80) as prompt_preview,
    mode,
    preset_key,
    created_at
FROM media_assets 
ORDER BY created_at DESC
LIMIT 20;
