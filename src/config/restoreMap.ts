// Restore Configuration - Type-Safe with Compile-Time Guarantees

// Only the configured Restore options (matching OPTION_GROUPS)
export const RESTORE_OPTIONS = [
  "colorize_bw",
  "revive_faded",
  "sharpen_enhance", 
  "remove_scratches"
] as const

export type RestoreOption = typeof RESTORE_OPTIONS[number]

// Restore configuration with preset and custom prompt
export interface RestoreConfig {
  presetId: string
  prompt: string
}

// All valid preset IDs (should match your actual presets)
export type PresetId = 
  | "crystal_clear" | "vivid_pop" | "bright_airy" | "tropical_boost" 
  | "noir_classic" | "soft_skin_portrait" | "cinematic_glow" | "neon_nights"
  | "urban_grit" | "retro_polaroid" | "vintage_film_35mm" | "mono_drama"

// Restore mappings - each option maps to a preset + custom prompt (matching OPTION_GROUPS)
export const RESTORE_MAP = {
  "colorize_bw": {
    presetId: "crystal_clear",
    prompt: "enhance clarity and sharpness, crisp details, clean and precise look colorize black and white photo, soft color restore overlay"
  },
  "revive_faded": {
    presetId: "vivid_pop",
    prompt: "restore faded colors, lift shadows, reduce color cast, enhance vibrancy"
  },
  "sharpen_enhance": {
    presetId: "crystal_clear", 
    prompt: "enhance clarity and sharpness, crisp details, clean and precise look"
  },
  "remove_scratches": {
    presetId: "crystal_clear",
    prompt: "enhance clarity and sharpness, crisp details, clean and precise look remove fine scratches and artifacts, light smoothing, preserve texture"
  }
} as const satisfies Record<RestoreOption, RestoreConfig>

// Helper functions for validation
export function isValidRestoreOption(option: string): option is RestoreOption {
  return RESTORE_OPTIONS.includes(option as RestoreOption)
}

export function getRestoreConfig(option: RestoreOption): RestoreConfig {
  return RESTORE_MAP[option]
}
