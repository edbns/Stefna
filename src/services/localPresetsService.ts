// src/services/localPresetsService.ts
// Local development service for experimenting with rotating presets
// This bypasses the database and uses the local rotatingPresets.ts file

import { ROTATING_PRESETS, getCurrentWeekPresets, getPresetByKey, RotatingPreset } from '../presets/rotatingPresets';

export class LocalPresetsService {
  // Get current week's presets (5 presets)
  static async getCurrentPresets() {
    console.log('🎨 [Local Presets] Using local development presets');
    const presets = getCurrentWeekPresets();
    
    return {
      success: true,
      data: {
        presets,
        currentWeek: Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7)) % 5 + 1,
        totalAvailable: presets.length,
        rotationInfo: {
          totalPresetsInSystem: 25,
          weeksInCycle: 5,
          presetsPerWeek: 5
        }
      }
    };
  }

  // Get a specific preset by key
  static async getPresetByKey(key: string) {
    const preset = getPresetByKey(key);
    if (!preset) {
      throw new Error(`Preset with key '${key}' not found`);
    }
    return preset;
  }

  // Get all presets (for development/testing)
  static async getAllPresets() {
    return ROTATING_PRESETS.filter(preset => preset.isActive);
  }

  // Start generation with a local preset
  static async startGeneration(presetKey: string, sourceAssetId: string) {
    const preset = getPresetByKey(presetKey);
    if (!preset) {
      throw new Error(`Preset '${presetKey}' not found`);
    }

    console.log('🚀 [Local Presets] Starting generation with local preset:', preset.label);
    console.log('📝 [Local Presets] Prompt:', preset.prompt);
    console.log('❌ [Local Presets] Negative Prompt:', preset.negativePrompt);

    // Call the unified generation endpoint with preset data
    const response = await fetch('/.netlify/functions/unified-generate-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'presets',
        sourceAssetId,
        prompt: preset.prompt,
        negative_prompt: preset.negativePrompt,
        strength: preset.strength,
        preset: presetKey
      })
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Development helper: Test a custom prompt
  static async testCustomPrompt(customPrompt: string, customNegativePrompt: string, sourceAssetId: string) {
    console.log('🧪 [Local Presets] Testing custom prompt');
    console.log('📝 [Local Presets] Custom Prompt:', customPrompt);
    console.log('❌ [Local Presets] Custom Negative Prompt:', customNegativePrompt);

    const response = await fetch('/.netlify/functions/unified-generate-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'custom',
        sourceAssetId,
        prompt: customPrompt,
        negative_prompt: customNegativePrompt,
        strength: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`Custom generation failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Export for easy access
export default LocalPresetsService;
