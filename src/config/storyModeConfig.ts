// Story Mode Configuration - Type-Safe
// Deterministic preset selection for story sequences

export const STORY_PRESET_IDS = [
  "cinematic_glow",
  "vivid_pop", 
  "bright_airy",
  "tropical_boost",
  "noir_classic",
  "soft_skin_portrait"
] as const

export type StoryPresetId = typeof STORY_PRESET_IDS[number]

// Story themes and their associated presets
export const STORY_THEMES: Record<string, string[]> = {
  "adventure": ["cinematic_glow", "tropical_boost", "urban_grit", "golden_hour_magic"],
  "lifestyle": ["bright_airy", "soft_skin_portrait", "dreamy_pastels", "sun_kissed"],
  "travel": ["tropical_boost", "golden_hour_magic", "ocean_breeze", "cultural_glow"],
  "portrait": ["soft_skin_portrait", "cinematic_glow", "golden_hour_magic", "bright_airy"],
  "urban": ["urban_grit", "noir_classic", "neon_nights", "street_story"],
  "nature": ["moody_forest", "golden_hour_magic", "ocean_breeze", "wildlife_focus"],
  "vintage": ["vintage_film_35mm", "retro_polaroid", "mono_drama", "sepia_warmth"],
  "dramatic": ["noir_classic", "mono_drama", "cinematic_glow", "moody_forest"]
}

// Get presets for a specific story theme
export function getPresetsForTheme(theme: string): string[] {
  return STORY_THEMES[theme] || STORY_PRESET_IDS.slice(0, 4)
}

// Get default story presets (fallback)
export function getDefaultStoryPresets(): string[] {
  return STORY_PRESET_IDS.slice(0, 4)
}
