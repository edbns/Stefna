// src/stores/selectedPreset.ts
import { create } from 'zustand';
import { PRESETS } from '../utils/presets/types';

type PresetId = keyof typeof PRESETS;

type SelState = {
  selectedPreset: PresetId | null;
  setSelectedPreset: (id: PresetId) => void;
  ensureDefault: (actives: PresetId[]) => void;
};

// Make the preset selection truly sticky (can't be reset to null)
const bootSet = new Set<string>();

export const useSelectedPreset = create<SelState>((set, get) => ({
  selectedPreset: null,
  setSelectedPreset: (id) => {
    if (!id) {
      console.warn('🚫 Ignoring attempt to set selectedPreset to null/undefined');
      return; // ignore null/undefined writes
    }
    console.log('🎯 Setting selectedPreset to:', id);
    set({ selectedPreset: id });
  },
  ensureDefault: (actives) => {
    if (get().selectedPreset) return;
    const first = actives[0];
    if (first && !bootSet.has('done')) {
      bootSet.add('done');
      console.log('🎯 Setting boot default preset to:', first);
      set({ selectedPreset: first as PresetId });
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
