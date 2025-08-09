// Generation Guards - Prevent automatic follow-up jobs after presets
// This prevents the "preset succeeds but then T2I/remix overwrites it" issue

export interface GenerationContext {
  source?: 'preset' | 'custom' | 'remix' | 'restored'
  auto?: boolean
  userInitiated?: boolean
}

/**
 * Determines if automatic follow-up generation should be blocked
 * Blocks automatic pipelines that originate from preset completion
 */
export function shouldBlockAutoFollowUp(ctx?: GenerationContext): boolean {
  // Block *automatic* follow-ups that originate from a preset
  return !!(ctx?.auto === true && ctx?.source === "preset")
}

/**
 * Block all non-user-initiated generation calls
 * This is the primary gate to prevent hidden auto-follow-ups
 */
export function requireUserIntent(opts?: { userInitiated?: boolean; source?: string }): boolean {
  // Block anything that isn't explicitly a user click
  if (!opts?.userInitiated) {
    console.warn("🚫 Blocked non-user-initiated generation", opts);
    return true;
  }
  return false;
}

/**
 * Central generation controller to prevent multiple jobs running simultaneously
 */
export const runController = {
  inFlight: false,
  
  async run<T>(fn: () => Promise<T>): Promise<T | null> {
    if (this.inFlight) {
      console.warn('🚫 Generation already in flight, ignoring new request')
      return null
    }
    
    this.inFlight = true
    try {
      return await fn()
    } finally {
      this.inFlight = false
    }
  },
  
  isRunning(): boolean {
    return this.inFlight
  },
  
  reset(): void {
    this.inFlight = false
  }
}

/**
 * Safe context detection wrapper that never crashes
 * Note: Removed dynamic import to avoid circular dependency
 */
