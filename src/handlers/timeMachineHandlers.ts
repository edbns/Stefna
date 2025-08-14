import { presetsStore } from '../stores/presetsStore'
import { startGeneration } from '../services/startGeneration'
import { TIME_MACHINE_MAP } from '../config/timeMachineMap'
import { GenerateJob } from '../types/generation'

export async function onTimeMachineClick(option: string, sourceUrl: string): Promise<void> {
  try {
    // Wait until presets are ready
    await presetsStore.getState().ready()
    
    // Map option to preset
    const presetId = TIME_MACHINE_MAP[option]
    if (!presetId) {
      console.error(`Option "${option}" not configured`)
      return
    }
    
    // Validate preset exists
    const preset = presetsStore.getState().byId[presetId]
    if (!preset) {
      console.warn(`Time Machine "${option}" → missing preset "${presetId}"`)
      console.error(`"${option}" is temporarily unavailable`)
      return
    }
    
    // Build job - don't touch selectedPreset (UI-only)
    const job: GenerateJob = {
      mode: 'time_machine',
      presetId,
      prompt: preset.prompt,
      params: { 
        ...preset.params, 
        time_machine_option: option 
      },
      source: { url: sourceUrl }
    }
    
    const result = await startGeneration(job)
    
    if (!result.success) {
      console.error('Time Machine failed:', result.error)
    } else {
      console.log(`Traveled to ${option}!`)
    }
  } catch (error) {
    console.error('Time Machine error:', error)
  }
}
