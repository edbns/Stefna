-- Complete Development to Production Data Migration
-- This script will populate your production database with real data

-- WARNING: This will overwrite production data!
-- Only run this if you're okay with losing current production data

-- Step 1: Clear existing production data (optional - comment out if you want to keep)
-- DELETE FROM "public"."notifications";
-- DELETE FROM "public"."user_settings";
-- DELETE FROM "public"."user_credits";
-- DELETE FROM "public"."neo_glitch_media";
-- DELETE FROM "public"."media_assets";
-- DELETE FROM "public"."users";

-- Step 2: Create real user accounts (replace with your actual dev data)
INSERT INTO "public"."users" ("id", "email", "name", "tier", "avatar_url", "created_at", "updated_at") 
VALUES 
    ('user-001', 'admin@stefna.com', 'Admin User', 'registered', NULL, NOW(), NOW()),
    ('user-002', 'test@stefna.com', 'Test User', 'registered', NULL, NOW(), NOW()),
    ('user-003', 'demo@stefna.com', 'Demo User', 'registered', NULL, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    tier = EXCLUDED.tier,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

-- Step 3: Create user settings
INSERT INTO "public"."user_settings" ("id", "user_id", "share_to_feed", "allow_remix", "updated_at")
VALUES 
    ('settings-001', 'user-001', true, true, NOW()),
    ('settings-002', 'user-002', true, true, NOW()),
    ('settings-003', 'user-003', true, true, NOW())
ON CONFLICT ("user_id") DO UPDATE SET
    share_to_feed = EXCLUDED.share_to_feed,
    allow_remix = EXCLUDED.allow_remix,
    updated_at = NOW();

-- Step 4: Create user credits
INSERT INTO "public"."user_credits" ("user_id", "balance", "updated_at")
VALUES 
    ('user-001', 100, NOW()),
    ('user-002', 50, NOW()),
    ('user-003', 75, NOW())
ON CONFLICT ("user_id") DO UPDATE SET
    balance = EXCLUDED.balance,
    updated_at = NOW();

-- Step 5: Create sample media assets (public feed content) - Using proper UUIDs
INSERT INTO "public"."media_assets" (
    "id", "user_id", "url", "resource_type", "visibility", "prompt", 
    "model", "mode", "env", "created_at", "updated_at", "status"
) VALUES 
    (
        gen_random_uuid(), 'user-001', 
        'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
        'image', 'public', 'A beautiful landscape with mountains',
        'stable-diffusion', 'landscape', 'production',
        NOW(), NOW(), 'ready'
    ),
    (
        gen_random_uuid(), 'user-002',
        'https://res.cloudinary.com/demo/image/upload/v1/sample2.jpg', 
        'image', 'public', 'Portrait of a person in artistic style',
        'stable-diffusion', 'portrait', 'production',
        NOW(), NOW(), 'ready'
    ),
    (
        gen_random_uuid(), 'user-003',
        'https://res.cloudinary.com/demo/image/upload/v1/sample3.jpg',
        'image', 'public', 'Abstract geometric patterns',
        'stable-diffusion', 'abstract', 'production', 
        NOW(), NOW(), 'ready'
    );

-- Step 6: Create sample Neo Glitch media - Using proper UUIDs
INSERT INTO "public"."neo_glitch_media" (
    "id", "user_id", "image_url", "source_url", "prompt", "preset", 
    "run_id", "status", "created_at"
) VALUES 
    (
        gen_random_uuid(), 'user-001',
        'https://res.cloudinary.com/demo/image/upload/v1/neo1.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/source1.jpg',
        'Cyberpunk city with neon lights', 'neo-tokyo-glitch',
        'run-001', 'completed', NOW()
    ),
    (
        gen_random_uuid(), 'user-002',
        'https://res.cloudinary.com/demo/image/upload/v1/neo2.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/source2.jpg',
        'Glitch art portrait', 'neo-tokyo-glitch',
        'run-002', 'completed', NOW()
    );

-- Step 7: Create notifications - Using proper UUIDs
INSERT INTO "public"."notifications" ("id", "user_id", "type", "title", "message", "read", "created_at")
VALUES 
    (gen_random_uuid(), 'user-001', 'welcome', 'Welcome to Stefna!', 'Your account has been set up successfully.', false, NOW()),
    (gen_random_uuid(), 'user-002', 'welcome', 'Welcome to Stefna!', 'Your account has been set up successfully.', false, NOW()),
    (gen_random_uuid(), 'user-003', 'welcome', 'Welcome to Stefna!', 'Your account has been set up successfully.', false, NOW());

-- Step 8: Ensure app_config has necessary values
INSERT INTO "public"."app_config" ("key", "value")
VALUES 
    ('daily_cap', '50'),
    ('starter_grant', '30'),
    ('referral_referrer_bonus', '50'),
    ('referral_new_bonus', '25')
ON CONFLICT ("key") DO NOTHING;

-- Step 9: Verify the migration
SELECT '=== MIGRATION COMPLETE - VERIFICATION ===' as info;

SELECT 'Data Counts After Migration:' as section;
SELECT 'Users:' as table_name, COUNT(*) as count FROM "public"."users"
UNION ALL
SELECT 'User Settings:', COUNT(*) FROM "public"."user_settings"
UNION ALL
SELECT 'User Credits:', COUNT(*) FROM "public"."user_credits"
UNION ALL
SELECT 'Media Assets:', COUNT(*) FROM "public"."media_assets"
UNION ALL
SELECT 'Neo Glitch Media:', COUNT(*) FROM "public"."neo_glitch_media"
UNION ALL
SELECT 'Notifications:', COUNT(*) FROM "public"."notifications"
UNION ALL
SELECT 'App Config:', COUNT(*) FROM "public"."app_config"
UNION ALL
SELECT 'Extensions:', COUNT(*) FROM "public"."_extensions";

-- Show sample data
SELECT '=== SAMPLE DATA VERIFICATION ===' as info;

SELECT 'Sample Users:' as data_type;
SELECT id, email, name, tier, created_at FROM "public"."users" LIMIT 3;

SELECT 'Sample Public Media:' as data_type;
SELECT id, user_id, prompt, visibility, created_at FROM "public"."media_assets" WHERE visibility = 'public' LIMIT 3;

SELECT 'Sample Neo Glitch:' as data_type;
SELECT id, user_id, prompt, status, created_at FROM "public"."neo_glitch_media" LIMIT 3;

SELECT '=== MIGRATION STATUS ===' as info;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM users) > 0 THEN '✅ Users migrated'
        ELSE '❌ Users failed'
    END as users_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM media_assets WHERE visibility = 'public') > 0 THEN '✅ Public media migrated'
        ELSE '❌ Public media failed'
    END as media_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM neo_glitch_media WHERE status = 'completed') > 0 THEN '✅ Neo Glitch migrated'
        ELSE '❌ Neo Glitch failed'
    END as neo_glitch_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM user_credits WHERE balance > 0) > 0 THEN '✅ Credits migrated'
        ELSE '❌ Credits failed'
    END as credits_status;
