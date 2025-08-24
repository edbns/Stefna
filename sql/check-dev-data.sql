-- Check Development Database Data
-- Run this on your DEVELOPMENT database to see what real data exists

-- Check what tables have data
SELECT '=== DEVELOPMENT DATABASE DATA CHECK ===' as info;

-- Users table
SELECT 'Users Table:' as table_name;
SELECT COUNT(*) as total_users FROM users;
SELECT id, email, external_id, name, created_at FROM users LIMIT 10;

-- Media assets table
SELECT 'Media Assets Table:' as table_name;
SELECT COUNT(*) as total_media FROM media_assets;
SELECT COUNT(*) as public_media FROM media_assets WHERE visibility = 'public';
SELECT COUNT(*) as private_media FROM media_assets WHERE visibility = 'private';
SELECT id, owner_id, prompt, visibility, created_at FROM media_assets LIMIT 10;

-- Neo Glitch media
SELECT 'Neo Glitch Media Table:' as table_name;
SELECT COUNT(*) as total_neo_glitch FROM neo_glitch_media;
SELECT COUNT(*) as completed_neo_glitch FROM neo_glitch_media WHERE status = 'completed';
SELECT id, user_id, prompt, status, created_at FROM neo_glitch_media LIMIT 10;

-- User settings
SELECT 'User Settings Table:' as table_name;
SELECT COUNT(*) as total_settings FROM user_settings;
SELECT user_id, share_to_feed, allow_remix FROM user_settings LIMIT 10;

-- User credits
SELECT 'User Credits Table:' as table_name;
SELECT COUNT(*) as total_credits FROM user_credits;
SELECT user_id, balance FROM user_credits LIMIT 10;

-- Notifications
SELECT 'Notifications Table:' as table_name;
SELECT COUNT(*) as total_notifications FROM notifications;
SELECT user_id, type, title, created_at FROM notifications LIMIT 10;

-- App config
SELECT 'App Config Table:' as table_name;
SELECT COUNT(*) as total_config FROM app_config;
SELECT key, value FROM app_config;

-- Extensions
SELECT 'Extensions Table:' as table_name;
SELECT COUNT(*) as total_extensions FROM _extensions;
SELECT name, enabled FROM _extensions;

-- Summary
SELECT '=== SUMMARY ===' as info;
SELECT 
    'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Media Assets', COUNT(*) FROM media_assets
UNION ALL
SELECT 'Neo Glitch Media', COUNT(*) FROM neo_glitch_media
UNION ALL
SELECT 'User Settings', COUNT(*) FROM user_settings
UNION ALL
SELECT 'User Credits', COUNT(*) FROM user_credits
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'App Config', COUNT(*) FROM app_config
UNION ALL
SELECT 'Extensions', COUNT(*) FROM _extensions;
