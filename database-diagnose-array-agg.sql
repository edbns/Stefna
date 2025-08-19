-- Diagnose array_agg Error
-- This script will find exactly what's causing the array_agg error
-- Date: 2025-08-19

-- Step 1: Find all objects that contain 'array_agg'
SELECT 'VIEW' as object_type, schemaname as schema_name, viewname as object_name, definition as object_definition
FROM pg_views 
WHERE definition LIKE '%array_agg%'
UNION ALL
SELECT 'FUNCTION' as object_type, n.nspname as schema_name, p.proname as object_name, pg_get_functiondef(p.oid) as object_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%array_agg%'
UNION ALL
SELECT 'MATERIALIZED VIEW' as object_type, schemaname as schema_name, matviewname as object_name, definition as object_definition
FROM pg_matviews 
WHERE definition LIKE '%array_agg%';

-- Step 2: Find all objects that contain 'tier' (still might be causing issues)
SELECT 'VIEW' as object_type, schemaname as schema_name, viewname as object_name, definition as object_definition
FROM pg_views 
WHERE definition LIKE '%tier%'
UNION ALL
SELECT 'FUNCTION' as object_type, n.nspname as schema_name, p.proname as object_name, pg_get_functiondef(p.oid) as object_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%tier%'
UNION ALL
SELECT 'MATERIALIZED VIEW' as object_type, schemaname as schema_name, matviewname as object_name, definition as object_definition
FROM pg_matviews 
WHERE definition LIKE '%tier%';

-- Step 3: Check for any remaining problematic views
SELECT 'REMAINING VIEWS' as info, schemaname, viewname
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Step 4: Check for any remaining functions
SELECT 'REMAINING FUNCTIONS' as info, n.nspname as schema_name, p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- Step 5: Check current users table structure
SELECT 'USERS TABLE STRUCTURE' as info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
