-- Detailed Production Database Schema Check
-- This will show us exactly what columns exist vs what Prisma expects

-- Check media_assets table structure (the one causing the error)
SELECT 'media_assets table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'media_assets'
ORDER BY ordinal_position;

-- Check users table structure
SELECT 'users table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Check user_settings table structure
SELECT 'user_settings table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_settings'
ORDER BY ordinal_position;

-- Check user_credits table structure
SELECT 'user_credits table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_credits'
ORDER BY ordinal_position;

-- Check notifications table structure
SELECT 'notifications table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Check if there are any tables with camelCase columns
SELECT 'Tables with potential camelCase columns:' as info;
SELECT table_name, column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND (column_name LIKE '%[A-Z]%' OR column_name LIKE '%[a-z][A-Z]%')
ORDER BY table_name, column_name;

-- Check foreign key relationships
SELECT 'Foreign key relationships:' as info;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
