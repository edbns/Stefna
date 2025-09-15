-- ============================================================================
-- FIX: Add DEFAULT value to edit_media.id column
-- ============================================================================
-- The edit_media table was converted from SERIAL to TEXT but is missing
-- the DEFAULT value for auto-generating UUIDs. This fixes the INSERT issue.
-- ============================================================================

-- Add DEFAULT value to edit_media.id column
ALTER TABLE edit_media ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Verify the change
SELECT column_name, column_default, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'edit_media' AND column_name = 'id';
