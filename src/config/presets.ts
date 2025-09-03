// presets.ts - Updated to use Professional Preset System
import { PROFESSIONAL_PRESETS, ProfessionalPresetConfig, ProfessionalPresetKey } from './professional-presets';

export type PresetKey = ProfessionalPresetKey;

export type PresetSel = { slug?: string; label?: string } | string;

// Get active presets directly from professional presets (no rotation service needed)
export function getActivePresets(): ProfessionalPresetConfig[] {
  return Object.values(PROFESSIONAL_PRESETS);
}

// Get preset prompts for active presets
export const PRESET_PROMPTS: Record<string, string> = (() => {
  const activePresets = getActivePresets();
  const prompts: Record<string, string> = {};
  
  activePresets.forEach(preset => {
    prompts[preset.id] = preset.promptAdd;
  });
  
  return prompts;
})();

// V2V-specific prompts for video processing
export const V2V_PRESET_PROMPTS: Record<string, string> = (() => {
  const activePresets = getActivePresets();
  const prompts: Record<string, string> = {};
  
  activePresets.forEach(preset => {
    // Add video-specific enhancements to prompts
    prompts[preset.id] = `${preset.promptAdd}, smooth motion, cinematic timing, enhanced video quality`;
  });
  
  return prompts;
})();

// normalize any input to a slug
export function toSlug(sel: PresetSel): string {
  const raw =
    typeof sel === 'string'
      ? sel
      : (sel?.slug || sel?.label || '');
  return raw.trim().toLowerCase().replace(/\s+/g, '_');
}

export function promptForPreset(sel: PresetSel, isVideo = false, fallback = 'stylize, preserve subject and composition'): string {
  const slug = toSlug(sel);
  const promptMap = isVideo ? V2V_PRESET_PROMPTS : PRESET_PROMPTS;
  const prompt = promptMap[slug];
  console.log('🎨 Preset lookup:', { input: sel, slug, isVideo, found: !!prompt, prompt: prompt || fallback });
  return prompt || fallback;
}

export interface PresetConfig {
  label: string
  prompt: string
  negative_prompt?: string
  strength: number
  description?: string
}

// Convert professional presets to the format expected by the UI
export const PRESETS: Record<PresetKey, PresetConfig> = (() => {
  const activePresets = getActivePresets();
  const presets: Record<PresetKey, PresetConfig> = {} as Record<PresetKey, PresetConfig>;
  
  activePresets.forEach(preset => {
    presets[preset.id as PresetKey] = {
      label: preset.label,
      prompt: preset.promptAdd,
      negative_prompt: 'blurry, low quality, distorted',
      strength: preset.strength,
      description: preset.description
    };
  });
  
  return presets;
})();

// Helper to build your I2I payload (BFL Flux I2I)
export function buildI2IPayload(preset: PresetConfig, image_url: string) {
  return {
    model: 'bfl/flux-pro-1.1',
    prompt: preset.prompt,
    image_url,
    strength: preset.strength,
    num_inference_steps: 30, // Optimized for BFL
    guidance_scale: 8,   // Optimized for BFL
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  };
}
