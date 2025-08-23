-- Neo Tokyo Glitch Dedicated Media Table
-- Clean, focused architecture for long-term stability

CREATE TABLE IF NOT EXISTS neo_glitch_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preset_key TEXT NOT NULL CHECK (preset_key IN ('base', 'visor', 'scanlines', 'glitch', 'cyberpunk')),
  source_url TEXT NOT NULL, -- Cloudinary source image URL
  output_url TEXT, -- Cloudinary output image URL (after Replicate generation)
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'processing', 'failed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  replicate_job_id TEXT, -- For debugging/tracking Replicate jobs
  generation_meta JSONB DEFAULT '{}', -- prompt, strength, params, etc.
  error_message TEXT, -- For failed generations
  UNIQUE (user_id, source_url) -- Prevent duplicate generations of same source
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_neo_glitch_media_user_id ON neo_glitch_media(user_id);
CREATE INDEX IF NOT EXISTS idx_neo_glitch_media_status ON neo_glitch_media(status);
CREATE INDEX IF NOT EXISTS idx_neo_glitch_media_created_at ON neo_glitch_media(created_at);
CREATE INDEX IF NOT EXISTS idx_neo_glitch_media_preset_key ON neo_glitch_media(preset_key);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_neo_glitch_media_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_neo_glitch_media_updated_at ON neo_glitch_media;
CREATE TRIGGER trigger_neo_glitch_media_updated_at 
  BEFORE UPDATE ON neo_glitch_media 
  FOR EACH ROW EXECUTE FUNCTION update_neo_glitch_media_updated_at();

-- Create view for public feed (Neo Tokyo Glitch items only)
CREATE OR REPLACE VIEW public_feed_neo_glitch AS
SELECT 
  ngm.id,
  ngm.user_id,
  ngm.preset_key,
  ngm.output_url as final_url,
  ngm.status,
  ngm.generation_meta,
  ngm.created_at
FROM neo_glitch_media ngm
WHERE ngm.status = 'completed' 
  AND ngm.output_url IS NOT NULL
ORDER BY ngm.created_at DESC;

-- Create view for user profile (Neo Tokyo Glitch items only)
CREATE OR REPLACE VIEW user_profile_neo_glitch AS
SELECT 
  ngm.id,
  ngm.user_id,
  ngm.preset_key,
  ngm.output_url as final_url,
  ngm.status,
  ngm.generation_meta,
  ngm.created_at,
  ngm.updated_at
FROM neo_glitch_media ngm
WHERE ngm.status = 'completed' 
  AND ngm.output_url IS NOT NULL
ORDER BY ngm.created_at DESC;

-- Add comments for documentation
COMMENT ON TABLE neo_glitch_media IS 'Dedicated table for Neo Tokyo Glitch media with clean architecture';
COMMENT ON COLUMN neo_glitch_media.preset_key IS 'Neo Tokyo Glitch preset type (base, visor, scanlines, etc.)';
COMMENT ON COLUMN neo_glitch_media.source_url IS 'Cloudinary URL of source image uploaded by user';
COMMENT ON COLUMN neo_glitch_media.output_url IS 'Cloudinary URL of generated Neo Tokyo Glitch image';
COMMENT ON COLUMN neo_glitch_media.replicate_job_id IS 'Replicate API job ID for tracking and debugging';
COMMENT ON COLUMN neo_glitch_media.generation_meta IS 'JSON containing prompt, strength, and other generation parameters';
