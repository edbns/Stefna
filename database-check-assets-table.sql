-- Check Assets Table Structure
-- This will show us what columns actually exist in the assets table
-- Date: 2025-08-19

-- Check the current assets table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'assets' 
ORDER BY ordinal_position;

-- Check if assets table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'assets';

-- Check for any views that might reference assets
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition LIKE '%assets%'
ORDER BY viewname;
