-- ============================================================================
-- MIGRATION: Add missing likes and edit_media tables
-- ============================================================================
-- This migration adds the missing tables that are causing the like functionality
-- to fail with 400 errors. The issues are:
-- 1. Missing 'likes' table (causing toggleLike 400 errors)
-- 2. Missing 'edit_media' table (causing edit mode like errors)
-- 3. Need to ensure proper like counting
-- ============================================================================

-- Step 1: Create the likes table
CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type TEXT NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    -- Ensure unique likes per user per media
    UNIQUE(user_id, media_id, media_type)
);

-- Step 2: Create the edit_media table (missing from main schema)
CREATE TABLE IF NOT EXISTS edit_media (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT, -- Nullable: populated when job completes
    source_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    preset TEXT NOT NULL DEFAULT 'edit',
    run_id TEXT, -- Nullable: populated when AI generation starts
    fal_job_id TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    status TEXT DEFAULT 'completed',
    metadata JSONB DEFAULT '{}',
    -- Additional columns for compatibility
    stability_job_id TEXT,
    preset_week INTEGER,
    preset_rotation_index INTEGER,
    is_currently_available BOOLEAN DEFAULT TRUE
);

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_media_id ON likes(media_id);
CREATE INDEX IF NOT EXISTS idx_likes_media_type ON likes(media_type);
CREATE INDEX IF NOT EXISTS idx_likes_user_media ON likes(user_id, media_id, media_type);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_edit_media_status ON edit_media(status);
CREATE INDEX IF NOT EXISTS idx_edit_media_user_id_created_at ON edit_media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edit_media_fal_job_id ON edit_media(fal_job_id);
CREATE INDEX IF NOT EXISTS idx_edit_media_preset ON edit_media(preset);

-- Step 4: Add triggers for updated_at columns
CREATE TRIGGER update_likes_updated_at BEFORE UPDATE ON likes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_edit_media_updated_at BEFORE UPDATE ON edit_media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Verify tables were created
SELECT 
    table_name,
    'CREATED' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('likes', 'edit_media')
ORDER BY table_name;

-- Step 6: Show table counts
SELECT 
    'likes' as table_name, COUNT(*) as count FROM likes
UNION ALL
SELECT 'edit_media', COUNT(*) FROM edit_media;
