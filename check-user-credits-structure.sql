-- Check the actual structure of user_credits table
-- This will show us what columns it has and their types

-- Check all columns in user_credits table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  is_identity,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_credits'
ORDER BY ordinal_position;

-- Check if user_credits has a primary key and what it is
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_credits' 
  AND tc.constraint_type = 'PRIMARY KEY';

-- Check the table definition
SELECT 
  table_name,
  table_type,
  is_insertable_into
FROM information_schema.tables 
WHERE table_name = 'user_credits';
