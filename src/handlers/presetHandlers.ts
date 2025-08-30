import { presetsStore } from '../stores/presetsStore'
import GenerationPipeline from '../services/generationPipeline'
import { GenerationRequest } from '../services/generationPipeline'

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

// Build I2I generation request helper
function buildI2IGenerationRequest({ presetId, source }: { presetId: string; source?: { file?: File; url?: string } }): Promise<GenerationRequest | null> {
  return new Promise((resolve) => {
    const preset = presetsStore.getState().byId[presetId]
    if (!preset) {
      console.warn(`Preset "${presetId}" not found`)
      resolve(null)
      return
    }

    resolve({
      type: 'presets',
      prompt: preset.prompt,
      presetKey: presetId,
      sourceAssetId: source?.url || '',
      userId: '', // This should be provided by the caller
      runId: crypto.randomUUID()
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
  const generationPipeline = GenerationPipeline.getInstance();
  const request = await buildI2IGenerationRequest({ presetId, source: { url: source.url } });
  if (request) {
    await generationPipeline.generate(request);
  }
}

// Legacy function for backward compatibility
export async function onPresetClick(presetId: string, file?: File, sourceUrl?: string) {
  const generationPipeline = GenerationPipeline.getInstance();
  const preset = presetsStore.getState().byId[presetId]
  if (!preset) {
    console.warn(`Preset "${presetId}" not found`)
    return null
  }

  const request: GenerationRequest = {
    type: 'presets',
    prompt: preset.prompt,
    presetKey: presetId,
    sourceAssetId: sourceUrl || '',
    userId: '', // This should be provided by the caller
    runId: crypto.randomUUID()
  };

  return await generationPipeline.generate(request);
}
