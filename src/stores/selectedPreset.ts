// stores/selectedPreset.ts
import { create } from 'zustand';
import { PRESETS } from '../utils/presets/types';

type PresetId = keyof typeof PRESETS;

type SelState = {
  selectedPreset: PresetId | null;
  setSelectedPreset: (id: PresetId | null) => void;
  ensureDefault: (actives: PresetId[]) => void;
};

// C. Stop nuking selectedPreset during boot
const BOOT_PRESET: PresetId | null = null;

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
    if (id === null) {
      console.log('🎯 Clearing selectedPreset to None');
      set({ selectedPreset: null });
      localStorage.removeItem('selectedPreset');
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
    
    // Don't auto-set a preset - let user choose or stay on None
    if (!current) {
      console.log('🎯 Keeping selectedPreset as None - user must choose');
      // Don't set anything - let it stay null
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
