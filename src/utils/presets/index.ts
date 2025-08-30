// utils/presets/index.ts
// Main exports for the new preset system

export * from './types';
export * from './validate';
export * from './payload';
export * from './handlers';
export * from './integration';

// Re-export the most commonly used functions
export { 
  OPTION_GROUPS, 
  resolvePreset,
  isConfigured 
} from './types';

export { 
  validateAll 
} from './validate';

export { 
  onPresetClick, 
  onOptionClick, 
  runPreset 
} from './handlers';




