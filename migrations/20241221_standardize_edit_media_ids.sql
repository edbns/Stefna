-- ============================================================================
-- MIGRATION: Standardize edit_media.id from INTEGER to TEXT (UUID)
-- ============================================================================
-- This migration converts edit_media.id from SERIAL (integer) to TEXT (UUID)
-- to match the schema pattern used by all other media tables.
-- 
-- SAFETY MEASURES:
-- 1. Creates new column first (preserves existing data)
-- 2. Populates new column with UUIDs
-- 3. Updates all foreign key references
-- 4. Drops old column only after verification
-- 5. Includes rollback instructions
-- ============================================================================

-- Step 1: Add new UUID column (nullable initially)
ALTER TABLE edit_media ADD COLUMN new_id TEXT;

-- Step 2: Populate new_id with UUIDs for existing records
UPDATE edit_media SET new_id = gen_random_uuid()::text WHERE new_id IS NULL;

-- Step 3: Make new_id NOT NULL and add primary key constraint
ALTER TABLE edit_media ALTER COLUMN new_id SET NOT NULL;

-- Step 4: Update likes table to reference new_id for edit media
-- First, add new column for the new reference
ALTER TABLE likes ADD COLUMN new_media_id TEXT;

-- Update likes table: copy existing media_id for non-edit types, use new_id for edit types
UPDATE likes 
SET new_media_id = media_id::text 
WHERE media_type != 'edit';

-- For edit media, we need to map old integer IDs to new UUIDs
UPDATE likes 
SET new_media_id = em.new_id
FROM edit_media em
WHERE likes.media_type = 'edit' 
  AND likes.media_id::integer = em.id;

-- Step 5: Make new_media_id NOT NULL
ALTER TABLE likes ALTER COLUMN new_media_id SET NOT NULL;

-- Step 6: Drop old foreign key constraints and indexes
-- (These will be recreated with new column names)

-- Step 7: Rename columns to final names
ALTER TABLE edit_media RENAME COLUMN id TO old_id;
ALTER TABLE edit_media RENAME COLUMN new_id TO id;

ALTER TABLE likes RENAME COLUMN media_id TO old_media_id;
ALTER TABLE likes RENAME COLUMN new_media_id TO media_id;

-- Step 8: Drop old primary key and add new one
ALTER TABLE edit_media DROP CONSTRAINT edit_media_pkey;
ALTER TABLE edit_media ADD PRIMARY KEY (id);

-- Step 9: Recreate indexes with new column
DROP INDEX IF EXISTS idx_edit_media_user_id;
DROP INDEX IF EXISTS idx_edit_media_run_id;
DROP INDEX IF EXISTS idx_edit_media_created_at;

CREATE INDEX IF NOT EXISTS idx_edit_media_user_id ON edit_media(user_id);
CREATE INDEX IF NOT EXISTS idx_edit_media_run_id ON edit_media(run_id);
CREATE INDEX IF NOT EXISTS idx_edit_media_created_at ON edit_media(created_at DESC);

-- Step 10: Update any functions or triggers that reference the old column
-- (This will be handled in the application code update)

-- Step 11: Clean up old columns (COMMENTED OUT FOR SAFETY - UNCOMMENT AFTER VERIFICATION)
-- ALTER TABLE edit_media DROP COLUMN old_id;
-- ALTER TABLE likes DROP COLUMN old_media_id;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration worked correctly:

-- Check that all edit_media records have new UUID IDs
-- SELECT COUNT(*) as total_records, COUNT(new_id) as records_with_new_id 
-- FROM edit_media;

-- Check that likes table references are updated correctly
-- SELECT media_type, COUNT(*) as count 
-- FROM likes 
-- GROUP BY media_type;

-- Check that edit media likes are properly linked
-- SELECT COUNT(*) as edit_likes_count
-- FROM likes l
-- JOIN edit_media em ON l.media_id = em.id
-- WHERE l.media_type = 'edit';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- If rollback is needed, run these commands in reverse order:
-- 
-- 1. Restore old columns:
-- ALTER TABLE edit_media RENAME COLUMN id TO new_id;
-- ALTER TABLE edit_media RENAME COLUMN old_id TO id;
-- ALTER TABLE likes RENAME COLUMN media_id TO new_media_id;
-- ALTER TABLE likes RENAME COLUMN old_media_id TO media_id;
--
-- 2. Drop new columns:
-- ALTER TABLE edit_media DROP COLUMN new_id;
-- ALTER TABLE likes DROP COLUMN new_media_id;
--
-- 3. Restore primary key:
-- ALTER TABLE edit_media DROP CONSTRAINT edit_media_pkey;
-- ALTER TABLE edit_media ADD PRIMARY KEY (id);
--
-- 4. Restore indexes:
-- DROP INDEX IF EXISTS idx_edit_media_user_id;
-- DROP INDEX IF EXISTS idx_edit_media_run_id; 
-- DROP INDEX IF EXISTS idx_edit_media_created_at;
-- CREATE INDEX IF NOT EXISTS idx_edit_media_user_id ON edit_media(user_id);
-- CREATE INDEX IF NOT EXISTS idx_edit_media_run_id ON edit_media(run_id);
-- CREATE INDEX IF NOT EXISTS idx_edit_media_created_at ON edit_media(created_at DESC);
-- ============================================================================
