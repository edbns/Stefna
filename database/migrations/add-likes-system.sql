-- Add likes system to Stefna
-- This migration adds likes functionality to media tables and users table

-- ========================================
-- LIKES TABLE
-- ========================================
-- Track individual likes from users to media items
CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type TEXT NOT NULL, -- 'custom_prompt', 'emotion_mask', 'ghibli_reaction', 'neo_glitch', 'presets'
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    -- Ensure a user can only like a media item once
    UNIQUE(user_id, media_id, media_type)
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_likes_media ON likes(media_id, media_type);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- ========================================
-- ADD LIKES COUNT TO MEDIA TABLES
-- ========================================
-- Add likes_count column to each media table for efficient display

ALTER TABLE custom_prompt_media 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

ALTER TABLE emotion_mask_media 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

ALTER TABLE ghibli_reaction_media 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

ALTER TABLE neo_glitch_media 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

ALTER TABLE presets_media 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- ========================================
-- ADD TOTAL LIKES TO USERS TABLE
-- ========================================
-- Track total likes received by each user's content
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_likes_received INTEGER DEFAULT 0;

-- ========================================
-- HELPER FUNCTIONS
-- ========================================
-- Function to update likes count on media tables
CREATE OR REPLACE FUNCTION update_media_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment likes count
        EXECUTE format('UPDATE %I SET likes_count = likes_count + 1 WHERE id = $1', NEW.media_type || '_media')
        USING NEW.media_id;
        
        -- Update user's total likes received
        UPDATE users 
        SET total_likes_received = total_likes_received + 1 
        WHERE id = (
            SELECT user_id 
            FROM (
                SELECT user_id FROM custom_prompt_media WHERE id = NEW.media_id AND NEW.media_type = 'custom_prompt'
                UNION ALL
                SELECT user_id FROM emotion_mask_media WHERE id = NEW.media_id AND NEW.media_type = 'emotion_mask'
                UNION ALL
                SELECT user_id FROM ghibli_reaction_media WHERE id = NEW.media_id AND NEW.media_type = 'ghibli_reaction'
                UNION ALL
                SELECT user_id FROM neo_glitch_media WHERE id = NEW.media_id AND NEW.media_type = 'neo_glitch'
                UNION ALL
                SELECT user_id FROM presets_media WHERE id = NEW.media_id AND NEW.media_type = 'presets'
            ) AS media_owners
            LIMIT 1
        );
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement likes count
        EXECUTE format('UPDATE %I SET likes_count = likes_count - 1 WHERE id = $1', OLD.media_type || '_media')
        USING OLD.media_id;
        
        -- Update user's total likes received
        UPDATE users 
        SET total_likes_received = total_likes_received - 1 
        WHERE id = (
            SELECT user_id 
            FROM (
                SELECT user_id FROM custom_prompt_media WHERE id = OLD.media_id AND OLD.media_type = 'custom_prompt'
                UNION ALL
                SELECT user_id FROM emotion_mask_media WHERE id = OLD.media_id AND OLD.media_type = 'emotion_mask'
                UNION ALL
                SELECT user_id FROM ghibli_reaction_media WHERE id = OLD.media_id AND OLD.media_type = 'ghibli_reaction'
                UNION ALL
                SELECT user_id FROM neo_glitch_media WHERE id = OLD.media_id AND OLD.media_type = 'neo_glitch'
                UNION ALL
                SELECT user_id FROM presets_media WHERE id = OLD.media_id AND OLD.media_type = 'presets'
            ) AS media_owners
            LIMIT 1
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update likes counts
CREATE TRIGGER update_media_likes_count_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_media_likes_count();

-- ========================================
-- POPULATE EXISTING COUNTS (if any likes exist)
-- ========================================
-- This will be a no-op on fresh installs but helps if likes were added manually

-- Update custom_prompt_media
UPDATE custom_prompt_media 
SET likes_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE media_id = custom_prompt_media.id 
    AND media_type = 'custom_prompt'
);

-- Update emotion_mask_media
UPDATE emotion_mask_media 
SET likes_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE media_id = emotion_mask_media.id 
    AND media_type = 'emotion_mask'
);

-- Update ghibli_reaction_media
UPDATE ghibli_reaction_media 
SET likes_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE media_id = ghibli_reaction_media.id 
    AND media_type = 'ghibli_reaction'
);

-- Update neo_glitch_media
UPDATE neo_glitch_media 
SET likes_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE media_id = neo_glitch_media.id 
    AND media_type = 'neo_glitch'
);

-- Update presets_media
UPDATE presets_media 
SET likes_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE media_id = presets_media.id 
    AND media_type = 'presets'
);

-- Update users total likes
UPDATE users 
SET total_likes_received = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE media_id IN (
        SELECT id FROM custom_prompt_media WHERE user_id = users.id
        UNION ALL
        SELECT id FROM emotion_mask_media WHERE user_id = users.id
        UNION ALL
        SELECT id FROM ghibli_reaction_media WHERE user_id = users.id
        UNION ALL
        SELECT id FROM neo_glitch_media WHERE user_id = users.id
        UNION ALL
        SELECT id FROM presets_media WHERE user_id = users.id
    )
);
