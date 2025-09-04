-- Create drafts table for user draft media
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_drafts_user_id ON user_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drafts_created_at ON user_drafts(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_drafts_updated_at
  BEFORE UPDATE ON user_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_drafts_updated_at();
