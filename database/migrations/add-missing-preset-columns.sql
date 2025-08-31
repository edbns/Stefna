-- Add missing columns to presets_config table for rotation system
-- Run this if preset_week and preset_rotation_index columns are missing

-- Add preset_week column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'presets_config'
        AND column_name = 'preset_week'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE presets_config ADD COLUMN preset_week INTEGER;
        RAISE NOTICE 'Added preset_week column to presets_config';
    ELSE
        RAISE NOTICE 'preset_week column already exists';
    END IF;
END $$;

-- Add preset_rotation_index column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'presets_config'
        AND column_name = 'preset_rotation_index'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE presets_config ADD COLUMN preset_rotation_index INTEGER;
        RAISE NOTICE 'Added preset_rotation_index column to presets_config';
    ELSE
        RAISE NOTICE 'preset_rotation_index column already exists';
    END IF;
END $$;

-- Update existing records with default rotation values if they're NULL
UPDATE presets_config
SET
    preset_week = CASE
        WHEN preset_key IN ('cinematic_glow', 'bright_airy', 'vivid_pop', 'vintage_film_35mm', 'tropical_boost') THEN 1
        WHEN preset_key IN ('urban_grit', 'mono_drama', 'dreamy_pastels', 'golden_hour_magic', 'high_fashion_editorial') THEN 2
        WHEN preset_key IN ('moody_forest', 'desert_glow', 'retro_polaroid', 'crystal_clear', 'ocean_breeze') THEN 3
        WHEN preset_key IN ('festival_vibes', 'noir_classic', 'sun_kissed', 'frost_light', 'neon_nights') THEN 4
        WHEN preset_key IN ('cultural_glow', 'soft_skin_portrait', 'rainy_day_mood', 'wildlife_focus', 'street_story') THEN 5
        ELSE 1
    END,
    preset_rotation_index = CASE
        WHEN preset_key IN ('cinematic_glow', 'urban_grit', 'moody_forest', 'festival_vibes', 'cultural_glow') THEN 1
        WHEN preset_key IN ('bright_airy', 'mono_drama', 'desert_glow', 'noir_classic', 'soft_skin_portrait') THEN 2
        WHEN preset_key IN ('vivid_pop', 'dreamy_pastels', 'retro_polaroid', 'sun_kissed', 'rainy_day_mood') THEN 3
        WHEN preset_key IN ('vintage_film_35mm', 'golden_hour_magic', 'crystal_clear', 'frost_light', 'wildlife_focus') THEN 4
        WHEN preset_key IN ('tropical_boost', 'high_fashion_editorial', 'ocean_breeze', 'neon_nights', 'street_story') THEN 5
        ELSE 1
    END
WHERE preset_week IS NULL OR preset_rotation_index IS NULL;

-- Verify the update
SELECT
    preset_key,
    preset_week,
    preset_rotation_index,
    preset_name
FROM presets_config
WHERE preset_key NOT IN ('ghibli', 'emotionmask', 'neotokyoglitch')
ORDER BY preset_week, preset_rotation_index;
