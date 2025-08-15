// src/stores/runs.ts
// Track all active runIds, accept any completion that matches one of them

import { create } from 'zustand'

interface RunsState {
  active: Set<string>
  startRun: (runId: string) => void
  completeRun: (runId: string) => boolean
  clearAll: () => void
  getActiveCount: () => number
}

export const useRunsStore = create<RunsState>((set, get) => ({
  active: new Set(),
  
  startRun: (runId: string) => {
    set((state) => {
      const newActive = new Set(state.active)
      newActive.add(runId)
      return { active: newActive }
    })
    console.log(`🚀 Run started: ${runId} (${get().active.size} active)`)
  },
  
  completeRun: (runId: string) => {
    const wasActive = get().active.has(runId)
    
    set((state) => {
      const newActive = new Set(state.active)
      newActive.delete(runId)
      return { active: newActive }
    })
    
    if (wasActive) {
      console.log(`✅ Run completed: ${runId} (${get().active.size} remaining)`)
    } else {
      console.log(`⚠️ Late completion processed: ${runId} (was not in active set)`)
    }
    
    return wasActive
  },
  
  clearAll: () => {
    set({ active: new Set() })
    console.log('🧹 All runs cleared')
  },
  
  getActiveCount: () => get().active.size,
}))

// Global access for non-React contexts
export const runsStore = {
  getState: () => useRunsStore.getState(),
  subscribe: useRunsStore.subscribe,
}
