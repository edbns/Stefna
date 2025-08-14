// CI Test: Mapping Validation
// Ensures all mappings are complete at build time

import { validateMappings, validationStore } from '../utils/validateMappings'
import { TIME_MACHINE_OPTIONS, TIME_MACHINE_MAP, RESTORE_OPTIONS, RESTORE_MAP } from '../config/timeMachineMap'
import { STORY_PRESET_IDS } from '../config/storyModeConfig'
import { presetsStore } from '../stores/presetsStore'

// Mock presets for testing
const mockPresets = {
  'cinematic_glow': { id: 'cinematic_glow', prompt: 'test' },
  'bright_airy': { id: 'bright_airy', prompt: 'test' },
  'vivid_pop': { id: 'vivid_pop', prompt: 'test' },
  'vintage_film_35mm': { id: 'vintage_film_35mm', prompt: 'test' },
  'tropical_boost': { id: 'tropical_boost', prompt: 'test' },
  'urban_grit': { id: 'urban_grit', prompt: 'test' },
  'mono_drama': { id: 'mono_drama', prompt: 'test' },
  'dreamy_pastels': { id: 'dreamy_pastels', prompt: 'test' },
  'golden_hour_magic': { id: 'golden_hour_magic', prompt: 'test' },
  'high_fashion_editorial': { id: 'high_fashion_editorial', prompt: 'test' },
  'moody_forest': { id: 'moody_forest', prompt: 'test' },
  'desert_glow': { id: 'desert_glow', prompt: 'test' },
  'retro_polaroid': { id: 'retro_polaroid', prompt: 'test' },
  'crystal_clear': { id: 'crystal_clear', prompt: 'test' },
  'ocean_breeze': { id: 'ocean_breeze', prompt: 'test' },
  'festival_vibes': { id: 'festival_vibes', prompt: 'test' },
  'noir_classic': { id: 'noir_classic', prompt: 'test' },
  'sun_kissed': { id: 'sun_kissed', prompt: 'test' },
  'frost_light': { id: 'frost_light', prompt: 'test' },
  'neon_nights': { id: 'neon_nights', prompt: 'test' },
  'cultural_glow': { id: 'cultural_glow', prompt: 'test' },
  'soft_skin_portrait': { id: 'soft_skin_portrait', prompt: 'test' },
  'rainy_day_mood': { id: 'rainy_day_mood', prompt: 'test' },
  'wildlife_focus': { id: 'wildlife_focus', prompt: 'test' },
  'street_story': { id: 'street_story', prompt: 'test' }
}

describe('Mapping Validation', () => {
  beforeEach(() => {
    // Mock presetsStore
    jest.spyOn(presetsStore, 'getState').mockReturnValue({
      byId: mockPresets,
      status: 'ready',
      load: jest.fn(),
      ready: jest.fn().mockResolvedValue(undefined)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Type Safety', () => {
    it('should have complete Time Machine mappings at compile time', () => {
      // This test ensures every TIME_MACHINE_OPTION has a mapping
      TIME_MACHINE_OPTIONS.forEach(option => {
        expect(TIME_MACHINE_MAP).toHaveProperty(option)
        expect(typeof TIME_MACHINE_MAP[option]).toBe('string')
        expect(TIME_MACHINE_MAP[option].length).toBeGreaterThan(0)
      })
    })

    it('should have complete Restore mappings at compile time', () => {
      // This test ensures every RESTORE_OPTION has a mapping
      RESTORE_OPTIONS.forEach(option => {
        expect(RESTORE_MAP).toHaveProperty(option)
        expect(typeof RESTORE_MAP[option]).toBe('string')
        expect(RESTORE_MAP[option].length).toBeGreaterThan(0)
      })
    })

    it('should have all Story presets defined', () => {
      // This test ensures all story presets exist
      STORY_PRESET_IDS.forEach(presetId => {
        expect(typeof presetId).toBe('string')
        expect(presetId.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Runtime Validation', () => {
    it('should have zero missing mappings in production build', async () => {
      await validateMappings()
      const state = validationStore.getState()
      
      expect(state.unavailableTimeMachineOptions.size).toBe(0)
      expect(state.unavailableRestoreOptions.size).toBe(0)
      expect(state.storyDisabled).toBe(false)
      expect(state.validationComplete).toBe(true)
    })

    it('should detect missing presets correctly', async () => {
      // Mock missing presets
      const incompletePresets = { ...mockPresets }
      delete incompletePresets['neon_nights']
      
      jest.spyOn(presetsStore, 'getState').mockReturnValue({
        byId: incompletePresets,
        status: 'ready',
        load: jest.fn(),
        ready: jest.fn().mockResolvedValue(undefined)
      })

      await validateMappings()
      const state = validationStore.getState()
      
      // Should detect missing mappings that reference 'neon_nights'
      expect(state.unavailableTimeMachineOptions.size).toBeGreaterThan(0)
    })

    it('should handle empty preset store gracefully', async () => {
      jest.spyOn(presetsStore, 'getState').mockReturnValue({
        byId: {},
        status: 'ready',
        load: jest.fn(),
        ready: jest.fn().mockResolvedValue(undefined)
      })

      await validateMappings()
      const state = validationStore.getState()
      
      // All mappings should be unavailable
      expect(state.unavailableTimeMachineOptions.size).toBe(TIME_MACHINE_OPTIONS.length)
      expect(state.unavailableRestoreOptions.size).toBe(RESTORE_OPTIONS.length)
      expect(state.storyDisabled).toBe(true)
    })
  })

  describe('Mapping Completeness', () => {
    it('should map every Time Machine option to a valid preset ID', () => {
      const mappedPresetIds = Object.values(TIME_MACHINE_MAP)
      const validPresetIds = Object.keys(mockPresets)
      
      mappedPresetIds.forEach(presetId => {
        expect(validPresetIds).toContain(presetId)
      })
    })

    it('should map every Restore option to a valid preset ID', () => {
      const mappedPresetIds = Object.values(RESTORE_MAP)
      const validPresetIds = Object.keys(mockPresets)
      
      mappedPresetIds.forEach(presetId => {
        expect(validPresetIds).toContain(presetId)
      })
    })

    it('should have all Story presets available', () => {
      const validPresetIds = Object.keys(mockPresets)
      
      STORY_PRESET_IDS.forEach(presetId => {
        expect(validPresetIds).toContain(presetId)
      })
    })
  })

  describe('Performance', () => {
    it('should complete validation quickly', async () => {
      const startTime = Date.now()
      await validateMappings()
      const duration = Date.now() - startTime
      
      // Validation should complete in under 100ms
      expect(duration).toBeLessThan(100)
    })

    it('should not leak memory during validation', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      // Run validation multiple times
      for (let i = 0; i < 10; i++) {
        await validateMappings()
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryGrowth = finalMemory - initialMemory
      
      // Should not grow more than 1MB
      expect(memoryGrowth).toBeLessThan(1024 * 1024)
    })
  })
})

// Export for CI scripts
export function runMappingValidationCI(): Promise<boolean> {
  return new Promise(async (resolve) => {
    try {
      await validateMappings()
      const state = validationStore.getState()
      
      const isValid = 
        state.unavailableTimeMachineOptions.size === 0 &&
        state.unavailableRestoreOptions.size === 0 &&
        !state.storyDisabled &&
        state.validationComplete
      
      if (!isValid) {
        console.error('❌ Mapping validation failed:')
        console.error('  - Unavailable Time Machine options:', Array.from(state.unavailableTimeMachineOptions))
        console.error('  - Unavailable Restore options:', Array.from(state.unavailableRestoreOptions))
        console.error('  - Story disabled:', state.storyDisabled)
      } else {
        console.log('✅ All mappings valid')
      }
      
      resolve(isValid)
    } catch (error) {
      console.error('❌ Mapping validation error:', error)
      resolve(false)
    }
  })
}
