-- Add Missing Columns to Assets Table
-- This script adds the columns that the views need
-- Date: 2025-08-19

-- Step 1: Add missing columns to assets table
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS final_url TEXT,
ADD COLUMN IF NOT EXISTS source_asset_id UUID REFERENCES assets(id),
ADD COLUMN IF NOT EXISTS preset_key TEXT,
ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Step 2: Update existing records to have default values
UPDATE assets 
SET 
    final_url = CASE 
        WHEN cloudinary_public_id ~~ 'stefna/%'::text THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/'::text || cloudinary_public_id)
        WHEN cloudinary_public_id IS NOT NULL AND cloudinary_public_id !~ '^stefna/' THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/stefna/'::text || cloudinary_public_id)
        ELSE NULL::text 
    END,
    preset_key = 'default'::text,
    prompt = 'Generated image'::text
WHERE final_url IS NULL OR preset_key IS NULL OR prompt IS NULL;

-- Step 3: Verify the new structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'assets' 
ORDER BY ordinal_position;

-- Step 4: Show sample data
SELECT 
    id,
    user_id,
    cloudinary_public_id,
    media_type,
    status,
    is_public,
    allow_remix,
    final_url,
    source_asset_id,
    preset_key,
    prompt,
    created_at
FROM assets 
LIMIT 5;
