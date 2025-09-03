-- Add likes support to Story Time
-- This migration adds likes functionality to the story table

-- ========================================
-- ADD LIKES COUNT TO STORY TABLE
-- ========================================
ALTER TABLE story 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- ========================================
-- UPDATE LIKES TABLE CHECK CONSTRAINT
-- ========================================
-- Drop the existing unique constraint first
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_media_id_media_type_key;

-- Add story to the allowed media types
-- Note: We need to update any existing check constraints if they exist
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_media_type_check;
ALTER TABLE likes ADD CONSTRAINT likes_media_type_check 
CHECK (media_type IN ('custom_prompt', 'emotion_mask', 'ghibli_reaction', 'neo_glitch', 'presets', 'story'));

-- Recreate the unique constraint
ALTER TABLE likes ADD CONSTRAINT likes_user_id_media_id_media_type_key 
UNIQUE(user_id, media_id, media_type);

-- ========================================
-- UPDATE TRIGGER FUNCTION
-- ========================================
-- Drop and recreate the trigger function to include story
DROP FUNCTION IF EXISTS update_media_likes_count() CASCADE;

CREATE OR REPLACE FUNCTION update_media_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment likes count
        IF NEW.media_type = 'story' THEN
            UPDATE story SET likes_count = likes_count + 1 WHERE id = NEW.media_id;
        ELSE
            EXECUTE format('UPDATE %I SET likes_count = likes_count + 1 WHERE id = $1', NEW.media_type || '_media')
            USING NEW.media_id;
        END IF;
        
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
                UNION ALL
                SELECT user_id FROM story WHERE id = NEW.media_id AND NEW.media_type = 'story'
            ) AS media_owners
            LIMIT 1
        );
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement likes count
        IF OLD.media_type = 'story' THEN
            UPDATE story SET likes_count = likes_count - 1 WHERE id = OLD.media_id;
        ELSE
            EXECUTE format('UPDATE %I SET likes_count = likes_count - 1 WHERE id = $1', OLD.media_type || '_media')
            USING OLD.media_id;
        END IF;
        
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
                UNION ALL
                SELECT user_id FROM story WHERE id = OLD.media_id AND OLD.media_type = 'story'
            ) AS media_owners
            LIMIT 1
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER update_media_likes_count_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_media_likes_count();

-- ========================================
-- POPULATE EXISTING STORY LIKES COUNTS
-- ========================================
-- Update any existing story likes counts
UPDATE story 
SET likes_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE media_id = story.id 
    AND media_type = 'story'
);

-- Update users total likes to include story likes
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
        UNION ALL
        SELECT id FROM story WHERE user_id = users.id
    )
);
