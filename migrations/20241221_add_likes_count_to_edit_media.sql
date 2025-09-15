-- ============================================================================
-- MIGRATION: Add likes_count column to edit_media table
-- ============================================================================
-- This migration adds the missing likes_count column to the edit_media table
-- to match the schema used by other media tables.
-- ============================================================================

-- Step 1: Add likes_count column to edit_media table
ALTER TABLE edit_media ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Step 2: Update existing edit_media records with current likes count
UPDATE edit_media 
SET likes_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE likes.media_id = edit_media.id 
    AND likes.media_type = 'edit'
);

-- Step 3: Create trigger to automatically update likes_count
-- First, drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_edit_media_likes_count ON likes;

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_edit_media_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' AND NEW.media_type = 'edit' THEN
        UPDATE edit_media 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.media_id;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' AND OLD.media_type = 'edit' THEN
        UPDATE edit_media 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = OLD.media_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_edit_media_likes_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_edit_media_likes_count();

-- Step 4: Verify the column was added
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'edit_media' 
ORDER BY column_name;

-- Step 5: Test that likes_count is working
SELECT 
    id,
    likes_count,
    (SELECT COUNT(*) FROM likes WHERE media_id = edit_media.id AND media_type = 'edit') as actual_likes
FROM edit_media 
LIMIT 5;
