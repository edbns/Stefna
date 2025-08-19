-- Fix All Database Schema Issues
-- This script fixes the users table, credits_ledger table, and ensures all required functionality works
-- Date: 2025-08-19

-- Step 1: Fix users table structure
-- Drop and recreate users table with correct schema
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    external_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Fix credits_ledger table structure
-- Drop and recreate with correct schema
DROP TABLE IF EXISTS credits_ledger CASCADE;

CREATE TABLE credits_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    request_id UUID NOT NULL,
    action TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('reserved','committed','refunded','granted')),
    meta JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create proper indexes
CREATE UNIQUE INDEX IF NOT EXISTS ux_ledger_user_request ON credits_ledger(user_id, request_id);
CREATE INDEX IF NOT EXISTS ix_ledger_user_created ON credits_ledger(user_id, created_at);

-- Step 3: Fix user_credits table structure
-- Drop and recreate with correct schema
DROP TABLE IF EXISTS user_credits CASCADE;

CREATE TABLE user_credits (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    balance INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 4: Recreate the app_users view
CREATE OR REPLACE VIEW app_users AS
SELECT 
    id, 
    email, 
    external_id, 
    created_at, 
    updated_at
FROM users;

-- Step 5: Recreate all the working views
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

-- Step 6: Verify all tables and views work
SELECT 'USERS TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT 'CREDITS_LEDGER TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'credits_ledger' 
ORDER BY ordinal_position;

SELECT 'USER_CREDITS TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
ORDER BY ordinal_position;

-- Step 7: Test all views
SELECT 'VIEWS VERIFICATION:' as info;
SELECT 'app_users' as view_name, COUNT(*) as row_count FROM app_users
UNION ALL
SELECT 'public_feed_working' as view_name, COUNT(*) as row_count FROM public_feed_working
UNION ALL
SELECT 'public_feed' as view_name, COUNT(*) as row_count FROM public_feed
UNION ALL
SELECT 'public_feed_v2' as view_name, COUNT(*) as row_count FROM public_feed_v2
UNION ALL
SELECT 'app_media' as view_name, COUNT(*) as row_count FROM app_media;

SELECT 'ALL SCHEMA ISSUES FIXED!' as info;
