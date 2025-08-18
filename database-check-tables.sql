-- Check what tables exist in the database
-- This will help us understand the current database structure

-- List all tables in public schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if old tables exist
SELECT 
  'app_media' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'app_media'
  ) as exists
UNION ALL
SELECT 
  'app_users' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'app_users'
  ) as exists
UNION ALL
SELECT 
  'assets' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'assets'
  ) as exists;

-- Check assets table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'assets' 
AND table_schema = 'public'
ORDER BY ordinal_position;
