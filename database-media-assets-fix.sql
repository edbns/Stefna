-- Fix for media_assets table to support text-based user IDs
-- This addresses the "record-asset returns 400 (DB schema mismatch)" issue

-- Create media_assets table if it doesn't exist, or alter existing table
-- First, try to create the table with the correct schema
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,  -- Changed from UUID to TEXT to support both UUIDs and guest IDs like 'guest-1723...'
  url TEXT NOT NULL,
  public_id TEXT,
  resource_type VARCHAR(10) NOT NULL CHECK (resource_type IN ('image', 'video')),
  folder TEXT,
  bytes INTEGER,
  width INTEGER,
  height INTEGER,
  duration REAL,  -- For videos
  meta JSONB,     -- Flexible metadata storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table already exists and user_id is UUID, alter it to TEXT
-- Note: Run this in your Supabase SQL editor if the table already exists
DO $$
BEGIN
  -- Check if user_id column exists and is UUID type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'media_assets' 
    AND column_name = 'user_id' 
    AND data_type = 'uuid'
  ) THEN
    -- Alter the column type to TEXT
    ALTER TABLE media_assets ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    RAISE NOTICE 'Changed media_assets.user_id from UUID to TEXT';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_resource_type ON media_assets(resource_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at);

-- Composite index for user's media by type
CREATE INDEX IF NOT EXISTS idx_media_assets_user_type ON media_assets(user_id, resource_type);

-- RLS (Row Level Security) policies if needed
-- Enable RLS
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own media
CREATE POLICY "Users can view own media" ON media_assets
  FOR SELECT USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

-- Policy: Users can insert their own media  
CREATE POLICY "Users can insert own media" ON media_assets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

-- Policy: Users can update their own media
CREATE POLICY "Users can update own media" ON media_assets
  FOR UPDATE USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

-- Policy: Users can delete their own media
CREATE POLICY "Users can delete own media" ON media_assets
  FOR DELETE USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

-- Optional: Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_media_assets_updated_at BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
