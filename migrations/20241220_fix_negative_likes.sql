-- Fix negative total_likes_received values
-- This migration ensures total_likes_received never goes below 0

-- First, fix any existing negative values
UPDATE users 
SET total_likes_received = 0 
WHERE total_likes_received < 0;

-- Add a check constraint to prevent future negative values
ALTER TABLE users 
ADD CONSTRAINT check_total_likes_received_non_negative 
CHECK (total_likes_received >= 0);

-- Update the trigger function to ensure it never goes below 0
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment likes count
        EXECUTE format('UPDATE %I SET likes_count = likes_count + 1 WHERE id = $1', NEW.media_type || '_media')
        USING NEW.media_id;
        
        -- Update user's total likes received (increment)
        UPDATE users 
        SET total_likes_received = total_likes_received + 1 
        WHERE id = (
            SELECT user_id 
            FROM (
                SELECT user_id FROM custom_prompt_media WHERE id = NEW.media_id AND NEW.media_type = 'custom_prompt'
                UNION ALL
                SELECT user_id FROM presets_media WHERE id = NEW.media_id AND NEW.media_type = 'presets'
                UNION ALL
                SELECT user_id FROM unreal_reflection_media WHERE id = NEW.media_id AND NEW.media_type = 'unreal_reflection'
                UNION ALL
                SELECT user_id FROM ghibli_reaction_media WHERE id = NEW.media_id AND NEW.media_type = 'ghibli_reaction'
                UNION ALL
                SELECT user_id FROM neo_glitch_media WHERE id = NEW.media_id AND NEW.media_type = 'neo_glitch'
                UNION ALL
                SELECT user_id FROM story_media WHERE id = NEW.media_id AND NEW.media_type = 'story'
            ) AS media_users
        );
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement likes count
        EXECUTE format('UPDATE %I SET likes_count = likes_count - 1 WHERE id = $1', OLD.media_type || '_media')
        USING OLD.media_id;
        
        -- Update user's total likes received (decrement, but never below 0)
        UPDATE users 
        SET total_likes_received = GREATEST(total_likes_received - 1, 0)
        WHERE id = (
            SELECT user_id 
            FROM (
                SELECT user_id FROM custom_prompt_media WHERE id = OLD.media_id AND OLD.media_type = 'custom_prompt'
                UNION ALL
                SELECT user_id FROM presets_media WHERE id = OLD.media_id AND NEW.media_type = 'presets'
                UNION ALL
                SELECT user_id FROM unreal_reflection_media WHERE id = OLD.media_id AND OLD.media_type = 'unreal_reflection'
                UNION ALL
                SELECT user_id FROM ghibli_reaction_media WHERE id = OLD.media_id AND OLD.media_type = 'ghibli_reaction'
                UNION ALL
                SELECT user_id FROM neo_glitch_media WHERE id = OLD.media_id AND OLD.media_type = 'neo_glitch'
                UNION ALL
                SELECT user_id FROM story_media WHERE id = OLD.media_id AND OLD.media_type = 'story'
            ) AS media_users
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
