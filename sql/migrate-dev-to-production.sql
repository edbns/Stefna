-- Development to Production Data Migration Script
-- This script copies essential data from development to production

-- WARNING: This will overwrite production data!
-- Only run this if you're okay with losing current production data

-- 1. Clear existing production data (optional - comment out if you want to keep)
-- DELETE FROM "public"."notifications";
-- DELETE FROM "public"."user_settings";
-- DELETE FROM "public"."user_credits";
-- DELETE FROM "public"."users";

-- 2. Copy users from development (replace with your dev database URL)
-- You'll need to run this from your development environment
-- or manually copy the data

-- Example structure for manual data entry:
INSERT INTO "public"."users" ("id", "email", "name", "tier", "avatar_url", "created_at", "updated_at") 
VALUES 
    ('dev-user-001', 'dev@stefna.com', 'Development User', 'registered', NULL, NOW(), NOW()),
    ('dev-user-002', 'test@stefna.com', 'Test User', 'registered', NULL, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    tier = EXCLUDED.tier,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

-- 3. Copy user settings
INSERT INTO "public"."user_settings" ("id", "user_id", "share_to_feed", "allow_remix", "updated_at")
VALUES 
    ('dev-settings-001', 'dev-user-001', true, true, NOW()),
    ('dev-settings-002', 'dev-user-002', true, true, NOW())
ON CONFLICT ("user_id") DO UPDATE SET
    share_to_feed = EXCLUDED.share_to_feed,
    allow_remix = EXCLUDED.allow_remix,
    updated_at = NOW();

-- 4. Copy user credits
INSERT INTO "public"."user_credits" ("user_id", "balance", "updated_at")
VALUES 
    ('dev-user-001', 50, NOW()),
    ('dev-user-002', 30, NOW())
ON CONFLICT ("user_id") DO UPDATE SET
    balance = EXCLUDED.balance,
    updated_at = NOW();

-- 5. Copy notifications
INSERT INTO "public"."notifications" ("id", "user_id", "type", "title", "message", "read", "created_at")
VALUES 
    ('dev-notif-001', 'dev-user-001', 'welcome', 'Welcome to Stefna Dev!', 'Your development account is ready.', false, NOW()),
    ('dev-notif-002', 'dev-user-002', 'welcome', 'Welcome to Stefna Dev!', 'Your test account is ready.', false, NOW())
ON CONFLICT ("id") DO NOTHING;

-- 6. Ensure app_config has necessary values
INSERT INTO "public"."app_config" ("key", "value")
VALUES 
    ('daily_cap', '50'),
    ('starter_grant', '30'),
    ('referral_referrer_bonus', '50'),
    ('referral_new_bonus', '25')
ON CONFLICT ("key") DO NOTHING;

-- 7. Verify the migration
SELECT 'Migration Results:' as info;
SELECT 'Users:' as table_name, COUNT(*) as count FROM "public"."users"
UNION ALL
SELECT 'User Settings:', COUNT(*) FROM "public"."user_settings"
UNION ALL
SELECT 'User Credits:', COUNT(*) FROM "public"."user_credits"
UNION ALL
SELECT 'Notifications:', COUNT(*) FROM "public"."notifications"
UNION ALL
SELECT 'App Config:', COUNT(*) FROM "public"."app_config"
UNION ALL
SELECT 'Extensions:', COUNT(*) FROM "public"."_extensions";

-- Show sample data
SELECT 'Sample Users:' as info;
SELECT id, email, name, tier, created_at FROM "public"."users" LIMIT 5;

SELECT 'Sample User Settings:';
SELECT user_id, share_to_feed, allow_remix FROM "public"."user_settings" LIMIT 5;

SELECT 'Sample App Config:';
SELECT key, value FROM "public"."app_config" LIMIT 10;
