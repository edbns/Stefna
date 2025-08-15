// utils/presets/integration.ts
// Integration layer for presets and moodmorph only

import { onOptionClick as newOptionClick, onPresetClick as newPresetClick } from './handlers';
import { OPTION_GROUPS, isConfigured } from './types';

// Direct preset handler
export async function onPresetClickIntegrated(presetId: string, file?: File, sourceUrl?: string): Promise<void> {
  console.log('🎨 Preset click (integrated):', presetId);
  
  // Use new system
  await newPresetClick(presetId as any); // Type assertion for now, will be properly typed
}

// Utility to check what options are available
export function getAvailableOptions() {
  const presets = Object.keys(OPTION_GROUPS.presets || {});
  
  return {
    presets,
    total: presets.length
  };
}

// Debug helper
export function debugPresetSystem() {
  console.group('🔍 Preset System Debug');
  console.log('Available options:', getAvailableOptions());
  console.log('Preset options:', Object.keys(OPTION_GROUPS.presets || {}));
  console.groupEnd();
}
