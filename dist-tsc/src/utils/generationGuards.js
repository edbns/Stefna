// Generation Guards - Prevent automatic follow-up jobs after presets
// This prevents the "preset succeeds but then T2I/remix overwrites it" issue
/**
 * Determines if automatic follow-up generation should be blocked
 * Blocks automatic pipelines that originate from preset completion
 */
export function shouldBlockAutoFollowUp(ctx) {
    // Block *automatic* follow-ups that originate from a preset
    return !!(ctx?.auto === true && ctx?.source === "preset");
}
/**
 * Block all non-user-initiated generation calls
 * This is the primary gate to prevent hidden auto-follow-ups
 */
export function requireUserIntent(opts) {
    const allowed = !!(opts && opts.userInitiated === true);
    const msg = allowed ? 'ALLOW' : 'BLOCK';
    console.info(`🛡️ requireUserIntent: ${msg}`, opts);
    return !allowed; // true => block caller
}
/**
 * Central generation controller to prevent multiple jobs running simultaneously
 */
export const runController = {
    inFlight: false,
    async run(fn) {
        if (this.inFlight) {
            console.warn('🚫 Generation already in flight, ignoring new request');
            return null;
        }
        this.inFlight = true;
        try {
            return await fn();
        }
        finally {
            this.inFlight = false;
        }
    },
    isRunning() {
        return this.inFlight;
    },
    reset() {
        this.inFlight = false;
    }
};
/**
 * Safe context detection wrapper that never crashes
 * Note: Removed dynamic import to avoid circular dependency
 */
