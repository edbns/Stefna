-- Safe View Creation Script
-- This script creates views using only columns that we know exist
-- Date: 2025-08-19

-- Step 1: First, let's check what columns actually exist in the assets table
-- Run this to see the current structure:
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'assets' 
ORDER BY ordinal_position;

-- Step 2: Create a minimal app_media view with only essential columns
CREATE OR REPLACE VIEW app_media AS
SELECT 
    id,
    user_id AS owner_id,
    cloudinary_public_id AS public_id,
    media_type AS resource_type,
    prompt,
    is_public AS visibility,
    allow_remix,
    created_at,
    updated_at,
    -- Construct URL safely
    COALESCE(final_url, 
        CASE 
            WHEN cloudinary_public_id ~~ 'stefna/%'::text THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/'::text || cloudinary_public_id)
            WHEN cloudinary_public_id IS NOT NULL AND cloudinary_public_id !~ '^stefna/' THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/stefna/'::text || cloudinary_public_id)
            ELSE NULL::text 
        END
    ) AS url
FROM assets;

-- Step 3: Create a minimal public_feed_working view
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
    -- Construct URL safely
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

-- Step 4: Create simplified public_feed view
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

-- Step 5: Create simplified public_feed_v2 view
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

-- Step 6: Create simplified app_users view
CREATE OR REPLACE VIEW app_users AS
SELECT 
    id, 
    email, 
    external_id, 
    created_at, 
    updated_at
FROM users;

-- Step 7: Verify all views work
SELECT 'app_users' as view_name, COUNT(*) as row_count FROM app_users
UNION ALL
SELECT 'public_feed_working' as view_name, COUNT(*) as row_count FROM public_feed_working
UNION ALL
SELECT 'public_feed' as view_name, COUNT(*) as row_count FROM public_feed
UNION ALL
SELECT 'public_feed_v2' as view_name, COUNT(*) as row_count FROM public_feed_v2
UNION ALL
SELECT 'app_media' as view_name, COUNT(*) as row_count FROM app_media;

-- Step 8: Show the final structure
SELECT 'FINAL VIEWS CREATED' as info;
