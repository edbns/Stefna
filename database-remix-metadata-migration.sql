-- Database Migration: Add remix metadata and denormalized counts
-- Safe, idempotent migration for remix tracking and metadata

-- 1. Add parent_id column to track remix relationships
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='media_assets' AND column_name='parent_id') THEN
    ALTER TABLE public.media_assets ADD COLUMN parent_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Add remix_count column for denormalized count
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='media_assets' AND column_name='remix_count') THEN
    ALTER TABLE public.media_assets ADD COLUMN remix_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 3. Update metadata column to include new generation tracking fields
-- The metadata column should already exist from previous migrations
-- We'll just ensure it has the right structure in the application code

-- 4. Create index for parent_id lookups (for remix chains)
CREATE INDEX IF NOT EXISTS media_assets_parent_id_idx
  ON public.media_assets (parent_id);

-- 5. Create index for remix_count (for sorting by popularity)
CREATE INDEX IF NOT EXISTS media_assets_remix_count_idx
  ON public.media_assets (remix_count DESC);

-- 6. Backfill remix_count for existing records
-- This is safe to run multiple times
UPDATE public.media_assets 
SET remix_count = (
  SELECT COUNT(*) 
  FROM public.media_assets children 
  WHERE children.parent_id = media_assets.id
)
WHERE remix_count = 0;

-- 7. Create a function to automatically update remix_count when new remixes are created
CREATE OR REPLACE FUNCTION update_remix_count()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a new remix (has parent_id), increment parent's remix_count
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE public.media_assets 
    SET remix_count = remix_count + 1 
    WHERE id = NEW.parent_id;
  END IF;
  
  -- If parent_id is being removed, decrement old parent's count
  IF TG_OP = 'UPDATE' AND OLD.parent_id IS NOT NULL AND NEW.parent_id IS NULL THEN
    UPDATE public.media_assets 
    SET remix_count = GREATEST(0, remix_count - 1) 
    WHERE id = OLD.parent_id;
  END IF;
  
  -- If parent_id is being changed, update both old and new parents
  IF TG_OP = 'UPDATE' AND OLD.parent_id IS NOT NULL AND NEW.parent_id IS NOT NULL AND OLD.parent_id != NEW.parent_id THEN
    -- Decrement old parent
    UPDATE public.media_assets 
    SET remix_count = GREATEST(0, remix_count - 1) 
    WHERE id = OLD.parent_id;
    
    -- Increment new parent
    UPDATE public.media_assets 
    SET remix_count = remix_count + 1 
    WHERE id = NEW.parent_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically maintain remix_count
DROP TRIGGER IF EXISTS trigger_update_remix_count ON public.media_assets;
CREATE TRIGGER trigger_update_remix_count
  AFTER INSERT OR UPDATE OF parent_id ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_remix_count();

-- 9. Create trigger to handle deletions (decrement parent's count)
CREATE OR REPLACE FUNCTION handle_remix_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- If deleted record was a remix, decrement parent's count
  IF OLD.parent_id IS NOT NULL THEN
    UPDATE public.media_assets 
    SET remix_count = GREATEST(0, remix_count - 1) 
    WHERE id = OLD.parent_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_remix_deletion ON public.media_assets;
CREATE TRIGGER trigger_handle_remix_deletion
  AFTER DELETE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION handle_remix_deletion();

-- 10. Add helpful indexes for the new metadata queries
CREATE INDEX IF NOT EXISTS media_assets_metadata_preset_id_idx
  ON public.media_assets USING GIN ((metadata->>'presetId'));

CREATE INDEX IF NOT EXISTS media_assets_metadata_mode_idx
  ON public.media_assets USING GIN ((metadata->>'mode'));

CREATE INDEX IF NOT EXISTS media_assets_metadata_group_idx
  ON public.media_assets USING GIN ((metadata->>'group'));

-- 11. Ensure RLS policies allow reading remix relationships
-- This assumes you have existing RLS policies - adjust as needed
-- Users should be able to see remix chains for public content
