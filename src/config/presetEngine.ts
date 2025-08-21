import { PROFESSIONAL_PRESETS, ProfessionalPresetKey, ProfessionalPresetConfig } from './professional-presets';

export type PresetCategory = 'Cinematic' | 'Vibrant' | 'Minimalist' | 'Vintage' | 'Travel' | 'Nature' | 'Portrait' | 'Urban' | 'Black & White' | 'Soft' | 'Warm' | 'Editorial' | 'Clarity' | 'Cool' | 'Moody';

export interface PresetOption {
  key: ProfessionalPresetKey;
  displayName: string;
  category: PresetCategory;
  thumbnail: string;
  promptFragment: string;
  strength: number;
  model: string;
  features: string[];
  description: string;
}

export interface PresetRotationConfig {
  lastRotationDate: string;
  themeRotation: Record<PresetCategory, number>;
  rotationInterval: number; // in hours
}

export interface ActivePresetResult {
  presetKey: string;
  displayName: string;
  category: PresetCategory;
  thumbnail: string;
  promptFragment: string;
  strength: number;
  model: string;
  features: string[];
  description: string;
}

// Convert existing professional presets to the new format
export const allPresets: PresetOption[] = Object.entries(PROFESSIONAL_PRESETS).map(([key, preset]) => ({
  key: key as ProfessionalPresetKey,
  displayName: preset.label,
  category: preset.category as PresetCategory,
  thumbnail: `/presets/${key}.png`,
  promptFragment: preset.promptAdd,
  strength: preset.strength,
  model: preset.model,
  features: preset.features,
  description: preset.description
}));

// Default rotation configuration
export const DEFAULT_ROTATION_CONFIG: PresetRotationConfig = {
  lastRotationDate: new Date().toISOString(),
  themeRotation: {
    'Cinematic': 0,
    'Vibrant': 0,
    'Minimalist': 0,
    'Vintage': 0,
    'Travel': 0,
    'Nature': 0,
    'Portrait': 0,
    'Urban': 0,
    'Black & White': 0,
    'Soft': 0,
    'Warm': 0,
    'Editorial': 0,
    'Clarity': 0,
    'Cool': 0,
    'Moody': 0
  },
  rotationInterval: 24 // 24 hours
};

// Get rotation configuration from localStorage or use default
export function getRotationConfig(): PresetRotationConfig {
  try {
    const stored = localStorage.getItem('presetRotationConfig');
    if (stored) {
      const config = JSON.parse(stored);
      // Check if rotation is due
      const lastRotation = new Date(config.lastRotationDate);
      const now = new Date();
      const hoursSinceLastRotation = (now.getTime() - lastRotation.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastRotation >= config.rotationInterval) {
        // Rotate presets
        Object.keys(config.themeRotation).forEach(category => {
          config.themeRotation[category] = (config.themeRotation[category] + 1) % 
            allPresets.filter(p => p.category === category).length;
        });
        config.lastRotationDate = now.toISOString();
        localStorage.setItem('presetRotationConfig', JSON.stringify(config));
      }
      
      return config;
    }
  } catch (error) {
    console.warn('Failed to load rotation config:', error);
  }
  
  // Set default config
  localStorage.setItem('presetRotationConfig', JSON.stringify(DEFAULT_ROTATION_CONFIG));
  return DEFAULT_ROTATION_CONFIG;
}

// Get active presets based on rotation
export function getActivePresets(): ActivePresetResult[] {
  const config = getRotationConfig();
  const activePresets: ActivePresetResult[] = [];
  
  // Get 6 presets (2 from each major category)
  const categories = ['Cinematic', 'Vibrant', 'Minimalist', 'Vintage', 'Portrait', 'Urban'] as PresetCategory[];
  
  categories.forEach(category => {
    const categoryPresets = allPresets.filter(p => p.category === category);
    if (categoryPresets.length > 0) {
      const rotationIndex = config.themeRotation[category] || 0;
      const preset = categoryPresets[rotationIndex % categoryPresets.length];
      
      activePresets.push({
        presetKey: preset.key,
        displayName: preset.displayName,
        category: preset.category,
        thumbnail: preset.thumbnail,
        promptFragment: preset.promptFragment,
        strength: preset.strength,
        model: preset.model,
        features: preset.features,
        description: preset.description
      });
    }
  });
  
  return activePresets;
}

// Force rotation of presets
export function forceRotation(): void {
  const config = getRotationConfig();
  config.lastRotationDate = new Date(Date.now() - (config.rotationInterval * 60 * 60 * 1000)).toISOString();
  localStorage.setItem('presetRotationConfig', JSON.stringify(config));
}

// Reset rotation to default
export function resetRotation(): void {
  localStorage.removeItem('presetRotationConfig');
  getRotationConfig(); // This will set the default
}

// Get presets by category
export function getPresetsByCategory(category: PresetCategory): PresetOption[] {
  return allPresets.filter(p => p.category === category);
}

// Search presets by name or description
export function searchPresets(query: string): PresetOption[] {
  const lowercaseQuery = query.toLowerCase();
  return allPresets.filter(preset => 
    preset.displayName.toLowerCase().includes(lowercaseQuery) ||
    preset.description.toLowerCase().includes(lowercaseQuery) ||
    preset.features.some(feature => feature.toLowerCase().includes(lowercaseQuery))
  );
}

// Get preset by key
export function getPresetByKey(key: ProfessionalPresetKey): PresetOption | undefined {
  return allPresets.find(p => p.key === key);
}

// Build API payload for a preset
export function buildPresetPayload(presetKey: ProfessionalPresetKey, imageUrl: string, customPrompt?: string): any {
  const preset = getPresetByKey(presetKey);
  if (!preset) {
    throw new Error(`Preset not found: ${presetKey}`);
  }
  
  const finalPrompt = customPrompt 
    ? `${customPrompt}, ${preset.promptFragment}`
    : preset.promptFragment;
  
  return {
    model: preset.model,
    prompt: finalPrompt,
    image_url: imageUrl,
    strength: preset.strength,
    num_inference_steps: 36,
    guidance_scale: 7.5,
    metadata: {
      presetKey: preset.key,
      presetName: preset.displayName,
      category: preset.category,
      features: preset.features,
      description: preset.description
    }
  };
}

// Get preset statistics
export function getPresetStats(): {
  total: number;
  byCategory: Record<PresetCategory, number>;
  averageStrength: number;
} {
  const byCategory: Record<PresetCategory, number> = {} as Record<PresetCategory, number>;
  let totalStrength = 0;
  
  allPresets.forEach(preset => {
    byCategory[preset.category] = (byCategory[preset.category] || 0) + 1;
    totalStrength += preset.strength;
  });
  
  return {
    total: allPresets.length,
    byCategory,
    averageStrength: totalStrength / allPresets.length
  };
}
