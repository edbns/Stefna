// Time Machine Configuration - Type-Safe with Compile-Time Guarantees

// Only the configured Time Machine options (matching OPTION_GROUPS)
export const TIME_MACHINE_OPTIONS = [
  "1920s_noir_glam", "1960s_kodachrome", "1980s_vhs_retro", 
  "1990s_disposable", "futuristic_cyberpunk"
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

// ❗ Compile-time guarantee every option is mapped (matching OPTION_GROUPS)
export const TIME_MACHINE_MAP = {
  "1920s_noir_glam": "noir_classic",
  "1960s_kodachrome": "vintage_film_35mm",
  "1980s_vhs_retro": "retro_polaroid",
  "1990s_disposable": "vintage_film_35mm",
  "futuristic_cyberpunk": "neon_nights"
} satisfies Record<TimeMachineOption, PresetId>

// Restore operations - Type-Safe (matching OPTION_GROUPS)
export const RESTORE_OPTIONS = [
  "colorize_bw", "revive_faded", "sharpen_enhance", "remove_scratches"
] as const

export type RestoreOption = typeof RESTORE_OPTIONS[number]

// ❗ Compile-time guarantee every restore option is mapped (matching OPTION_GROUPS)
export const RESTORE_MAP = {
  "colorize_bw": "crystal_clear",
  "revive_faded": "vivid_pop", 
  "sharpen_enhance": "crystal_clear",
  "remove_scratches": "crystal_clear"
} satisfies Record<RestoreOption, PresetId>
