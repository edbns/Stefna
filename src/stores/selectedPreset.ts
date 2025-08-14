// src/stores/selectedPreset.ts
import { create } from 'zustand';
import { PRESETS } from '../utils/presets/types';

type PresetId = keyof typeof PRESETS;

type SelState = {
  selectedPreset: PresetId | null;
  setSelectedPreset: (id: PresetId) => void;
  ensureDefault: (actives: PresetId[]) => void;
};

export const useSelectedPreset = create<SelState>((set, get) => ({
  selectedPreset: null,
  setSelectedPreset: (id) => {
    console.log('🎯 Setting selectedPreset to:', id);
    set({ selectedPreset: id });
  },
  ensureDefault: (actives) => {
    const cur = get().selectedPreset;
    if (cur) {
      console.log('🔒 Keeping sticky selection:', cur);
      return; // keep sticky selection
    }
    const first = actives[0];
    if (first) {
      console.log('🎯 Setting default preset to:', first);
      set({ selectedPreset: first });
    }
  },
}));

// Defensive logging to catch unexpected resets
if (typeof window !== 'undefined') {
  useSelectedPreset.subscribe((state) => {
    if (state.selectedPreset === null) {
      console.warn('[selectedPreset] became null unexpectedly', new Error().stack);
    }
  });
}
