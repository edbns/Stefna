-- Ultra-Simple Database Views Fix for Stefna
-- Copy and paste this entire script into Supabase SQL Editor

-- Step 1: Create the user_media_with_counts view (simplified - no interaction tables needed)
CREATE OR REPLACE VIEW user_media_with_counts AS
SELECT 
  ma.*,
  0 as likes_count,
  0 as remixes_count,
  0 as shares_count
FROM media_assets ma;

-- Step 2: Create the public_media_with_counts view (simplified - no interaction tables needed)
CREATE OR REPLACE VIEW public_media_with_counts AS
SELECT 
  ma.*,
  0 as likes_count,
  0 as remixes_count,
  0 as shares_count
FROM media_assets ma
WHERE ma.visibility = 'public' OR ma.visibility IS NULL;

-- Step 3: Grant permissions on views
GRANT SELECT ON user_media_with_counts TO authenticated;
GRANT SELECT ON public_media_with_counts TO authenticated;

-- Step 4: Check results
SELECT 'Views created successfully!' as status;
SELECT 'user_media_with_counts' as view_name, COUNT(*) as row_count FROM user_media_with_counts
UNION ALL
SELECT 'public_media_with_counts' as view_name, COUNT(*) as row_count FROM public_media_with_counts;
