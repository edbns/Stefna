// Test System for Preset Validation
// Simple test runner to verify core functionality

import { validateAllSync, isConfigured, getConfiguredOptions } from './validate';
import { PRESETS, OPTION_GROUPS, ACTIVE_PRESET_IDS } from './types';
import { getCardChips } from '../mediaCardHelpers';

export function runPresetSystemTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function test(name: string, testFn: () => boolean | void) {
    try {
      const result = testFn();
      if (result === false) {
        results.push(`❌ ${name}: FAILED`);
        failed++;
      } else {
        results.push(`✅ ${name}: PASSED`);
        passed++;
      }
    } catch (error) {
      results.push(`❌ ${name}: ERROR - ${error}`);
      failed++;
    }
  }

  // Test 1: Validation system
  test('Validation system runs without errors', () => {
    const validation = validateAllSync();
    const totalErrors = validation.presetErrors.length + validation.optionErrors.length + validation.uiErrors.length;
    return totalErrors === 0;
  });

  // Test 2: Active preset IDs are valid
  test('Active preset IDs reference existing presets', () => {
    return ACTIVE_PRESET_IDS.every(id => PRESETS[id] !== undefined);
  });

  // Test 3: Weekly rotation has exactly 6 presets
  test('Weekly rotation has exactly 6 presets', () => {
    return ACTIVE_PRESET_IDS.length === 6;
  });

  // Test 4: Time Machine options are configured
  test('Time Machine options are configured', () => {
    const requiredOptions = ['1920s_noir_glam', '1960s_kodachrome', '1980s_vhs_retro', '1990s_disposable', 'futuristic_cyberpunk'];
    return requiredOptions.every(option => isConfigured('time_machine', option));
  });

  // Test 5: Restore options are configured
  test('Restore options are configured', () => {
    const requiredOptions = ['colorize_bw', 'revive_faded', 'sharpen_enhance', 'remove_scratches'];
    return requiredOptions.every(option => isConfigured('restore', option));
  });

  // Test 6: All configured options reference valid presets
  test('All configured options reference valid presets', () => {
    const presetIds = new Set(Object.keys(PRESETS));
    
    for (const [groupName, group] of Object.entries(OPTION_GROUPS)) {
      if (!group) continue;
      for (const [optionKey, option] of Object.entries(group)) {
        if (!presetIds.has(option.use)) {
          return false;
        }
      }
    }
    return true;
  });

  // Test 7: Card chips function works
  test('Card chips function generates valid output', () => {
    const mockMedia = {
      meta: {
        presetId: 'crystal_clear',
        mode: 'i2i' as const,
        group: 'time_machine' as const,
        optionKey: '1980s_vhs_retro'
      }
    };
    
    const { modeChip, detailChip } = getCardChips(mockMedia);
    return modeChip === 'Time Machine' && detailChip === '1980s vhs retro';
  });

  // Test 8: Strength values are within valid range
  test('All preset strength values are valid', () => {
    for (const preset of Object.values(PRESETS)) {
      if (preset.strength !== undefined && (preset.strength < 0 || preset.strength > 1)) {
        return false;
      }
    }
    return true;
  });

  // Test 9: All presets have required fields
  test('All presets have required fields', () => {
    for (const [id, preset] of Object.entries(PRESETS)) {
      if (!preset.id || !preset.label || !preset.prompt || !preset.mode || !preset.input) {
        return false;
      }
      if (preset.id !== id) {
        return false;
      }
    }
    return true;
  });

  // Test 10: Option overrides have valid strength values
  test('Option overrides have valid strength values', () => {
    for (const group of Object.values(OPTION_GROUPS)) {
      if (!group) continue;
      for (const option of Object.values(group)) {
        if (option.overrides?.strength !== undefined) {
          if (option.overrides.strength < 0 || option.overrides.strength > 1) {
            return false;
          }
        }
      }
    }
    return true;
  });

  return { passed, failed, results };
}

// Run tests and log results
export function logTestResults() {
  console.log('🧪 Running preset system tests...');
  const { passed, failed, results } = runPresetSystemTests();
  
  results.forEach(result => console.log(result));
  
  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Preset system is ready.');
  } else {
    console.warn('⚠️ Some tests failed. Check the issues above.');
  }
  
  return { passed, failed };
}
