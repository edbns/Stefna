-- Add missing columns for save-media and save-media-batch functions
-- Run this in your database to fix the "column media_type does not exist" error

-- Add the new columns used by save-media(+batch)
ALTER TABLE media ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image';
ALTER TABLE media ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS final_url TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

-- Optional but useful for future batches/runs
ALTER TABLE media ADD COLUMN IF NOT EXISTS run_id TEXT;
CREATE INDEX IF NOT EXISTS media_user_run_idx ON media(user_id, run_id);

-- Optional if you later group saves
CREATE TABLE IF NOT EXISTS media_batches (
  batch_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  run_id TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'media' 
ORDER BY ordinal_position;
