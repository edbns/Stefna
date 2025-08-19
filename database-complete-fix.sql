-- Complete Database Fix Script
-- This script fixes the assets table and creates all working views
-- Date: 2025-08-19

-- Step 1: Add missing columns to assets table
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS final_url TEXT,
ADD COLUMN IF NOT EXISTS source_asset_id UUID REFERENCES assets(id),
ADD COLUMN IF NOT EXISTS preset_key TEXT,
ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Step 2: Update existing records with default values
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

-- Step 3: Create app_media view
CREATE OR REPLACE VIEW app_media AS
SELECT 
    id,
    user_id AS owner_id,
    COALESCE(final_url, 
        CASE 
            WHEN cloudinary_public_id ~~ 'stefna/%'::text THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/'::text || cloudinary_public_id)
            WHEN cloudinary_public_id IS NOT NULL AND cloudinary_public_id !~ '^stefna/' THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/stefna/'::text || cloudinary_public_id)
            ELSE NULL::text 
        END
    ) AS url,
    cloudinary_public_id AS public_id,
    media_type AS resource_type,
    prompt,
    is_public AS visibility,
    allow_remix,
    created_at,
    updated_at
FROM assets;

-- Step 4: Create public_feed_working view
CREATE OR REPLACE VIEW public_feed_working AS
SELECT 
    id, 
    user_id, 
    cloudinary_public_id, 
    media_type, 
    status, 
    is_public, 
    allow_remix, 
    created_at AS published_at, 
    source_asset_id, 
    preset_key, 
    prompt, 
    created_at, 
    COALESCE(final_url, 
        CASE 
            WHEN cloudinary_public_id ~~ 'stefna/%'::text THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/'::text || cloudinary_public_id)
            WHEN cloudinary_public_id IS NOT NULL AND cloudinary_public_id !~ '^stefna/' THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/stefna/'::text || cloudinary_public_id)
            ELSE NULL::text 
        END
    ) AS url 
FROM assets a 
WHERE ((is_public = true) AND (status = 'ready'::text) AND ((final_url IS NOT NULL) OR (cloudinary_public_id ~~ 'stefna/%'::text))) 
ORDER BY created_at DESC;

-- Step 5: Create public_feed view
CREATE OR REPLACE VIEW public_feed AS
SELECT 
    pf.id,
    pf.user_id,
    pf.url,
    pf.cloudinary_public_id,
    pf.media_type AS resource_type,
    pf.prompt,
    pf.published_at,
    pf.is_public AS visibility,
    pf.allow_remix
FROM public_feed_working pf;

-- Step 6: Create public_feed_v2 view
CREATE OR REPLACE VIEW public_feed_v2 AS
SELECT 
    pf.id,
    pf.user_id,
    pf.url,
    pf.cloudinary_public_id,
    pf.media_type AS resource_type,
    pf.prompt,
    pf.published_at,
    pf.is_public AS visibility,
    pf.allow_remix
FROM public_feed_working pf;

-- Step 7: Create app_users view
CREATE OR REPLACE VIEW app_users AS
SELECT 
    id, 
    email, 
    external_id, 
    created_at, 
    updated_at
FROM users;

-- Step 8: Verify all views work
SELECT 'app_users' as view_name, COUNT(*) as row_count FROM app_users
UNION ALL
SELECT 'public_feed_working' as view_name, COUNT(*) as row_count FROM public_feed_working
UNION ALL
SELECT 'public_feed' as view_name, COUNT(*) as row_count FROM public_feed
UNION ALL
SELECT 'public_feed_v2' as view_name, COUNT(*) as row_count FROM public_feed_v2
UNION ALL
SELECT 'app_media' as view_name, COUNT(*) as row_count FROM app_media;

-- Step 9: Show final assets table structure
SELECT 'FINAL ASSETS TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'assets' 
ORDER BY ordinal_position;
