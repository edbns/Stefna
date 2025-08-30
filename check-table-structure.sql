-- Check actual table structure and column types
-- Run this directly in your database to see what columns actually exist

-- Check all tables that might have id columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name IN (
  'users', 'user_credits', 'credits_ledger', 'custom_prompt_media',
  'emotion_mask_media', 'ghibli_reaction_media', 'neo_glitch_media',
  'presets_media', 'story', 'story_photo', 'video_jobs',
  'referral_signups', 'ai_generations', 'assets', 'presets_config',
  'app_config', 'auth_otps'
) 
AND column_name = 'id'
ORDER BY table_name, ordinal_position;

-- Also check which tables actually exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN (
  'users', 'user_credits', 'credits_ledger', 'custom_prompt_media',
  'emotion_mask_media', 'ghibli_reaction_media', 'neo_glitch_media',
  'presets_media', 'story', 'story_photo', 'video_jobs',
  'referral_signups', 'ai_generations', 'assets', 'presets_config',
  'app_config', 'auth_otps'
)
ORDER BY table_name;
