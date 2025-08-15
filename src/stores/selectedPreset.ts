// stores/selectedPreset.ts
import { create } from 'zustand';
import { PRESETS } from '../utils/presets/types';

type PresetId = keyof typeof PRESETS;

type SelState = {
  selectedPreset: PresetId | null;
  setSelectedPreset: (id: PresetId | null) => void;
  ensureDefault: (actives: PresetId[]) => void;
  resetToDefault: () => void;
  getDefaultPreset: () => PresetId;
};

// Defensive default preset - never null
const DEFAULT_PRESET: PresetId = 'cinematic_glow';

export const useSelectedPreset = create<SelState>((set, get) => ({
  // Make selectedPreset resilient to store reloads/preset refresh
  selectedPreset: (() => {
    const stored = localStorage.getItem('selectedPreset');
    if (stored && stored in PRESETS) {
      console.log('🎯 Restored selectedPreset from localStorage:', stored);
      return stored as PresetId;
    }
    console.log('🎯 Using boot default preset:', DEFAULT_PRESET);
    return DEFAULT_PRESET;
  })(),
  
  setSelectedPreset: (id) => {
    if (id === null) {
      console.log('🎯 Clearing selectedPreset to default');
      set({ selectedPreset: DEFAULT_PRESET });
      localStorage.setItem('selectedPreset', DEFAULT_PRESET);
      return;
    }
    if (!id) {
      console.warn('🚫 Ignoring attempt to set selectedPreset to undefined');
      return; // ignore undefined writes
    }
    console.log('🎯 Setting selectedPreset to:', id);
    set({ selectedPreset: id });
    
    // Persist to localStorage
    localStorage.setItem('selectedPreset', id);
  },
  
  ensureDefault: (actives) => {
    const current = get().selectedPreset;
    
    // Only set if it's currently null/undefined or not in active list
    if (!current || !actives.includes(current)) {
      const first = actives[0];
      if (first) {
        console.log('🎯 Setting boot default preset to:', first);
        set({ selectedPreset: first as PresetId });
        localStorage.setItem('selectedPreset', first);
      } else {
        console.log('🎯 Setting fallback boot preset to:', DEFAULT_PRESET);
        set({ selectedPreset: DEFAULT_PRESET });
        localStorage.setItem('selectedPreset', DEFAULT_PRESET);
      }
    }
  },

  resetToDefault: () => {
    console.log('🎯 Resetting to default preset:', DEFAULT_PRESET);
    set({ selectedPreset: DEFAULT_PRESET });
    localStorage.setItem('selectedPreset', DEFAULT_PRESET);
  },

  getDefaultPreset: () => DEFAULT_PRESET,
}));

// Defensive logging to catch unexpected resets
if (typeof window !== 'undefined') {
  useSelectedPreset.subscribe((state) => {
    if (state.selectedPreset === null) {
      console.warn('[selectedPreset] became null unexpectedly, resetting to default', new Error().stack);
      // Auto-recover from null state
      useSelectedPreset.getState().resetToDefault();
    }
  });
}
