import { presetsStore } from '../stores/presetsStore'
import { runGeneration } from '../services/generationPipeline'
import { GenerateJob } from '../types/generation'

// Asset store interface (you'll need to implement this)
interface AssetStore {
  current: { file?: File; url?: string } | null
}

// Mock asset store - replace with your actual implementation
const assetStore = {
  getState: (): AssetStore => ({
    current: null // This should be replaced with actual asset state
  })
}

// UI store interface for uploader
interface UploaderStore {
  open: () => void
}

// Mock uploader store - replace with your actual implementation  
const uploaderStore = {
  getState: (): UploaderStore => ({
    open: () => {
      // This should trigger file picker
      console.log('Opening file picker...')
    }
  })
}

// UI store interface for selected preset
interface UIStore {
  selectedPreset: string | null
  setSelectedPreset: (presetId: string) => void
}

// Mock UI store - replace with your actual implementation
const uiStore = {
  getState: (): UIStore => ({
    selectedPreset: null,
    setSelectedPreset: (presetId: string) => {
      console.log('Setting selected preset:', presetId)
    }
  })
}

// Build I2I job helper
function buildI2IJob({ presetId, source }: { presetId: string; source?: { file?: File; url?: string } }): Promise<GenerateJob | null> {
  return new Promise((resolve) => {
    const preset = presetsStore.getState().byId[presetId]
    if (!preset) {
      console.warn(`Preset "${presetId}" not found`)
      resolve(null)
      return
    }
    
    resolve({
      mode: 'i2i' as const,
      presetId,
      prompt: preset.prompt,
      params: preset.params || {},
      source
    })
  })
}

// Helper to resolve source from various UI states
function resolveSource(): {id: string, url: string} | null {
  // This should be replaced with actual UI state access
  // For now, return null to trigger the error message
  return null;
}

// Main preset click handler - auto-runs if asset available
export async function handlePresetClick(presetId: string) {
  // Always set the selected preset for UI state
  uiStore.getState().setSelectedPreset(presetId)

  // Check if we have a source asset using the resolver
  const source = resolveSource()
  if (!source) {
    // Show clear error message and return
    console.error('Pick a photo/video first, then apply a preset.')
    // Dispatch toast event
    window.dispatchEvent(new CustomEvent('generation-error', { 
      detail: { message: 'Pick a photo/video first, then apply a preset.', timestamp: Date.now() } 
    }))
    return
  }

  // We have an asset, run generation immediately
  await runGeneration(() => buildI2IJob({ presetId, source: { url: source.url } }))
}

// Legacy function for backward compatibility
export function onPresetClick(presetId: string, file?: File, sourceUrl?: string) {
  return runGeneration(async () => {
    const preset = presetsStore.getState().byId[presetId]
    if (!preset) {
      console.warn(`Preset "${presetId}" not found`)
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
