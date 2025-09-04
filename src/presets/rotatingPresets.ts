// src/presets/rotatingPresets.ts
// Local development version of the 25 rotating presets
// This file can be easily modified for prompt experimentation
// In production, these come from the database via get-presets.ts

export type RotatingPreset = {
  id: string
  key: string
  label: string
  description: string
  category: string
  prompt: string
  negativePrompt: string
  strength: number
  rotationIndex: number
  week: number
  isActive: boolean
}

/*

🎨 Rotating Presets Structure (Local Development)

This is a local version of the 25 rotating presets for easy prompt experimentation.
In production, these are stored in the database and retrieved via get-presets.ts.

| Week | Presets (5 per week) | Theme |
|------|---------------------|-------|
| 1    | cinematic_glow, bright_airy, vivid_pop, vintage_film_35mm, tropical_boost | Classic Styles |
| 2    | urban_grit, mono_drama, dreamy_pastels, golden_hour_magic, high_fashion_editorial | Urban & Fashion |
| 3    | moody_forest, desert_glow, retro_polaroid, crystal_clear, ocean_breeze | Nature & Retro |
| 4    | festival_vibes, noir_classic, sun_kissed, frost_light, neon_nights | Dynamic & Noir |
| 5    | cultural_glow, soft_skin_portrait, rainy_day_mood, wildlife_focus, street_story | Cultural & Documentary |

*/

export const ROTATING_PRESETS: RotatingPreset[] = [
  // Week 1: Classic Styles
  {
    id: 'preset_001',
    key: 'cinematic_glow',
    label: 'Cinematic Glow',
    description: 'Cinematic photo with soft lighting',
    category: 'cinematic',
    prompt: 'Cinematic photo with soft lighting, shallow depth of field, filmic glow, natural skin texture, professional color grading',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 1,
    week: 1,
    isActive: true
  },
  {
    id: 'preset_002',
    key: 'bright_airy',
    label: 'Bright & Airy',
    description: 'Bright and airy portrait',
    category: 'bright',
    prompt: 'Bright and airy portrait, pastel tones, soft sunlight, fresh clean look, dreamy light balance',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 2,
    week: 1,
    isActive: true
  },
  {
    id: 'preset_003',
    key: 'vivid_pop',
    label: 'Vivid Pop',
    description: 'Vivid photo with bold colors',
    category: 'vivid',
    prompt: 'Vivid photo with bold colors, strong contrast, high saturation, punchy lighting, vibrant modern look',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 3,
    week: 1,
    isActive: true
  },
  {
    id: 'preset_004',
    key: 'vintage_film_35mm',
    label: 'Vintage Film 35mm',
    description: 'Analog 35mm film style',
    category: 'vintage',
    prompt: 'Analog 35mm film style, vintage grain, faded tones, retro warmth, nostalgic aesthetic',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 4,
    week: 1,
    isActive: true
  },
  {
    id: 'preset_005',
    key: 'tropical_boost',
    label: 'Tropical Boost',
    description: 'Tropical color enhancement',
    category: 'tropical',
    prompt: 'Tropical color enhancement, saturated greens and blues, warm skin tones, sunny vacation vibe',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 5,
    week: 1,
    isActive: true
  },

  // Week 2: Urban & Fashion
  {
    id: 'preset_006',
    key: 'urban_grit',
    label: 'Urban Grit',
    description: 'Street style with strong shadows',
    category: 'urban',
    prompt: 'Street style with strong shadows, gritty texture, authentic urban lighting, cinematic color grading',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 1,
    week: 2,
    isActive: true
  },
  {
    id: 'preset_007',
    key: 'mono_drama',
    label: 'Mono Drama',
    description: 'Black and white portrait',
    category: 'monochrome',
    prompt: 'Black and white portrait with dramatic shadows, sharp contrast, minimal aesthetic, expressive focus',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 2,
    week: 2,
    isActive: true
  },
  {
    id: 'preset_008',
    key: 'dreamy_pastels',
    label: 'Dreamy Pastels',
    description: 'Pastel color tones',
    category: 'dreamy',
    prompt: 'Pastel color tones, soft lighting, dreamy haze, low contrast, artistic photo filter aesthetic',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 3,
    week: 2,
    isActive: true
  },
  {
    id: 'preset_009',
    key: 'golden_hour_magic',
    label: 'Golden Hour Magic',
    description: 'Soft golden hour light',
    category: 'golden',
    prompt: 'Soft golden hour light, warm skin glow, romantic sunset hues, dreamy shadows',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 4,
    week: 2,
    isActive: true
  },
  {
    id: 'preset_010',
    key: 'high_fashion_editorial',
    label: 'High Fashion Editorial',
    description: 'High fashion editorial photo',
    category: 'fashion',
    prompt: 'High fashion editorial photo, studio lighting, sharp facial detail, magazine-quality color tones, luxury aesthetic',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 5,
    week: 2,
    isActive: true
  },

  // Week 3: Nature & Retro
  {
    id: 'preset_011',
    key: 'moody_forest',
    label: 'Moody Forest',
    description: 'Dark green forest tones',
    category: 'moody',
    prompt: 'Dark green forest tones, cinematic mood, cool shadows, natural light, earthy color grading',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 1,
    week: 3,
    isActive: true
  },
  {
    id: 'preset_012',
    key: 'desert_glow',
    label: 'Desert Glow',
    description: 'Warm desert tones',
    category: 'desert',
    prompt: 'Warm desert tones, dusty light, golden color palette, vintage sunset style',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 2,
    week: 3,
    isActive: true
  },
  {
    id: 'preset_013',
    key: 'retro_polaroid',
    label: 'Retro Polaroid',
    description: 'Polaroid look with instant film',
    category: 'retro',
    prompt: 'Polaroid look with instant film border, low saturation, slight vignette, faded retro color',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 3,
    week: 3,
    isActive: true
  },
  {
    id: 'preset_014',
    key: 'crystal_clear',
    label: 'Crystal Clear',
    description: 'Ultra clear portrait',
    category: 'clear',
    prompt: 'Ultra clear portrait, sharp details, natural skin texture, minimal color grading, clean studio look',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 4,
    week: 3,
    isActive: true
  },
  {
    id: 'preset_015',
    key: 'ocean_breeze',
    label: 'Ocean Breeze',
    description: 'Cool oceanic tones',
    category: 'ocean',
    prompt: 'Cool oceanic tones, soft blues and whites, calm and refreshing vibe, minimal color grading',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 5,
    week: 3,
    isActive: true
  },

  // Week 4: Dynamic & Noir
  {
    id: 'preset_016',
    key: 'festival_vibes',
    label: 'Festival Vibes',
    description: 'Energetic, colorful photo',
    category: 'festival',
    prompt: 'Energetic, colorful photo with sparkle lights, vibrant glow, festive color palette, joyful aesthetic',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 1,
    week: 4,
    isActive: true
  },
  {
    id: 'preset_017',
    key: 'noir_classic',
    label: 'Noir Classic',
    description: 'Classic noir style',
    category: 'noir',
    prompt: 'Classic noir style, dramatic lighting, black and white, high contrast shadows, vintage film grain',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 2,
    week: 4,
    isActive: true
  },
  {
    id: 'preset_018',
    key: 'sun_kissed',
    label: 'Sun-Kissed',
    description: 'Golden hour lighting',
    category: 'sunset',
    prompt: 'Golden hour lighting, warm skin tones, soft shadows, sunlit aesthetic, natural and radiant',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 3,
    week: 4,
    isActive: true
  },
  {
    id: 'preset_019',
    key: 'frost_light',
    label: 'Frost & Light',
    description: 'Cool tones, diffused lighting',
    category: 'frost',
    prompt: 'Cool tones, diffused lighting, winter-inspired atmosphere, pale highlights, soft contrast',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 4,
    week: 4,
    isActive: true
  },
  {
    id: 'preset_020',
    key: 'neon_nights',
    label: 'Neon Nights',
    description: 'Urban night photo',
    category: 'neon',
    prompt: 'Urban night photo with glowing neon lights, cinematic shadows, vibrant pink and blue highlights',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 5,
    week: 4,
    isActive: true
  },

  // Week 5: Cultural & Documentary
  {
    id: 'preset_021',
    key: 'cultural_glow',
    label: 'Cultural Glow',
    description: 'Rich skin tones',
    category: 'cultural',
    prompt: 'Rich skin tones, traditional color palettes, natural light, respectful enhancement of cultural features',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 1,
    week: 5,
    isActive: true
  },
  {
    id: 'preset_022',
    key: 'soft_skin_portrait',
    label: 'Soft Skin Portrait',
    description: 'Natural portrait',
    category: 'soft',
    prompt: 'Natural portrait with soft lighting, gentle skin smoothing, subtle blush tones, professional retouching',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 2,
    week: 5,
    isActive: true
  },
  {
    id: 'preset_023',
    key: 'rainy_day_mood',
    label: 'Rainy Day Mood',
    description: 'Blue-gray tones',
    category: 'rainy',
    prompt: 'Blue-gray tones, moody overcast lighting, reflective emotion, cinematic rainy day look',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 3,
    week: 5,
    isActive: true
  },
  {
    id: 'preset_024',
    key: 'wildlife_focus',
    label: 'Wildlife Focus',
    description: 'Sharp detail on facial features',
    category: 'wildlife',
    prompt: 'Sharp detail on facial features, natural lighting, organic textures, nature documentary feel',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 4,
    week: 5,
    isActive: true
  },
  {
    id: 'preset_025',
    key: 'street_story',
    label: 'Street Story',
    description: 'Photojournalism aesthetic',
    category: 'street',
    prompt: 'Photojournalism aesthetic, documentary style lighting, slight grain, candid emotion, city storytelling',
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
    strength: 0.8,
    rotationIndex: 5,
    week: 5,
    isActive: true
  }
];

// Helper functions for local development
export function getCurrentWeekPresets(): RotatingPreset[] {
  // Calculate current week (1-5 cycle)
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysSinceStartOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.floor(daysSinceStartOfYear / 7) % 5 + 1;
  
  return ROTATING_PRESETS.filter(preset => preset.week === currentWeek && preset.isActive);
}

export function getPresetByKey(key: string): RotatingPreset | undefined {
  return ROTATING_PRESETS.find(preset => preset.key === key);
}

export function getAllPresets(): RotatingPreset[] {
  return ROTATING_PRESETS.filter(preset => preset.isActive);
}
