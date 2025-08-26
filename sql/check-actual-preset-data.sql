-- Check what preset information is actually available in your existing data
-- This will help us understand how to properly map the presets

-- Check what preset_id values exist
SELECT 
    'Preset ID Analysis' as info,
    preset_id,
    COUNT(*) as count
FROM media_assets 
WHERE preset_id IS NOT NULL
GROUP BY preset_id
ORDER BY count DESC;

-- Check what's in the meta JSON for preset information
SELECT 
    'Meta JSON Preset Info' as info,
    meta->>'presetId' as meta_preset_id,
    meta->>'presetKey' as meta_preset_key,
    meta->>'mode' as meta_mode,
    meta->>'generationType' as meta_generation_type,
    COUNT(*) as count
FROM media_assets 
WHERE meta IS NOT NULL
GROUP BY meta->>'presetId', meta->>'presetKey', meta->>'mode', meta->>'generationType'
ORDER BY count DESC;

-- Check sample records with their actual preset data
SELECT 
    'Sample Records with Preset Data' as info,
    id,
    prompt,
    mode,
    preset_id,
    preset_key,
    meta->>'presetId' as meta_preset_id,
    meta->>'presetKey' as meta_preset_key,
    meta->>'mode' as meta_mode,
    meta->>'generationType' as meta_generation_type,
    created_at
FROM media_assets 
WHERE preset_id IS NOT NULL 
   OR meta->>'presetId' IS NOT NULL
   OR meta->>'presetKey' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
