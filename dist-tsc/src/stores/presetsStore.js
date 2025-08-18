import { create } from 'zustand';
import { PRESETS } from '../utils/presets/types';
let readyResolve = null;
const readyPromise = new Promise(res => (readyResolve = res));
export const presetsStore = create((set, get) => ({
    byId: {},
    status: 'idle',
    load: async () => {
        const currentStatus = get().status;
        if (currentStatus === 'ready' || currentStatus === 'loading')
            return;
        set({ status: 'loading' });
        try {
            // Load presets (currently from static config, could be from API)
            const presetEntries = Object.entries(PRESETS);
            const byId = {};
            for (const [key, preset] of presetEntries) {
                byId[key] = preset;
            }
            set({ byId, status: 'ready' });
            readyResolve?.(); // Release the barrier once
            console.log('✅ Presets loaded and ready:', Object.keys(byId).length);
        }
        catch (error) {
            console.error('❌ Failed to load presets:', error);
            set({ status: 'error' });
        }
    },
    ready: () => readyPromise,
}));
// Helper functions
export function getPresetOrThrow(id) {
    const p = presetsStore.getState().byId[id];
    if (!p)
        throw new Error(`Invalid preset: ${id}`);
    return p;
}
export function indexById(list) {
    const result = {};
    for (const item of list) {
        if (item.id) {
            result[item.id] = item;
        }
    }
    return result;
}
