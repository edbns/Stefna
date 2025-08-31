-- Check for any other potential feed visibility controls
-- Look for columns that might control public/private visibility

-- 1. Check for isPublic columns in any table
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name ILIKE '%public%' 
   OR column_name ILIKE '%private%'
   OR column_name ILIKE '%visible%'
   OR column_name ILIKE '%share%'
   OR column_name ILIKE '%feed%'
ORDER BY table_name, column_name;

-- 2. Check for any views that might control feed visibility
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name ILIKE '%feed%'
   OR table_name ILIKE '%public%'
   OR table_name ILIKE '%media%'
ORDER BY table_name;

-- 3. Check if there are any triggers or functions that might affect visibility
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name ILIKE '%feed%'
   OR routine_name ILIKE '%public%'
   OR routine_name ILIKE '%share%'
   OR routine_name ILIKE '%visibility%'
ORDER BY routine_name;

-- 4. Check if there are any foreign key relationships that might affect feed visibility
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name ILIKE '%media%' OR ccu.table_name ILIKE '%user%')
ORDER BY tc.table_name, kcu.column_name;

-- 5. Check if there are any RLS (Row Level Security) policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename ILIKE '%media%'
   OR tablename ILIKE '%user%'
   OR tablename ILIKE '%feed%'
ORDER BY tablename, policyname;
