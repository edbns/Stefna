// Bulletproof Generation Pipeline
// Fixes: preflight checks, side-effect ordering, error cleanup
import { presetsStore } from '../stores/presetsStore'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'
import { useToasts } from '../components/ui/Toasts'
import { authFetch } from '../utils/authFetch'
import { logger } from '../utils/logger'
import { preventDuplicateOperation, networkGuardRails, buttonGuardRails } from '../utils/guardRails'

// File type guard to prevent uploading strings as files
const isFileLike = (x: unknown): x is File | Blob =>
  typeof x === "object" && x !== null && "size" in (x as any) && "type" in (x as any)

export type GenerateJob = {
  mode: "i2i" | "t2i" | "story" | "time_machine" | "restore"
  presetId: string
  prompt: string
  params: Record<string, unknown>
  source?: { url?: string, file?: File }
  runId?: string
  // New metadata fields for tracking generation context
  group?: 'story'|'time_machine'|'restore'|null;
  optionKey?: string | null;     // e.g. 'vhs_1980s', 'four_seasons/spring', 'colorize_bw'
  storyKey?: string | null;      // e.g. 'four_seasons'
  storyLabel?: string | null;    // e.g. 'Spring'
  parentId?: string | null;      // if this is a remix, points to original media
}

export type GenerationResult = {
  success: boolean
  resultUrl?: string
  error?: string
  runId?: string
  media?: any
}

// UI State Management with Cancellation Support
interface ActiveRun {
  runId: string
  controller: AbortController
  timestamp: number
}

interface UIState {
  busy: boolean
  currentRunId: string | null
  activeRuns: Map<string, ActiveRun>
}

let uiState: UIState = {
  busy: false,
  currentRunId: null,
  activeRuns: new Map()
}

// State management functions
export const uiStore = {
  getState: () => uiState,
  setBusy: (busy: boolean) => {
    uiState.busy = busy
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('ui-state-change', { detail: uiState }))
  },
  setCurrentRunId: (runId: string | null) => {
    uiState.currentRunId = runId
  },
  registerActiveRun: (runId: string, controller: AbortController) => {
    uiState.activeRuns.set(runId, {
      runId,
      controller,
      timestamp: Date.now()
    })
  },
  unregisterActiveRun: (runId: string) => {
    uiState.activeRuns.delete(runId)
  },
  abortAllActiveRuns: () => {
    console.log(`🛑 Aborting ${uiState.activeRuns.size} active runs`)
    uiState.activeRuns.forEach(({ controller }) => {
      controller.abort('Navigation or unmount')
    })
    uiState.activeRuns.clear()
    uiState.busy = false
    uiState.currentRunId = null
  },
  abortStaleRuns: (maxAgeMs = 300000) => { // 5 minutes
    const now = Date.now()
    const staleRuns = Array.from(uiState.activeRuns.entries())
      .filter(([, run]) => now - run.timestamp > maxAgeMs)
    
    staleRuns.forEach(([runId, run]) => {
      console.warn(`🧹 Aborting stale run: ${runId}`)
      run.controller.abort('Stale run cleanup')
      uiState.activeRuns.delete(runId)
    })
  }
}

// Quota check (simplified - extend as needed)
const quotaStore = {
  getState: () => ({
    hasCredit: () => true // TODO: Implement proper quota checking
  })
}

// prevents double-clicks and lets us cancel stale updates
let activeRunId: string | null = null

export async function runGeneration(buildJob: () => Promise<GenerateJob | null>): Promise<GenerationResult | null> {
  // Guard rails: prevent duplicate operations and check network
  const operationKey = `generation-${Date.now()}`
  if (!preventDuplicateOperation(operationKey)) {
    return null
  }

  if (!networkGuardRails.requireOnline('generation')) {
    return null
  }

  // mark UI busy for *this* run with cancellation support
  const runId = crypto.randomUUID()
  const controller = new AbortController()
  const startTime = Date.now()
  
  // Create logger for this generation run
  const genLogger = logger.generationStart(runId, 'unknown', 'unknown')
  
  activeRunId = runId
  uiStore.setBusy(true)
  uiStore.setCurrentRunId(runId)
  uiStore.registerActiveRun(runId, controller)
  
  genLogger.info('Generation started')

  try {
    // 1) PRE-FLIGHT ───────────────────────────────────────────────
    const preflightLogger = genLogger.generationStep('preflight')
    await presetsStore.getState().ready()
    
    if (controller.signal.aborted) return null
    
    const job = await buildJob()
    if (!job || controller.signal.aborted) return null

    // Update logger with job details
    const jobLogger = logger.child({ runId, mode: job.mode, presetId: job.presetId })

    const { presetId, prompt } = job
    if (!presetId || !prompt) {
      jobLogger.error('Missing required fields', { presetId: !!presetId, prompt: !!prompt })
      showError("Preset or prompt missing", runId)
      return null
    }

    const hasPreset = !!presetsStore.getState().byId[presetId]
    if (!hasPreset) {
      jobLogger.error('Preset not available', { presetId })
      showError("This style is temporarily unavailable", runId)
      return null
    }

    if (!quotaStore.getState().hasCredit()) {
      jobLogger.error('Insufficient credits')
      showError("You're out of credits", runId)
      return null
    }

    if (controller.signal.aborted) return null
    jobLogger.info('Preflight checks passed')

    // 2) SIDE-EFFECTS (after preflight only) ──────────────────────
    const uploadLogger = jobLogger.generationStep('upload')
    let sourceUrl: string | undefined
    
    // ✅ Strictly detect file vs url before uploading
    if (isFileLike(job.source?.file)) {
      try {
        uploadLogger.info('Starting file upload', { 
          fileName: (job.source!.file as File).name,
          fileSize: job.source!.file.size 
        })
        sourceUrl = await uploadToCloudinary(job.source!.file as File, { signal: controller.signal })
        uploadLogger.info('Upload completed', { sourceUrl })
      } catch (error) {
        if (controller.signal.aborted) return null
        uploadLogger.error('Upload failed', { error: error instanceof Error ? error.message : error })
        showError("Upload failed: " + (error instanceof Error ? error.message : 'Unknown error'), runId)
        return null
      }
    } else if (typeof job.source?.url === "string" && job.source.url) {
      sourceUrl = job.source.url
      uploadLogger.info('Using provided URL', { sourceUrl })
    } else {
      uploadLogger.error('No valid source found', { source: job.source })
      showError("No source image found", runId)
      return null
    }

    if (controller.signal.aborted) return null

    // 3) GENERATE ─────────────────────────────────────────────────
    const apiLogger = jobLogger.generationStep('api_call')
    const payload = { 
      ...job, 
      source: sourceUrl ? { url: sourceUrl } : undefined,
      runId
    }
    
    apiLogger.info('Calling AIML API', { hasSource: !!sourceUrl })
    const res = await callAimlApi(payload, { signal: controller.signal })
    apiLogger.info('API call completed', { success: res.success })

    // 4) SAVE & UI updates (process even if run is out-of-date) ───────────────────
    if (!controller.signal.aborted) {
      const saveLogger = jobLogger.generationStep('save')
      
      if (activeRunId !== runId) {
        console.info('Out-of-date run completed, still surfacing result', {runId});
      }
      
      // Always process the result to update UI state
      await onGenerationComplete(res, job);
      saveLogger.info('Generation result processed and UI updated')
    }
    
    const duration = Date.now() - startTime
    jobLogger.generationComplete(res.success, duration)
    return res
  } catch (err: any) {
    if (controller.signal.aborted) {
      genLogger.info('Generation cancelled by user')
      return null
    }
    const msg = err?.message || "Generation failed"
    genLogger.error('Generation failed', { error: msg, stack: err?.stack })
    showError(msg, runId)
    return null
  } finally {
    // ALWAYS clear busy state for this run
    if (activeRunId === runId) {
      uiStore.setBusy(false)
      uiStore.setCurrentRunId(null)
      activeRunId = null
    }
    uiStore.unregisterActiveRun(runId)
    
    const duration = Date.now() - startTime
    genLogger.info('Generation pipeline completed', { duration: `${duration}ms` })
  }
}

// Helper to call AIML API with proper error handling and cancellation
async function callAimlApi(job: GenerateJob, options?: { signal?: AbortSignal }): Promise<GenerationResult> {
  try {
    const response = await authFetch('/.netlify/functions/aimlApi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: options?.signal,
      body: JSON.stringify({
        ...job.params,
        prompt: job.prompt,
        image_url: job.source?.url,
        mode: job.mode,
        presetId: job.presetId,
        runId: job.runId
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Generation failed: ${response.status}`)
    }

    const result = await response.json()
    
    return {
      success: true,
      resultUrl: result.result_url || result.output_url,
      runId: job.runId,
      media: result
    }
  } catch (error) {
    console.error('❌ AIML API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      runId: job.runId
    }
  }
}

// Toast deduplication to prevent spam
const recentToasts = new Set<string>()
const TOAST_DEDUPE_TIME = 3000 // 3 seconds

// Helper to show errors with deduplication
function showError(message: string, runId?: string) {
  const toastKey = message.toLowerCase().trim()
  
  // Prevent duplicate toasts
  if (recentToasts.has(toastKey)) {
    console.warn(`🔇 Suppressed duplicate toast: ${message}`)
    return
  }
  
  recentToasts.add(toastKey)
  setTimeout(() => recentToasts.delete(toastKey), TOAST_DEDUPE_TIME)
  
  console.error('🚨', message, runId ? `[${runId}]` : '')
  
  // Dispatch custom event for toast system
  window.dispatchEvent(new CustomEvent('generation-error', { 
    detail: { message, runId, timestamp: Date.now() } 
  }))
}

// Export UI state for components to subscribe to
export function subscribeToUIState(callback: (state: UIState) => void) {
  const handler = (event: CustomEvent) => callback(event.detail)
  window.addEventListener('ui-state-change', handler as EventListener)
  return () => window.removeEventListener('ui-state-change', handler as EventListener)
}

// Navigation and cleanup handlers
export function setupNavigationCleanup() {
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    console.log('🧹 Page unload - aborting active runs')
    uiStore.abortAllActiveRuns()
  })
  
  // Clean up on visibility change (tab switch, minimize)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('🧹 Page hidden - cleaning up stale runs')
      uiStore.abortStaleRuns(60000) // 1 minute for hidden tabs
    }
  })
  
  // Periodic cleanup of very stale runs
  setInterval(() => {
    uiStore.abortStaleRuns()
  }, 60000) // Every minute
}

// Handle generation completion - save to DB and update UI
async function onGenerationComplete(result: GenerationResult, job: GenerateJob) {
  if (!result.success || !result.resultUrl) {
    console.error('Generation failed, skipping completion handling')
    return
  }

  try {
    // Save to database with proper metadata (record-asset format)
    const record = {
      url: result.resultUrl,
      public_id: extractPublicId(result.resultUrl),
      resource_type: 'image', // TODO: detect video vs image from result
      folder: 'stefna/outputs',
      parent_id: job.parentId || null,
      meta: {
        presetId: job.presetId,
        mode: job.mode,
        group: job.group || null,
        optionKey: job.optionKey || null,
        storyKey: job.storyKey || null,
        storyLabel: job.storyLabel || null,
        prompt: job.prompt,
        source_url: job.source?.url,
        tags: ['transformed', `preset:${job.presetId}`, `mode:${job.mode}`]
      }
    }

    console.log('💾 Saving generation result to DB:', record)
    const response = await fetch('/.netlify/functions/record-asset', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(record)
    })

    if (!response.ok) {
      console.error('Failed to save to DB:', response.status, await response.text())
      return
    }

    console.log('✅ Generation saved to DB successfully')

    // Update UI state immediately so user sees result without reload
    // Dispatch custom event for UI components to listen to
    window.dispatchEvent(new CustomEvent('generation-complete', { 
      detail: { 
        record, 
        resultUrl: result.resultUrl,
        presetId: job.presetId,
        mode: job.mode,
        timestamp: Date.now() 
      } 
    }))

    // Show success toast
    window.dispatchEvent(new CustomEvent('generation-success', { 
      detail: { message: 'Preset applied!', resultUrl: result.resultUrl, timestamp: Date.now() } 
    }))

  } catch (error) {
    console.error('Failed to complete generation:', error)
  }
}

// Helper to extract Cloudinary public_id from URL
function extractPublicId(url: string): string {
  if (!url) return ''
  
  // Extract public_id from Cloudinary URL
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?(?:\?|$)/)
  return match?.[1] || url.split('/').pop()?.split('.')[0] || ''
}

// Route change cleanup (call this in your router)
export function cleanupOnRouteChange() {
  console.log('🧹 Route change - aborting active runs')
  uiStore.abortAllActiveRuns()
}
