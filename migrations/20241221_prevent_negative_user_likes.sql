-- ============================================================================
-- PREVENTIVE MIGRATION: Ensure total_likes_received never goes negative
-- ============================================================================
-- This migration adds constraints and updates triggers to prevent negative
-- total_likes_received values from ever occurring in the users table.
-- ============================================================================

-- Step 1: Add CHECK constraint to prevent negative total_likes_received
ALTER TABLE users ADD CONSTRAINT check_total_likes_received_non_negative CHECK (total_likes_received >= 0);

-- Step 2: Update the trigger function to prevent negative values
CREATE OR REPLACE FUNCTION update_user_total_likes_received()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- When a new like is added, increment the user's total_likes_received
        UPDATE users 
        SET total_likes_received = total_likes_received + 1,
            updated_at = NOW()
        WHERE id = (
            SELECT user_id FROM (
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
                SELECT user_id FROM edit_media WHERE id = NEW.media_id AND NEW.media_type = 'edit'
                UNION ALL
                SELECT user_id FROM story WHERE id = NEW.media_id AND NEW.media_type = 'story'
            ) media_owner
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- When a like is removed, decrement the user's total_likes_received (but never below 0)
        UPDATE users 
        SET total_likes_received = GREATEST(total_likes_received - 1, 0),
            updated_at = NOW()
        WHERE id = (
            SELECT user_id FROM (
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
                SELECT user_id FROM edit_media WHERE id = OLD.media_id AND OLD.media_type = 'edit'
                UNION ALL
                SELECT user_id FROM story WHERE id = OLD.media_id AND OLD.media_type = 'story'
            ) media_owner
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Ensure the trigger exists (drop and recreate to be safe)
DROP TRIGGER IF EXISTS update_user_total_likes_received_trigger ON likes;
CREATE TRIGGER update_user_total_likes_received_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_user_total_likes_received();

-- Step 4: Verify the constraint was added
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_total_likes_received_non_negative' 
        AND contype = 'c'
    ) THEN
        RAISE NOTICE '✅ CHECK constraint check_total_likes_received_non_negative added successfully';
    ELSE
        RAISE NOTICE '❌ Failed to add CHECK constraint check_total_likes_received_non_negative';
    END IF;
END $$;

-- Step 5: Verify the trigger exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_total_likes_received_trigger'
    ) THEN
        RAISE NOTICE '✅ Trigger update_user_total_likes_received_trigger is active';
    ELSE
        RAISE NOTICE '❌ Trigger update_user_total_likes_received_trigger is missing';
    END IF;
END $$;
