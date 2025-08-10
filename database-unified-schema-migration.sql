-- Stefna Unified Schema Migration
-- This script migrates existing tables to support separate uploads vs generated content
-- with a unified read model

-- Step 1: Check and fix existing tables
DO $$
BEGIN
  -- Check if assets table exists and has correct schema
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets') THEN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'resource_type') THEN
      ALTER TABLE assets ADD COLUMN resource_type VARCHAR(10) DEFAULT 'image';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'meta') THEN
      ALTER TABLE assets ADD COLUMN meta JSONB;
    END IF;
    
    -- Ensure user_id is TEXT type
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'assets' 
      AND column_name = 'user_id' 
      AND data_type = 'uuid'
    ) THEN
      ALTER TABLE assets ALTER COLUMN user_id TYPE TEXT USING user_id::text;
      RAISE NOTICE 'Changed assets.user_id from UUID to TEXT';
    END IF;
  ELSE
    -- Create assets table if it doesn't exist
    CREATE TABLE assets (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      url TEXT NOT NULL,
      public_id TEXT,
      resource_type VARCHAR(10) NOT NULL DEFAULT 'image' CHECK (resource_type IN ('image', 'video')),
      folder TEXT,
      bytes INTEGER,
      width INTEGER,
      height INTEGER,
      duration REAL,
      meta JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Created assets table';
  END IF;
END $$;

-- Step 2: Ensure media_assets table has correct schema for generated content
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_assets') THEN
    -- Add missing columns for generated content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'result_url') THEN
      ALTER TABLE media_assets ADD COLUMN result_url TEXT;
      -- Migrate existing url to result_url for generated content
      UPDATE media_assets SET result_url = url WHERE result_url IS NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'source_url') THEN
      ALTER TABLE media_assets ADD COLUMN source_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'parent_asset_id') THEN
      ALTER TABLE media_assets ADD COLUMN parent_asset_id UUID REFERENCES media_assets(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'prompt') THEN
      ALTER TABLE media_assets ADD COLUMN prompt TEXT DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'visibility') THEN
      ALTER TABLE media_assets ADD COLUMN visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'allow_remix') THEN
      ALTER TABLE media_assets ADD COLUMN allow_remix BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'metadata') THEN
      ALTER TABLE media_assets ADD COLUMN metadata JSONB;
    END IF;
    
    -- Ensure user_id is TEXT type
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'media_assets' 
      AND column_name = 'user_id' 
      AND data_type = 'uuid'
    ) THEN
      ALTER TABLE media_assets ALTER COLUMN user_id TYPE TEXT USING user_id::text;
      RAISE NOTICE 'Changed media_assets.user_id from UUID to TEXT';
    END IF;
  ELSE
    -- Create media_assets table if it doesn't exist
    CREATE TABLE media_assets (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      result_url TEXT NOT NULL,           -- AI-generated output
      source_url TEXT,                    -- Original upload URL (for I2I/V2V)
      parent_asset_id UUID REFERENCES media_assets(id), -- For remixes
      prompt TEXT NOT NULL DEFAULT '',
      resource_type VARCHAR(10) NOT NULL CHECK (resource_type IN ('image', 'video')),
      visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
      allow_remix BOOLEAN DEFAULT false,
      public_id TEXT,
      folder TEXT,
      bytes INTEGER,
      width INTEGER,
      height INTEGER,
      duration REAL,
      metadata JSONB,                    -- AI model info, settings, etc.
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Created media_assets table';
  END IF;
END $$;

-- Step 3: Create or replace the unified view
DROP VIEW IF EXISTS user_all_media;

CREATE VIEW user_all_media AS
SELECT 
  'upload' as kind,
  id,
  user_id,
  url,
  resource_type,
  created_at,
  'private' as visibility,
  false as allow_remix,
  null as prompt,
  null as parent_asset_id,
  null as result_url,
  null as source_url
FROM assets
UNION ALL
SELECT 
  'generated' as kind,
  id,
  user_id,
  result_url as url,
  resource_type,
  created_at,
  visibility,
  allow_remix,
  prompt,
  parent_asset_id,
  result_url,
  source_url
FROM media_assets;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_resource_type ON assets(resource_type);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);

CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_resource_type ON media_assets(resource_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_visibility ON media_assets(visibility);
CREATE INDEX IF NOT EXISTS idx_media_assets_parent_asset_id ON media_assets(parent_asset_id);

-- Step 5: Enable RLS and create policies
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Assets policies (uploads are always private)
DROP POLICY IF EXISTS "Users can view own assets" ON assets;
CREATE POLICY "Users can view own assets" ON assets
  FOR SELECT USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

DROP POLICY IF EXISTS "Users can insert own assets" ON assets;
CREATE POLICY "Users can insert own assets" ON assets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

DROP POLICY IF EXISTS "Users can update own assets" ON assets;
CREATE POLICY "Users can update own assets" ON assets
  FOR UPDATE USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

DROP POLICY IF EXISTS "Users can delete own assets" ON assets;
CREATE POLICY "Users can delete own assets" ON assets
  FOR DELETE USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

-- Media assets policies (can be public/private)
DROP POLICY IF EXISTS "Users can view media assets" ON media_assets;
CREATE POLICY "Users can view media assets" ON media_assets
  FOR SELECT USING (
    visibility = 'public' OR 
    auth.uid()::text = user_id OR 
    user_id LIKE 'guest-%'
  );

DROP POLICY IF EXISTS "Users can insert own media assets" ON media_assets;
CREATE POLICY "Users can insert own media assets" ON media_assets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

DROP POLICY IF EXISTS "Users can update own media assets" ON media_assets;
CREATE POLICY "Users can update own media assets" ON media_assets
  FOR UPDATE USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

DROP POLICY IF EXISTS "Users can delete own media assets" ON media_assets;
CREATE POLICY "Users can delete own media assets" ON media_assets
  FOR DELETE USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

-- Step 6: Create trigger for updated_at on media_assets
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_media_assets_updated_at ON media_assets;
CREATE TRIGGER update_media_assets_updated_at 
  BEFORE UPDATE ON media_assets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Grant permissions
GRANT SELECT ON user_all_media TO authenticated;
GRANT SELECT ON assets TO authenticated;
GRANT SELECT ON media_assets TO authenticated;

-- Step 8: Verify the setup
SELECT 'Migration completed successfully!' as status;
SELECT 'Tables:' as info;
SELECT table_name, table_type FROM information_schema.tables WHERE table_name IN ('assets', 'media_assets', 'user_all_media') ORDER BY table_name;
SELECT 'View columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_all_media' ORDER BY ordinal_position;
