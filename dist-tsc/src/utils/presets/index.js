// utils/presets/index.ts
// Main exports for the new preset system
export * from './types';
export * from './validate';
export * from './payload';
export * from './handlers';
export * from './integration';
// Re-export the most commonly used functions
export { PRESETS, OPTION_GROUPS, resolvePreset, getOptionEntries, isConfigured } from './types';
export { validateAll } from './validate';
export { onPresetClick, onOptionClick, runPreset } from './handlers';
export { ACTIVE_PRESET_IDS } from './types';
