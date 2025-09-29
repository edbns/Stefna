-- Migration: Fix stories table by adding missing columns
-- This fixes the partially created stories table

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add full_story_content if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stories' AND column_name = 'full_story_content') THEN
        ALTER TABLE stories ADD COLUMN full_story_content TEXT NOT NULL DEFAULT '';
    END IF;

    -- Add hero_image_social if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stories' AND column_name = 'hero_image_social') THEN
        ALTER TABLE stories ADD COLUMN hero_image_social TEXT;
    END IF;

    -- Add hero_image_thumbnail if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stories' AND column_name = 'hero_image_thumbnail') THEN
        ALTER TABLE stories ADD COLUMN hero_image_thumbnail TEXT;
    END IF;

    -- Add story_images if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stories' AND column_name = 'story_images') THEN
        ALTER TABLE stories ADD COLUMN story_images JSONB NOT NULL DEFAULT '[]';
    END IF;

    -- Add keywords if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stories' AND column_name = 'keywords') THEN
        ALTER TABLE stories ADD COLUMN keywords TEXT;
    END IF;

    -- Add estimated_read_time if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stories' AND column_name = 'estimated_read_time') THEN
        ALTER TABLE stories ADD COLUMN estimated_read_time INTEGER;
    END IF;

    -- Add story_category if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stories' AND column_name = 'story_category') THEN
        ALTER TABLE stories ADD COLUMN story_category TEXT;
    END IF;

    -- Add word_count if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stories' AND column_name = 'word_count') THEN
        ALTER TABLE stories ADD COLUMN word_count INTEGER;
    END IF;

    -- Add featured if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stories' AND column_name = 'featured') THEN
        ALTER TABLE stories ADD COLUMN featured BOOLEAN DEFAULT false;
    END IF;

    -- Add view_count if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stories' AND column_name = 'view_count') THEN
        ALTER TABLE stories ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;

    -- Update status check constraint if needed
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name = 'stories_status_check') THEN
        ALTER TABLE stories DROP CONSTRAINT stories_status_check;
    END IF;
    
    ALTER TABLE stories ADD CONSTRAINT stories_status_check 
        CHECK (status IN ('draft', 'published', 'archived'));
END $$;

-- Create missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(story_category);
CREATE INDEX IF NOT EXISTS idx_stories_featured ON stories(featured);
CREATE INDEX IF NOT EXISTS idx_stories_view_count ON stories(view_count DESC);

-- GIN index for story images JSONB
CREATE INDEX IF NOT EXISTS idx_stories_images_gin ON stories USING GIN (story_images);

-- Create functions (they might already exist)
CREATE OR REPLACE FUNCTION update_stories_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ language 'plpgsql';

CREATE OR REPLACE FUNCTION set_stories_published_at()
RETURNS TRIGGER AS $func$
BEGIN
    IF NEW.status = 'published' AND OLD.status != 'published' THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$func$ language 'plpgsql';

-- Create triggers if they don't exist
DO $$
BEGIN
    -- Update timestamp trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'update_stories_updated_at') THEN
        CREATE TRIGGER update_stories_updated_at
            BEFORE UPDATE ON stories
            FOR EACH ROW
            EXECUTE FUNCTION update_stories_updated_at();
    END IF;

    -- Published timestamp trigger  
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'set_stories_published_at') THEN
        CREATE TRIGGER set_stories_published_at
            BEFORE UPDATE ON stories
            FOR EACH ROW
            EXECUTE FUNCTION set_stories_published_at();
    END IF;
END $$;
