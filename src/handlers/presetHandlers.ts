import { presetsStore } from '../stores/presetsStore'
import { runGeneration } from '../services/generationPipeline'
import { GenerateJob } from '../types/generation'

export function onPresetClick(presetId: string, file?: File, sourceUrl?: string) {
  return runGeneration(async () => {
    const preset = presetsStore.getState().byId[presetId]
    if (!preset) {
      console.warn(`Preset "${presetId}" not found`)
      // Error will be shown by pipeline
      return null
    }
    
    return {
      mode: 'i2i' as const,
      presetId,
      prompt: preset.prompt,
      params: preset.params || {},
      source: file ? { file } : sourceUrl ? { url: sourceUrl } : undefined
    }
  })
}
