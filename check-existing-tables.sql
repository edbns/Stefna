-- 🔍 Database Diagnostic Script for Stefna
-- Run this FIRST to see what tables already exist and what's missing

-- 1. Check what tables currently exist
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check table structures for key tables
-- Users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 3. Check if specific tables exist and their row counts
DO $$
DECLARE
    table_name text;
    row_count integer;
    missing_tables text[] := ARRAY[
        'users', 'auth_otps', 'user_credits', 'user_settings', 
        'credits_ledger', 'custom_prompt_media', 'emotion_mask_media',
        'ghibli_reaction_media', 'neo_glitch_media', 'presets_media',
        'notifications', 'assets', 'presets_config', 'referral_signups',
        'app_config', '_extensions', 'story', 'story_photo', 'video_jobs',
        'ai_generations', 'story_time_presets', 'media_assets'
    ];
    existing_tables text[] := '{}';
    missing_tables_found text[] := '{}';
BEGIN
    -- Check each table
    FOREACH table_name IN ARRAY missing_tables
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM information_schema.tables WHERE table_name = %L AND table_schema = %L', table_name, 'public') INTO row_count;
        
        IF row_count > 0 THEN
            existing_tables := existing_tables || table_name;
            EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
            RAISE NOTICE 'Table % exists with % rows', table_name, row_count;
        ELSE
            missing_tables_found := missing_tables_found || table_name;
            RAISE NOTICE 'Table % is MISSING', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '=== SUMMARY ===';
    RAISE NOTICE 'Existing tables: %', array_to_string(existing_tables, ', ');
    RAISE NOTICE 'Missing tables: %', array_to_string(missing_tables_found, ', ');
END $$;

-- 4. Check for any custom or unexpected tables
SELECT 
    table_name,
    'CUSTOM/UNEXPECTED' as type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name NOT IN (
        'users', 'auth_otps', 'user_credits', 'user_settings', 
        'credits_ledger', 'custom_prompt_media', 'emotion_mask_media',
        'ghibli_reaction_media', 'neo_glitch_media', 'presets_media',
        'notifications', 'assets', 'presets_config', 'referral_signups',
        'app_config', '_extensions', 'story', 'story_photo', 'video_jobs',
        'ai_generations', 'story_time_presets', 'media_assets',
        'missing_table', 'media_assets_backup'
    )
ORDER BY table_name;

-- 5. Check database extensions
SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension
ORDER BY extname;

-- 6. Check database size and connection info
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgres_version,
    pg_size_pretty(pg_database_size(current_database())) as database_size;
