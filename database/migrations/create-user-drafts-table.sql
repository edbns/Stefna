-- Create user_drafts table for saving draft compositions
-- This table stores user's draft compositions before they generate the final media

CREATE TABLE IF NOT EXISTS user_drafts (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
    aspect_ratio DECIMAL(5,2) DEFAULT 1.33,
    width INTEGER DEFAULT 800,
    height INTEGER DEFAULT 600,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_drafts_user_id ON user_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drafts_created_at ON user_drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_drafts_media_type ON user_drafts(media_type);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_drafts_updated_at
    BEFORE UPDATE ON user_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_drafts_updated_at();
