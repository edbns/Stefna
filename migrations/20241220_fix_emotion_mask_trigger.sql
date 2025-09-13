-- Fix: Update trigger function to use unreal_reflection_media instead of emotion_mask_media
-- This resolves the "relation emotion_mask_media does not exist" error

-- Drop and recreate the trigger function to use the correct table name
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
                SELECT user_id FROM unreal_reflection_media WHERE id = NEW.media_id AND NEW.media_type = 'unreal_reflection'
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
                SELECT user_id FROM unreal_reflection_media WHERE id = OLD.media_id AND OLD.media_type = 'unreal_reflection'
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
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_media_likes_count_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_media_likes_count();

-- Verify the function was created successfully
SELECT 
    'Trigger function updated successfully' as status,
    'emotion_mask_media references replaced with unreal_reflection_media' as details;
