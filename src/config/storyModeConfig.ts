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

// Story theme options
export const STORY_OPTIONS = [
  "four_seasons_autumn",
  "four_seasons_winter", 
  "four_seasons_spring",
  "four_seasons_summer",
  "adventure_journey",
  "lifestyle_moments",
  "travel_memories",
  "portrait_series",
  "urban_stories",
  "nature_tales",
  "vintage_memories",
  "dramatic_scenes"
] as const

export type StoryOption = typeof STORY_OPTIONS[number]

// Story configuration with preset and custom prompt
export interface StoryConfig {
  presetId: StoryPresetId
  prompt: string
}

// Story mappings - each option maps to a preset + custom prompt
export const STORY_THEMES = {
  "four_seasons_autumn": {
    presetId: "bright_airy",
    prompt: "autumn palette, warm golden light, soft contrast, cinematic fall atmosphere"
  },
  "four_seasons_winter": {
    presetId: "cinematic_glow", 
    prompt: "winter mood, cool tones, crisp light, serene winter atmosphere"
  },
  "four_seasons_spring": {
    presetId: "vivid_pop",
    prompt: "spring freshness, vibrant greens, soft natural light, renewal energy"
  },
  "four_seasons_summer": {
    presetId: "tropical_boost",
    prompt: "summer warmth, bright saturated colors, golden hour glow, vacation vibes"
  },
  "adventure_journey": {
    presetId: "cinematic_glow",
    prompt: "epic adventure, dramatic lighting, heroic composition, journey narrative"
  },
  "lifestyle_moments": {
    presetId: "bright_airy",
    prompt: "authentic lifestyle, natural moments, soft beautiful light, genuine emotion"
  },
  "travel_memories": {
    presetId: "tropical_boost",
    prompt: "travel photography, cultural richness, vibrant destinations, wanderlust"
  },
  "portrait_series": {
    presetId: "soft_skin_portrait",
    prompt: "portrait storytelling, emotional depth, beautiful skin tones, character focus"
  },
  "urban_stories": {
    presetId: "noir_classic",
    prompt: "urban narrative, city atmosphere, street photography, metropolitan mood"
  },
  "nature_tales": {
    presetId: "bright_airy",
    prompt: "nature storytelling, organic beauty, natural harmony, environmental mood"
  },
  "vintage_memories": {
    presetId: "cinematic_glow",
    prompt: "vintage nostalgia, timeless quality, classic photography, memory lane"
  },
  "dramatic_scenes": {
    presetId: "noir_classic",
    prompt: "dramatic storytelling, intense mood, powerful composition, emotional impact"
  }
} as const satisfies Record<StoryOption, StoryConfig>

// Helper functions for validation
export function isValidStoryOption(option: string): option is StoryOption {
  return STORY_OPTIONS.includes(option as StoryOption)
}

export function getStoryConfig(option: StoryOption): StoryConfig {
  return STORY_THEMES[option]
}

// Get default story presets (fallback)
export function getDefaultStoryPresets(): StoryPresetId[] {
  return STORY_PRESET_IDS.slice(0, 4)
}
