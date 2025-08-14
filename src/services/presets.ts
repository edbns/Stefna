// Master preset catalog for modes that reference presets outside the current 6-rotation
export type PresetDef = {
  label: string;
  prompt: string;
  negative_prompt?: string;
  strength?: number;
  description?: string;
};

export const MASTER_PRESET_CATALOG: Record<string, PresetDef> = {
  neon_nights: {
    label: "Neon Nights",
    prompt: "Vivid neon colors, deep blacks, crisp micro-contrast, night city vibe.",
    negative_prompt: "flat, muddy blacks, blown highlights, banding, halos, color bleed",
    strength: 0.7,
    description: "Night urban with neon pop"
  },
  crystal_clear: {
    label: "Crystal Clear",
    prompt: "Enhance sharpness, remove haze, boost clarity, keep colors true to life.",
    negative_prompt: "oversharpen halo, plastic skin, artificial texture, noise",
    strength: 0.65,
    description: "Clean detail and clarity"
  },
  noir_classic: {
    label: "Noir Classic",
    prompt: "High-contrast black and white, deep blacks, sharp detail, cinematic mood.",
    negative_prompt: "low-contrast, washed out, muddy blacks, blur, noise",
    strength: 0.7,
    description: "Timeless B/W look"
  },
  vintage_film_35mm: {
    label: "Vintage Film",
    prompt: "Film grain, warm tones, analog color grading, nostalgic atmosphere.",
    negative_prompt: "digital artifacts, oversaturation, harsh contrast, plastic look",
    strength: 0.6,
    description: "Classic film aesthetic"
  },
  retro_polaroid: {
    label: "Retro Polaroid",
    prompt: "Instant film look, soft focus, warm vintage colors, slight vignette.",
    negative_prompt: "sharp digital, cold tones, perfect clarity, modern look",
    strength: 0.65,
    description: "Instant camera nostalgia"
  },
  vivid_pop: {
    label: "Vivid Pop",
    prompt: "Saturated colors, high contrast, vibrant energy, bold visual impact.",
    negative_prompt: "muted colors, low contrast, dull, washed out",
    strength: 0.6,
    description: "Bold and energetic"
  },
  cinematic_glow: {
    label: "Cinematic Glow",
    prompt: "Warm cinematic lighting, subtle glow, film-like color grading, dramatic mood.",
    negative_prompt: "flat lighting, harsh shadows, amateur look, oversaturation",
    strength: 0.65,
    description: "Movie-like atmosphere"
  },
  bright_airy: {
    label: "Bright Airy",
    prompt: "Light and airy feel, soft shadows, clean bright tones, fresh atmosphere.",
    negative_prompt: "dark, heavy, muddy, harsh contrast",
    strength: 0.55,
    description: "Light and fresh"
  },
  urban_grit: {
    label: "Urban Grit",
    prompt: "Street photography style, raw urban energy, high contrast, gritty texture.",
    negative_prompt: "soft, clean, polished, suburban",
    strength: 0.7,
    description: "Raw city energy"
  },
  dreamy_pastels: {
    label: "Dreamy Pastels",
    prompt: "Soft pastel colors, dreamy atmosphere, gentle lighting, ethereal mood.",
    negative_prompt: "harsh colors, sharp contrast, dark, aggressive",
    strength: 0.5,
    description: "Soft and dreamy"
  }
};

// Prefer active-6 first; fall back to master catalog
export function getPresetDef(
  slug: string,
  active: Record<string, PresetDef>
): PresetDef | null {
  return active?.[slug] ?? MASTER_PRESET_CATALOG[slug] ?? null;
}

// Safe label getter that never crashes
export function getPresetLabel(
  slug: string | null | undefined,
  active: Record<string, PresetDef>
): string {
  if (!slug) return "Custom";
  const presetDef = getPresetDef(slug, active);
  return presetDef?.label ?? slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
