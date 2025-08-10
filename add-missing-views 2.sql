-- Add Missing Tables and Views for Netlify Functions
-- Run this in Supabase SQL Editor after the main migration

-- Step 1: Create missing interaction tables
CREATE TABLE IF NOT EXISTS media_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  parent_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, parent_asset_id)
);

CREATE TABLE IF NOT EXISTS media_remixes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  parent_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  remix_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, parent_asset_id, remix_asset_id)
);

CREATE TABLE IF NOT EXISTS media_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  parent_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, parent_asset_id)
);

-- Step 2: Enable RLS on interaction tables
ALTER TABLE media_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_remixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_shares ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies for interaction tables
CREATE POLICY "Users can view all likes" ON media_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON media_likes FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'guest-%');
CREATE POLICY "Users can delete own likes" ON media_likes FOR DELETE USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

CREATE POLICY "Users can view all remixes" ON media_remixes FOR SELECT USING (true);
CREATE POLICY "Users can insert own remixes" ON media_remixes FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'guest-%');
CREATE POLICY "Users can delete own remixes" ON media_remixes FOR DELETE USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

CREATE POLICY "Users can view all shares" ON media_shares FOR SELECT USING (true);
CREATE POLICY "Users can insert own shares" ON media_shares FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'guest-%');
CREATE POLICY "Users can delete own shares" ON media_shares FOR DELETE USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_likes_parent_asset ON media_likes(parent_asset_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_user_id ON media_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_media_remixes_parent_asset ON media_remixes(parent_asset_id);
CREATE INDEX IF NOT EXISTS idx_media_remixes_user_id ON media_remixes(user_id);
CREATE INDEX IF NOT EXISTS idx_media_shares_parent_asset ON media_shares(parent_asset_id);
CREATE INDEX IF NOT EXISTS idx_media_shares_user_id ON media_shares(user_id);

-- Step 5: Create public_media_with_counts view (for getPublicFeed)
CREATE OR REPLACE VIEW public_media_with_counts AS
SELECT 
  ma.*,
  COALESCE(ml.likes_count, 0) as likes_count,
  COALESCE(mr.remixes_count, 0) as remixes_count,
  COALESCE(ms.shares_count, 0) as shares_count
FROM media_assets ma
LEFT JOIN (
  SELECT parent_asset_id, COUNT(*) as likes_count
  FROM media_likes 
  GROUP BY parent_asset_id
) ml ON ma.id = ml.parent_asset_id
LEFT JOIN (
  SELECT parent_asset_id, COUNT(*) as remixes_count
  FROM media_remixes 
  GROUP BY parent_asset_id
) mr ON ma.id = mr.parent_asset_id
LEFT JOIN (
  SELECT parent_asset_id, COUNT(*) as shares_count
  FROM media_shares 
  GROUP BY parent_asset_id
) ms ON ma.id = ms.parent_asset_id
WHERE ma.visibility = 'public';

-- Step 6: Create user_media_with_counts view (for getUserMedia)
CREATE OR REPLACE VIEW user_media_with_counts AS
SELECT 
  ma.*,
  COALESCE(ml.likes_count, 0) as likes_count,
  COALESCE(mr.remixes_count, 0) as remixes_count,
  COALESCE(ms.shares_count, 0) as shares_count
FROM media_assets ma
LEFT JOIN (
  SELECT parent_asset_id, COUNT(*) as likes_count
  FROM media_likes 
  GROUP BY parent_asset_id
) ml ON ma.id = ml.parent_asset_id
LEFT JOIN (
  SELECT parent_asset_id, COUNT(*) as remixes_count
  FROM media_remixes 
  GROUP BY parent_asset_id
) mr ON ma.id = mr.parent_asset_id
LEFT JOIN (
  SELECT parent_asset_id, COUNT(*) as shares_count
  FROM media_shares 
  GROUP BY parent_asset_id
) ms ON ma.id = ms.parent_asset_id
WHERE ma.user_id = auth.uid()::text OR ma.user_id LIKE 'guest-%';

-- Step 7: Grant permissions on views
GRANT SELECT ON public_media_with_counts TO authenticated;
GRANT SELECT ON user_media_with_counts TO authenticated;

-- Step 8: Check results
SELECT 'All missing tables and views created successfully!' as status;
