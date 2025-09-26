-- Fix duplicate likes issue by removing overlapping triggers
-- The problem: Multiple triggers are firing for the same media types

-- ========================================
-- STEP 1: Remove duplicate triggers
-- ========================================

-- Remove the specific edit_media trigger since update_media_likes_count handles it
DROP TRIGGER IF EXISTS update_edit_media_likes_count ON likes;

-- Remove the specific parallel_self_media triggers since update_media_likes_count handles them
DROP TRIGGER IF EXISTS update_parallel_self_media_likes_count_insert ON likes;
DROP TRIGGER IF EXISTS update_parallel_self_media_likes_count_delete ON likes;

-- ========================================
-- STEP 2: Update update_media_likes_count to handle all media types properly
-- ========================================

CREATE OR REPLACE FUNCTION update_media_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment likes count for all media types
        IF NEW.media_type = 'story' THEN
            UPDATE story SET likes_count = likes_count + 1 WHERE id = NEW.media_id;
        ELSIF NEW.media_type = 'edit' THEN
            UPDATE edit_media SET likes_count = likes_count + 1 WHERE id = NEW.media_id;
        ELSIF NEW.media_type = 'parallel_self' THEN
            UPDATE parallel_self_media SET likes_count = likes_count + 1 WHERE id = NEW.media_id;
        ELSE
            -- For other media types (custom_prompt, unreal_reflection, ghibli_reaction, cyber_siren, presets)
            EXECUTE format('UPDATE %I SET likes_count = likes_count + 1 WHERE id = $1', NEW.media_type || '_media') USING NEW.media_id;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement likes count for all media types (but never below 0)
        IF OLD.media_type = 'story' THEN
            UPDATE story SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.media_id;
        ELSIF OLD.media_type = 'edit' THEN
            UPDATE edit_media SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.media_id;
        ELSIF OLD.media_type = 'parallel_self' THEN
            UPDATE parallel_self_media SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.media_id;
        ELSE
            -- For other media types (custom_prompt, unreal_reflection, ghibli_reaction, cyber_siren, presets)
            EXECUTE format('UPDATE %I SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1', OLD.media_type || '_media') USING OLD.media_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 3: Fix any existing duplicate likes counts
-- ========================================

-- Recalculate correct likes counts for all media tables
UPDATE story SET likes_count = (
    SELECT COUNT(*) FROM likes WHERE media_id = story.id AND media_type = 'story'
);

UPDATE edit_media SET likes_count = (
    SELECT COUNT(*) FROM likes WHERE media_id = edit_media.id AND media_type = 'edit'
);

UPDATE parallel_self_media SET likes_count = (
    SELECT COUNT(*) FROM likes WHERE media_id = parallel_self_media.id AND media_type = 'parallel_self'
);

UPDATE custom_prompt_media SET likes_count = (
    SELECT COUNT(*) FROM likes WHERE media_id = custom_prompt_media.id AND media_type = 'custom_prompt'
);

UPDATE unreal_reflection_media SET likes_count = (
    SELECT COUNT(*) FROM likes WHERE media_id = unreal_reflection_media.id AND media_type = 'unreal_reflection'
);

UPDATE ghibli_reaction_media SET likes_count = (
    SELECT COUNT(*) FROM likes WHERE media_id = ghibli_reaction_media.id AND media_type = 'ghibli_reaction'
);

UPDATE cyber_siren_media SET likes_count = (
    SELECT COUNT(*) FROM likes WHERE media_id = cyber_siren_media.id AND media_type = 'cyber_siren'
);

UPDATE presets_media SET likes_count = (
    SELECT COUNT(*) FROM likes WHERE media_id = presets_media.id AND media_type = 'presets'
);

-- ========================================
-- VERIFICATION
-- ========================================

-- Check remaining triggers on likes table
SELECT trigger_name, event_object_table, action_timing, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'likes'
ORDER BY trigger_name;

-- Check for any negative likes counts (should be 0)
SELECT 'story' as table_name, COUNT(*) as negative_count FROM story WHERE likes_count < 0
UNION ALL
SELECT 'edit_media', COUNT(*) FROM edit_media WHERE likes_count < 0
UNION ALL
SELECT 'parallel_self_media', COUNT(*) FROM parallel_self_media WHERE likes_count < 0
UNION ALL
SELECT 'custom_prompt_media', COUNT(*) FROM custom_prompt_media WHERE likes_count < 0
UNION ALL
SELECT 'unreal_reflection_media', COUNT(*) FROM unreal_reflection_media WHERE likes_count < 0
UNION ALL
SELECT 'ghibli_reaction_media', COUNT(*) FROM ghibli_reaction_media WHERE likes_count < 0
UNION ALL
SELECT 'cyber_siren_media', COUNT(*) FROM cyber_siren_media WHERE likes_count < 0
UNION ALL
SELECT 'presets_media', COUNT(*) FROM presets_media WHERE likes_count < 0;
