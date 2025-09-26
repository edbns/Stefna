-- ============================================================================
-- PREVENTIVE MIGRATION: Ensure likes_count never goes negative
-- ============================================================================
-- This migration adds constraints and updates triggers to prevent negative
-- likes_count values from ever occurring in the future.
-- ============================================================================

-- Step 1: Add CHECK constraints to prevent negative likes_count
ALTER TABLE custom_prompt_media ADD CONSTRAINT check_likes_count_non_negative CHECK (likes_count >= 0);
ALTER TABLE unreal_reflection_media ADD CONSTRAINT check_likes_count_non_negative CHECK (likes_count >= 0);
ALTER TABLE ghibli_reaction_media ADD CONSTRAINT check_likes_count_non_negative CHECK (likes_count >= 0);
ALTER TABLE cyber_siren_media ADD CONSTRAINT check_likes_count_non_negative CHECK (likes_count >= 0);
ALTER TABLE presets_media ADD CONSTRAINT check_likes_count_non_negative CHECK (likes_count >= 0);
ALTER TABLE edit_media ADD CONSTRAINT check_likes_count_non_negative CHECK (likes_count >= 0);

-- Step 2: Update triggers to use GREATEST to prevent negative values
-- Update custom_prompt_media trigger
DROP TRIGGER IF EXISTS update_custom_prompt_media_likes_count ON likes;
CREATE OR REPLACE FUNCTION update_custom_prompt_media_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.media_type = 'custom_prompt' THEN
        UPDATE custom_prompt_media 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.media_id;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' AND OLD.media_type = 'custom_prompt' THEN
        UPDATE custom_prompt_media 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = OLD.media_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_prompt_media_likes_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_prompt_media_likes_count();

-- Update edit_media trigger (already exists but ensure it uses GREATEST)
DROP TRIGGER IF EXISTS update_edit_media_likes_count ON likes;
CREATE OR REPLACE FUNCTION update_edit_media_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.media_type = 'edit' THEN
        UPDATE edit_media 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.media_id;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' AND OLD.media_type = 'edit' THEN
        UPDATE edit_media 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = OLD.media_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_edit_media_likes_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_edit_media_likes_count();

-- Step 3: Verify constraints were added
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE constraint_name LIKE '%likes_count_non_negative%'
ORDER BY table_name;

-- Step 4: Test that constraints work
-- This should fail if constraints are working
-- UPDATE custom_prompt_media SET likes_count = -1 WHERE id = (SELECT id FROM custom_prompt_media LIMIT 1);
