-- Check Development Database Schema
-- Run this on your DEVELOPMENT database to see the actual column names

-- Check what columns exist in each table
SELECT '=== DEVELOPMENT DATABASE SCHEMA CHECK ===' as info;

-- Users table columns
SELECT 'Users Table Columns:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Media assets table columns
SELECT 'Media Assets Table Columns:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'media_assets' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Neo Glitch media table columns
SELECT 'Neo Glitch Media Table Columns:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'neo_glitch_media' AND table_schema = 'public'
ORDER BY ordinal_position;

-- User settings table columns
SELECT 'User Settings Table Columns:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_settings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- User credits table columns
SELECT 'User Credits Table Columns:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_credits' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Notifications table columns
SELECT 'Notifications Table Columns:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' AND table_schema = 'public'
ORDER BY ordinal_position;

-- App config table columns
SELECT 'App Config Table Columns:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'app_config' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Extensions table columns
SELECT 'Extensions Table Columns:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = '_extensions' AND table_schema = 'public'
ORDER BY ordinal_position;
