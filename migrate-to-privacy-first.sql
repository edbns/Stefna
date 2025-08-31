-- Migration to Privacy-First Approach
-- Sets share_to_feed to false for all existing users (privacy-first default)

-- Update all existing user settings to have share_to_feed = false
-- This ensures existing users start with private sharing by default
UPDATE user_settings 
SET share_to_feed = false, 
    updated_at = NOW()
WHERE share_to_feed = true;

-- Update all existing media to be private (isPublic = false)
-- This ensures existing media is not publicly visible unless user explicitly opts in

-- Update ghibli_reaction_media
UPDATE ghibli_reaction_media 
SET status = 'private', 
    updated_at = NOW()
WHERE status = 'public';

-- Update emotion_mask_media  
UPDATE emotion_mask_media 
SET status = 'private', 
    updated_at = NOW()
WHERE status = 'public';

-- Update presets_media
UPDATE presets_media 
SET status = 'private', 
    updated_at = NOW()
WHERE status = 'public';

-- Update custom_prompt_media
UPDATE custom_prompt_media 
SET status = 'private', 
    updated_at = NOW()
WHERE status = 'public';

-- Update neo_glitch_media
UPDATE neo_glitch_media 
SET status = 'private', 
    updated_at = NOW()
WHERE status = 'public';

-- Verify the changes
SELECT 
    'user_settings' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN share_to_feed = false THEN 1 END) as private_users,
    COUNT(CASE WHEN share_to_feed = true THEN 1 END) as public_users
FROM user_settings
UNION ALL
SELECT 
    'ghibli_reaction_media' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'private' THEN 1 END) as private_media,
    COUNT(CASE WHEN status = 'public' THEN 1 END) as public_media
FROM ghibli_reaction_media
UNION ALL
SELECT 
    'emotion_mask_media' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'private' THEN 1 END) as private_media,
    COUNT(CASE WHEN status = 'public' THEN 1 END) as public_media
FROM emotion_mask_media
UNION ALL
SELECT 
    'presets_media' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'private' THEN 1 END) as private_media,
    COUNT(CASE WHEN status = 'public' THEN 1 END) as public_media
FROM presets_media
UNION ALL
SELECT 
    'custom_prompt_media' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'private' THEN 1 END) as private_media,
    COUNT(CASE WHEN status = 'public' THEN 1 END) as public_media
FROM custom_prompt_media
UNION ALL
SELECT 
    'neo_glitch_media' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'private' THEN 1 END) as private_media,
    COUNT(CASE WHEN status = 'public' THEN 1 END) as public_media
FROM neo_glitch_media;
