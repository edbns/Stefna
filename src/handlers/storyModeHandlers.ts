import { presetsStore } from '../stores/presetsStore'
import { runGeneration } from '../services/generationPipeline'
import { STORY_PRESET_IDS, STORY_THEMES, StoryOption } from '../config/storyModeConfig'
import { GenerateJob } from '../types/generation'

// Asset store interface (same as other handlers)
interface AssetStore {
  current: { file?: File; url?: string } | null
}

const assetStore = {
  getState: (): AssetStore => ({
    current: null // Replace with actual asset state
  })
}

// Helper to require and pick image if none available
async function requireAndPickImage(): Promise<{ file?: File; url?: string } | null> {
  console.log('Would open file picker for image selection')
  return null
}

// Build I2I job helper for story
function buildStoryJob({ option, source }: { option: StoryOption; source?: { file?: File; url?: string } }): Promise<GenerateJob | null> {
  return new Promise((resolve) => {
    const theme = STORY_THEMES[option]
    if (!theme) {
      console.warn(`Story option "${option}" not configured`)
      resolve(null)
      return
    }

    const preset = presetsStore.getState().byId[theme.presetId]
    if (!preset) {
      console.warn(`Story "${option}" → missing preset "${theme.presetId}"`)
      resolve(null)
      return
    }

    // Combine preset prompt with story-specific prompt
    const combinedPrompt = `${preset.prompt}, ${theme.prompt}`

    resolve({
      mode: "story" as const,
      presetId: theme.presetId,
      prompt: combinedPrompt,
      params: { ...preset.params, story_option: option },
      source
    })
  })
}

// New handler with no legacy path - resolves options directly
export async function handleStory(option: StoryOption) {
  const theme = STORY_THEMES[option]
  if (!theme) {
    console.error(`"${option}" is unavailable`)
    return
  }

  const src = assetStore.getState().current ?? (await requireAndPickImage())
  if (!src) {
    console.error('Please select an image first')
    return
  }

  await runGeneration(() => buildStoryJob({ option, source: src }))
}

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

// Legacy function for backward compatibility - now uses new runner
export async function runStory(sourceUrl: string, basePrompt?: string): Promise<void> {
  console.info('Starting Story Mode (new runner)...');
  
  // Import and use the new story runner
  const { onStoryThemeClick } = await import('../utils/presets/story');
  await onStoryThemeClick('auto', sourceUrl);
}
