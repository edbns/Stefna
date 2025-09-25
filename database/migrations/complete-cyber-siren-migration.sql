-- Complete Migration Script: Neo Tokyo Glitch → Cyber Siren
-- Run this script to rename the database table and update all references

-- ========================================
-- DATABASE CHANGES
-- ========================================

-- 1. Rename the main table
ALTER TABLE neo_glitch_media RENAME TO cyber_siren_media;

-- 2. Update any indexes (if they exist)
-- Example: ALTER INDEX idx_neo_glitch_media_user_id RENAME TO idx_cyber_siren_media_user_id;

-- 3. Update any foreign key constraints (if they exist)
-- Example: ALTER TABLE other_table DROP CONSTRAINT fk_neo_glitch_media;
-- Example: ALTER TABLE other_table ADD CONSTRAINT fk_cyber_siren_media FOREIGN KEY (cyber_siren_id) REFERENCES cyber_siren_media(id);

-- 4. Update any views (if they exist)
-- Example: CREATE OR REPLACE VIEW cyber_siren_view AS SELECT * FROM cyber_siren_media;

-- 5. Update any stored procedures or functions (if they exist)
-- Example: CREATE OR REPLACE FUNCTION get_cyber_siren_media(user_id UUID) RETURNS TABLE(...) AS $$ ... $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify the table was renamed successfully
SELECT table_name FROM information_schema.tables WHERE table_name = 'cyber_siren_media';

-- Verify the table structure is intact
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cyber_siren_media' 
ORDER BY ordinal_position;

-- Check for any remaining references to the old table name
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE indexname LIKE '%neo_glitch%';

-- ========================================
-- ROLLBACK SCRIPT (if needed)
-- ========================================

-- To rollback this migration, run:
-- ALTER TABLE cyber_siren_media RENAME TO neo_glitch_media;

-- ========================================
-- NOTES
-- ========================================

-- After running this migration, you'll also need to update:
-- 1. Application code references (already done in the codebase)
-- 2. Any API endpoints that reference the old table name
-- 3. Any configuration files that reference the old table name
-- 4. Any documentation that references the old table name

-- The application code has already been updated to use 'cyber_siren' as the source identifier,
-- so the database table rename should be the final step.
