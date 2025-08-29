-- Database Structure Check Script
-- Run this to see what actually exists in your database

-- 1. Check if tables exist
SELECT '=== TABLE EXISTENCE CHECK ===' as info;

SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users',
    'user_settings', 
    'user_credits',
    'auth_otps',
    'credits_ledger',
    'neo_glitch_media',
    'presets_media',
    'custom_prompt_media',
    'emotion_mask_media',
    'ghibli_reaction_media',
    'story',
    'story_photo',
    'video_jobs',
    'ai_generations'
)
ORDER BY table_name;

-- 2. Check table columns for key tables
SELECT '=== USERS TABLE COLUMNS ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT '=== USER_CREDITS TABLE COLUMNS ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
ORDER BY ordinal_position;

SELECT '=== NEO_GLITCH_MEDIA TABLE COLUMNS ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'neo_glitch_media' 
ORDER BY ordinal_position;

SELECT '=== USER_SETTINGS TABLE COLUMNS ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;

-- 3. Check for any constraints that might be causing issues
SELECT '=== FOREIGN KEY CONSTRAINTS ===' as info;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4. Check for any NOT NULL constraints that might be failing
SELECT '=== NOT NULL COLUMNS ===' as info;
SELECT 
    table_name, 
    column_name, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND is_nullable = 'NO'
ORDER BY table_name, column_name;

-- 5. Sample data check
SELECT '=== SAMPLE DATA CHECK ===' as info;
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'user_settings', COUNT(*) FROM user_settings
UNION ALL
SELECT 'user_credits', COUNT(*) FROM user_credits
UNION ALL
SELECT 'neo_glitch_media', COUNT(*) FROM neo_glitch_media;
