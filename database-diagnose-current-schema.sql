-- Diagnostic: Check what columns actually exist in your assets table
-- Run this first to see your current schema

-- Check if assets table exists and what columns it has
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'assets' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if the table exists at all
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'assets' 
  AND table_schema = 'public';

-- Check what tables exist that might be similar
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%asset%'
ORDER BY table_name;

-- Check if you have a media_assets table instead
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'media_assets' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
