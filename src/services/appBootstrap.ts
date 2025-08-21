// Application Bootstrap - Initialize all systems with hardening
import { presetsStore } from '../stores/presetsStore'
// import { validateMappings } from '../utils/validateMappings' // REMOVED - complex drama file
import { setupNavigationCleanup } from './generationPipeline'
// import { setupMemoryLeakPrevention } from '../utils/guardRails' // REMOVED - complex drama file
import { logger } from '../utils/logger'

let bootstrapComplete = false
let bootstrapPromise: Promise<void> | null = null

export async function initializeApp(): Promise<void> {
  // Prevent multiple initializations
  if (bootstrapComplete) return
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = performBootstrap()
  await bootstrapPromise
  bootstrapComplete = true
}

async function performBootstrap(): Promise<void> {
  const bootLogger = logger.child({ component: 'bootstrap' })
  bootLogger.info('Initializing Stefna app...')
  
  try {
    // 1. Setup hardening systems first
    bootLogger.info('Setting up hardening systems...')
    setupNavigationCleanup()
    // setupMemoryLeakPrevention() // REMOVED - complex drama validation
    
    // 2. Load presets
    bootLogger.info('Loading presets...')
    await presetsStore.getState().load()
    
    // 3. Validate all mappings after presets are loaded
    bootLogger.info('Validating mappings...')
    // await validateMappings() // REMOVED - complex drama validation
    
    // 4. Initialize other systems as needed
    // TODO: Add quota store initialization
    // TODO: Add user media store initialization
    
    bootLogger.info('App initialization complete')
  } catch (error) {
    bootLogger.error('App initialization failed', { error: error instanceof Error ? error.message : error })
    throw error
  }
}

// Check if bootstrap is complete
export function isBootstrapComplete(): boolean {
  return bootstrapComplete
}

// Get bootstrap promise for waiting
export function getBootstrapPromise(): Promise<void> | null {
  return bootstrapPromise
}
