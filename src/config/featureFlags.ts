// config/featureFlags.ts

export interface FeatureFlags {
  storyMode: boolean;
  timeMachine: boolean;
  restore: boolean;
  presetRotation: boolean;
  advancedPresets: boolean;
}

// Default feature flags - can be overridden by environment variables
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  storyMode: true,
  timeMachine: true,
  restore: true,
  presetRotation: true,
  advancedPresets: true,
};

// Environment variable overrides
const ENV_FEATURE_FLAGS: Partial<FeatureFlags> = {
  storyMode: import.meta.env.VITE_ENABLE_STORY_MODE !== 'false',
  timeMachine: import.meta.env.VITE_ENABLE_TIME_MACHINE !== 'false',
  restore: import.meta.env.VITE_ENABLE_RESTORE !== 'false',
  presetRotation: import.meta.env.VITE_ENABLE_PRESET_ROTATION !== 'false',
  advancedPresets: import.meta.env.VITE_ENABLE_ADVANCED_PRESETS !== 'false',
};

// Merge defaults with environment overrides
export const FEATURE_FLAGS: FeatureFlags = {
  ...DEFAULT_FEATURE_FLAGS,
  ...ENV_FEATURE_FLAGS,
};

// Helper functions
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[feature];
}

export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}

export function getDisabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => !enabled)
    .map(([feature]) => feature);
}

// Log feature flags on startup
if (typeof window !== 'undefined') {
  console.log('🚩 Feature Flags:', {
    enabled: getEnabledFeatures(),
    disabled: getDisabledFeatures(),
    all: FEATURE_FLAGS
  });
}
