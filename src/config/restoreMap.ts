// Restore Configuration - Type-Safe with Compile-Time Guarantees

// All available Restore options
export const RESTORE_OPTIONS = [
  "revive_faded",
  "sharpen_enhance", 
  "fix_colors",
  "brighten_shadows",
  "enhance_details",
  "reduce_noise",
  "upscale_quality",
  "restore_vintage"
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

// Restore mappings - each option maps to a preset + custom prompt
export const RESTORE_MAP = {
  "revive_faded": {
    presetId: "vivid_pop",
    prompt: "restore faded colors, lift shadows, reduce color cast, enhance vibrancy"
  },
  "sharpen_enhance": {
    presetId: "crystal_clear", 
    prompt: "increase clarity and edge acuity, enhance details, avoid halos"
  },
  "fix_colors": {
    presetId: "vivid_pop",
    prompt: "correct color balance, fix white balance, natural color restoration"
  },
  "brighten_shadows": {
    presetId: "bright_airy",
    prompt: "lift shadows, brighten dark areas, maintain highlight detail"
  },
  "enhance_details": {
    presetId: "crystal_clear",
    prompt: "enhance fine details, improve texture clarity, sharpen edges"
  },
  "reduce_noise": {
    presetId: "soft_skin_portrait",
    prompt: "reduce image noise, smooth grain, preserve important details"
  },
  "upscale_quality": {
    presetId: "crystal_clear",
    prompt: "upscale resolution, enhance quality, preserve sharpness"
  },
  "restore_vintage": {
    presetId: "retro_polaroid",
    prompt: "restore vintage photo, fix age damage, preserve character"
  }
} as const satisfies Record<RestoreOption, RestoreConfig>

// Helper functions for validation
export function isValidRestoreOption(option: string): option is RestoreOption {
  return RESTORE_OPTIONS.includes(option as RestoreOption)
}

export function getRestoreConfig(option: RestoreOption): RestoreConfig {
  return RESTORE_MAP[option]
}
