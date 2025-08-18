import { create } from 'zustand'

export type PresetKey = string
export type Preset = {
  id: string; 
  label: string; 
  description?: string;
  prompt: string; 
  negative_prompt?: string;
  strength?: number; 
  model?: 'eagle'|'flux'|'other';
  mode: 'i2i'|'txt2img'; 
  input: 'image'|'video'; 
  requiresSource?: boolean;
  post?: { upscale?: 'x2'|'x4'; sharpen?: boolean };
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

let readyResolve: (() => void) | null = null
const readyPromise = new Promise<void>(res => (readyResolve = res))

interface PresetsState {
  byId: Record<string, Preset>
  status: Status
  load: () => Promise<void>
  ready: () => Promise<void>
}

export const presetsStore = create<PresetsState>((set, get) => ({
  byId: {},
  status: 'idle',
  
  load: async () => {
    const currentStatus = get().status
    if (currentStatus === 'ready' || currentStatus === 'loading') return
    
    set({ status: 'loading' })
    
    try {
      // Load presets dynamically to avoid circular dependencies
      const { PRESETS } = await import('../utils/presets/types')
      const presetEntries = Object.entries(PRESETS)
      const byId: Record<string, Preset> = {}
      
      for (const [key, preset] of presetEntries) {
        byId[key] = preset
      }
      
      set({ byId, status: 'ready' })
      readyResolve?.() // Release the barrier once
      console.log('✅ Presets loaded and ready:', Object.keys(byId).length)
    } catch (error) {
      console.error('❌ Failed to load presets:', error)
      set({ status: 'error' })
    }
  },
  
  ready: () => readyPromise,
}))

// Helper functions
export function getPresetOrThrow(id: string): Preset {
  const p = presetsStore.getState().byId[id]
  if (!p) throw new Error(`Invalid preset: ${id}`)
  return p
}

export function indexById<T extends { id?: string }>(list: T[]): Record<string, T> {
  const result: Record<string, T> = {}
  for (const item of list) {
    if (item.id) {
      result[item.id] = item
    }
  }
  return result
}
