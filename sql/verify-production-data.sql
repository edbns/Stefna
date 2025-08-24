-- Production Data Verification Script
-- Run this to check if the seeding was successful

-- Check all tables for data
SELECT 'Users' as table_name, COUNT(*) as row_count FROM "public"."users"
UNION ALL
SELECT 'User Settings', COUNT(*) FROM "public"."user_settings"
UNION ALL
SELECT 'User Credits', COUNT(*) FROM "public"."user_credits"
UNION ALL
SELECT 'Notifications', COUNT(*) FROM "public"."notifications"
UNION ALL
SELECT 'App Config', COUNT(*) FROM "public"."app_config"
UNION ALL
SELECT 'Extensions', COUNT(*) FROM "public"."_extensions"
UNION ALL
SELECT 'Media Assets', COUNT(*) FROM "public"."media_assets"
UNION ALL
SELECT 'Credit Transactions', COUNT(*) FROM "public"."credits_ledger"
UNION ALL
SELECT 'Neo Glitch Media', COUNT(*) FROM "public"."neo_glitch_media"
UNION ALL
SELECT 'Auth OTPs', COUNT(*) FROM "public"."auth_otps"
UNION ALL
SELECT 'Referral Signups', COUNT(*) FROM "public"."referral_signups";

-- Show sample data from key tables
SELECT 'Sample Users:' as info;
SELECT id, email, name, created_at FROM "public"."users" LIMIT 5;

SELECT 'Sample User Settings:';
SELECT user_id, share_to_feed, allow_remix FROM "public"."user_settings" LIMIT 5;

SELECT 'Sample App Config:';
SELECT key, value FROM "public"."app_config" LIMIT 10;
