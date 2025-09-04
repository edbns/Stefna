-- Create edit_media table for Edit My Photo mode
CREATE TABLE IF NOT EXISTS edit_media (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  source_url TEXT,
  prompt TEXT NOT NULL,
  run_id UUID NOT NULL UNIQUE,
  fal_job_id TEXT,
  status TEXT DEFAULT 'completed',
  metadata JSONB,
  additional_images JSONB, -- Array of additional image URLs used in the edit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_edit_media_user_id ON edit_media(user_id);

-- Create index on run_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_edit_media_run_id ON edit_media(run_id);

-- Create index on created_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_edit_media_created_at ON edit_media(created_at DESC);
