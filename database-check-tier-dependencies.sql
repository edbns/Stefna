-- Check what objects depend on the tier column
-- This will help us understand what needs to be updated before removing tier

-- Check for views that reference the tier column
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition LIKE '%tier%' 
   OR definition LIKE '%users.tier%';

-- Check for functions that reference the tier column
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%tier%';

-- Check for triggers that might reference tier
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%tier%';

-- Check for foreign key constraints
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (kcu.column_name LIKE '%tier%' OR ccu.column_name LIKE '%tier%');

-- Check for indexes on the tier column
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE indexdef LIKE '%tier%';

-- Check the current users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
