-- Ultra-Simple Database Views Fix for Stefna
-- Copy and paste this entire script into Supabase SQL Editor

-- Step 0: Drop existing views if they exist (to avoid data type conflicts)
DROP VIEW IF EXISTS user_media_with_counts;
DROP VIEW IF EXISTS public_media_with_counts;

-- Step 1: Create the user_media_with_counts view with ALL required columns
CREATE OR REPLACE VIEW user_media_with_counts AS
SELECT 
  ma.id,
  ma.user_id,
  ma.url,
  ma.public_id,
  ma.resource_type,
  ma.folder,
  ma.bytes,
  ma.width,
  ma.height,
  ma.duration,
  ma.meta,
  ma.created_at,
  ma.updated_at,
  COALESCE(ma.result_url, ma.url) as result_url,
  COALESCE(ma.source_url, ma.url) as source_url,
  COALESCE(ma.job_id, '') as job_id,
  COALESCE(ma.model, '') as model,
  COALESCE(ma.mode, '') as mode,
  COALESCE(ma.prompt, '') as prompt,
  COALESCE(ma.negative_prompt, '') as negative_prompt,
  COALESCE(ma.visibility, 'private') as visibility,
  COALESCE(ma.env, 'dev') as env,
  COALESCE(ma.like_count, 0) as like_count,
  COALESCE(ma.allow_remix, false) as allow_remix,
  -- UUID columns should not use COALESCE with empty string
  ma.parent_asset_id,
  COALESCE(ma.strength, 0.7) as strength,
  0 as likes_count,
  0 as remixes_count,
  0 as shares_count
FROM media_assets ma;

-- Step 2: Create the public_media_with_counts view with ALL required columns
CREATE OR REPLACE VIEW public_media_with_counts AS
SELECT 
  ma.id,
  ma.user_id,
  ma.url,
  ma.public_id,
  ma.resource_type,
  ma.folder,
  ma.bytes,
  ma.width,
  ma.height,
  ma.duration,
  ma.meta,
  ma.created_at,
  ma.updated_at,
  COALESCE(ma.result_url, ma.url) as result_url,
  COALESCE(ma.source_url, ma.url) as source_url,
  COALESCE(ma.job_id, '') as job_id,
  COALESCE(ma.model, '') as model,
  COALESCE(ma.mode, '') as mode,
  COALESCE(ma.prompt, '') as prompt,
  COALESCE(ma.negative_prompt, '') as negative_prompt,
  COALESCE(ma.visibility, 'private') as visibility,
  COALESCE(ma.env, 'dev') as env,
  COALESCE(ma.like_count, 0) as like_count,
  COALESCE(ma.allow_remix, false) as allow_remix,
  -- UUID columns should not use COALESCE with empty string
  ma.parent_asset_id,
  COALESCE(ma.strength, 0.7) as strength,
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

-- Step 5: Test the view structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'user_media_with_counts' 
ORDER BY ordinal_position;
