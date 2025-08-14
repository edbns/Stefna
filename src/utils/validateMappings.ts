import { presetsStore } from '../stores/presetsStore'
import { TIME_MACHINE_MAP, RESTORE_MAP } from '../config/timeMachineMap'

export function validateModeMappings() {
  const { byId } = presetsStore.getState()
  
  // Check Time Machine mappings
  const missingTM = Object.entries(TIME_MACHINE_MAP)
    .filter(([, presetId]) => !byId[presetId])
    .map(([option, presetId]) => ({ option, presetId, type: 'time_machine' }))
  
  // Check Restore mappings  
  const missingRestore = Object.entries(RESTORE_MAP)
    .filter(([, presetId]) => !byId[presetId])
    .map(([option, presetId]) => ({ option, presetId, type: 'restore' }))
    
  const allMissing = [...missingTM, ...missingRestore]
  
  if (allMissing.length) {
    console.warn('❌ Missing preset mappings:', allMissing)
    return allMissing
  }
  
  console.log('✅ All mode mappings validated')
  return []
}

export function getUnavailableOptions() {
  const missing = validateModeMappings()
  return {
    timeMachine: new Set(missing.filter(m => m.type === 'time_machine').map(m => m.option)),
    restore: new Set(missing.filter(m => m.type === 'restore').map(m => m.option))
  }
}
