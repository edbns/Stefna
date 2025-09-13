-- Migration: Rename unreal_reflection_media to unreal_reflection_media
-- This replaces the emotion mask system with Unreal Reflection™

-- Rename the table
ALTER TABLE unreal_reflection_media RENAME TO unreal_reflection_media;

-- Update any indexes that reference the old table name
-- (PostgreSQL automatically updates index names when table is renamed)

-- Verify the rename was successful
SELECT 
    table_name,
    'RENAMED' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'unreal_reflection_media';
