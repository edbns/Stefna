-- Add Missing Database Views for Stefna (Corrected Version)
-- Copy and paste this entire script into Supabase SQL Editor

-- Step 1: Add missing columns to media_assets table
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS result_url TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS job_id TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS mode TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS negative_prompt TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS strength NUMERIC(3,2);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS env TEXT DEFAULT 'prod';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS allow_remix BOOLEAN DEFAULT FALSE;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS parent_asset_id UUID REFERENCES media_assets(id);
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS remix_count INTEGER DEFAULT 0;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- Step 2: Create interaction tables if they don't exist
CREATE TABLE IF NOT EXISTS media_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_id, user_id)
);

CREATE TABLE IF NOT EXISTS media_remixes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_id, user_id)
);

CREATE TABLE IF NOT EXISTS media_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_id, user_id)
);

-- Step 3: Enable RLS on interaction tables
ALTER TABLE media_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_remixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_shares ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies (only if they don't exist)
DO $$
BEGIN
  -- media_likes policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_likes' AND policyname = 'Users can view all likes') THEN
    CREATE POLICY "Users can view all likes" ON media_likes FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_likes' AND policyname = 'Users can insert own likes') THEN
    CREATE POLICY "Users can insert own likes" ON media_likes FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_likes' AND policyname = 'Users can delete own likes') THEN
    CREATE POLICY "Users can delete own likes" ON media_likes FOR DELETE USING (true);
  END IF;
  
  -- media_remixes policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_remixes' AND policyname = 'Users can view all remixes') THEN
    CREATE POLICY "Users can view all remixes" ON media_remixes FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_remixes' AND policyname = 'Users can insert own remixes') THEN
    CREATE POLICY "Users can insert own remixes" ON media_remixes FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_remixes' AND policyname = 'Users can delete own remixes') THEN
    CREATE POLICY "Users can delete own remixes" ON media_remixes FOR DELETE USING (true);
  END IF;
  
  -- media_shares policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_shares' AND policyname = 'Users can view all shares') THEN
    CREATE POLICY "Users can view all shares" ON media_shares FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_shares' AND policyname = 'Users can insert own shares') THEN
    CREATE POLICY "Users can insert own shares" ON media_shares FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_shares' AND policyname = 'Users can delete own shares') THEN
    CREATE POLICY "Users can delete own shares" ON media_shares FOR DELETE USING (true);
  END IF;
END $$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_likes_media_id ON media_likes(media_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_user_id ON media_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_media_remixes_media_id ON media_remixes(media_id);
CREATE INDEX IF NOT EXISTS idx_media_remixes_user_id ON media_remixes(user_id);
CREATE INDEX IF NOT EXISTS idx_media_shares_media_id ON media_shares(media_id);
CREATE INDEX IF NOT EXISTS idx_media_shares_user_id ON media_shares(user_id);

-- Step 6: Create the user_media_with_counts view
CREATE OR REPLACE VIEW user_media_with_counts AS
SELECT 
  ma.*,
  COALESCE(ml.count, 0) as likes_count,
  COALESCE(mr.count, 0) as remixes_count,
  COALESCE(ms.count, 0) as shares_count
FROM media_assets ma
LEFT JOIN (
  SELECT media_id, COUNT(*) as count
  FROM media_likes
  GROUP BY media_id
) ml ON ma.id = ml.media_id
LEFT JOIN (
  SELECT media_id, COUNT(*) as count
  FROM media_remixes
  GROUP BY media_id
) mr ON ma.id = mr.media_id
LEFT JOIN (
  SELECT media_id, COUNT(*) as count
  FROM media_shares
  GROUP BY media_id
) ms ON ma.id = ms.media_id;

-- Step 7: Create the public_media_with_counts view
CREATE OR REPLACE VIEW public_media_with_counts AS
SELECT 
  ma.*,
  COALESCE(ml.count, 0) as likes_count,
  COALESCE(mr.count, 0) as remixes_count,
  COALESCE(ms.count, 0) as shares_count
FROM media_assets ma
LEFT JOIN (
  SELECT media_id, COUNT(*) as count
  FROM media_likes
  GROUP BY media_id
) ml ON ma.id = ml.media_id
LEFT JOIN (
  SELECT media_id, COUNT(*) as count
  FROM media_remixes
  GROUP BY media_id
) mr ON ma.id = mr.media_id
LEFT JOIN (
  SELECT media_id, COUNT(*) as count
  FROM media_shares
  GROUP BY media_id
) ms ON ma.id = ms.media_id
WHERE ma.visibility = 'public';

-- Step 8: Grant permissions on views
GRANT SELECT ON user_media_with_counts TO authenticated;
GRANT SELECT ON public_media_with_counts TO authenticated;

-- Step 9: Check results
SELECT 'Views created successfully!' as status;
SELECT 'user_media_with_counts' as view_name, COUNT(*) as row_count FROM user_media_with_counts
UNION ALL
SELECT 'public_media_with_counts' as view_name, COUNT(*) as row_count FROM public_media_with_counts;
