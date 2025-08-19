-- List all views in the database to see what needs to be updated
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Also check for any materialized views
SELECT 
    schemaname,
    matviewname as viewname,
    definition
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname;
