-- Comprehensive Production Database Data Status Check
-- This will show us exactly what data exists vs what's missing

-- Check all tables for data counts
SELECT '=== PRODUCTION DATABASE DATA STATUS ===' as info;

-- Check what tables exist first
SELECT 'Available Tables:' as section;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check specific critical tables
SELECT '=== CRITICAL TABLES DATA CHECK ===' as info;

-- Users table
SELECT 'Users Table:' as table_name;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as users_with_emails FROM users WHERE email IS NOT NULL;
SELECT COUNT(*) as users_with_names FROM users WHERE name IS NOT NULL;

-- Media tables
SELECT 'Media Assets Table:' as table_name;
SELECT COUNT(*) as total_media FROM media_assets;
SELECT COUNT(*) as public_media FROM media_assets WHERE visibility = 'public';
SELECT COUNT(*) as private_media FROM media_assets WHERE visibility = 'private';

-- Neo Glitch Media
SELECT 'Neo Glitch Media Table:' as table_name;
SELECT COUNT(*) as total_neo_glitch FROM neo_glitch_media;
SELECT COUNT(*) as completed_neo_glitch FROM neo_glitch_media WHERE status = 'completed';

-- User Settings
SELECT 'User Settings Table:' as table_name;
SELECT COUNT(*) as total_settings FROM user_settings;

-- User Credits
SELECT 'User Credits Table:' as table_name;
SELECT COUNT(*) as total_credits FROM user_credits;
SELECT COUNT(*) as users_with_credits FROM user_credits WHERE balance > 0;

-- Notifications
SELECT 'Notifications Table:' as table_name;
SELECT COUNT(*) as total_notifications FROM notifications;

-- App Config
SELECT 'App Config Table:' as table_name;
SELECT COUNT(*) as total_config FROM app_config;
SELECT key, value FROM app_config LIMIT 10;

-- Extensions
SELECT 'Extensions Table:' as table_name;
SELECT COUNT(*) as total_extensions FROM _extensions;
SELECT name, enabled FROM _extensions;

-- Check for any data at all
SELECT '=== OVERALL STATUS ===' as info;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM users) > 0 THEN '✅ Users exist'
        ELSE '❌ No users'
    END as users_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM media_assets) > 0 THEN '✅ Media exists'
        ELSE '❌ No media'
    END as media_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM neo_glitch_media) > 0 THEN '✅ Neo Glitch exists'
        ELSE '❌ No Neo Glitch'
    END as neo_glitch_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM user_credits) > 0 THEN '✅ Credits exist'
        ELSE '❌ No credits'
    END as credits_status;

-- Show sample data if it exists
SELECT '=== SAMPLE DATA (if any exists) ===' as info;

-- Sample users
SELECT 'Sample Users:' as data_type;
SELECT id, email, name, tier, created_at FROM users LIMIT 3;

-- Sample media
SELECT 'Sample Media Assets:' as data_type;
SELECT id, user_id, url, visibility, created_at FROM media_assets LIMIT 3;

-- Sample Neo Glitch
SELECT 'Sample Neo Glitch:' as data_type;
SELECT id, user_id, prompt, status, created_at FROM neo_glitch_media LIMIT 3;
