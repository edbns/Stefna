// Bulletproof Generation Pipeline
// Fixes: preflight checks, side-effect ordering, error cleanup
import { logger } from '../utils/logger'
import { presetsStore } from '../stores/presetsStore'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'
import { useToasts } from '../components/ui/Toasts'
import { authFetch } from '../utils/authFetch'
// import { preventDuplicateOperation, networkGuardRails, buttonGuardRails } from '../utils/guardRails' // REMOVED - complex drama file
import { getHttpsSource } from '../services/mediaSource'
import { runsStore } from '../stores/runs'
import { postAuthed } from '../utils/fetchAuthed'
import authService from '../services/authService'
import { uploadSourceToCloudinary } from './uploadSource'
import { assertFile } from './sourceFile'
import { getSourceFileOrThrow, dbgSource } from './source'
import { fetchWithAuth } from '../utils/fetchWithAuth';

// File type guard to prevent uploading strings as files
const isFileLike = (x: unknown): x is File | Blob =>
  typeof x === "object" && x !== null && "size" in (x as any) && "type" in (x as any)

export type GenerateJob = {
  mode: "i2i" | "t2i" | "story"
  presetId: string
  prompt: string
  params: Record<string, unknown>
  source?: { url?: string, file?: File }
  runId?: string
  // New metadata fields for tracking generation context
  group?: 'story'|null;
  optionKey?: string | null;     // e.g. 'vhs_1980s', 'four_seasons/spring', 'colorize_bw'
  storyKey?: string | null;      // e.g. 'four_seasons'
  storyLabel?: string | null;    // e.g. 'Spring'
  parentId?: string | null;      // if this is a remix, points to original media
  // 🔧 NEW: Track the actual generation type for preset mapping
  generationType?: 'preset' | 'custom' | 'emotionmask' | 'ghiblireact' | 'neotokyoglitch' | null;
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

// Quota check (real implementation)
const quotaStore = {
  getState: () => ({
    hasCredit: async (userId?: string) => {
      try {
        // Get auth token
        const token = localStorage.getItem('auth_token') || localStorage.getItem('jwt_token');
        if (!token) {
          console.warn('No auth token found for credit check');
          return false;
        }

        // Check backend quota
        const response = await fetch('/.netlify/functions/getQuota', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn('Failed to get backend quota');
          return false;
        }

        const quota = await response.json();
        const remaining = quota.remaining || (quota.daily_limit - quota.daily_used);
        const hasCredits = remaining >= 2; // Minimum cost for image generation

        console.log(`Credit check: ${remaining} credits remaining, can generate: ${hasCredits}`);
        return hasCredits;
      } catch (error) {
        console.warn('Credit check failed:', error);
        return false;
      }
    }
  })
}

// prevents double-clicks and lets us cancel stale updates
let activeRunId: string | null = null

export async function runGeneration(buildJob: () => Promise<GenerateJob | null>): Promise<GenerationResult | null> {
  // Guard rails: prevent duplicate operations and check network
  const operationKey = `generation-${Date.now()}`
          // if (!preventDuplicateOperation(operationKey)) { // REMOVED - complex drama validation
    //   return null
    // }

          // if (!networkGuardRails.requireOnline('generation')) { // REMOVED - complex drama validation
    //   return null
    // }

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

    const hasCredits = await quotaStore.getState().hasCredit()
    if (!hasCredits) {
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
      dbgSource('before-dispatchGenerate')
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
    // 🔧 ALWAYS reset UI state for this specific run
    uiStore.unregisterActiveRun(runId)
    
    // Check if NO inflight runs remain, then clear the spinner
    const remainingRuns = runsStore.getState().getActiveCount()
    if (remainingRuns === 0) {
      uiStore.setBusy(false)
      uiStore.setCurrentRunId(null)
      activeRunId = null
      console.log('🎯 All runs completed, spinner cleared')
    } else {
      console.log(`🎯 Run ${runId} completed, ${remainingRuns} runs still active`)
    }
    
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
    // The sourceUrl is already a Cloudinary HTTPS URL from the upload step
    // No need to call ensureRemoteUrl again
    const secureImageUrl = job.source?.url;
    
    if (!secureImageUrl) {
      throw new Error('No source URL available for generation');
    }
    
    const response = await authFetch('/.netlify/functions/aimlApi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: options?.signal,
      body: JSON.stringify({
        ...job.params,
        prompt: job.prompt,
        image_url: secureImageUrl, // Use the already-uploaded Cloudinary URL
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
        image_url: result.resultUrl,  // ✅ Fixed: 'url' → 'image_url'
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
    
    try {
      const response = await fetchWithAuth('/.netlify/functions/save-media', {
        method: 'POST',
        body: JSON.stringify(savePayload)
      });

      if (!response.ok) {
        console.error('Failed to save via save-media:', response.status, await response.text())
        return
      }

      const saveResult = await response.json()
      console.log('✅ Generation saved via save-media:', saveResult)

      // If this is a remix (has parentId), send anonymous notification
      if (job.parentId) {
        try {
          const notifyResponse = await fetchWithAuth('/.netlify/functions/notify-remix', {
            method: 'POST',
            body: JSON.stringify({
              parentId: job.parentId,
              childId: saveResult.results?.[0]?.cloudinary_public_id || 'unknown',
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
          record: saveResult.results?.[0], 
          resultUrl: result.resultUrl,
          presetId: job.presetId,
          mode: job.mode,
          timestamp: Date.now() 
        } 
      }))

      // Show success toast
      window.dispatchEvent(new CustomEvent('generation-success', { 
        detail: { resultUrl: result.resultUrl, timestamp: Date.now() } 
      }))

      // 💰 Finalize credits (commit) after successful generation
      try {
        console.log('💰 Generation Pipeline: Finalizing credits (commit)...');
        const finalizeResponse = await fetchWithAuth('/.netlify/functions/credits-finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_id: job.runId,
            disposition: 'commit'
          })
        });
        
        if (finalizeResponse.ok) {
          const finalizeResult = await finalizeResponse.json();
          console.log('✅ Generation Pipeline: Credits finalized successfully:', finalizeResult);
        } else {
          console.error('❌ Generation Pipeline: Credits finalization failed:', finalizeResponse.status);
          // Don't throw here - generation succeeded, just log the credit issue
        }
      } catch (finalizeError) {
        console.error('❌ Generation Pipeline: Credits finalization error:', finalizeError);
        // Don't throw here - generation succeeded, just log the credit issue
      }

    } catch (error) {
      console.error('Failed to save generation result:', error);
      
      // 💰 Refund credits if generation save failed
      try {
        console.log('💰 Generation Pipeline: Refunding credits due to save failure...');
        const refundResponse = await fetchWithAuth('/.netlify/functions/credits-finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_id: job.runId,
            disposition: 'refund'
          })
        });
        
        if (refundResponse.ok) {
          const refundResult = await refundResponse.json();
          console.log('✅ Generation Pipeline: Credits refunded successfully:', refundResult);
        } else {
          console.error('❌ Generation Pipeline: Credits refund failed:', refundResponse.status);
        }
      } catch (refundError) {
        console.error('❌ Generation Pipeline: Credits refund error:', refundError);
      }
      
      // Don't fail the generation if save fails
    }

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
