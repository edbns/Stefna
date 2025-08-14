import { presetsStore, getPresetOrThrow } from '../stores/presetsStore'
import { startGeneration } from '../services/startGeneration'
import { GenerateJob } from '../types/generation'

export async function onPresetClick(presetId: string, sourceUrl?: string): Promise<void> {
  try {
    // 1) Ensure presets are ready
    await presetsStore.getState().ready()
    
    // 2) Validate preset exists
    const preset = getPresetOrThrow(presetId)
    
    // 3) Build the job atomically
    const job: GenerateJob = {
      mode: 'i2i',
      presetId,
      prompt: preset.prompt,
      params: preset.params || {},
      source: sourceUrl ? { url: sourceUrl } : undefined
    }
    
    // 4) Fire once
    const result = await startGeneration(job)
    
    if (!result.success) {
      console.error('Generation failed:', result.error)
    } else {
      console.log('Generation complete!')
    }
  } catch (error) {
    console.error('Preset click error:', error)
  }
}
