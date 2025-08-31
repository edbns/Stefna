-- Restore Original 25 Rotating Presets
-- This fixes the mistake where the original presets were replaced
-- IMPORTANT: Run add-missing-preset-columns.sql FIRST if columns don't exist

-- First, clear existing incorrect presets
DELETE FROM presets_config WHERE preset_key NOT IN ('ghibli', 'emotionmask', 'neotokyoglitch');

-- Insert the 25 ORIGINAL rotating presets with proper rotation weeks
INSERT INTO presets_config (
  id,
  preset_key,
  preset_name,
  preset_description,
  preset_category,
  preset_prompt,
  preset_negative_prompt,
  preset_strength,
  preset_rotation_index,
  preset_week,
  is_active,
  created_at,
  updated_at
) VALUES
-- Week 1: cinematic_glow, bright_airy, vivid_pop, vintage_film_35mm, tropical_boost
  ('preset_001', 'cinematic_glow', 'Cinematic Glow', 'Cinematic photo with soft lighting', 'cinematic', 'Cinematic photo with soft lighting, shallow depth of field, filmic glow, natural skin texture, professional color grading', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 1, 1, true, NOW(), NOW()),
  ('preset_002', 'bright_airy', 'Bright & Airy', 'Bright and airy portrait', 'bright', 'Bright and airy portrait, pastel tones, soft sunlight, fresh clean look, dreamy light balance', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 2, 1, true, NOW(), NOW()),
  ('preset_003', 'vivid_pop', 'Vivid Pop', 'Vivid photo with bold colors', 'vivid', 'Vivid photo with bold colors, strong contrast, high saturation, punchy lighting, vibrant modern look', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 3, 1, true, NOW(), NOW()),
  ('preset_004', 'vintage_film_35mm', 'Vintage Film 35mm', 'Analog 35mm film style', 'vintage', 'Analog 35mm film style, vintage grain, faded tones, retro warmth, nostalgic aesthetic', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 4, 1, true, NOW(), NOW()),
  ('preset_005', 'tropical_boost', 'Tropical Boost', 'Tropical color enhancement', 'tropical', 'Tropical color enhancement, saturated greens and blues, warm skin tones, sunny vacation vibe', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 5, 1, true, NOW(), NOW()),

-- Week 2: urban_grit, mono_drama, dreamy_pastels, golden_hour_magic, high_fashion_editorial
  ('preset_006', 'urban_grit', 'Urban Grit', 'Street style with strong shadows', 'urban', 'Street style with strong shadows, gritty texture, authentic urban lighting, cinematic color grading', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 1, 2, true, NOW(), NOW()),
  ('preset_007', 'mono_drama', 'Mono Drama', 'Black and white portrait', 'monochrome', 'Black and white portrait with dramatic shadows, sharp contrast, minimal aesthetic, expressive focus', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 2, 2, true, NOW(), NOW()),
  ('preset_008', 'dreamy_pastels', 'Dreamy Pastels', 'Pastel color tones', 'dreamy', 'Pastel color tones, soft lighting, dreamy haze, low contrast, artistic photo filter aesthetic', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 3, 2, true, NOW(), NOW()),
  ('preset_009', 'golden_hour_magic', 'Golden Hour Magic', 'Soft golden hour light', 'golden', 'Soft golden hour light, warm skin glow, romantic sunset hues, dreamy shadows', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 4, 2, true, NOW(), NOW()),
  ('preset_010', 'high_fashion_editorial', 'High Fashion Editorial', 'High fashion editorial photo', 'fashion', 'High fashion editorial photo, studio lighting, sharp facial detail, magazine-quality color tones, luxury aesthetic', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 5, 2, true, NOW(), NOW()),

-- Week 3: moody_forest, desert_glow, retro_polaroid, crystal_clear, ocean_breeze
  ('preset_011', 'moody_forest', 'Moody Forest', 'Dark green forest tones', 'moody', 'Dark green forest tones, cinematic mood, cool shadows, natural light, earthy color grading', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 1, 3, true, NOW(), NOW()),
  ('preset_012', 'desert_glow', 'Desert Glow', 'Warm desert tones', 'desert', 'Warm desert tones, dusty light, golden color palette, vintage sunset style', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 2, 3, true, NOW(), NOW()),
  ('preset_013', 'retro_polaroid', 'Retro Polaroid', 'Polaroid look with instant film', 'retro', 'Polaroid look with instant film border, low saturation, slight vignette, faded retro color', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 3, 3, true, NOW(), NOW()),
  ('preset_014', 'crystal_clear', 'Crystal Clear', 'Ultra clear portrait', 'clear', 'Ultra clear portrait, sharp details, natural skin texture, minimal color grading, clean studio look', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 4, 3, true, NOW(), NOW()),
  ('preset_015', 'ocean_breeze', 'Ocean Breeze', 'Cool oceanic tones', 'ocean', 'Cool oceanic tones, soft blues and whites, calm and refreshing vibe, minimal color grading', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 5, 3, true, NOW(), NOW()),

-- Week 4: festival_vibes, noir_classic, sun_kissed, frost_light, neon_nights
  ('preset_016', 'festival_vibes', 'Festival Vibes', 'Energetic, colorful photo', 'festival', 'Energetic, colorful photo with sparkle lights, vibrant glow, festive color palette, joyful aesthetic', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 1, 4, true, NOW(), NOW()),
  ('preset_017', 'noir_classic', 'Noir Classic', 'Classic noir style', 'noir', 'Classic noir style, dramatic lighting, black and white, high contrast shadows, vintage film grain', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 2, 4, true, NOW(), NOW()),
  ('preset_018', 'sun_kissed', 'Sun-Kissed', 'Golden hour lighting', 'sunset', 'Golden hour lighting, warm skin tones, soft shadows, sunlit aesthetic, natural and radiant', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 3, 4, true, NOW(), NOW()),
  ('preset_019', 'frost_light', 'Frost & Light', 'Cool tones, diffused lighting', 'frost', 'Cool tones, diffused lighting, winter-inspired atmosphere, pale highlights, soft contrast', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 4, 4, true, NOW(), NOW()),
  ('preset_020', 'neon_nights', 'Neon Nights', 'Urban night photo', 'neon', 'Urban night photo with glowing neon lights, cinematic shadows, vibrant pink and blue highlights', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 5, 4, true, NOW(), NOW()),

-- Week 5: cultural_glow, soft_skin_portrait, rainy_day_mood, wildlife_focus, street_story
  ('preset_021', 'cultural_glow', 'Cultural Glow', 'Rich skin tones', 'cultural', 'Rich skin tones, traditional color palettes, natural light, respectful enhancement of cultural features', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 1, 5, true, NOW(), NOW()),
  ('preset_022', 'soft_skin_portrait', 'Soft Skin Portrait', 'Natural portrait', 'soft', 'Natural portrait with soft lighting, gentle skin smoothing, subtle blush tones, professional retouching', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 2, 5, true, NOW(), NOW()),
  ('preset_023', 'rainy_day_mood', 'Rainy Day Mood', 'Blue-gray tones', 'rainy', 'Blue-gray tones, moody overcast lighting, reflective emotion, cinematic rainy day look', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 3, 5, true, NOW(), NOW()),
  ('preset_024', 'wildlife_focus', 'Wildlife Focus', 'Sharp detail on facial features', 'wildlife', 'Sharp detail on facial features, natural lighting, organic textures, nature documentary feel', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 4, 5, true, NOW(), NOW()),
  ('preset_025', 'street_story', 'Street Story', 'Photojournalism aesthetic', 'street', 'Photojournalism aesthetic, documentary style lighting, slight grain, candid emotion, city storytelling', 'blurry, low quality, distorted, deformed, ugly, bad anatomy', 0.8, 5, 5, true, NOW(), NOW())

ON CONFLICT (preset_key) DO UPDATE SET
  preset_name = EXCLUDED.preset_name,
  preset_description = EXCLUDED.preset_description,
  preset_category = EXCLUDED.preset_category,
  preset_prompt = EXCLUDED.preset_prompt,
  preset_negative_prompt = EXCLUDED.preset_negative_prompt,
  preset_strength = EXCLUDED.preset_strength,
  preset_rotation_index = EXCLUDED.preset_rotation_index,
  preset_week = EXCLUDED.preset_week,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the migration
SELECT
  COUNT(*) as total_presets,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_presets,
  COUNT(DISTINCT preset_week) as weeks_count,
  COUNT(CASE WHEN preset_week = 1 THEN 1 END) as week_1_count,
  COUNT(CASE WHEN preset_week = 2 THEN 1 END) as week_2_count,
  COUNT(CASE WHEN preset_week = 3 THEN 1 END) as week_3_count,
  COUNT(CASE WHEN preset_week = 4 THEN 1 END) as week_4_count,
  COUNT(CASE WHEN preset_week = 5 THEN 1 END) as week_5_count
FROM presets_config
WHERE preset_key NOT IN ('ghibli', 'emotionmask', 'neotokyoglitch');
