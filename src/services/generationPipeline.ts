// Bulletproof Generation Pipeline
// Fixes: preflight checks, side-effect ordering, error cleanup
import { logger } from '../utils/logger'
import { presetsStore } from '../stores/presetsStore'
import { uiStore } from '../stores/ui'
import { quotaStore } from '../stores/quota'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'
import { useToasts } from '../components/ui/Toasts'
import { authFetch } from '../utils/authFetch'
import { preventDuplicateOperation, networkGuardRails, buttonGuardRails } from '../utils/guardRails'
import { getHttpsSource } from '../services/mediaSource'
import { runsStore } from '../stores/runs'
import { postAuthed } from '../utils/fetchAuthed'
import authService from '../services/authService'
import { uploadSourceToCloudinary } from './uploadSource'
import { assertFile } from './sourceFile'
import { getSourceFileOrThrow } from './source'

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
  
  // Track this run to prevent dropping late completions
  runsStore.getState().startRun(runId)
  
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
    
    // ✅ Use new uploadSource service - never fetch blob URLs
    try {
      const sourceFile = await getSourceFileOrThrow(job.source?.file || job.source?.url)
      const uploadResult = await uploadSourceToCloudinary({
        file: sourceFile,
        url: undefined // We always use the file now
      })
      sourceUrl = uploadResult.secureUrl
      uploadLogger.info('Source uploaded to Cloudinary', { sourceUrl })
    } catch (error) {
      if (controller.signal.aborted) return null
      uploadLogger.error('Source upload failed', { error: error instanceof Error ? error.message : error })
      showError("Source upload failed: " + (error instanceof Error ? error.message : 'Unknown error'), runId)
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

    // 4) COMPLETION ───────────────────────────────────────────────
    const completionLogger = jobLogger.generationStep('completion')
    
    // Process completion regardless of whether it's "late" - don't drop it
    const wasActive = runsStore.getState().completeRun(runId)
    
    if (wasActive) {
      completionLogger.info('Run completed normally', { runId })
    } else {
      completionLogger.info('Late completion processed', { runId })
    }
    
    // Always process the completion, even if it was "late"
    try {
      await onGenerationComplete(res, job)
      completionLogger.info('Completion processing successful')
    } catch (error) {
      completionLogger.error('Completion processing failed', { error: error instanceof Error ? error.message : error })
      // Don't fail the generation - the asset was created successfully
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
    // 🔧 ALWAYS reset so you don't need a page refresh
    if (activeRunId === runId) {
      uiStore.setBusy(false)
      uiStore.setCurrentRunId(null)
      activeRunId = null
    }
    uiStore.unregisterActiveRun(runId)
    
    // Clean up file input and blob URLs
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) fileInput.value = ''
    
    // Revoke any blob URLs to prevent memory leaks
    if (window.__lastSelectedFile) {
      const previewUrl = document.querySelector('img[src^="blob:"]')?.getAttribute('src')
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    
    const duration = Date.now() - startTime
    genLogger.info('Generation pipeline completed', { duration: `${duration}ms` })
  }
}

// Helper to call AIML API with proper error handling and cancellation
async function callAimlApi(job: GenerateJob, options?: { signal?: AbortSignal }): Promise<GenerationResult> {
  try {
    // Import and use ensureRemoteUrl to convert any blob URLs to HTTPS
    const { ensureRemoteUrl } = await import('../utils/ensureRemoteUrl');
    
    // Ensure we have a proper HTTPS URL before calling AIML
    const secureImageUrl = await ensureRemoteUrl({ 
      url: job.source?.url,
      file: job.source?.file
    });
    
    const response = await authFetch('/.netlify/functions/aimlApi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: options?.signal,
      body: JSON.stringify({
        ...job.params,
        prompt: job.prompt,
        image_url: secureImageUrl, // Use the ensured HTTPS URL
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
    
    // Bulletproof success check - handle both response formats
    const resultImageUrl = result.images?.[0]?.url || result.data?.[0]?.url || result.result_url || result.output_url || result.image_url
    
    if (!resultImageUrl) {
      console.error('❌ No image URL in AIML response:', result)
      throw new Error('No image URL returned from generation')
    }
    
    return {
      success: true,
      resultUrl: resultImageUrl,
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
    // Use the new unified save-media endpoint
    const savePayload = {
      runId: job.runId,
      presetId: job.presetId,
      allowPublish: true, // TODO: get from user settings
      source: job.source,
      variations: [{
        url: result.resultUrl,
        type: 'image', // TODO: detect from result
        meta: {
          presetId: job.presetId,
          mode: job.mode,
          group: job.group || null,
          optionKey: job.optionKey || null,
          storyKey: job.storyKey || null,
          storyLabel: job.storyLabel || null,
          prompt: job.prompt,
          source_url: job.source?.url,
        }
      }],
      tags: ['transformed', `preset:${job.presetId}`, `mode:${job.mode}`],
      extra: {
        source: 'generation',
        timestamp: new Date().toISOString()
      }
    }

    console.log('💾 Saving generation result via save-media:', savePayload)
    
    // Get auth token for the request
    const token = authService.getToken()
    if (!token) {
      console.warn('No auth token available, saving without DB record')
    }

    const response = await fetch('/.netlify/functions/save-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(savePayload)
    })

    if (!response.ok) {
      console.error('Failed to save via save-media:', response.status, await response.text())
      return
    }

    const saveResult = await response.json()
    console.log('✅ Generation saved via save-media:', saveResult)

    // If this is a remix (has parentId), send anonymous notification
    if (job.parentId) {
      try {
        const notifyResponse = await fetch('/.netlify/functions/notify-remix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentId: job.parentId,
            childId: saveResult.items?.[0]?.cloudinary_public_id || 'unknown',
            createdAt: new Date().toISOString()
          })
        });

        if (notifyResponse.ok) {
          console.log('📬 Remix notification sent successfully');
        } else {
          console.warn('⚠️ Failed to send remix notification:', notifyResponse.status);
        }
      } catch (notifyError) {
        console.warn('⚠️ Remix notification error:', notifyError);
        // Don't fail the generation if notification fails
      }
    }

    // Update UI state immediately so user sees result without reload
    // Dispatch custom event for UI components to listen to
    window.dispatchEvent(new CustomEvent('generation-complete', { 
      detail: { 
        record: saveResult.items?.[0], 
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
