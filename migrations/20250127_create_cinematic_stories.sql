-- Create cinematic stories table for SEO content management
-- This table stores fantasy stories with multi-platform support

CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    teaser_text TEXT NOT NULL,
    full_story_content TEXT NOT NULL,
    
    -- Multi-platform image optimization
    hero_image_url TEXT NOT NULL,
    hero_image_social TEXT, -- Optimized for social sharing
    hero_image_thumbnail TEXT, -- For story cards/previews
    
    -- Story images array (JSONB for flexibility)
    story_images JSONB NOT NULL DEFAULT '[]', -- Array of {url: string, alt_text: string, caption: string}
    
    -- SEO optimization
    meta_title TEXT,
    meta_description TEXT,
    keywords TEXT, -- For internal categorization
    
    -- Story metadata
    estimated_read_time INTEGER, -- in minutes
    story_category TEXT, -- fantasy, adventure, romance, etc.
    word_count INTEGER,
    
    -- Publishing
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    featured BOOLEAN DEFAULT false, -- For featured stories
    
    -- Analytics/tracking
    view_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_slug ON stories(slug);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON stories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(story_category);
CREATE INDEX IF NOT EXISTS idx_stories_featured ON stories(featured);
CREATE INDEX IF NOT EXISTS idx_stories_view_count ON stories(view_count DESC);

-- GIN index for story images JSONB for efficient image queries
CREATE INDEX IF NOT EXISTS idx_stories_images_gin ON stories USING GIN (story_images);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_stories_updated_at();

-- Add trigger to set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_stories_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND OLD.status != 'published' THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_stories_published_at
    BEFORE UPDATE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION set_stories_published_at();
