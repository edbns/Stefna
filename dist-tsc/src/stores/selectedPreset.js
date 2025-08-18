// stores/selectedPreset.ts
import { create } from 'zustand';
import { PRESETS } from '../utils/presets/types';
// Default preset - null means "None" selected
const DEFAULT_PRESET = null;
export const useSelectedPreset = create((set, get) => ({
    // Make selectedPreset resilient to store reloads/preset refresh
    selectedPreset: (() => {
        const stored = localStorage.getItem('selectedPreset');
        // Clear old "cinematic_glow" default if it exists
        if (stored === 'cinematic_glow') {
            console.log('🎯 Clearing old cinematic_glow default, setting to None');
            localStorage.setItem('selectedPreset', 'none');
            return null;
        }
        if (stored === 'none') {
            console.log('🎯 Restored selectedPreset from localStorage: None');
            return null;
        }
        if (stored && stored in PRESETS) {
            console.log('🎯 Restored selectedPreset from localStorage:', stored);
            return stored;
        }
        console.log('🎯 Using boot default preset: None');
        return DEFAULT_PRESET;
    })(),
    setSelectedPreset: (id) => {
        if (id === null) {
            console.log('🎯 Clearing selectedPreset to default (None)');
            set({ selectedPreset: DEFAULT_PRESET });
            localStorage.setItem('selectedPreset', 'none');
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
            // Always start with "None" (null) as default, don't auto-select first preset
            console.log('🎯 Setting boot default preset to: None (no auto-selection)');
            set({ selectedPreset: DEFAULT_PRESET });
            localStorage.setItem('selectedPreset', 'none');
        }
    },
    resetToDefault: () => {
        console.log('🎯 Resetting to default preset: None');
        set({ selectedPreset: DEFAULT_PRESET });
        localStorage.setItem('selectedPreset', 'none');
    },
    getDefaultPreset: () => DEFAULT_PRESET,
}));
// Defensive logging to catch unexpected resets
if (typeof window !== 'undefined') {
    useSelectedPreset.subscribe((state) => {
        if (state.selectedPreset === null) {
            console.warn('[selectedPreset] became null unexpectedly - this is now the expected default state');
            // Don't auto-recover since null is now our intended default
        }
    });
}
