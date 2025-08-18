// src/stores/generationMode.ts
import { create } from 'zustand';
export const useGenerationMode = create()((set) => ({
    mode: 'presets',
    setMode: (m) => set({ mode: m }),
}));
