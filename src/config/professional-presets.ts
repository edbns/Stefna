export interface ProfessionalPresetConfig {
  id: string;
  label: string;
  category: string;
  description: string;
  promptAdd: string; // free-form text you append to the base prompt
  prompt?: string; // full prompt text
  negative_prompt?: string; // negative prompt text
  strength: number;
  model: string;
  mode: 'i2i';
  input: 'image';
  requiresSource: boolean;
  source: string;
  features: string[];
  guidance_scale?: number;
  num_inference_steps?: number;
}

export type ProfessionalPresetKey = 
  | 'cinematic_glow'
  | 'bright_airy'
  | 'vivid_pop'
  | 'vintage_film_35mm'
  | 'tropical_boost'
  | 'urban_grit'
  | 'mono_drama'
  | 'dreamy_pastels'
  | 'golden_hour_magic'
  | 'high_fashion_editorial'
  | 'moody_forest'
  | 'desert_glow'
  | 'retro_polaroid'
  | 'crystal_clear'
  | 'ocean_breeze'
  | 'festival_vibes'
  | 'noir_classic'
  | 'sun_kissed'
  | 'frost_light'
  | 'neon_nights'
  | 'cultural_glow'
  | 'soft_skin_portrait'
  | 'rainy_day_mood'
  | 'wildlife_focus'
  | 'street_story';

export const PROFESSIONAL_PRESETS: Record<ProfessionalPresetKey, ProfessionalPresetConfig> = {
  cinematic_glow: {
    id: 'cinematic_glow',
    label: 'Cinematic Glow',
    category: 'Cinematic',
    description: 'Cinematic grading, warm highlights, deep shadows…',
    promptAdd: 'cinematic color grading, warm highlights, deep shadows, rich blacks, subtle teal-orange balance, natural faces',
    strength: 0.45,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['cinematic', 'color_grading', 'warm_highlights', 'deep_shadows']
  },
  bright_airy: {
    id: 'bright_airy',
    label: 'Bright & Airy',
    category: 'Minimalist',
    description: 'Clean, airy, pastel tones…',
    promptAdd: 'clean airy style, soft lighting, pastel tones, balanced whites, gentle shadows',
    strength: 0.35,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['minimalist', 'soft_lighting', 'pastel_tones', 'balanced_whites']
  },
  vivid_pop: {
    id: 'vivid_pop',
    label: 'Vivid Pop',
    category: 'Vibrant',
    description: 'Vibrant colors, realistic skin…',
    promptAdd: 'vibrant saturated colors, realistic skin tones, enhanced clarity, slight contrast, punchy look',
    strength: 0.40,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['vibrant', 'saturated_colors', 'realistic_skin', 'enhanced_clarity']
  },
  vintage_film_35mm: {
    id: 'vintage_film_35mm',
    label: 'Vintage Film 35mm',
    category: 'Vintage',
    description: 'Retro 35mm look…',
    promptAdd: 'retro 35mm film look, warm faded tones, subtle grain, soft shadows, nostalgic mood, sharp details',
    strength: 0.50,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['vintage', '35mm_film', 'warm_tones', 'subtle_grain']
  },
  tropical_boost: {
    id: 'tropical_boost',
    label: 'Tropical Boost',
    category: 'Travel',
    description: 'Sunny tropical feel…',
    promptAdd: 'boosted blues and greens, warm tones, slight HDR for landscapes, natural skin',
    strength: 0.45,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['travel', 'tropical', 'boosted_colors', 'slight_hdr']
  },
  urban_grit: {
    id: 'urban_grit',
    label: 'Urban Grit',
    category: 'Urban',
    description: 'Desaturated blues, deep contrast…',
    promptAdd: 'desaturated blues, deep contrast, crisp details, strong shadows, clean highlights, urban aesthetic',
    strength: 0.55,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['urban', 'desaturated', 'deep_contrast', 'crisp_details']
  },
  mono_drama: {
    id: 'mono_drama',
    label: 'Mono Drama',
    category: 'Black & White',
    description: 'High-contrast B&W…',
    promptAdd: 'black and white, strong contrast, bright highlights, detailed textures',
    strength: 0.60,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['black_white', 'strong_contrast', 'detailed_textures', 'moody']
  },
  dreamy_pastels: {
    id: 'dreamy_pastels',
    label: 'Dreamy Pastels',
    category: 'Soft',
    description: 'Soft focus, pastel colors…',
    promptAdd: 'soft focus, pastel colors, warm highlights, dreamy romantic vibe, smooth details',
    strength: 0.35,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['soft', 'pastel_colors', 'warm_highlights', 'romantic']
  },
  golden_hour_magic: {
    id: 'golden_hour_magic',
    label: 'Golden Hour Magic',
    category: 'Warm',
    description: 'Simulate golden hour…',
    promptAdd: 'golden hour lighting, warm tones, glowing highlights, soft shadows',
    strength: 0.45,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['warm', 'golden_hour', 'glowing_highlights', 'soft_shadows']
  },
  high_fashion_editorial: {
    id: 'high_fashion_editorial',
    label: 'High Fashion Editorial',
    category: 'Editorial',
    description: 'Desaturated, strong contrast…',
    promptAdd: 'sleek desaturated tones, strong contrast, minimal noise, smooth skin retouching, editorial quality',
    strength: 0.50,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['editorial', 'desaturated', 'strong_contrast', 'smooth_skin']
  },
  moody_forest: {
    id: 'moody_forest',
    label: 'Moody Forest',
    category: 'Nature',
    description: 'Deep greens, light fog…',
    promptAdd: 'deep green tones, soft diffused light, light fog overlay, moody forest atmosphere',
    strength: 0.55,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['nature', 'moody', 'deep_greens', 'fog_overlay']
  },
  desert_glow: {
    id: 'desert_glow',
    label: 'Desert Glow',
    category: 'Travel',
    description: 'Warm sandy tones…',
    promptAdd: 'warm sandy tones, golden highlights, gentle texture enhancement',
    strength: 0.45,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['travel', 'desert', 'warm_tones', 'golden_highlights']
  },
  retro_polaroid: {
    id: 'retro_polaroid',
    label: 'Retro Polaroid',
    category: 'Vintage',
    description: 'Warm faded instant look…',
    promptAdd: 'warm faded tones, soft focus, subtle frame edge blur, retro instant camera feel',
    strength: 0.50,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['vintage', 'polaroid', 'warm_tones', 'soft_focus']
  },
  crystal_clear: {
    id: 'crystal_clear',
    label: 'Crystal Clear',
    category: 'Clarity',
    description: 'Haze removal, clarity…',
    promptAdd: 'enhanced sharpness, dehaze, boosted clarity, true-to-life colors',
    strength: 0.40,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['clarity', 'enhanced_sharpness', 'remove_haze', 'true_colors']
  },
  ocean_breeze: {
    id: 'ocean_breeze',
    label: 'Ocean Breeze',
    category: 'Travel',
    description: 'Bright blues, airy highlights…',
    promptAdd: 'bright blues, soft whites, airy highlights, clean coastal feel',
    strength: 0.40,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['travel', 'coastal', 'bright_blues', 'airy_highlights']
  },
  festival_vibes: {
    id: 'festival_vibes',
    label: 'Festival Vibes',
    category: 'Vibrant',
    description: 'Rich saturation, slight vignette…',
    promptAdd: 'rich saturated colors, warm highlights, slight vignette, lively festival mood',
    strength: 0.50,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['vibrant', 'festival', 'saturated_colors', 'vignette']
  },
  noir_classic: {
    id: 'noir_classic',
    label: 'Noir Classic',
    category: 'Black & White',
    description: 'Timeless cinematic B&W…',
    promptAdd: 'black and white, high contrast, sharp detail, deep blacks, timeless cinematic mood',
    strength: 0.60,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['black_white', 'high_contrast', 'sharp_detail', 'cinematic']
  },
  sun_kissed: {
    id: 'sun_kissed',
    label: 'Sun-Kissed',
    category: 'Warm',
    description: 'Golden warmth, glowing skin…',
    promptAdd: 'golden warmth, soft shadows, glowing skin tones',
    strength: 0.40,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['warm', 'sunlit', 'golden_warmth', 'glowing_skin']
  },
  frost_light: {
    id: 'frost_light',
    label: 'Frost & Light',
    category: 'Cool',
    description: 'Cool blues, crisp whites…',
    promptAdd: 'cool blues, crisp whites, enhanced snow textures, winter feel',
    strength: 0.45,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['cool', 'winter', 'cool_blues', 'crisp_whites']
  },
  neon_nights: {
    id: 'neon_nights',
    label: 'Neon Nights',
    category: 'Urban',
    description: 'Vivid neon, deep blacks…',
    promptAdd: 'vivid neon colors, deep blacks, sharp clarity, night city scene',
    strength: 0.55,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['urban', 'neon', 'vivid_colors', 'sharp_clarity']
  },
  cultural_glow: {
    id: 'cultural_glow',
    label: 'Cultural Glow',
    category: 'Travel',
    description: 'Enhance fabrics, patterns…',
    promptAdd: 'enhanced traditional fabrics and patterns, natural light, cultural richness',
    strength: 0.40,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['travel', 'cultural', 'traditional_patterns', 'natural_light']
  },
  soft_skin_portrait: {
    id: 'soft_skin_portrait',
    label: 'Soft Skin Portrait',
    category: 'Portrait',
    description: 'Smooth skin, natural color…',
    promptAdd: 'smooth natural skin tones, subtle color correction, soft background blur',
    strength: 0.35,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['portrait', 'smooth_skin', 'natural_colors', 'soft_blur']
  },
  rainy_day_mood: {
    id: 'rainy_day_mood',
    label: 'Rainy Day Mood',
    category: 'Moody',
    description: 'Cool tones, raindrop texture…',
    promptAdd: 'cool tones, soft reflections, subtle raindrop texture, rainy ambience',
    strength: 0.45,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['moody', 'rainy', 'cool_tones', 'raindrop_texture']
  },
  wildlife_focus: {
    id: 'wildlife_focus',
    label: 'Wildlife Focus',
    category: 'Nature',
    description: 'Enhance fur/feathers…',
    promptAdd: 'natural tones, sharp detail on fur/feathers/scales, slightly blurred background',
    strength: 0.50,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['nature', 'wildlife', 'enhanced_textures', 'sharp_detail']
  },
  street_story: {
    id: 'street_story',
    label: 'Street Story',
    category: 'Urban',
    description: 'High contrast, textured…',
    promptAdd: 'high contrast, rich shadows, enhanced textures, documentary street style',
    strength: 0.55,
    model: 'flux/dev',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'professional',
    features: ['urban', 'street', 'high_contrast', 'enhanced_textures']
  }
};

// Export the preset keys for easy access
export const PROFESSIONAL_PRESET_KEYS: ProfessionalPresetKey[] = Object.keys(PROFESSIONAL_PRESETS) as ProfessionalPresetKey[];

// Helper function to get a preset by key
export function getProfessionalPreset(key: ProfessionalPresetKey): ProfessionalPresetConfig {
  return PROFESSIONAL_PRESETS[key];
}

// Helper function to get all presets
export function getAllProfessionalPresets(): ProfessionalPresetConfig[] {
  return Object.values(PROFESSIONAL_PRESETS);
}
