import { presetsStore } from '../stores/presetsStore'
import { runGeneration } from '../services/generationPipeline'
import { TIME_MACHINE_MAP } from '../config/timeMachineMap'
import { GenerateJob } from '../types/generation'

export function onTimeMachineClick(option: string, file?: File, sourceUrl?: string) {
  return runGeneration(async () => {
    const presetId = TIME_MACHINE_MAP[option]
    if (!presetId) {
      console.warn(`Option "${option}" not configured`)
      // Error will be shown by pipeline
      return null
    }
    
    const preset = presetsStore.getState().byId[presetId]
    if (!preset) {
      console.warn(`Time Machine "${option}" → missing preset "${presetId}"`)
      // Error will be shown by pipeline
      return null
    }
    
    return {
      mode: "time_machine" as const,
      presetId,
      prompt: preset.prompt,
      params: { 
        ...preset.params, 
        time_machine_option: option 
      },
      source: file ? { file } : sourceUrl ? { url: sourceUrl } : undefined,
    }
  })
}
