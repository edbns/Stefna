// utils/presets/types.ts
export type Mode = 'i2i'|'txt2img'|'restore'|'story';
export type IO = 'image'|'video';

export type Preset = {
  id: string; 
  label: string; 
  description?: string;
  prompt: string; 
  negative_prompt?: string;
  strength?: number; 
  model?: 'eagle'|'flux'|'other';
  mode: Mode; 
  input: IO; 
  requiresSource?: boolean;
  post?: { upscale?: 'x2'|'x4'; sharpen?: boolean };
};

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

// ---- Registries (yours) ----------------------------------------------------
export const PRESETS = {
  cinematic_glow: {
    id: 'cinematic_glow',
    label: 'Cinematic Glow',
    prompt: 'Enhance this image/video with cinematic color grading, warm highlights, deep shadows, rich blacks. Subtle teal-orange. Keep faces natural.',
    negative_prompt: 'flat, dull, oversaturated, harsh lighting',
    strength: 0.75, 
    model: 'eagle', 
    mode: 'i2i', 
    input: 'image', 
    requiresSource: true,
  },
  bright_airy: {
    id: 'bright_airy',
    label: 'Bright & Airy',
    prompt: 'bright, airy, clean aesthetic with lifted shadows, soft highlights, minimal contrast, fresh and light feeling',
    negative_prompt: 'dark, moody, heavy shadows, high contrast',
    strength: 0.7,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  vivid_pop: {
    id: 'vivid_pop',
    label: 'Vivid Pop',
    prompt: 'vibrant colors, enhanced saturation, punchy contrast, bold and energetic look',
    negative_prompt: 'muted, desaturated, flat colors',
    strength: 0.8,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  vintage_film_35mm: {
    id: 'vintage_film_35mm',
    label: 'Vintage Film 35mm',
    prompt: 'vintage 35mm film aesthetic, warm color grading, subtle grain, soft contrast, nostalgic feel',
    negative_prompt: 'digital, sharp, modern, clinical',
    strength: 0.75,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  // --- Film looks
  film_90s: {
    id:'film_90s', 
    label:'90s Disposable',
    prompt:'90s disposable camera aesthetic, on-camera flash, gentle vignette, medium grain, slight color cast, soft halation on highlights.',
    negative_prompt:'modern clarity, HDR, oversharp, neon',
    strength:0.7, 
    model:'eagle', 
    mode:'i2i', 
    input:'image', 
    requiresSource:true,
  },
  pns_2005: {
    id:'pns_2005', 
    label:'2005 Point-&-Shoot',
    prompt:'early-2000s compact camera look, cool white balance, slight on-camera flash bloom, mild barrel distortion, moderate digital noise.',
    negative_prompt:'cinematic grading, deep contrast',
    strength:0.65, 
    model:'eagle', 
    mode:'i2i', 
    input:'image', 
    requiresSource:true,
  },
  // --- Restore
  restore_sharpen: {
    id:'restore_sharpen', 
    label:'Restore & Sharpen',
    prompt:'Recover fine detail, reduce noise, deblur motion, maintain skin texture, natural contrast.',
    negative_prompt:'plastic skin, watercolor smearing',
    strength:0.6, 
    model:'eagle', 
    mode:'restore', 
    input:'image', 
    requiresSource:true, 
    post:{sharpen:true},
  },
  crystal_clear: {
    id: 'crystal_clear',
    label: 'Crystal Clear',
    prompt: 'enhance clarity and sharpness, crisp details, clean and precise look',
    negative_prompt: 'blurry, soft, hazy',
    strength: 0.6,
    model: 'eagle',
    mode: 'restore',
    input: 'image',
    requiresSource: true,
  },
  // --- Story moods
  story_night: {
    id:'story_night', 
    label:'Story: Night',
    prompt:'night-time ambiance, practical lights, soft bokeh, gentle noise, subdued palette, cinematic vignette',
    negative_prompt:'flat lighting, HDR halo, harsh neon',
    strength:0.6, 
    model:'eagle', 
    mode:'story', 
    input:'image', 
    requiresSource:true,
  },
  story_goldenhour: {
    id:'story_goldenhour', 
    label:'Story: Golden Hour',
    prompt:'warm golden-hour glow, long soft shadows, gentle flare, rich midtones, filmic contrast',
    negative_prompt:'cool cast, sterile light',
    strength:0.6, 
    model:'eagle', 
    mode:'story', 
    input:'image', 
    requiresSource:true,
  },
  // Additional presets from existing system
  tropical_boost: {
    id: 'tropical_boost',
    label: 'Tropical Boost',
    prompt: 'tropical vibes, warm saturated colors, enhanced blues and greens, vacation aesthetic',
    negative_prompt: 'cold, muted, winter',
    strength: 0.75,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  urban_grit: {
    id: 'urban_grit',
    label: 'Urban Grit',
    prompt: 'urban street photography, gritty contrast, desaturated with selective color pops, raw city aesthetic',
    negative_prompt: 'clean, polished, suburban',
    strength: 0.8,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  mono_drama: {
    id: 'mono_drama',
    label: 'Mono Drama',
    prompt: 'dramatic black and white, high contrast, deep shadows, striking highlights',
    negative_prompt: 'color, flat, low contrast',
    strength: 0.75,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  retro_polaroid: {
    id: 'retro_polaroid',
    label: 'Retro Polaroid',
    prompt: 'vintage polaroid aesthetic, soft focus, warm tones, slight vignette, instant camera feel',
    negative_prompt: 'sharp, digital, modern',
    strength: 0.7,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  soft_skin_portrait: {
    id: 'soft_skin_portrait',
    label: 'Soft Skin Portrait',
    prompt: 'portrait enhancement, soft skin tones, natural beauty, gentle lighting, flattering look',
    negative_prompt: 'harsh, over-processed, plastic',
    strength: 0.6,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  neon_nights: {
    id: 'neon_nights',
    label: 'Neon Nights',
    prompt: 'cyberpunk neon aesthetic, electric colors, urban nightlife, glowing highlights',
    negative_prompt: 'natural, muted, daylight',
    strength: 0.8,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
} satisfies Record<string, Preset>;

export type PresetId = keyof typeof PRESETS;

// Option refs must point to existing presets:
type OptionRef<P extends Record<string, Preset>> = {
  use: keyof P;
  overrides?: DeepPartial<Preset>;
};
type OptionGroups<P extends Record<string, Preset>> = {
  time_machine?: Record<string, OptionRef<P>>;
  restore?: Record<string, OptionRef<P>>;
  story?: Record<string, OptionRef<P>>;
};

// Buttons map
export const OPTION_GROUPS: OptionGroups<typeof PRESETS> = {
  time_machine: {
    '1990s_disposable': { use: 'film_90s', overrides: { strength: 0.7 } },
    '2000s_point_and_shoot': { use: 'pns_2005' },
    'sharpen_enhance': { use: 'restore_sharpen', overrides: { post: { sharpen: true } } },
    'vintage_film': { use: 'vintage_film_35mm' },
    'retro_polaroid': { use: 'retro_polaroid' },
  },
  restore: {
    sharpen_enhance: { use: 'restore_sharpen', overrides: { post: { sharpen: true } } },
    crystal_clear: { use: 'crystal_clear' },
    enhance_details: { use: 'crystal_clear', overrides: { strength: 0.7 } },
  },
  story: {
    time_night: { use: 'story_night', overrides: { prompt: 'night-time ambiance, practical lights, bokeh' } },
    time_goldenhour: { use: 'story_goldenhour' },
    cinematic_mood: { use: 'cinematic_glow', overrides: { mode: 'story' } },
  },
} as const;

// ---- Deep merge (handles nested `post`) ------------------------------------
function mergePreset(base: Preset, overrides: DeepPartial<Preset> = {}): Preset {
  return {
    ...base,
    ...overrides,
    post: { ...(base.post ?? {}), ...(overrides.post ?? {}) },
  };
}

// ---- Resolvers & click handlers -------------------------------------------
export function resolvePreset(id: PresetId, overrides: DeepPartial<Preset> = {}): Preset {
  const base = PRESETS[id];
  if (!base) throw new Error(`Preset ${String(id)} missing`);
  return mergePreset(base, overrides);
}

// ---- Safe helpers for UI (no-noop rendering) -------------------------------
export function getOptionEntries<G extends keyof typeof OPTION_GROUPS>(group: G) {
  const g = OPTION_GROUPS[group] ?? {};
  return Object.entries(g) as Array<[string, OptionRef<typeof PRESETS>]>;
}

export function isConfigured<G extends keyof typeof OPTION_GROUPS>(group: G, key: string) {
  return Boolean(OPTION_GROUPS[group]?.[key]);
}
