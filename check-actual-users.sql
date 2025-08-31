-- Check actual user count vs user_settings records
SELECT 
    'users' as table_name,
    COUNT(*) as total_users
FROM users
UNION ALL
SELECT 
    'user_settings' as table_name,
    COUNT(*) as total_settings
FROM user_settings
UNION ALL
SELECT 
    'unique_user_settings' as table_name,
    COUNT(DISTINCT user_id) as unique_users
FROM user_settings;

-- Check for any orphaned or duplicate user_settings
SELECT 
    'orphaned_settings' as issue,
    COUNT(*) as count
FROM user_settings us
LEFT JOIN users u ON us.user_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'duplicate_settings' as issue,
    COUNT(*) - COUNT(DISTINCT user_id) as count
FROM user_settings;

-- Show sample of user_settings to understand the data
SELECT 
    user_id,
    share_to_feed,
    media_upload_agreed,
    created_at,
    updated_at
FROM user_settings
ORDER BY created_at DESC
LIMIT 10;
