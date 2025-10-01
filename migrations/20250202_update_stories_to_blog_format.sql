-- Update stories table from card-based to blog-style format
-- Images are now auto-detected from Cloudinary URLs in the text content

-- Drop the old story_images JSONB column and its index
-- Images are now embedded directly in full_story_content as URLs
DROP INDEX IF EXISTS idx_stories_images_gin;
ALTER TABLE stories DROP COLUMN IF EXISTS story_images;

