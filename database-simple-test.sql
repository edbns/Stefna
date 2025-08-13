-- Simple Database Test - No complex syntax, just basic SQL
-- Run this in Supabase SQL Editor to check your database state

-- Test 1: Basic connection test
SELECT 'Database connection successful' as test_result;

-- Test 2: List all tables in public schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Test 3: Check if assets table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets' AND table_schema = 'public')
    THEN 'Assets table exists'
    ELSE 'Assets table does not exist'
  END as assets_table_status;

-- Test 4: Show assets table structure (if it exists)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'assets' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 5: Check for media-related tables
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND (table_name LIKE '%media%' OR table_name LIKE '%asset%' OR table_name LIKE '%image%' OR table_name LIKE '%video%')
ORDER BY table_name;

-- Test 6: Check if you have any existing data
SELECT 
  'Total tables in public schema:' as info,
  count(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public';
