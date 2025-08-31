-- Check actual status values in media tables
SELECT 
    'ghibli_reaction_media' as table_name,
    status,
    COUNT(*) as count
FROM ghibli_reaction_media 
GROUP BY status
UNION ALL
SELECT 
    'emotion_mask_media' as table_name,
    status,
    COUNT(*) as count
FROM emotion_mask_media 
GROUP BY status
UNION ALL
SELECT 
    'presets_media' as table_name,
    status,
    COUNT(*) as count
FROM presets_media 
GROUP BY status
UNION ALL
SELECT 
    'custom_prompt_media' as table_name,
    status,
    COUNT(*) as count
FROM custom_prompt_media 
GROUP BY status
UNION ALL
SELECT 
    'neo_glitch_media' as table_name,
    status,
    COUNT(*) as count
FROM neo_glitch_media 
GROUP BY status
ORDER BY table_name, count DESC;
