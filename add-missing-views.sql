-- Add Missing Database Views for Stefna
-- Copy and paste this entire script into Supabase SQL Editor

-- Step 1: Create interaction tables if they don't exist
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

-- Step 2: Enable RLS on interaction tables
ALTER TABLE media_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_remixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_shares ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies for interaction tables
CREATE POLICY "Users can view all likes" ON media_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON media_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own likes" ON media_likes FOR DELETE USING (true);

CREATE POLICY "Users can view all remixes" ON media_remixes FOR SELECT USING (true);
CREATE POLICY "Users can insert own remixes" ON media_remixes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own remixes" ON media_remixes FOR DELETE USING (true);

CREATE POLICY "Users can view all shares" ON media_shares FOR SELECT USING (true);
CREATE POLICY "Users can insert own shares" ON media_shares FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own shares" ON media_shares FOR DELETE USING (true);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_likes_media_id ON media_likes(media_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_user_id ON media_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_media_remixes_media_id ON media_remixes(media_id);
CREATE INDEX IF NOT EXISTS idx_media_remixes_user_id ON media_remixes(user_id);
CREATE INDEX IF NOT EXISTS idx_media_shares_media_id ON media_shares(media_id);
CREATE INDEX IF NOT EXISTS idx_media_shares_user_id ON media_shares(user_id);

-- Step 5: Create the user_media_with_counts view
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

-- Step 6: Create the public_media_with_counts view
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

-- Step 7: Grant permissions on views
GRANT SELECT ON user_media_with_counts TO authenticated;
GRANT SELECT ON public_media_with_counts TO authenticated;

-- Step 8: Check results
SELECT 'Views created successfully!' as status;
SELECT 'user_media_with_counts' as view_name, COUNT(*) as row_count FROM user_media_with_counts
UNION ALL
SELECT 'public_media_with_counts' as view_name, COUNT(*) as row_count FROM public_media_with_counts;
