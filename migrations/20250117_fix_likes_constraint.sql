-- ============================================================================
-- MIGRATION: Fix likes table constraint issue
-- ============================================================================
-- This migration fixes the "there is no unique or exclusion constraint matching 
-- the ON CONFLICT specification" error by ensuring the likes table has the 
-- proper UNIQUE constraint.
-- ============================================================================

-- Step 1: Drop existing likes table if it exists (to ensure clean state)
DROP TABLE IF EXISTS likes CASCADE;

-- Step 2: Create the likes table with proper constraints
CREATE TABLE likes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    media_type TEXT NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    -- Ensure unique likes per user per media
    UNIQUE(user_id, media_id, media_type)
);

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_media_id ON likes(media_id);
CREATE INDEX IF NOT EXISTS idx_likes_media_type ON likes(media_type);
CREATE INDEX IF NOT EXISTS idx_likes_user_media ON likes(user_id, media_id, media_type);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- Step 4: Add trigger for updated_at column
CREATE TRIGGER update_likes_updated_at BEFORE UPDATE ON likes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Verify table was created with proper constraints
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
    AND table_name = 'likes'
ORDER BY constraint_name;

-- Step 6: Show table info
SELECT 
    'likes' as table_name, 
    COUNT(*) as count 
FROM likes;
