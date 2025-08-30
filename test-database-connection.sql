-- Test Database Connection and Basic Operations
-- Run this to verify everything is working after the Prisma to SQL migration

-- 1. Test basic connection
SELECT 'Database connection successful' as status, NOW() as timestamp;

-- 2. Test table creation and basic operations
DO $$
BEGIN
    -- Test inserting a user
    INSERT INTO users (id, email, name, tier) 
    VALUES ('test-user-' || gen_random_uuid()::text, 'test@example.com', 'Test User', 'registered')
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'User insertion test passed';
    
    -- Test inserting user settings
    INSERT INTO user_settings (user_id, media_upload_agreed, share_to_feed)
    SELECT id, true, true FROM users WHERE email = 'test@example.com'
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'User settings insertion test passed';
    
    -- Test inserting user credits
    INSERT INTO user_credits (user_id, balance)
    SELECT id, 30 FROM users WHERE email = 'test@example.com'
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'User credits insertion test passed';
    
    -- Test inserting a test media record
    INSERT INTO presets_media (id, user_id, image_url, source_url, prompt, preset, run_id, status)
    SELECT 
        gen_random_uuid()::text,
        u.id,
        'https://example.com/test-image.jpg',
        'https://example.com/source.jpg',
        'Test prompt',
        'ghibli',
        'test-run-' || gen_random_uuid()::text,
        'completed'
    FROM users u WHERE u.email = 'test@example.com';
    
    RAISE NOTICE 'Media insertion test passed';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
        RAISE;
END $$;

-- 3. Test basic queries
SELECT 'Testing basic queries...' as status;

-- Test user query
SELECT id, email, name, tier, created_at 
FROM users 
WHERE email = 'test@example.com';

-- Test user settings query
SELECT us.*, u.email 
FROM user_settings us 
JOIN users u ON us.user_id = u.id 
WHERE u.email = 'test@example.com';

-- Test user credits query
SELECT uc.*, u.email 
FROM user_credits uc 
JOIN users u ON uc.user_id = u.id 
WHERE u.email = 'test@example.com';

-- Test media query
SELECT pm.*, u.email 
FROM presets_media pm 
JOIN users u ON pm.user_id = u.id 
WHERE u.email = 'test@example.com';

-- 4. Test table structure
SELECT 'Testing table structure...' as status;

-- Check if all required tables exist
SELECT table_name, 'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'user_settings', 'user_credits', 'auth_otps', 
    'credits_ledger', 'custom_prompt_media', 'emotion_mask_media',
    'ghibli_reaction_media', 'neo_glitch_media', 'presets_media',
    'story', 'story_photo', 'video_jobs', 'ai_generations',
    'notifications', 'assets', 'presets_config', 'referral_signups',
    'app_config', '_extensions'
)
ORDER BY table_name;

-- 5. Test triggers
SELECT 'Testing triggers...' as status;

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE 'update_%_updated_at'
ORDER BY trigger_name;

-- 6. Cleanup test data
SELECT 'Cleaning up test data...' as status;

DELETE FROM presets_media WHERE prompt = 'Test prompt';
DELETE FROM user_credits WHERE user_id IN (SELECT id FROM users WHERE email = 'test@example.com');
DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE email = 'test@example.com');
DELETE FROM users WHERE email = 'test@example.com';

SELECT 'Database migration test completed successfully!' as final_status;
