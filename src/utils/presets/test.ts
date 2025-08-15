// utils/presets/test.ts
// Quick test to verify the preset system works correctly

import { validateAll } from './validate';
import { PRESETS, OPTION_GROUPS, resolvePreset, isConfigured } from './types';
import { onOptionClick } from './handlers';

export function testPresetSystem() {
  console.group('🧪 Testing Preset System');
  
  // Test 1: Validation
  console.log('1. Running validation...');
  const validation = validateAll();
  
  // Test 2: Check preset configuration
  console.log('2. Checking preset configuration...');
  console.log(`   Total presets: ${Object.keys(PRESETS).length}`);
  
  // Test 3: Test preset resolution
  console.log('3. Testing preset resolution...');
  try {
    const preset = resolvePreset('film_90s', { strength: 0.8 });
    console.log('   ✅ Preset resolution works:', preset.label);
  } catch (error) {
    console.error('   ❌ Preset resolution failed:', error);
  }
  
  // Test 4: Check option groups
  console.log('4. Available options:');
  Object.entries(OPTION_GROUPS).forEach(([group, options]) => {
    console.log(`   ${group}: ${Object.keys(options || {}).length} options`);
    Object.keys(options || {}).forEach(key => {
      console.log(`     - ${key}`);
    });
  });
  
  console.log('5. Total presets:', Object.keys(PRESETS).length);
  console.groupEnd();
  
  return validation;
}

// Auto-run test in development
if (import.meta.env.DEV) {
  // Run test after a short delay to ensure everything is loaded
  setTimeout(() => {
    testPresetSystem();
  }, 1000);
}
