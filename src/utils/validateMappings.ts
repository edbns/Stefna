// Mapping Validation - Disable broken options at boot
import { presetsStore } from '../stores/presetsStore'
import { TIME_MACHINE_MAP, RESTORE_MAP } from '../config/timeMachineMap'
import { STORY_PRESET_IDS } from '../config/storyModeConfig'

// UI State for disabled options
interface ValidationState {
  unavailableTimeMachineOptions: Set<string>
  unavailableRestoreOptions: Set<string>
  storyDisabled: boolean
  validationComplete: boolean
}

let validationState: ValidationState = {
  unavailableTimeMachineOptions: new Set(),
  unavailableRestoreOptions: new Set(),
  storyDisabled: false,
  validationComplete: false
}

// Export validation state
export const validationStore = {
  getState: () => validationState,
  setUnavailableTimeMachineOptions: (options: Set<string>) => {
    validationState.unavailableTimeMachineOptions = options
    dispatchValidationUpdate()
  },
  setUnavailableRestoreOptions: (options: Set<string>) => {
    validationState.unavailableRestoreOptions = options
    dispatchValidationUpdate()
  },
  setStoryDisabled: (disabled: boolean) => {
    validationState.storyDisabled = disabled
    dispatchValidationUpdate()
  },
  setValidationComplete: (complete: boolean) => {
    validationState.validationComplete = complete
    dispatchValidationUpdate()
  }
}

function dispatchValidationUpdate() {
  window.dispatchEvent(new CustomEvent('validation-state-change', { detail: validationState }))
}

export async function validateMappings(): Promise<void> {
  console.log('🔍 Validating preset mappings...')
  
  // Wait for presets to be ready
  await presetsStore.getState().ready()
  const { byId } = presetsStore.getState()

  // Validate Time Machine mappings
  const tmMissing = Object.entries(TIME_MACHINE_MAP)
    .filter(([, presetId]) => !byId[presetId])
    .map(([option]) => option)

  validationStore.setUnavailableTimeMachineOptions(new Set(tmMissing))

  // Validate Restore mappings
  const restoreMissing = Object.entries(RESTORE_MAP)
    .filter(([, presetId]) => !byId[presetId])
    .map(([option]) => option)

  validationStore.setUnavailableRestoreOptions(new Set(restoreMissing))

  // Validate Story Mode presets
  const storyMissing = STORY_PRESET_IDS.filter(presetId => !byId[presetId])
  validationStore.setStoryDisabled(storyMissing.length > 0)

  // Log validation results
  if (process.env.NODE_ENV !== "production") {
    if (tmMissing.length) {
      console.warn("❌ Missing Time Machine mappings:", tmMissing)
    }
    if (restoreMissing.length) {
      console.warn("❌ Missing Restore mappings:", restoreMissing)
    }
    if (storyMissing.length) {
      console.warn("❌ Story missing presets:", storyMissing)
    }
    
    if (tmMissing.length === 0 && restoreMissing.length === 0 && storyMissing.length === 0) {
      console.log("✅ All preset mappings valid")
    }
  }

  validationStore.setValidationComplete(true)
  console.log('✅ Mapping validation complete')
}

// Legacy export for backward compatibility
export const validateModeMappings = validateMappings

// Helper functions for components to check availability
export function isTimeMachineOptionAvailable(option: string): boolean {
  return !validationState.unavailableTimeMachineOptions.has(option)
}

export function isRestoreOptionAvailable(option: string): boolean {
  return !validationState.unavailableRestoreOptions.has(option)
}

export function isStoryModeAvailable(): boolean {
  return !validationState.storyDisabled
}

export function isValidationComplete(): boolean {
  return validationState.validationComplete
}

// Subscribe to validation state changes
export function subscribeToValidationState(callback: (state: ValidationState) => void) {
  const handler = (event: CustomEvent) => callback(event.detail)
  window.addEventListener('validation-state-change', handler as EventListener)
  return () => window.removeEventListener('validation-state-change', handler as EventListener)
}