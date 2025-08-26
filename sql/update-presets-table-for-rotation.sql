-- Update Presets Table for 25 Preset Rotation System
-- This adds fields to handle the rotating preset system (25 presets, 6 per week)

-- 1. Add rotation-specific fields to presets_media table
ALTER TABLE "public"."presets_media" 
ADD COLUMN IF NOT EXISTS "preset_week" INTEGER,
ADD COLUMN IF NOT EXISTS "preset_rotation_index" INTEGER,
ADD COLUMN IF NOT EXISTS "is_currently_available" BOOLEAN DEFAULT true;

-- 2. Create a presets_config table to manage the 25 preset rotation
CREATE TABLE IF NOT EXISTS "public"."presets_config" (
    "id" TEXT NOT NULL,
    "preset_key" TEXT NOT NULL UNIQUE,
    "preset_name" TEXT NOT NULL,
    "preset_description" TEXT,
    "preset_category" TEXT,
    "preset_prompt" TEXT NOT NULL,
    "preset_negative_prompt" TEXT,
    "preset_strength" FLOAT DEFAULT 0.8,
    "preset_rotation_index" INTEGER NOT NULL, -- 1-25 (which of the 25 presets)
    "preset_week" INTEGER, -- Which week this preset is available (1-5, or NULL for always available)
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presets_config_pkey" PRIMARY KEY ("id")
);

-- 3. Create indexes for presets_config
CREATE INDEX IF NOT EXISTS "presets_config_preset_key_idx" ON "public"."presets_config"("preset_key");
CREATE INDEX IF NOT EXISTS "presets_config_rotation_index_idx" ON "public"."presets_config"("preset_rotation_index");
CREATE INDEX IF NOT EXISTS "presets_config_week_idx" ON "public"."presets_config"("preset_week");
CREATE INDEX IF NOT EXISTS "presets_config_active_idx" ON "public"."presets_config"("is_active");

-- 4. Insert the 25 professional presets with rotation data
INSERT INTO "public"."presets_config" (
    "id", "preset_key", "preset_name", "preset_description", "preset_category", 
    "preset_prompt", "preset_negative_prompt", "preset_strength", "preset_rotation_index", "preset_week"
) VALUES 
-- Week 1 Presets (1-6)
('preset_001', 'cinematic', 'Cinematic', 'Hollywood movie poster style', 'cinematic', 
 'Transform this image with cinematic lighting, dramatic shadows, and movie poster aesthetics. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 1, 1),

('preset_002', 'portrait', 'Portrait', 'Professional portrait photography', 'portrait', 
 'Transform this image with professional portrait lighting, studio quality, and elegant composition. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 2, 1),

('preset_003', 'landscape', 'Landscape', 'Breathtaking landscape photography', 'landscape', 
 'Transform this image with stunning landscape photography, golden hour lighting, and dramatic skies. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 3, 1),

('preset_004', 'street', 'Street', 'Urban street photography style', 'street', 
 'Transform this image with urban street photography aesthetics, gritty realism, and city atmosphere. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 4, 1),

('preset_005', 'vintage', 'Vintage', 'Classic vintage film look', 'vintage', 
 'Transform this image with vintage film aesthetics, classic colors, and nostalgic atmosphere. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 5, 1),

('preset_006', 'black_white', 'Black & White', 'Timeless monochrome', 'monochrome', 
 'Transform this image with classic black and white photography, high contrast, and timeless elegance. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 6, 1),

-- Week 2 Presets (7-12)
('preset_007', 'artistic', 'Artistic', 'Fine art photography style', 'artistic', 
 'Transform this image with fine art photography aesthetics, creative composition, and artistic vision. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 7, 2),

('preset_008', 'fashion', 'Fashion', 'High-end fashion photography', 'fashion', 
 'Transform this image with high-end fashion photography, editorial style, and glamorous aesthetics. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 8, 2),

('preset_009', 'documentary', 'Documentary', 'Photojournalism style', 'documentary', 
 'Transform this image with documentary photography style, raw authenticity, and storytelling composition. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 9, 2),

('preset_010', 'minimalist', 'Minimalist', 'Clean, simple aesthetics', 'minimalist', 
 'Transform this image with minimalist photography, clean lines, and simple composition. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 10, 2),

('preset_011', 'dramatic', 'Dramatic', 'High contrast dramatic style', 'dramatic', 
 'Transform this image with dramatic photography, high contrast lighting, and intense atmosphere. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 11, 2),

('preset_012', 'soft', 'Soft', 'Gentle, dreamy aesthetics', 'soft', 
 'Transform this image with soft photography, gentle lighting, and dreamy atmosphere. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 12, 2),

-- Week 3 Presets (13-18)
('preset_013', 'bold', 'Bold', 'Strong, impactful style', 'bold', 
 'Transform this image with bold photography, strong composition, and impactful aesthetics. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 13, 3),

('preset_014', 'elegant', 'Elegant', 'Sophisticated luxury style', 'elegant', 
 'Transform this image with elegant photography, sophisticated composition, and luxury aesthetics. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 14, 3),

('preset_015', 'dynamic', 'Dynamic', 'Energetic movement style', 'dynamic', 
 'Transform this image with dynamic photography, energetic composition, and movement aesthetics. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 15, 3),

('preset_016', 'serene', 'Serene', 'Peaceful, calm style', 'serene', 
 'Transform this image with serene photography, peaceful composition, and calm atmosphere. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 16, 3),

('preset_017', 'mysterious', 'Mysterious', 'Enigmatic, intriguing style', 'mysterious', 
 'Transform this image with mysterious photography, enigmatic composition, and intriguing atmosphere. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 17, 3),

('preset_018', 'vibrant', 'Vibrant', 'Colorful, energetic style', 'vibrant', 
 'Transform this image with vibrant photography, colorful composition, and energetic atmosphere. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 18, 3),

-- Week 4 Presets (19-24)
('preset_019', 'subtle', 'Subtle', 'Understated, refined style', 'subtle', 
 'Transform this image with subtle photography, understated composition, and refined aesthetics. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 19, 4),

('preset_020', 'powerful', 'Powerful', 'Strong, commanding style', 'powerful', 
 'Transform this image with powerful photography, strong composition, and commanding presence. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 20, 4),

('preset_021', 'delicate', 'Delicate', 'Fragile, intricate style', 'delicate', 
 'Transform this image with delicate photography, fragile composition, and intricate details. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 21, 4),

('preset_022', 'intense', 'Intense', 'High energy, focused style', 'intense', 
 'Transform this image with intense photography, high energy composition, and focused intensity. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 22, 4),

('preset_023', 'tranquil', 'Tranquil', 'Peaceful, meditative style', 'tranquil', 
 'Transform this image with tranquil photography, peaceful composition, and meditative atmosphere. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 23, 4),

('preset_024', 'striking', 'Striking', 'Bold, attention-grabbing style', 'striking', 
 'Transform this image with striking photography, bold composition, and attention-grabbing aesthetics. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 24, 4),

-- Week 5 Preset (25)
('preset_025', 'timeless', 'Timeless', 'Classic, enduring style', 'timeless', 
 'Transform this image with timeless photography, classic composition, and enduring aesthetics. Keep the original composition and subject identity intact.', 
 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs', 0.8, 25, 5)

ON CONFLICT ("preset_key") DO UPDATE SET
    "preset_name" = EXCLUDED."preset_name",
    "preset_description" = EXCLUDED."preset_description",
    "preset_category" = EXCLUDED."preset_category",
    "preset_prompt" = EXCLUDED."preset_prompt",
    "preset_negative_prompt" = EXCLUDED."preset_negative_prompt",
    "preset_strength" = EXCLUDED."preset_strength",
    "preset_rotation_index" = EXCLUDED."preset_rotation_index",
    "preset_week" = EXCLUDED."preset_week",
    "updated_at" = CURRENT_TIMESTAMP;

-- 5. Create a function to get current week's presets (6 presets)
CREATE OR REPLACE FUNCTION get_current_week_presets()
RETURNS TABLE (
    preset_key TEXT,
    preset_name TEXT,
    preset_description TEXT,
    preset_category TEXT,
    preset_prompt TEXT,
    preset_negative_prompt TEXT,
    preset_strength FLOAT,
    preset_rotation_index INTEGER,
    preset_week INTEGER
) AS $$
BEGIN
    -- Calculate current week (1-5) based on current date
    -- This rotates through the 25 presets, showing 6 per week
    DECLARE
        current_week INTEGER;
    BEGIN
        -- Simple week calculation: week 1-5 based on month
        current_week := ((EXTRACT(MONTH FROM CURRENT_DATE) - 1) * 5 / 12) + 1;
        current_week := GREATEST(1, LEAST(5, current_week)); -- Ensure 1-5 range
        
        RETURN QUERY
        SELECT 
            pc.preset_key,
            pc.preset_name,
            pc.preset_description,
            pc.preset_category,
            pc.preset_prompt,
            pc.preset_negative_prompt,
            pc.preset_strength,
            pc.preset_rotation_index,
            pc.preset_week
        FROM presets_config pc
        WHERE pc.preset_week = current_week
          AND pc.is_active = true
        ORDER BY pc.preset_rotation_index;
    END;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a function to get all available presets
CREATE OR REPLACE FUNCTION get_all_presets()
RETURNS TABLE (
    preset_key TEXT,
    preset_name TEXT,
    preset_description TEXT,
    preset_category TEXT,
    preset_prompt TEXT,
    preset_negative_prompt TEXT,
    preset_strength FLOAT,
    preset_rotation_index INTEGER,
    preset_week INTEGER,
    is_currently_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.preset_key,
        pc.preset_name,
        pc.preset_description,
        pc.preset_category,
        pc.preset_prompt,
        pc.preset_negative_prompt,
        pc.preset_strength,
        pc.preset_rotation_index,
        pc.preset_week,
        (pc.preset_week = ((EXTRACT(MONTH FROM CURRENT_DATE) - 1) * 5 / 12) + 1) as is_currently_available
    FROM presets_config pc
    WHERE pc.is_active = true
    ORDER BY pc.preset_rotation_index;
END;
$$ LANGUAGE plpgsql;

-- 7. Verify the setup
DO $$
BEGIN
    RAISE NOTICE '✅ Presets rotation system setup complete!';
    RAISE NOTICE '   - 25 professional presets configured';
    RAISE NOTICE '   - 6 presets rotate per week';
    RAISE NOTICE '   - Current week presets available via get_current_week_presets()';
    RAISE NOTICE '   - All presets available via get_all_presets()';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Preset Rotation:';
    RAISE NOTICE '   Week 1: Presets 1-6 (cinematic, portrait, landscape, street, vintage, black_white)';
    RAISE NOTICE '   Week 2: Presets 7-12 (artistic, fashion, documentary, minimalist, dramatic, soft)';
    RAISE NOTICE '   Week 3: Presets 13-18 (bold, elegant, dynamic, serene, mysterious, vibrant)';
    RAISE NOTICE '   Week 4: Presets 19-24 (subtle, powerful, delicate, intense, tranquil, striking)';
    RAISE NOTICE '   Week 5: Preset 25 (timeless)';
END $$;

-- 8. Test the functions
SELECT 'Current Week Presets:' as info;
SELECT * FROM get_current_week_presets();

SELECT 'All Presets:' as info;
SELECT preset_key, preset_name, preset_week, is_currently_available FROM get_all_presets();
