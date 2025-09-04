-- Add likes support to Edit Media
-- This migration adds likes functionality to the edit_media table

-- ========================================
-- ADD LIKES COUNT TO EDIT_MEDIA TABLE
-- ========================================
ALTER TABLE edit_media 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- ========================================
-- UPDATE LIKES TABLE CHECK CONSTRAINT
-- ========================================
-- Drop the existing unique constraint first
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_media_id_media_type_key;

-- Add edit to the allowed media types
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_media_type_check;
ALTER TABLE likes ADD CONSTRAINT likes_media_type_check 
CHECK (media_type IN ('custom_prompt', 'emotion_mask', 'ghibli_reaction', 'neo_glitch', 'presets', 'story', 'edit'));

-- Recreate the unique constraint
ALTER TABLE likes ADD CONSTRAINT likes_user_id_media_id_media_type_key 
UNIQUE(user_id, media_id, media_type);

-- ========================================
-- UPDATE TRIGGER FUNCTION
-- ========================================
-- Drop and recreate the trigger function to include edit
DROP FUNCTION IF EXISTS update_media_likes_count() CASCADE;

CREATE OR REPLACE FUNCTION update_media_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment likes count
        IF NEW.media_type = 'story' THEN
            UPDATE story SET likes_count = likes_count + 1 WHERE id = NEW.media_id;
        ELSIF NEW.media_type = 'edit' THEN
            UPDATE edit_media SET likes_count = likes_count + 1 WHERE id = NEW.media_id;
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
                UNION ALL
                SELECT user_id FROM edit_media WHERE id = NEW.media_id AND NEW.media_type = 'edit'
            ) AS media_owners
            LIMIT 1
        );
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement likes count
        IF OLD.media_type = 'story' THEN
            UPDATE story SET likes_count = likes_count - 1 WHERE id = OLD.media_id;
        ELSIF OLD.media_type = 'edit' THEN
            UPDATE edit_media SET likes_count = likes_count - 1 WHERE id = OLD.media_id;
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
                UNION ALL
                SELECT user_id FROM edit_media WHERE id = OLD.media_id AND OLD.media_type = 'edit'
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
-- POPULATE EXISTING COUNTS (if any likes exist)
-- ========================================
-- Update edit_media likes_count based on existing likes
UPDATE edit_media 
SET likes_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE media_id = edit_media.id AND media_type = 'edit'
);
