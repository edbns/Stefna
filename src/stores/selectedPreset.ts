// stores/selectedPreset.ts
import { create } from 'zustand';
import { PRESETS } from '../utils/presets/types';

type PresetId = keyof typeof PRESETS;

type SelState = {
  selectedPreset: PresetId | null;
  setSelectedPreset: (id: PresetId) => void;
  ensureDefault: (actives: PresetId[]) => void;
};

// C. Stop nuking selectedPreset during boot
const BOOT_PRESET: PresetId = 'cinematic_glow';

export const useSelectedPreset = create<SelState>((set, get) => ({
  // Make selectedPreset resilient to store reloads/preset refresh
  selectedPreset: (() => {
    const stored = localStorage.getItem('selectedPreset');
    if (stored && stored in PRESETS) {
      console.log('🎯 Restored selectedPreset from localStorage:', stored);
      return stored as PresetId;
    }
    console.log('🎯 Using boot default preset:', BOOT_PRESET);
    return BOOT_PRESET;
  })(),
  
  setSelectedPreset: (id) => {
    if (!id) {
      console.warn('🚫 Ignoring attempt to set selectedPreset to null/undefined');
      return; // ignore null/undefined writes
    }
    console.log('🎯 Setting selectedPreset to:', id);
    set({ selectedPreset: id });
    
    // Persist to localStorage
    localStorage.setItem('selectedPreset', id);
  },
  
  ensureDefault: (actives) => {
    const current = get().selectedPreset;
    
    // Only set if it's currently null/undefined
    if (!current) {
      const first = actives[0];
      if (first) {
        console.log('🎯 Setting boot default preset to:', first);
        set({ selectedPreset: first as PresetId });
        localStorage.setItem('selectedPreset', first);
      } else {
        console.log('🎯 Setting fallback boot preset to:', BOOT_PRESET);
        set({ selectedPreset: BOOT_PRESET });
        localStorage.setItem('selectedPreset', BOOT_PRESET);
      }
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
