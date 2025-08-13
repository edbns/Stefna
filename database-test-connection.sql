-- Simple test to verify database connection and basic functionality
-- Run this first to make sure everything is working

-- Test 1: Check if we can connect and see tables
SELECT 'Database connection successful' as test_result;

-- Test 2: List all tables in public schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Test 3: Check if assets table exists and what it looks like
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets' AND table_schema = 'public')
    THEN 'Assets table exists'
    ELSE 'Assets table does not exist'
  END as assets_table_status;

-- Test 4: If assets table exists, show its structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets' AND table_schema = 'public') THEN
    RAISE NOTICE 'Assets table columns:';
    FOR col IN 
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'assets' AND table_schema = 'public'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE '  %: % (%)', col.column_name, col.data_type, col.is_nullable;
    END LOOP;
  ELSE
    RAISE NOTICE 'Assets table does not exist yet';
  END IF;
END $$;

-- Test 5: Check if you have any existing media tables
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND (table_name LIKE '%media%' OR table_name LIKE '%asset%' OR table_name LIKE '%image%' OR table_name LIKE '%video%')
ORDER BY table_name;
