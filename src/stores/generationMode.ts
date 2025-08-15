// src/stores/generationMode.ts
import { create } from 'zustand'

type Mode = 'presets' | 'moodmorph' | 'styleclash'

export const useGenerationMode = create<{
  mode: Mode
  setMode: (m: Mode) => void
}>()((set) => ({
  mode: 'presets',
  setMode: (m) => set({ mode: m }),
}))
