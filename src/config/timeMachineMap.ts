// Time Machine Configuration - Type-Safe with Compile-Time Guarantees

// All available Time Machine options
export const TIME_MACHINE_OPTIONS = [
  // Historical Periods
  "1920s_art_deco", "1930s_golden_age", "1940s_wartime", "1950s_americana", 
  "1960s_psychedelic", "1960s_kodachrome", "1970s_disco", "1980s_neon", "1990s_grunge", 
  "2000s_y2k", "2010s_hipster", "2020s_minimalist", "2100_cyberpunk",
  
  // Decades - Alternative naming
  "roaring_twenties", "great_depression", "golden_fifties", "swinging_sixties",
  "groovy_seventies", "radical_eighties", "grunge_nineties", "digital_2000s",
  "social_2010s", "streaming_2020s", "cyber_future",
  
  // Cultural Movements
  "art_nouveau", "bauhaus", "pop_art", "minimalism", "punk_rock", "new_wave",
  "grunge_movement", "indie_aesthetic", "hipster_culture",
  
  // Geographic/Cultural Eras
  "victorian_era", "jazz_age", "atomic_age", "space_age", "information_age",
  "digital_age", "social_media_age",
  
  // Artistic Movements
  "impressionism", "expressionism", "surrealism", "abstract_expressionism",
  "pop_art_movement", "street_art", "digital_art"
] as const

export type TimeMachineOption = typeof TIME_MACHINE_OPTIONS[number]

// All valid preset IDs (extend this as presets are added)
export type PresetId = 
  | "cinematic_glow" | "bright_airy" | "vivid_pop" | "vintage_film_35mm" 
  | "tropical_boost" | "urban_grit" | "mono_drama" | "dreamy_pastels"
  | "golden_hour_magic" | "high_fashion_editorial" | "moody_forest" 
  | "desert_glow" | "retro_polaroid" | "crystal_clear" | "ocean_breeze"
  | "festival_vibes" | "noir_classic" | "sun_kissed" | "frost_light" 
  | "neon_nights" | "cultural_glow" | "soft_skin_portrait" | "rainy_day_mood"
  | "wildlife_focus" | "street_story"

// ❗ Compile-time guarantee every option is mapped
export const TIME_MACHINE_MAP = {
  // Eras - Historical Periods
  "1920s_art_deco": "vintage_film_35mm",
  "1930s_golden_age": "cinematic_glow",
  "1940s_wartime": "mono_drama",
  "1950s_americana": "retro_polaroid", 
  "1960s_psychedelic": "vivid_pop",
  "1960s_kodachrome": "retro_polaroid",
  "1970s_disco": "neon_nights",
  "1980s_neon": "neon_nights",
  "1990s_grunge": "urban_grit",
  "2000s_y2k": "crystal_clear",
  "2010s_hipster": "retro_polaroid",
  "2020s_minimalist": "bright_airy",
  "2100_cyberpunk": "neon_nights",
  
  // Decades - Alternative naming
  "roaring_twenties": "vintage_film_35mm",
  "great_depression": "mono_drama",
  "golden_fifties": "retro_polaroid",
  "swinging_sixties": "vivid_pop",
  "groovy_seventies": "golden_hour_magic",
  "radical_eighties": "neon_nights", 
  "grunge_nineties": "urban_grit",
  "digital_2000s": "crystal_clear",
  "social_2010s": "retro_polaroid",
  "streaming_2020s": "bright_airy",
  "cyber_future": "neon_nights",
  
  // Cultural Movements
  "art_nouveau": "vintage_film_35mm",
  "bauhaus": "mono_drama",
  "pop_art": "vivid_pop",
  "minimalism": "bright_airy",
  "punk_rock": "urban_grit",
  "new_wave": "neon_nights",
  "grunge_movement": "urban_grit",
  "indie_aesthetic": "retro_polaroid",
  "hipster_culture": "vintage_film_35mm",
  
  // Geographic/Cultural Eras
  "victorian_era": "vintage_film_35mm",
  "jazz_age": "cinematic_glow",
  "atomic_age": "retro_polaroid",
  "space_age": "crystal_clear",
  "information_age": "bright_airy",
  "digital_age": "crystal_clear",
  "social_media_age": "vivid_pop",
  
  // Artistic Movements
  "impressionism": "dreamy_pastels",
  "expressionism": "mono_drama",
  "surrealism": "dreamy_pastels",
  "abstract_expressionism": "vivid_pop",
  "pop_art_movement": "vivid_pop",
  "street_art": "urban_grit",
  "digital_art": "crystal_clear"
} satisfies Record<TimeMachineOption, PresetId>

// Restore operations - Type-Safe
export const RESTORE_OPTIONS = [
  "enhance_details", "fix_colors", "remove_noise", 
  "sharpen_focus", "restore_vintage", "brighten_shadows"
] as const

export type RestoreOption = typeof RESTORE_OPTIONS[number]

// ❗ Compile-time guarantee every restore option is mapped
export const RESTORE_MAP = {
  "enhance_details": "crystal_clear",
  "fix_colors": "vivid_pop", 
  "remove_noise": "crystal_clear",
  "sharpen_focus": "crystal_clear",
  "restore_vintage": "vintage_film_35mm",
  "brighten_shadows": "vivid_pop"
} satisfies Record<RestoreOption, PresetId>
