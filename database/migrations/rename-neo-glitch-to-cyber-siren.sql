-- Migration: Rename Neo Tokyo Glitch to Cyber Siren
-- This script renames the database table and updates all related references

-- Step 1: Rename the main table
ALTER TABLE neo_glitch_media RENAME TO cyber_siren_media;

-- Step 2: Update any foreign key constraints or indexes that reference the old table name
-- (Add any specific constraints here if they exist)

-- Step 3: Update any views that might reference the old table
-- (Add any views here if they exist)

-- Step 4: Update any stored procedures or functions that reference the old table
-- (Add any procedures here if they exist)

-- Step 5: Update any triggers that reference the old table
-- (Add any triggers here if they exist)

-- Step 6: Update any sequences or other database objects
-- (Add any sequences here if they exist)

-- Verification queries (run these after the migration to verify):
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'cyber_siren_media';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'cyber_siren_media';

-- Note: This migration assumes the table exists and has the standard structure.
-- If there are additional constraints, indexes, or relationships, they may need to be updated separately.
