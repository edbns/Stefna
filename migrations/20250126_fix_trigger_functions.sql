-- Fix trigger functions that still reference neo_glitch_media
-- This will resolve the toggleLike 500 error

-- ========================================
-- STEP 1: Fix update_media_likes_count function
-- ========================================

CREATE OR REPLACE FUNCTION update_media_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment likes count
        IF NEW.media_type = 'story' THEN
            UPDATE story SET likes_count = likes_count + 1 WHERE id = NEW.media_id;
        ELSE
            EXECUTE format('UPDATE %I SET likes_count = likes_count + 1 WHERE id = $1', NEW.media_type || '_media') USING NEW.media_id;
        END IF;
        
        -- Update user's total likes received
        UPDATE users SET total_likes_received = total_likes_received + 1 WHERE id = (
            SELECT user_id FROM (
                SELECT user_id FROM custom_prompt_media WHERE id = NEW.media_id AND NEW.media_type = 'custom_prompt'
                UNION ALL
                SELECT user_id FROM unreal_reflection_media WHERE id = NEW.media_id AND NEW.media_type = 'unreal_reflection'
                UNION ALL
                SELECT user_id FROM ghibli_reaction_media WHERE id = NEW.media_id AND NEW.media_type = 'ghibli_reaction'
                UNION ALL
                SELECT user_id FROM cyber_siren_media WHERE id = NEW.media_id AND NEW.media_type = 'cyber_siren'
                UNION ALL
                SELECT user_id FROM presets_media WHERE id = NEW.media_id AND NEW.media_type = 'presets'
                UNION ALL
                SELECT user_id FROM story WHERE id = NEW.media_id AND NEW.media_type = 'story'
            ) AS media_owners LIMIT 1
        );
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement likes count
        IF OLD.media_type = 'story' THEN
            UPDATE story SET likes_count = likes_count - 1 WHERE id = OLD.media_id;
        ELSE
            EXECUTE format('UPDATE %I SET likes_count = likes_count - 1 WHERE id = $1', OLD.media_type || '_media') USING OLD.media_id;
        END IF;
        
        -- Update user's total likes received
        UPDATE users SET total_likes_received = total_likes_received - 1 WHERE id = (
            SELECT user_id FROM (
                SELECT user_id FROM custom_prompt_media WHERE id = OLD.media_id AND OLD.media_type = 'custom_prompt'
                UNION ALL
                SELECT user_id FROM unreal_reflection_media WHERE id = OLD.media_id AND OLD.media_type = 'unreal_reflection'
                UNION ALL
                SELECT user_id FROM ghibli_reaction_media WHERE id = OLD.media_id AND OLD.media_type = 'ghibli_reaction'
                UNION ALL
                SELECT user_id FROM cyber_siren_media WHERE id = OLD.media_id AND OLD.media_type = 'cyber_siren'
                UNION ALL
                SELECT user_id FROM presets_media WHERE id = OLD.media_id AND OLD.media_type = 'presets'
                UNION ALL
                SELECT user_id FROM story WHERE id = OLD.media_id AND OLD.media_type = 'story'
            ) AS media_owners LIMIT 1
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 2: Fix update_user_total_likes_received function
-- ========================================

CREATE OR REPLACE FUNCTION update_user_total_likes_received()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- When a new like is added, increment the user's total_likes_received
        UPDATE users SET total_likes_received = total_likes_received + 1, updated_at = NOW() WHERE id = (
            SELECT user_id FROM (
                SELECT user_id FROM custom_prompt_media WHERE id = NEW.media_id AND NEW.media_type = 'custom_prompt'
                UNION ALL
                SELECT user_id FROM unreal_reflection_media WHERE id = NEW.media_id AND NEW.media_type = 'unreal_reflection'
                UNION ALL
                SELECT user_id FROM ghibli_reaction_media WHERE id = NEW.media_id AND NEW.media_type = 'ghibli_reaction'
                UNION ALL
                SELECT user_id FROM cyber_siren_media WHERE id = NEW.media_id AND NEW.media_type = 'cyber_siren'
                UNION ALL
                SELECT user_id FROM presets_media WHERE id = NEW.media_id AND NEW.media_type = 'presets'
                UNION ALL
                SELECT user_id FROM edit_media WHERE id = NEW.media_id AND NEW.media_type = 'edit'
                UNION ALL
                SELECT user_id FROM story WHERE id = NEW.media_id AND NEW.media_type = 'story'
                UNION ALL
                SELECT user_id FROM parallel_self_media WHERE id = NEW.media_id AND NEW.media_type = 'parallel_self'
            ) media_owner
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- When a like is removed, decrement the user's total_likes_received (but never below 0)
        UPDATE users SET total_likes_received = GREATEST(total_likes_received - 1, 0), updated_at = NOW() WHERE id = (
            SELECT user_id FROM (
                SELECT user_id FROM custom_prompt_media WHERE id = OLD.media_id AND OLD.media_type = 'custom_prompt'
                UNION ALL
                SELECT user_id FROM unreal_reflection_media WHERE id = OLD.media_id AND OLD.media_type = 'unreal_reflection'
                UNION ALL
                SELECT user_id FROM ghibli_reaction_media WHERE id = OLD.media_id AND OLD.media_type = 'ghibli_reaction'
                UNION ALL
                SELECT user_id FROM cyber_siren_media WHERE id = OLD.media_id AND OLD.media_type = 'cyber_siren'
                UNION ALL
                SELECT user_id FROM presets_media WHERE id = OLD.media_id AND OLD.media_type = 'presets'
                UNION ALL
                SELECT user_id FROM edit_media WHERE id = OLD.media_id AND OLD.media_type = 'edit'
                UNION ALL
                SELECT user_id FROM story WHERE id = OLD.media_id AND OLD.media_type = 'story'
                UNION ALL
                SELECT user_id FROM parallel_self_media WHERE id = OLD.media_id AND OLD.media_type = 'parallel_self'
            ) media_owner
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify the functions were updated correctly
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('update_media_likes_count', 'update_user_total_likes_received')
AND routine_definition LIKE '%cyber_siren%';

-- Check that neo_glitch references are gone
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('update_media_likes_count', 'update_user_total_likes_received')
AND routine_definition LIKE '%neo_glitch%';
