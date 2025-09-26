-- Check for any remaining neo_glitch references in the database
-- Run this script to identify what's causing the toggleLike error

-- 1. Check for triggers that might reference neo_glitch_media
SELECT 'TRIGGERS' as check_type, trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE action_statement LIKE '%neo_glitch%';

-- 2. Check for functions that might reference neo_glitch_media  
SELECT 'FUNCTIONS' as check_type, routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%neo_glitch%';

-- 3. Check for any views that might reference neo_glitch_media
SELECT 'VIEWS' as check_type, table_name, view_definition
FROM information_schema.views 
WHERE view_definition LIKE '%neo_glitch%';

-- 4. Check for triggers on the likes table specifically
SELECT 'LIKES_TRIGGERS' as check_type, trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'likes';

-- 5. Check for any functions that might be called by triggers
SELECT 'TRIGGER_FUNCTIONS' as check_type, routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%likes%' AND routine_definition LIKE '%media%';

-- 6. Check if there are any remaining neo_glitch_media references in any table
SELECT 'TABLE_REFERENCES' as check_type, 
       schemaname, 
       tablename, 
       indexname
FROM pg_indexes 
WHERE indexname LIKE '%neo_glitch%' OR tablename LIKE '%neo_glitch%';

-- 7. Check for any foreign key constraints that might reference neo_glitch
SELECT 'FOREIGN_KEYS' as check_type,
       conname,
       conrelid::regclass as table_name,
       confrelid::regclass as referenced_table,
       pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE pg_get_constraintdef(oid) LIKE '%neo_glitch%';
