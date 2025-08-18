// Mapping Validation - Simplified for Presets + MoodMorph only
import { presetsStore } from '../stores/presetsStore';
let validationState = {
    validationComplete: false
};
// Export validation state
export const validationStore = {
    getState: () => validationState,
    setValidationComplete: (complete) => {
        validationState.validationComplete = complete;
        dispatchValidationUpdate();
    }
};
function dispatchValidationUpdate() {
    window.dispatchEvent(new CustomEvent('validation-state-change', { detail: validationState }));
}
export async function validateMappings() {
    console.log('🔍 Validating preset mappings...');
    // Wait for presets to be ready
    await presetsStore.getState().ready();
    const { byId } = presetsStore.getState();
    // Simple validation - just check if presets are loaded
    const presetCount = Object.keys(byId).length;
    // Log validation results
    if (process.env.NODE_ENV !== "production") {
        console.log(`✅ Presets loaded: ${presetCount}`);
    }
    validationStore.setValidationComplete(true);
    console.log('✅ Mapping validation complete');
}
// Legacy export for backward compatibility
export const validateModeMappings = validateMappings;
// Helper functions for components to check availability
export function isValidationComplete() {
    return validationState.validationComplete;
}
// Subscribe to validation state changes
export function subscribeToValidationState(callback) {
    const handler = (event) => callback(event.detail);
    window.addEventListener('validation-state-change', handler);
    return () => window.removeEventListener('validation-state-change', handler);
}
