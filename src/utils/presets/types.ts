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

// ---- Use your existing 25 presets (import from your current system) ----
// This will be replaced with imports from your existing preset system
export const PRESETS = {
  // Core 6 for weekly rotation
  crystal_clear: {
    id: 'crystal_clear',
    label: 'Crystal Clear',
    prompt: 'enhance clarity and sharpness, crisp details, clean and precise look',
    negative_prompt: 'blurry, soft, hazy',
    strength: 0.6,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  cinematic_glow: {
    id: 'cinematic_glow',
    label: 'Cinematic Glow',
    prompt: 'cinematic color grading, warm highlights, deep shadows, rich blacks, subtle teal-orange',
    negative_prompt: 'flat, dull, oversaturated, harsh lighting',
    strength: 0.75,
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
  vintage_film_35mm: {
    id: 'vintage_film_35mm',
    label: 'Vintage Film 35mm',
    prompt: 'vintage 35mm film aesthetic, warm color grading, subtle grain, soft contrast',
    negative_prompt: 'digital, sharp, modern, clinical',
    strength: 0.75,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  dreamy_pastels: {
    id: 'dreamy_pastels',
    label: 'Dreamy Pastels',
    prompt: 'soft pastel colors, dreamy atmosphere, gentle lighting, ethereal mood',
    negative_prompt: 'harsh, bold, saturated, dramatic',
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
  // Additional presets for story sequences
  noir_classic: {
    id: 'noir_classic',
    label: 'Noir Classic',
    prompt: 'film noir aesthetic, dramatic shadows, high contrast black and white',
    negative_prompt: 'bright, colorful, flat lighting',
    strength: 0.75,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  retro_polaroid: {
    id: 'retro_polaroid',
    label: 'Retro Polaroid',
    prompt: 'vintage polaroid aesthetic, soft focus, warm tones, slight vignette',
    negative_prompt: 'sharp, digital, modern',
    strength: 0.7,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  sun_kissed: {
    id: 'sun_kissed',
    label: 'Sun Kissed',
    prompt: 'warm golden sunlight, natural glow, soft highlights, summer feeling',
    negative_prompt: 'cold, harsh, artificial lighting',
    strength: 0.7,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  moody_forest: {
    id: 'moody_forest',
    label: 'Moody Forest',
    prompt: 'moody forest atmosphere, deep greens, mysterious lighting, natural drama',
    negative_prompt: 'bright, urban, artificial',
    strength: 0.75,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  frost_light: {
    id: 'frost_light',
    label: 'Frost Light',
    prompt: 'cool winter light, crisp atmosphere, subtle blue tones, fresh feeling',
    negative_prompt: 'warm, tropical, summer',
    strength: 0.7,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  golden_hour_magic: {
    id: 'golden_hour_magic',
    label: 'Golden Hour Magic',
    prompt: 'magical golden hour light, warm glow, soft shadows, romantic atmosphere',
    negative_prompt: 'harsh midday, artificial lighting',
    strength: 0.75,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
  urban_grit: {
    id: 'urban_grit',
    label: 'Urban Grit',
    prompt: 'urban street photography, gritty contrast, raw city aesthetic',
    negative_prompt: 'clean, polished, suburban',
    strength: 0.8,
    model: 'eagle',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
  },
} satisfies Record<string, Preset>;

export type PresetId = keyof typeof PRESETS;

// 1) Source of truth for the weekly rotation (exactly 6 ids, rotated weekly)
export const ACTIVE_PRESET_IDS: PresetId[] = [
  'crystal_clear',
  'cinematic_glow', 
  'neon_nights',
  'vintage_film_35mm',
  'dreamy_pastels',
  'vivid_pop'
];

// Option refs must point to existing presets:
type OptionRef<P extends Record<string, Preset>> = {
  use: keyof P;
  overrides?: DeepPartial<Preset>;
};
type OptionGroups<P extends Record<string, Preset>> = {
  time_machine?: Record<string, OptionRef<P>>;
  restore?: Record<string, OptionRef<P>>;
};

// 2) Time Machine & Restore as simple option mappings (no complexity)
export const OPTION_GROUPS: OptionGroups<typeof PRESETS> = {
  // TIME MACHINE (1→1 mapping + tiny overrides when needed)
  time_machine: {
    noir_1920s: { use: 'noir_classic' },
    kodachrome_1960s: { use: 'vintage_film_35mm' },
    vhs_1980s: { use: 'retro_polaroid' },
    disposable_1990s: { 
      use: 'vintage_film_35mm', 
      overrides: { 
        strength: 0.55, 
        prompt: 'vintage 35mm film aesthetic, warm color grading, subtle grain, soft contrast, soft grain variant' 
      } 
    },
    cyberpunk_2100: { use: 'neon_nights' },
  },
  
  // RESTORE (base preset + low-risk overrides)
  restore: {
    colorize_bw: { 
      use: 'crystal_clear', 
      overrides: { 
        mode: 'restore', 
        prompt: 'enhance clarity and sharpness, crisp details, clean and precise look, colorize black and white photo, soft color restore overlay' 
      } 
    },
    revive_faded: { use: 'vivid_pop', overrides: { strength: 0.45 } },
    sharpen_enhance: { use: 'crystal_clear', overrides: { post: { sharpen: true } } },
    remove_scratches: { 
      use: 'crystal_clear', 
      overrides: { 
        strength: 0.5, 
        prompt: 'enhance clarity and sharpness, crisp details, clean and precise look, remove fine scratches and artifacts, light smoothing, preserve texture' 
      } 
    },
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
