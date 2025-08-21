// Professional AI Editing Presets (retuned for safe I2I)
// Notes:
// - Prompts include preservation + single-panel guard.
// - Strengths are edit-safe; your router should still clamp to [0.08, 0.22].
// - Always pass negative_prompt through to the model.

export type ProfessionalPresetKey =
  | 'cinematic_glow' | 'bright_airy' | 'vivid_pop' | 'vintage_film_35mm' | 'tropical_boost'
  | 'urban_grit' | 'mono_drama' | 'dreamy_pastels' | 'golden_hour_magic' | 'high_fashion_editorial'
  | 'moody_forest' | 'desert_glow' | 'retro_polaroid' | 'crystal_clear' | 'ocean_breeze'
  | 'festival_vibes' | 'noir_classic' | 'sun_kissed' | 'frost_light' | 'neon_nights'
  | 'cultural_glow' | 'soft_skin_portrait' | 'rainy_day_mood' | 'wildlife_focus' | 'street_story'
  | 'express_enhance';

export interface ProfessionalPresetConfig {
  id: string
  name: string
  tag: string
  prompt: string
  negative_prompt?: string
  strength: number
  description: string
  category: 'cinematic' | 'minimal' | 'vibrant' | 'vintage' | 'nature'
}

const SINGLE_PANEL_GUARD =
  'Render as one continuous single frame (no grid, collage, split-screen, mirror, border or frame). Show only one instance of the subject.';
const PRESERVE_IDENTITY =
  'Preserve the original composition, camera crop, subject identity and facial geometry. Do not add or remove objects. Keep background layout unchanged.';
const BASE_NEG =
  'duplicate face, extra face, extra limb, split screen, collage, grid, diptych, mirror, border, frame, text, caption, watermark, logo, signature, anime, cartoon, 2D, low quality, jpeg artifacts, oversharpened, waxy skin, deformed, distorted, unrealistic';
const BASE_PROMPT_SUFFIX = `${SINGLE_PANEL_GUARD} ${PRESERVE_IDENTITY}`;

// All Professional Presets (retuned)
export const PROFESSIONAL_PRESETS: Record<ProfessionalPresetKey, ProfessionalPresetConfig> = {
  cinematic_glow: {
    id: 'cinematic_glow',
    name: 'Cinematic Glow',
    tag: 'Cinematic',
    prompt:
      `Enhance with cinematic color grading: warm highlights, deep shadows, rich blacks, subtle teal–orange balance. Keep skin natural. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, harsh color shifts`,
    strength: 0.16,
    description: 'Professional cinematic look with teal–orange balance',
    category: 'cinematic'
  },

  bright_airy: {
    id: 'bright_airy',
    name: 'Clean Minimal',
    tag: 'Minimalist',
    prompt:
      `Clean, airy edit: soft light, pastel tones, balanced whites, gentle shadows. Ideal for lifestyle/wellness. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, crushed blacks, blown highlights`,
    strength: 0.12,
    description: 'Clean, minimal aesthetic for lifestyle content',
    category: 'minimal'
  },

  vivid_pop: {
    id: 'vivid_pop',
    name: 'Color Pop',
    tag: 'Vibrant',
    prompt:
      `Boost saturation and micro-contrast for vibrant, punchy color while keeping skin tones realistic. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, posterization, oversaturation`,
    strength: 0.18,
    description: 'Bold, vibrant colors suited to social media',
    category: 'vibrant'
  },

  vintage_film_35mm: {
    id: 'vintage_film_35mm',
    name: 'Film Look 35mm',
    tag: 'Vintage',
    prompt:
      `Retro 35mm vibe: warm faded tones, subtle fine film grain (not digital noise), soft shadows; keep detail intact. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, digital noise, plastic skin`,
    strength: 0.18,
    description: 'Classic film aesthetic with warm, nostalgic tones',
    category: 'vintage'
  },

  tropical_boost: {
    id: 'tropical_boost',
    name: 'Tropical Vibes',
    tag: 'Travel',
    prompt:
      `Enhance blues/greens and warm sunlit tones; gentle HDR for landscapes; keep people natural. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, cyan shift on skin`,
    strength: 0.18,
    description: 'Tropical colors for travel scenes',
    category: 'vibrant'
  },

  urban_grit: {
    id: 'urban_grit',
    name: 'Urban Grit',
    tag: 'Urban',
    prompt:
      `Desaturated blues, strong contrast, crisp micro-detail; modern street mood without changing layout. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, halos, over-sharpening`,
    strength: 0.18,
    description: 'Gritty, modern city aesthetic',
    category: 'vibrant'
  },

  mono_drama: {
    id: 'mono_drama',
    name: 'B&W Drama',
    tag: 'Black & White',
    prompt:
      `Convert to rich black and white: strong contrast, bright highlights, detailed textures; filmic tonality. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, color`,
    strength: 0.20,
    description: 'Dramatic B&W with strong contrast',
    category: 'cinematic'
  },

  dreamy_pastels: {
    id: 'dreamy_pastels',
    name: 'Soft Pastel Glow',
    tag: 'Soft',
    prompt:
      `Soft-focus glow, pastel palette, warm highlights; flattering but natural detail retention. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, haze artifacts, plastic skin`,
    strength: 0.14,
    description: 'Soft, dreamy aesthetic',
    category: 'cinematic'
  },

  golden_hour_magic: {
    id: 'golden_hour_magic',
    name: 'Golden Hour Magic',
    tag: 'Warm',
    prompt:
      `Simulate golden hour: warm tones, glowing highlights, soft rolloff in shadows; keep skin natural. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, orange cast on whites`,
    strength: 0.16,
    description: 'Warm golden hour simulation',
    category: 'cinematic'
  },

  high_fashion_editorial: {
    id: 'high_fashion_editorial',
    name: 'Fashion Editorial',
    tag: 'Editorial',
    prompt:
      `Sleek editorial finish: gently desaturated palette, strong contrast, subtle skin polish (retain pores), magazine clean. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, over-smoothing, plastic skin`,
    strength: 0.18,
    description: 'Editorial look for fashion content',
    category: 'cinematic'
  },

  moody_forest: {
    id: 'moody_forest',
    name: 'Forest Mood',
    tag: 'Nature',
    prompt:
      `Deep greens, soft diffused light, subtle fog atmosphere; maintain natural luminance separation. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, color cast on skin`,
    strength: 0.16,
    description: 'Moody forest atmosphere',
    category: 'nature'
  },

  desert_glow: {
    id: 'desert_glow',
    name: 'Golden Dunes',
    tag: 'Travel',
    prompt:
      `Warm sandy palette, golden highlights, gentle texture/clarity for dunes; avoid halos. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, cyan shadows`,
    strength: 0.16,
    description: 'Warm desert tones',
    category: 'vintage'
  },

  retro_polaroid: {
    id: 'retro_polaroid',
    name: 'Instant Retro',
    tag: 'Vintage',
    prompt:
      `Warm faded tones, soft focus, subtle edge vignette (not a hard frame) for instant-camera feel. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}`, // keep frame/border neg to avoid fake frames
    strength: 0.16,
    description: 'Retro instant camera aesthetic',
    category: 'vintage'
  },

  crystal_clear: {
    id: 'crystal_clear',
    name: 'Sharp Clarity',
    tag: 'Clarity',
    prompt:
      `Increase clarity and sharpness, remove haze, keep colors true-to-life; retain natural skin texture. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, halos, over-sharpening, crunchy detail`,
    strength: 0.12,
    description: 'Maximum clarity with natural rendering',
    category: 'minimal'
  },

  ocean_breeze: {
    id: 'ocean_breeze',
    name: 'Coastal Air',
    tag: 'Travel',
    prompt:
      `Bright ocean blues, clean whites, airy highlights; crisp yet soft coastal feel. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, cyan skin`,
    strength: 0.14,
    description: 'Clean coastal aesthetic',
    category: 'nature'
  },

  festival_vibes: {
    id: 'festival_vibes',
    name: 'Vibrant Festival',
    tag: 'Vibrant',
    prompt:
      `Rich saturation, warm highlights, slight vignette for lively festival energy; keep faces true. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, neon clipping, oversaturation`,
    strength: 0.20,
    description: 'Lively, colorful festival atmosphere',
    category: 'vibrant'
  },

  noir_classic: {
    id: 'noir_classic',
    name: 'Noir Cinema',
    tag: 'Black & White',
    prompt:
      `High-contrast monochrome with deep blacks and crisp detail; timeless cinematic mood. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, color`,
    strength: 0.20,
    description: 'Classic high-contrast noir',
    category: 'cinematic'
  },

  sun_kissed: {
    id: 'sun_kissed',
    name: 'Warm Glow',
    tag: 'Warm',
    prompt:
      `Golden warmth, soft shadows, glowing skin tones for outdoor sunlight; protect whites. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, orange cast on whites`,
    strength: 0.16,
    description: 'Natural sunlit warmth',
    category: 'vibrant'
  },

  frost_light: {
    id: 'frost_light',
    name: 'Winter Chill',
    tag: 'Cool',
    prompt:
      `Cool blues and crisp whites; enhance snow texture without gray mush; keep skin neutral. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, muddy snow`,
    strength: 0.16,
    description: 'Cool winter aesthetic',
    category: 'nature'
  },

  neon_nights: {
    id: 'neon_nights',
    name: 'Neon Nights',
    tag: 'Urban',
    prompt:
      `Vivid neon color contrast with deep blacks and high clarity for night city scenes; protect skin tones. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, banding, neon clipping`,
    strength: 0.20,
    description: 'Vibrant neon city night look',
    category: 'vibrant'
  },

  cultural_glow: {
    id: 'cultural_glow',
    name: 'Cultural Heritage',
    tag: 'Travel',
    prompt:
      `Enhance traditional fabrics/patterns and natural light; emphasize authentic color and texture. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, artificial tint`,
    strength: 0.16,
    description: 'Cultural richness with natural lighting',
    category: 'nature'
  },

  soft_skin_portrait: {
    id: 'soft_skin_portrait',
    name: 'Natural Portrait',
    tag: 'Portrait',
    prompt:
      `Subtle skin polish and color correction with soft background separation; retain pores and natural texture. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, plastic skin, over-smoothing`,
    strength: 0.12,
    description: 'Natural portrait with gentle enhancement',
    category: 'minimal'
  },

  rainy_day_mood: {
    id: 'rainy_day_mood',
    name: 'Rain Mood',
    tag: 'Moody',
    prompt:
      `Cool tonal palette, soft reflections, subtle rain atmosphere; preserve contrast in midtones. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, muddy midtones`,
    strength: 0.16,
    description: 'Moody rainy atmosphere',
    category: 'nature'
  },

  wildlife_focus: {
    id: 'wildlife_focus',
    name: 'Wildlife Detail',
    tag: 'Nature',
    prompt:
      `Enhance fur/feather/scale detail with natural tones; gently blur background separation if needed. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, over-sharpening, artifacting`,
    strength: 0.16,
    description: 'Natural detail for wildlife',
    category: 'nature'
  },

  street_story: {
    id: 'street_story',
    name: 'Urban Portrait',
    tag: 'Urban',
    prompt:
      `Documentary street contrast, rich shadows, enhanced textures; keep story elements intact. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, halos, crunchy grain`,
    strength: 0.18,
    description: 'Documentary street aesthetic',
    category: 'minimal'
  },

  express_enhance: {
    id: 'express_enhance',
    name: 'Express Enhance',
    tag: 'Clarity',
    prompt:
      `Quick clarity boost: sharpen, dehaze, polish—without altering composition or skin realism. ${BASE_PROMPT_SUFFIX}`,
    negative_prompt: `${BASE_NEG}, halos, plastic skin`,
    strength: 0.12,
    description: 'Fast polish: clarity + dehaze',
    category: 'minimal'
  }
};

// Helpers unchanged:
export function getPresetsByCategory(category: string): ProfessionalPresetConfig[] {
  return Object.values(PROFESSIONAL_PRESETS).filter(preset => preset.category === category);
}
export function getAllCategories(): string[] {
  return [...new Set(Object.values(PROFESSIONAL_PRESETS).map(preset => preset.category))];
}
export function getRandomPresets(count: number): ProfessionalPresetConfig[] {
  const presets = Object.values(PROFESSIONAL_PRESETS);
  const shuffled = [...presets].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
