import { presetsStore } from '../stores/presetsStore'
import { runGeneration } from '../services/generationPipeline'
import { STORY_PRESET_IDS } from '../config/storyModeConfig'
import { GenerateJob } from '../types/generation'

export function onStoryClick(files: File[], basePrompt?: string) {
  return runGeneration(async () => {
    await presetsStore.getState().ready()
    const { byId } = presetsStore.getState()
    
    // Get available story presets
    const activePresets = STORY_PRESET_IDS.filter(id => byId[id])
    if (activePresets.length === 0) {
      console.warn('No story presets available')
      // Error will be shown by pipeline
      return null
    }
    
    // Use first available preset for the job
    const firstPreset = byId[activePresets[0]]
    
    return {
      mode: 'story' as const,
      presetId: firstPreset.id,
      prompt: basePrompt || firstPreset.prompt,
      params: { 
        sequence: activePresets, 
        frames: files.length,
        story_shot: true
      },
      source: files?.[0] ? { file: files[0] } : undefined,
    }
  })
}

// Legacy function for backward compatibility
export async function runStory(sourceUrl: string, basePrompt?: string): Promise<void> {
  console.log('🎬 Starting Story Mode (legacy)...')
  
  const result = await runGeneration(async () => {
    await presetsStore.getState().ready()
    const { byId } = presetsStore.getState()
    
    const activePresets = STORY_PRESET_IDS.filter(id => byId[id])
    if (activePresets.length === 0) {
      return null
    }
    
    const firstPreset = byId[activePresets[0]]
    
    return {
      mode: 'story' as const,
      presetId: firstPreset.id,
      prompt: basePrompt || firstPreset.prompt,
      params: { 
        sequence: activePresets,
        story_shot: true
      },
      source: { url: sourceUrl },
    }
  })
  
  if (result?.success) {
    console.log('Story Mode complete!')
  } else {
    console.error('Story Mode failed:', result?.error)
  }
}
