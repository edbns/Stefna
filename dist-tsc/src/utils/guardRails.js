// Guard Rails for UI State and Generation Safety
import { logger } from './logger';
// Guard rail: selectedPreset is UI-only, never mutated by modes/auth boot
let uiSelectedPreset = null;
let isPresetSelectionLocked = false;
export const presetGuardRails = {
    // Get current UI selection (read-only)
    getSelectedPreset: () => uiSelectedPreset,
    // Set UI selection (only allowed from UI components)
    setSelectedPreset: (presetId, source = 'ui') => {
        if (isPresetSelectionLocked && source === 'system') {
            logger.warn('Attempted to modify selectedPreset from system during locked state', {
                attempted: presetId,
                current: uiSelectedPreset,
                source
            });
            return;
        }
        uiSelectedPreset = presetId;
        logger.debug('Preset selection changed', { presetId, source });
    },
    // Lock preset selection during generation
    lockSelection: () => {
        isPresetSelectionLocked = true;
        logger.debug('Preset selection locked');
    },
    // Unlock preset selection after generation
    unlockSelection: () => {
        isPresetSelectionLocked = false;
        logger.debug('Preset selection unlocked');
    },
    // Check if preset is available and valid
    isPresetAvailable: (presetId, availablePresets) => {
        const isAvailable = !!availablePresets[presetId];
        if (!isAvailable) {
            logger.warn('Preset not available', { presetId, availableCount: Object.keys(availablePresets).length });
        }
        return isAvailable;
    }
};
// Guard rail: Prevent multiple identical operations
const recentOperations = new Map();
const OPERATION_COOLDOWN = 1000; // 1 second
export function preventDuplicateOperation(operationKey, cooldownMs = OPERATION_COOLDOWN) {
    const now = Date.now();
    const lastOperation = recentOperations.get(operationKey);
    if (lastOperation && (now - lastOperation) < cooldownMs) {
        logger.warn('Duplicate operation prevented', {
            operationKey,
            timeSinceLastMs: now - lastOperation,
            cooldownMs
        });
        return false;
    }
    recentOperations.set(operationKey, now);
    // Cleanup old entries
    setTimeout(() => {
        recentOperations.delete(operationKey);
    }, cooldownMs * 2);
    return true;
}
// Guard rail: Network state awareness
let isOnline = navigator.onLine;
let networkStateCallbacks = [];
window.addEventListener('online', () => {
    isOnline = true;
    logger.info('Network connection restored');
    networkStateCallbacks.forEach(cb => cb(true));
});
window.addEventListener('offline', () => {
    isOnline = false;
    logger.warn('Network connection lost');
    networkStateCallbacks.forEach(cb => cb(false));
});
export const networkGuardRails = {
    isOnline: () => isOnline,
    onNetworkChange: (callback) => {
        networkStateCallbacks.push(callback);
        return () => {
            networkStateCallbacks = networkStateCallbacks.filter(cb => cb !== callback);
        };
    },
    requireOnline: (operationName) => {
        if (!isOnline) {
            logger.error('Operation requires network connection', { operationName });
            // Dispatch event for UI to show offline message
            window.dispatchEvent(new CustomEvent('network-required', {
                detail: { operationName }
            }));
            return false;
        }
        return true;
    }
};
// Guard rail: Button state management
const buttonStates = new Map();
export const buttonGuardRails = {
    // Set button as busy (prevents double-clicks)
    setBusy: (buttonId, busy) => {
        buttonStates.set(buttonId, busy);
        logger.debug('Button state changed', { buttonId, busy });
    },
    // Check if button is busy
    isBusy: (buttonId) => {
        return buttonStates.get(buttonId) || false;
    },
    // Prevent action if button is busy
    preventIfBusy: (buttonId, actionName) => {
        const isBusy = buttonStates.get(buttonId) || false;
        if (isBusy) {
            logger.warn('Action prevented - button busy', { buttonId, actionName });
            return false;
        }
        return true;
    },
    // Clear all button states (on error recovery)
    clearAllStates: () => {
        const count = buttonStates.size;
        buttonStates.clear();
        logger.info('Cleared all button states', { count });
    }
};
// Guard rail: Memory leak prevention
export function setupMemoryLeakPrevention() {
    // Clear intervals and timeouts on page unload
    const intervals = [];
    const timeouts = [];
    const originalSetInterval = window.setInterval;
    const originalSetTimeout = window.setTimeout;
    window.setInterval = ((fn, delay) => {
        const id = originalSetInterval(fn, delay);
        intervals.push(id);
        return id;
    });
    window.setTimeout = ((fn, delay) => {
        const id = originalSetTimeout(fn, delay);
        timeouts.push(id);
        return id;
    });
    window.addEventListener('beforeunload', () => {
        intervals.forEach(id => clearInterval(id));
        timeouts.forEach(id => clearTimeout(id));
        logger.info('Cleaned up timers on page unload', {
            intervals: intervals.length,
            timeouts: timeouts.length
        });
    });
}
