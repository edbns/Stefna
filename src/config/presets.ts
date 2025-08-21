// presets.ts - Updated to use Professional Preset System
import { PROFESSIONAL_PRESETS, ProfessionalPresetConfig, ProfessionalPresetKey } from './professional-presets';
import presetRotationService from '../services/presetRotationService';

export type PresetKey = ProfessionalPresetKey;

export type PresetSel = { slug?: string; label?: string } | string;

// Get active presets from rotation service
export function getActivePresets(): ProfessionalPresetConfig[] {
  return presetRotationService.getActivePresets();
}

// Get preset prompts for active presets
export const PRESET_PROMPTS: Record<string, string> = (() => {
  const activePresets = getActivePresets();
  const prompts: Record<string, string> = {};
  
  activePresets.forEach(preset => {
    prompts[preset.id] = preset.prompt;
  });
  
  return prompts;
})();

// V2V-specific prompts for video processing
export const V2V_PRESET_PROMPTS: Record<string, string> = (() => {
  const activePresets = getActivePresets();
  const prompts: Record<string, string> = {};
  
  activePresets.forEach(preset => {
    // Add video-specific enhancements to prompts
    prompts[preset.id] = `${preset.prompt}, smooth motion, cinematic timing, enhanced video quality`;
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

export function promptForPreset(sel: PresetSel, isVideo = false): string {
  const slug = toSlug(sel);
  const promptMap = isVideo ? V2V_PRESET_PROMPTS : PRESET_PROMPTS;
  const prompt = promptMap[slug];
  if (!prompt) throw new Error(`Preset prompt not found for "${slug}"`);
  console.log('🎨 Preset lookup:', { input: sel, slug, isVideo, found: true, prompt });
  return prompt;
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
      label: preset.name,
      prompt: preset.prompt,
      negative_prompt: preset.negative_prompt || 'blurry, low quality, distorted',
      strength: preset.strength,
      description: preset.description
    };
  });
  
  return presets;
})();

// Helper to build your I2I payload (uses router for proper engine selection)
export function buildI2IPayload(presetId: string, image_url: string) {
  // Import and use the router for proper payload building
  const { buildPayload } = require('../utils/router');
  return buildPayload(presetId, image_url);
}
