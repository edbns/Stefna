-- Check what columns actually exist in the media_assets table
-- This will help us understand the real schema

-- List all columns in media_assets table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'media_assets'
ORDER BY ordinal_position;

-- Check sample data structure
SELECT 
    id,
    prompt,
    mode,
    preset_id,
    preset_key,
    meta,
    tags,
    created_at
FROM media_assets 
LIMIT 3;
