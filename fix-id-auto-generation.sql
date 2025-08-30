-- Fix id column auto-generation for ghibli_reaction_media table
-- Ensure UUID extension is enabled and id column generates properly

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix the id column to use proper UUID generation
ALTER TABLE ghibli_reaction_media 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Ensure the column is NOT NULL and has proper constraints
ALTER TABLE ghibli_reaction_media 
ALTER COLUMN id SET NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN ghibli_reaction_media.id IS 'Auto-generated UUID primary key for ghibli reaction media records';

-- Verify the fix by checking the table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'ghibli_reaction_media' AND column_name = 'id';
