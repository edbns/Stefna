import { presetsStore } from '../stores/presetsStore'
import { runGeneration } from '../services/generationPipeline'
import { TIME_MACHINE_MAP, TimeMachineOption } from '../config/timeMachineMap'
import { GenerateJob } from '../types/generation'

// Asset store interface (same as preset handlers)
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
  // This should open file picker and wait for selection
  console.log('Would open file picker for image selection')
  return null
}

// Build I2I job helper for time machine
function buildTimeMachineJob({ option, source }: { option: TimeMachineOption; source?: { file?: File; url?: string } }): Promise<GenerateJob | null> {
  return new Promise((resolve) => {
    const presetId = TIME_MACHINE_MAP[option]
    if (!presetId) {
      console.warn(`Time Machine option "${option}" not configured`)
      resolve(null)
      return
    }

    const preset = presetsStore.getState().byId[presetId]
    if (!preset) {
      console.warn(`Time Machine "${option}" → missing preset "${presetId}"`)
      resolve(null)
      return
    }

    resolve({
      mode: "time_machine" as const,
      presetId,
      prompt: preset.prompt,
      params: { ...preset.params, time_machine_option: option },
      source
    })
  })
}

// New handler with no legacy path - resolves options directly
export async function handleTimeMachine(option: TimeMachineOption) {
  const presetId = TIME_MACHINE_MAP[option]
  if (!presetId) {
    console.error(`"${option}" is unavailable`)
    return
  }

  const src = assetStore.getState().current ?? (await requireAndPickImage())
  if (!src) {
    console.error('Please select an image first')
    return
  }

  await runGeneration(() => buildTimeMachineJob({ option, source: src }))
}

// Legacy function for backward compatibility
export function onTimeMachineClick(option: string, file?: File, sourceUrl?: string) {
  return runGeneration(async () => {
    const presetId = TIME_MACHINE_MAP[option]
    if (!presetId) {
      console.warn(`Option "${option}" not configured`)
      return null
    }
    
    const preset = presetsStore.getState().byId[presetId]
    if (!preset) {
      console.warn(`Time Machine "${option}" → missing preset "${presetId}"`)
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
