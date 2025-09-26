-- Fix all remaining neo_glitch references to cyber_siren
-- This migration addresses the 500 error in toggleLike function

-- ========================================
-- STEP 1: Update database constraints
-- ========================================

-- Drop the old constraint that includes 'neo_glitch'
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_media_type_check;

-- Add the updated constraint with 'cyber_siren' instead of 'neo_glitch'
ALTER TABLE likes ADD CONSTRAINT likes_media_type_check 
    CHECK (media_type IN ('custom_prompt', 'unreal_reflection', 'ghibli_reaction', 'cyber_siren', 'presets', 'story', 'edit', 'parallel_self'));

-- Update credits_ledger constraint as well
ALTER TABLE credits_ledger DROP CONSTRAINT IF EXISTS credits_ledger_media_type_check;
ALTER TABLE credits_ledger ADD CONSTRAINT credits_ledger_media_type_check 
    CHECK (media_type IN ('custom_prompt', 'unreal_reflection', 'ghibli_reaction', 'cyber_siren', 'presets', 'story', 'edit', 'parallel_self'));

-- ========================================
-- STEP 2: Update triggers that reference neo_glitch_media
-- ========================================

-- Drop and recreate the likes trigger to use cyber_siren_media
DROP TRIGGER IF EXISTS update_likes_count_trigger ON likes;
DROP FUNCTION IF EXISTS update_likes_count();

-- Recreate the function with cyber_siren_media
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update likes count for the media
        UPDATE custom_prompt_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = NEW.media_id AND media_type = 'custom_prompt'
        )
        WHERE id = NEW.media_id AND NEW.media_type = 'custom_prompt';
        
        UPDATE unreal_reflection_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = NEW.media_id AND media_type = 'unreal_reflection'
        )
        WHERE id = NEW.media_id AND NEW.media_type = 'unreal_reflection';
        
        UPDATE ghibli_reaction_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = NEW.media_id AND media_type = 'ghibli_reaction'
        )
        WHERE id = NEW.media_id AND NEW.media_type = 'ghibli_reaction';
        
        UPDATE cyber_siren_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = NEW.media_id AND media_type = 'cyber_siren'
        )
        WHERE id = NEW.media_id AND NEW.media_type = 'cyber_siren';
        
        UPDATE presets_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = NEW.media_id AND media_type = 'presets'
        )
        WHERE id = NEW.media_id AND NEW.media_type = 'presets';
        
        UPDATE story 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = NEW.media_id AND media_type = 'story'
        )
        WHERE id = NEW.media_id AND NEW.media_type = 'story';
        
        UPDATE edit_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = NEW.media_id AND media_type = 'edit'
        )
        WHERE id = NEW.media_id AND NEW.media_type = 'edit';
        
        UPDATE parallel_self_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = NEW.media_id AND media_type = 'parallel_self'
        )
        WHERE id = NEW.media_id AND NEW.media_type = 'parallel_self';
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Update likes count for the media
        UPDATE custom_prompt_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = OLD.media_id AND media_type = 'custom_prompt'
        )
        WHERE id = OLD.media_id AND OLD.media_type = 'custom_prompt';
        
        UPDATE unreal_reflection_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = OLD.media_id AND media_type = 'unreal_reflection'
        )
        WHERE id = OLD.media_id AND OLD.media_type = 'unreal_reflection';
        
        UPDATE ghibli_reaction_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = OLD.media_id AND media_type = 'ghibli_reaction'
        )
        WHERE id = OLD.media_id AND OLD.media_type = 'ghibli_reaction';
        
        UPDATE cyber_siren_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = OLD.media_id AND media_type = 'cyber_siren'
        )
        WHERE id = OLD.media_id AND OLD.media_type = 'cyber_siren';
        
        UPDATE presets_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = OLD.media_id AND media_type = 'presets'
        )
        WHERE id = OLD.media_id AND OLD.media_type = 'presets';
        
        UPDATE story 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = OLD.media_id AND media_type = 'story'
        )
        WHERE id = OLD.media_id AND OLD.media_type = 'story';
        
        UPDATE edit_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = OLD.media_id AND media_type = 'edit'
        )
        WHERE id = OLD.media_id AND OLD.media_type = 'edit';
        
        UPDATE parallel_self_media 
        SET likes_count = (
            SELECT COUNT(*) FROM likes 
            WHERE media_id = OLD.media_id AND media_type = 'parallel_self'
        )
        WHERE id = OLD.media_id AND OLD.media_type = 'parallel_self';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_likes_count();

-- ========================================
-- STEP 3: Update indexes
-- ========================================

-- Drop old indexes that reference neo_glitch_media
DROP INDEX IF EXISTS idx_neo_glitch_media_stability_job_id;
DROP INDEX IF EXISTS idx_neo_glitch_media_status;
DROP INDEX IF EXISTS idx_neo_glitch_media_user_id_created_at;
DROP INDEX IF EXISTS idx_neo_glitch_media_preset;
DROP INDEX IF EXISTS idx_neo_glitch_media_3d;

-- Create new indexes for cyber_siren_media
CREATE INDEX IF NOT EXISTS idx_cyber_siren_media_stability_job_id ON cyber_siren_media(stability_job_id);
CREATE INDEX IF NOT EXISTS idx_cyber_siren_media_status ON cyber_siren_media(status);
CREATE INDEX IF NOT EXISTS idx_cyber_siren_media_user_id_created_at ON cyber_siren_media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cyber_siren_media_preset ON cyber_siren_media(preset);
CREATE INDEX IF NOT EXISTS idx_cyber_siren_media_3d ON cyber_siren_media(obj_url, gltf_url) WHERE obj_url IS NOT NULL OR gltf_url IS NOT NULL;

-- ========================================
-- STEP 4: Add likes_count column to cyber_siren_media if missing
-- ========================================

ALTER TABLE cyber_siren_media ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- ========================================
-- STEP 5: Update existing likes_count values
-- ========================================

UPDATE cyber_siren_media 
SET likes_count = (
    SELECT COUNT(*) FROM likes 
    WHERE media_id = cyber_siren_media.id AND media_type = 'cyber_siren'
);

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify the table exists and has the correct structure
SELECT table_name FROM information_schema.tables WHERE table_name = 'cyber_siren_media';

-- Verify constraints are updated
SELECT conname, consrc FROM pg_constraint WHERE conname LIKE '%media_type_check%';

-- Verify indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'cyber_siren_media';

-- Check for any remaining neo_glitch references
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE indexname LIKE '%neo_glitch%';

-- Verify trigger exists
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'update_likes_count_trigger';
