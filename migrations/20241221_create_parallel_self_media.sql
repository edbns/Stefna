-- ============================================================================
-- PARALLEL SELF MODE DATABASE MIGRATION
-- ============================================================================
-- Creates complete database structure for Parallel Self mode
-- Following the exact same pattern as unreal_reflection_media
-- ============================================================================

-- Step 1: Create the parallel_self_media table with complete schema
CREATE TABLE IF NOT EXISTS parallel_self_media (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    source_url TEXT,
    prompt TEXT NOT NULL,
    preset TEXT DEFAULT 'default' NOT NULL,
    run_id TEXT,
    fal_job_id TEXT,
    status TEXT DEFAULT 'processing' NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 3D model support (same as unreal_reflection_media)
    obj_url TEXT,
    gltf_url TEXT,
    texture_url TEXT,
    model_3d_metadata JSONB DEFAULT '{}',
    
    -- Likes system (same as unreal_reflection_media)
    likes_count INTEGER DEFAULT 0 NOT NULL CHECK (likes_count >= 0)
);

-- Step 2: Create indexes for performance (same as unreal_reflection_media)
CREATE INDEX IF NOT EXISTS idx_parallel_self_media_user_id ON parallel_self_media(user_id);
CREATE INDEX IF NOT EXISTS idx_parallel_self_media_run_id ON parallel_self_media(run_id);
CREATE INDEX IF NOT EXISTS idx_parallel_self_media_created_at ON parallel_self_media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parallel_self_media_status ON parallel_self_media(status);
CREATE INDEX IF NOT EXISTS idx_parallel_self_media_preset ON parallel_self_media(preset);

-- Step 3: Create 3D model indexes (same as unreal_reflection_media)
CREATE INDEX IF NOT EXISTS idx_parallel_self_media_3d ON parallel_self_media(obj_url, gltf_url) WHERE obj_url IS NOT NULL OR gltf_url IS NOT NULL;

-- Step 4: Create trigger for likes_count updates (same as unreal_reflection_media)
CREATE OR REPLACE FUNCTION update_parallel_self_media_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE parallel_self_media SET likes_count = likes_count + 1 WHERE id = NEW.media_id AND NEW.media_type = 'parallel_self';
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE parallel_self_media SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.media_id AND OLD.media_type = 'parallel_self';
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create triggers for likes_count updates
CREATE TRIGGER update_parallel_self_media_likes_count_insert
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_parallel_self_media_likes_count();

CREATE TRIGGER update_parallel_self_media_likes_count_delete
    AFTER DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_parallel_self_media_likes_count();

-- Step 6: Update user total_likes_received trigger to include parallel_self
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
                UNION ALL
                SELECT user_id FROM parallel_self_media WHERE id = NEW.media_id AND NEW.media_type = 'parallel_self'
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
                SELECT user_id FROM presets_media WHERE id = OLD.media_id AND NEW.media_type = 'presets'
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

-- Step 7: Add parallel_self to likes table constraint (if it exists)
DO $$ 
BEGIN
    -- Check if the constraint exists and update it
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'likes_media_type_check' 
        AND contype = 'c'
    ) THEN
        -- Drop the old constraint
        ALTER TABLE likes DROP CONSTRAINT likes_media_type_check;
        
        -- Add the new constraint with parallel_self included
        ALTER TABLE likes ADD CONSTRAINT likes_media_type_check 
            CHECK (media_type IN ('custom_prompt', 'unreal_reflection', 'ghibli_reaction', 'neo_glitch', 'presets', 'story', 'edit', 'parallel_self'));
        
        RAISE NOTICE 'Updated likes_media_type_check constraint to include parallel_self';
    ELSE
        RAISE NOTICE 'likes_media_type_check constraint does not exist, skipping update';
    END IF;
END $$;

-- Step 8: Add parallel_self to credits_ledger constraint (if it exists)
DO $$ 
BEGIN
    -- Check if the constraint exists and update it
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'credits_ledger_media_type_check' 
        AND contype = 'c'
    ) THEN
        -- Drop the old constraint
        ALTER TABLE credits_ledger DROP CONSTRAINT credits_ledger_media_type_check;
        
        -- Add the new constraint with parallel_self included
        ALTER TABLE credits_ledger ADD CONSTRAINT credits_ledger_media_type_check 
            CHECK (media_type IN ('custom_prompt', 'unreal_reflection', 'ghibli_reaction', 'neo_glitch', 'presets', 'story', 'edit', 'parallel_self'));
        
        RAISE NOTICE 'Updated credits_ledger_media_type_check constraint to include parallel_self';
    ELSE
        RAISE NOTICE 'credits_ledger_media_type_check constraint does not exist, skipping update';
    END IF;
END $$;

-- Step 9: Verify the table was created successfully
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'parallel_self_media'
    ) THEN
        RAISE NOTICE '✅ parallel_self_media table created successfully';
        
        -- Check if all required columns exist
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'parallel_self_media' 
            AND column_name = 'likes_count'
        ) THEN
            RAISE NOTICE '✅ likes_count column exists';
        ELSE
            RAISE NOTICE '❌ likes_count column missing';
        END IF;
        
        -- Check if 3D columns exist
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'parallel_self_media' 
            AND column_name = 'obj_url'
        ) THEN
            RAISE NOTICE '✅ 3D model columns exist';
        ELSE
            RAISE NOTICE '❌ 3D model columns missing';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ parallel_self_media table creation failed';
    END IF;
END $$;

-- Step 10: Verify triggers were created
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_parallel_self_media_likes_count_insert'
    ) THEN
        RAISE NOTICE '✅ Parallel Self likes_count insert trigger is active';
    ELSE
        RAISE NOTICE '❌ Parallel Self likes_count insert trigger is missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_parallel_self_media_likes_count_delete'
    ) THEN
        RAISE NOTICE '✅ Parallel Self likes_count delete trigger is active';
    ELSE
        RAISE NOTICE '❌ Parallel Self likes_count delete trigger is missing';
    END IF;
END $$;
