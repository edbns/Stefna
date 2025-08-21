export interface ProfessionalPresetConfig {
  id: string;
  label: string;
  description: string;
  prompt: string;
  negative_prompt?: string;
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
    description: 'Cinematic color grading with warm highlights, deep shadows, and rich blacks',
    prompt: 'Enhance this image/video with cinematic color grading, warm highlights, deep shadows, and rich blacks. Add a subtle teal-orange tone balance. Keep faces natural.',
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
    description: 'Clean, airy style with soft lighting and pastel tones',
    prompt: 'Edit with a clean, airy style—soft lighting, pastel tones, balanced whites, and gentle shadows. Perfect for lifestyle, wellness, and yoga shots.',
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
    description: 'Vibrant colors with realistic skin tones and enhanced clarity',
    prompt: 'Make colors vibrant and saturated while keeping skin tones realistic. Enhance clarity and add slight contrast for a punchy, Instagram-ready look.',
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
    description: 'Retro 35mm film look with warm faded tones and subtle grain',
    prompt: 'Add a retro 35mm film look with warm faded tones, subtle grain, and soft shadows. Keep details sharp but with a nostalgic mood.',
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
    description: 'Boost blues, greens, and warm tones for tropical sunny feel',
    prompt: 'Boost blues, greens, and warm tones for a tropical, sunny feel. Slight HDR for landscapes, keep people looking natural.',
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
    description: 'Desaturated blues with deep contrast and crisp details',
    prompt: 'Apply desaturated blues, deep contrast, and crisp details. Keep shadows strong and highlights clean for an urban city aesthetic.',
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
    description: 'Black and white with strong contrast and detailed textures',
    prompt: 'Convert to black and white with strong contrast, bright highlights, and detailed textures. Ideal for close-up portraits or moody street scenes.',
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
    description: 'Soft-focus effect with pastel colors and warm highlights',
    prompt: 'Add soft-focus effect, pastel colors, and warm highlights for a dreamy, romantic vibe. Keep details smooth and flattering.',
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
    description: 'Simulate golden hour lighting with warm tones and glowing highlights',
    prompt: 'Simulate golden hour lighting—warm tones, glowing highlights, and soft shadows. Perfect for portraits and sunsets.',
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
    description: 'Sleek desaturated tones with strong contrast and smooth skin',
    prompt: 'Sleek desaturated tones with strong contrast, minimal noise, and smooth skin retouching. Magazine cover quality.',
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
    description: 'Deep green tones with soft diffused light and light fog',
    prompt: 'Deep green tones, soft diffused light, and light fog overlay for a moody forest atmosphere.',
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
    description: 'Warm sandy tones with golden highlights and gentle texture',
    prompt: 'Warm sandy tones, golden highlights, and gentle texture enhancement for desert and dune scenes.',
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
    description: 'Warm faded tones with soft focus and subtle frame edge blur',
    prompt: 'Add warm faded tones, soft focus, and subtle frame edge blur for a retro instant camera feel.',
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
    description: 'Enhanced sharpness and clarity while keeping colors true',
    prompt: 'Enhance sharpness, remove haze, and boost clarity while keeping colors true to life.',
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
    description: 'Bright blues with soft whites and airy highlights',
    prompt: 'Bright blues, soft whites, and airy highlights for a clean, coastal feel.',
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
    description: 'Rich saturated colors with warm highlights and slight vignette',
    prompt: 'Rich saturated colors, warm highlights, and slight vignette for lively festival and street party scenes.',
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
    description: 'High-contrast black and white with sharp detail and deep blacks',
    prompt: 'High-contrast black and white with sharp detail, deep blacks, and a timeless cinematic mood.',
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
    description: 'Golden warmth with soft shadows and glowing skin tones',
    prompt: 'Golden warmth, soft shadows, and glowing skin tones for outdoor sunlit photos.',
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
    description: 'Cool blues and crisp whites for winter and mountain scenes',
    prompt: 'Cool blues and crisp whites for winter and mountain scenes, enhancing snow textures.',
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
    description: 'Vivid neon colors with deep blacks and sharp clarity',
    prompt: 'Vivid neon colors, deep blacks, and sharp clarity for night city scenes.',
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
    description: 'Enhance traditional fabrics and patterns with natural light',
    prompt: 'Enhance traditional fabrics, patterns, and natural light to showcase cultural richness.',
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
    description: 'Smooth skin tones with natural color correction and soft blur',
    prompt: 'Smooth skin tones, natural color correction, and soft background blur for professional portraits.',
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
    description: 'Cool tones with soft reflections and subtle raindrop texture',
    prompt: 'Cool tones, soft reflections, and subtle raindrop texture for rainy street or nature scenes.',
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
    description: 'Enhance fur, feathers, or scales with natural tones and sharp detail',
    prompt: 'Enhance fur, feathers, or scales with natural tones and sharp detail, keeping background slightly blurred.',
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
    description: 'High contrast with rich shadows and enhanced textures',
    prompt: 'High contrast, rich shadows, and enhanced textures for documentary-style street photography.',
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
