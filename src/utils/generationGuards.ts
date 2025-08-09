// Generation Guards - Prevent automatic follow-up jobs after presets
// This prevents the "preset succeeds but then T2I/remix overwrites it" issue

export interface GenerationContext {
  source?: 'preset' | 'custom' | 'remix' | 'restored'
  auto?: boolean
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
 */
export async function safeDetectContext(imageData: string, fallback: string = 'default'): Promise<string> {
  try {
    // Import the actual detection function
    const { detectContentContext } = await import('../components/WebsiteLayout')
    return await detectContentContext(imageData)
  } catch (error) {
    console.warn('Context detection failed, using fallback:', error)
    return fallback
  }
}
