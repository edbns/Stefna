-- Check current state of preset data in media_assets table
-- This will help us understand what data we have available to reconstruct preset information

SELECT 
    id,
    prompt,
    mode,
    preset_id,
    preset_key,
    meta,
    tags,
    created_at,
    -- Extract useful info from meta JSON
    meta->>'mode' as meta_mode,
    meta->>'presetId' as meta_preset_id,
    meta->>'presetKey' as meta_preset_key,
    meta->>'presetType' as meta_preset_type,
    meta->>'generationType' as meta_generation_type
FROM media_assets 
WHERE preset_key IS NULL 
   OR preset_key = 'unknown'
   OR preset_key = ''
ORDER BY created_at DESC
LIMIT 20;
