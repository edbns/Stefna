-- Create Neo Tokyo Glitch dedicated table
-- This serves as the canonical source for all glitch generations
-- and eliminates the duplicate/desync issues

CREATE TABLE IF NOT EXISTS media_assets_glitch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  preset_key TEXT NOT NULL,
  prompt TEXT NOT NULL,
  replicate_url TEXT, -- Temporary Replicate URL
  cloudinary_url TEXT, -- Permanent Cloudinary URL (canonical)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  meta JSONB DEFAULT '{}',
  input_hash TEXT NOT NULL, -- SHA256 hash for deduplication
  source_asset_id TEXT, -- Reference to source image
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique constraint for deduplication
  UNIQUE (user_id, input_hash)
);

-- Add comment for documentation
COMMENT ON TABLE media_assets_glitch IS 'Canonical table for Neo Tokyo Glitch generations with deduplication and permanent URL storage';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_media_assets_glitch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_media_assets_glitch_updated_at
  BEFORE UPDATE ON media_assets_glitch
  FOR EACH ROW
  EXECUTE FUNCTION update_media_assets_glitch_updated_at();

-- Create indexes for performance
CREATE INDEX idx_media_assets_glitch_user_id ON media_assets_glitch(user_id);
CREATE INDEX idx_media_assets_glitch_run_id ON media_assets_glitch(run_id);
CREATE INDEX idx_media_assets_glitch_status ON media_assets_glitch(status);
CREATE INDEX idx_media_assets_glitch_created_at ON media_assets_glitch(created_at);
CREATE INDEX idx_media_assets_glitch_input_hash ON media_assets_glitch(input_hash);

-- Create function to generate input hash
CREATE OR REPLACE FUNCTION generate_glitch_input_hash(
  p_prompt TEXT,
  p_preset_key TEXT,
  p_source_asset_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
BEGIN
  -- Generate SHA256 hash of input parameters for deduplication
  RETURN encode(sha256(
    (p_prompt || '|' || p_preset_key || '|' || COALESCE(p_source_asset_id, ''))::bytea
  ), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create view for public feed (glitch items only)
CREATE OR REPLACE VIEW public_feed_glitch AS
SELECT 
  mag.id,
  mag.user_id,
  mag.preset_key,
  mag.prompt,
  mag.cloudinary_url as final_url,
  mag.status,
  mag.meta,
  mag.created_at,
  u.username,
  u.avatar_url
FROM media_assets_glitch mag
JOIN users u ON mag.user_id = u.id
WHERE mag.status = 'completed' 
  AND mag.cloudinary_url IS NOT NULL
ORDER BY mag.created_at DESC;

-- Create view for user profile (glitch items only)
CREATE OR REPLACE VIEW user_profile_glitch AS
SELECT 
  mag.id,
  mag.user_id,
  mag.preset_key,
  mag.prompt,
  mag.cloudinary_url as final_url,
  mag.status,
  mag.meta,
  mag.created_at,
  mag.updated_at
FROM media_assets_glitch mag
WHERE mag.status = 'completed' 
  AND mag.cloudinary_url IS NOT NULL
ORDER BY mag.created_at DESC;
