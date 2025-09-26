-- Fix likes table constraint to properly allow 'edit' media type
-- This migration ensures the likes table constraint includes 'edit' as a valid media type

-- Drop the existing constraint
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_media_type_check;

-- Add the updated constraint that includes 'edit'
ALTER TABLE likes ADD CONSTRAINT likes_media_type_check 
CHECK (media_type IN ('custom_prompt', 'unreal_reflection', 'ghibli_reaction', 'cyber_siren', 'presets', 'story', 'edit'));
