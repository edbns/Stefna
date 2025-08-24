-- Production Database Seeding Script (Updated for Actual Schema)
-- This script adds basic test data needed for the app to function

-- 1. Create a test user (matching actual production schema)
INSERT INTO "public"."users" ("id", "email", "name", "tier", "avatar_url", "created_at", "updated_at") 
VALUES (
    'test-user-001',
    'test@stefna.com',
    'Test User',
    'registered',
    NULL,
    NOW(),
    NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 2. Create user settings for the test user
INSERT INTO "public"."user_settings" ("id", "user_id", "share_to_feed", "allow_remix", "updated_at")
VALUES (
    'test-settings-001',
    'test-user-001',
    true,
    true,
    NOW()
) ON CONFLICT ("user_id") DO NOTHING;

-- 3. Create user credits for the test user
INSERT INTO "public"."user_credits" ("user_id", "balance", "updated_at")
VALUES (
    'test-user-001',
    30,
    NOW()
) ON CONFLICT ("user_id") DO NOTHING;

-- 4. Add daily_cap to app_config if it doesn't exist
INSERT INTO "public"."app_config" ("key", "value")
VALUES ('daily_cap', '30')
ON CONFLICT ("key") DO NOTHING;

-- 5. Create a test notification
INSERT INTO "public"."notifications" ("id", "user_id", "type", "title", "message", "read", "created_at")
VALUES (
    'test-notification-001',
    'test-user-001',
    'welcome',
    'Welcome to Stefna!',
    'Your account has been set up successfully.',
    false,
    NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 6. Skip extensions - they already exist in production
-- (This avoids the duplicate key constraint error)

-- Verify the data was created
SELECT 'Users created:' as info, COUNT(*) as count FROM "public"."users"
UNION ALL
SELECT 'User settings created:', COUNT(*) FROM "public"."user_settings"
UNION ALL
SELECT 'User credits created:', COUNT(*) FROM "public"."user_credits"
UNION ALL
SELECT 'Notifications created:', COUNT(*) FROM "public"."notifications"
UNION ALL
SELECT 'App config entries:', COUNT(*) FROM "public"."app_config"
UNION ALL
SELECT 'Extensions (existing):', COUNT(*) FROM "public"."_extensions";
