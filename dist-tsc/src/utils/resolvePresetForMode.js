import { getPresetDef } from '../services/presets';
export function resolvePresetForMode({ mode, option, activePresets }) {
    // For presets mode, return the option directly if it exists
    if (mode === 'presets' && option) {
        if (getPresetDef(option, activePresets)) {
            return option;
        }
    }
    // For moodmorph, we don't need preset resolution
    if (mode === 'moodmorph') {
        return null;
    }
    // Fallback: pick first available active preset
    const fallback = Object.keys(activePresets)[0] || 'vivid_pop';
    console.warn(`Preset ${option} not found, falling back to ${fallback}`);
    return fallback;
}
