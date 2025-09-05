// src/services/simpleGenerationService.ts
// Simplified Generation Service - Direct calls to Netlify functions
// Removes the complex pipeline layers for cleaner architecture

import { authenticatedFetch } from '../utils/apiClient'
import authService from './authService';

export type GenerationMode = 'presets' | 'custom-prompt' | 'emotion-mask' | 'ghibli-reaction' | 'neo-glitch' | 'story-time' | 'edit-photo';

export interface SimpleGenerationRequest {
  mode: GenerationMode;
  prompt: string;
  presetKey?: string;
  sourceAssetId: string;
  sourceWidth?: number;
  sourceHeight?: number;
  userId: string;
  runId: string;
  emotionMaskPresetId?: string;
  ghibliReactionPresetId?: string;
  neoGlitchPresetId?: string;
  storyTimePresetId?: string;
  additionalImages?: File[];
  meta?: any;
  // IPA (Identity Preservation Analysis) parameters
  ipaThreshold?: number;
  ipaRetries?: number;
  ipaBlocking?: boolean;
}

export interface SimpleGenerationResult {
  success: boolean;
  jobId?: string;
  runId?: string;
  status: 'completed' | 'processing' | 'failed';
  imageUrl?: string;
  videoUrl?: string;
  error?: string;
  provider?: string;
  type: GenerationMode;
}

// All generation modes now use the unified endpoint
const FUNCTION_ENDPOINTS: Record<GenerationMode, string> = {
  'presets': '/.netlify/functions/unified-generate-background',
  'custom-prompt': '/.netlify/functions/unified-generate-background',
  'emotion-mask': '/.netlify/functions/unified-generate-background',
  'ghibli-reaction': '/.netlify/functions/unified-generate-background',
  'neo-glitch': '/.netlify/functions/unified-generate-background',
  'story-time': '/.netlify/functions/unified-generate-background',
  'edit-photo': '/.netlify/functions/unified-generate-background'
};

class SimpleGenerationService {
  private static instance: SimpleGenerationService;
  private lastGenerationRequest?: SimpleGenerationRequest;

  private constructor() {}

  static getInstance(): SimpleGenerationService {
    if (!SimpleGenerationService.instance) {
      SimpleGenerationService.instance = new SimpleGenerationService();
    }
    return SimpleGenerationService.instance;
  }

    /**
   * Generate content using direct function calls with automatic polling
   */
  async generate(request: SimpleGenerationRequest): Promise<SimpleGenerationResult> {
    console.log('🚀 [SimpleGeneration] Starting generation:', {
      mode: request.mode,
      runId: request.runId,
      hasSource: !!request.sourceAssetId
    });

    // Store the request for polling fallback
    this.lastGenerationRequest = request;

    try {
      const endpoint = FUNCTION_ENDPOINTS[request.mode];
      if (!endpoint) {
        throw new Error(`Unknown generation mode: ${request.mode}`);
      }

      // Prepare request payload based on mode
      const payload = this.buildPayload(request);

      console.log('📡 [SimpleGeneration] Calling endpoint:', endpoint);

      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Read response body first to check for early failures
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        // If we can't parse JSON, create a synthetic error response
        result = {
          success: false,
          status: 'failed',
          error: `HTTP ${response.status}: ${response.statusText} (JSON parse failed)`
        };
      }

      // Check for early failure before starting polling
      if (result && result.success === false && result.status === 'failed' && result.hasOutput === false) {
        console.warn(`🚨 [SimpleGeneration] Early failure detected: ${result.error}`);
        console.warn(`🚨 [SimpleGeneration] Full failure response:`, JSON.stringify(result, null, 2));
        
        // Special handling for insufficient credits
        if (result.error === 'INSUFFICIENT_CREDITS') {
          console.log('🚨 [SimpleGeneration] Throwing INSUFFICIENT_CREDITS error for frontend handling');
          throw new Error('INSUFFICIENT_CREDITS');
        }
        
        // For other failures, throw the error message
        const errorMessage = result.error || result.message || 'Generation failed';
        console.log('🚨 [SimpleGeneration] Throwing early failure error:', errorMessage);
        throw new Error(errorMessage);
      }

      // If this is a Netlify background function, it responds 202 with no body
      if (response.status === 202) {
        console.log('ℹ️ [SimpleGeneration] Background accepted (202), starting polling...');
        
        // Start polling for completion
        return await this.pollForCompletion(request.runId, request.mode);
      }

      if (!response.ok) {
        // Use the parsed result if available, otherwise create error message
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        if (result && result.error) {
          errorMessage = result.error;
        } else if (result && result.message) {
          errorMessage = result.message;
        }
        
        // Special handling for insufficient credits
        if (result && result.errorType === 'INSUFFICIENT_CREDITS') {
          console.log('🚨 [SimpleGeneration] Detected INSUFFICIENT_CREDITS, throwing error');
          throw new Error('INSUFFICIENT_CREDITS');
        }
        
        // Also check for insufficient credits in error message
        if (result && result.error && result.error.includes('Insufficient credits')) {
          console.log('🚨 [SimpleGeneration] Detected insufficient credits in error message, throwing error');
          throw new Error('INSUFFICIENT_CREDITS');
        }
        
        console.log('🚨 [SimpleGeneration] Throwing error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Note: Early failure check is now handled above before polling starts

      // Normalize backend unified-generate-background response
      const normalized = {
        success: !!result.success,
        jobId: result.jobId || result.runId || undefined,
        runId: result.runId || undefined,
        status: result.status === 'done' ? 'completed' : result.status,
        imageUrl: result.imageUrl || result.outputUrl || undefined,
        videoUrl: result.videoUrl || undefined,
        error: result.error,
        provider: result.provider,
        type: request.mode as GenerationMode
      } as SimpleGenerationResult;

      // Ensure failed-but-with-output is not treated as timeout
      if (normalized.status === 'failed' && normalized.imageUrl) {
        normalized.status = 'completed'; // let polling exit
        normalized.success = false;      // still mark as a failure (e.g. IPA fail)
      }

      console.log('✅ [SimpleGeneration] Generation completed (normalized):', {
        success: normalized.success,
        status: normalized.status,
        hasImage: !!normalized.imageUrl,
        hasVideo: !!normalized.videoUrl
      });

      return normalized;

    } catch (error) {
      console.error('❌ [SimpleGeneration] Generation failed:', error);

      // Re-throw INSUFFICIENT_CREDITS errors so frontend can handle them properly
      if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
        console.log('🚨 [SimpleGeneration] Re-throwing INSUFFICIENT_CREDITS error for frontend handling');
        throw error;
      }

      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        type: request.mode
      };
    }
  }

  /**
   * Poll for generation completion with intelligent detection
   */
  private async pollForCompletion(runId: string, mode: GenerationMode): Promise<SimpleGenerationResult> {
    const maxAttempts = 72; // 6 minutes with 5-second intervals (increased for longer generations)
    const pollInterval = 5000; // 5 seconds
    const startTime = Date.now()
    
    console.log(`🔄 [SimpleGeneration] Starting intelligent polling for runId: ${runId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const elapsed = Date.now() - startTime
        console.log(`📡 [SimpleGeneration] Polling attempt ${attempt}/${maxAttempts} (${Math.round(elapsed/1000)}s elapsed) for runId: ${runId}`);
        
        const statusResult = await this.checkStatus(runId, mode);
        
        // Backup check: If we detect a failure response, stop polling immediately
        if (statusResult.success === false && statusResult.status === 'failed' && !statusResult.imageUrl && !statusResult.videoUrl) {
          console.warn(`🚨 [Polling] Generation failed during polling: ${statusResult.error}`);
          console.warn(`🚨 [Polling] Stopping polling and returning failure`);
          return statusResult;
        }
        
        if (statusResult.status === 'completed') {
          console.log(`✅ [SimpleGeneration] Generation completed after ${attempt} attempts (${Math.round(elapsed/1000)}s total)`);
          return statusResult;
        }
        
        if (statusResult.status === 'failed') {
          // If there's an image, treat as "soft fail" (IPA failure)
          if (statusResult.imageUrl || statusResult.videoUrl) {
            console.warn(`⚠️ [SimpleGeneration] Generation failed but has output. Returning as completed with warning.`);
            return {
              ...statusResult,
              status: 'completed', // force status to completed
              success: false,      // retain false for UI to show IPA warning
            };
          }

          // No output at all — real failure
          console.log(`❌ [SimpleGeneration] Generation failed after ${attempt} attempts (${Math.round(elapsed/1000)}s total)`);
          return statusResult;
        }
        
        // Still processing, wait before next poll
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        
      } catch (error) {
        console.warn(`⚠️ [SimpleGeneration] Polling attempt ${attempt} failed:`, error);
        
        // Don't fail immediately on polling errors, continue trying
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }
    }
    
    // Timeout reached
    const totalElapsed = Date.now() - startTime
    console.log(`⏰ [SimpleGeneration] Polling timeout reached for runId: ${runId} after ${Math.round(totalElapsed/1000)}s`);
    return {
      success: false,
      status: 'failed',
      error: 'Generation timed out. Please try again.',
      type: mode
    };
  }

  /**
   * Build payload for unified generation endpoint
   */
  private buildPayload(request: SimpleGenerationRequest): any {
    // Convert mode names to match unified function expectations
    const modeMap: Record<GenerationMode, string> = {
      'presets': 'presets',
      'custom-prompt': 'custom',
      'emotion-mask': 'emotion_mask',
      'ghibli-reaction': 'ghibli_reaction',
      'neo-glitch': 'neo_glitch',
      'story-time': 'story_time',
      'edit-photo': 'edit'
    };

    const basePayload = {
      mode: modeMap[request.mode],
      prompt: request.prompt,
      sourceAssetId: request.sourceAssetId,
      sourceWidth: request.sourceWidth,
      sourceHeight: request.sourceHeight,
      userId: request.userId,
      runId: request.runId,
      meta: request.meta || {},
      // IPA parameters
      ipaThreshold: request.ipaThreshold,
      ipaRetries: request.ipaRetries,
      ipaBlocking: request.ipaBlocking
    };

    // Add mode-specific parameters
    switch (request.mode) {
      case 'presets':
        return {
          ...basePayload,
          presetKey: request.presetKey
        };

      case 'custom-prompt':
        return basePayload;

      case 'emotion-mask':
        return {
          ...basePayload,
          emotionMaskPresetId: request.emotionMaskPresetId
        };

      case 'ghibli-reaction':
        return {
          ...basePayload,
          ghibliReactionPresetId: request.ghibliReactionPresetId
        };

      case 'neo-glitch':
        return {
          ...basePayload,
          neoGlitchPresetId: request.neoGlitchPresetId
        };

      case 'story-time':
        return {
          ...basePayload,
          storyTimePresetId: request.storyTimePresetId,
          additionalImages: request.additionalImages
        };

      case 'edit-photo':
        return {
          ...basePayload,
          editImages: request.additionalImages,
          editPrompt: request.prompt
        };

      default:
        return basePayload;
    }
  }

  /**
   * Check generation status using exact runId matching with fallback
   */
  async checkStatus(runId: string, mode: GenerationMode): Promise<SimpleGenerationResult> {
    try {
      console.log(`🔍 [SimpleGeneration] Checking status for runId: ${runId}`);
      
      // Try the new getMediaByRunId endpoint first
      try {
        const response = await authenticatedFetch(`/.netlify/functions/getMediaByRunId?runId=${runId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 404) {
          // Media not found yet, still processing
          console.log(`⏳ [SimpleGeneration] Media not found yet, still processing... (runId: ${runId})`);
          return {
            success: true,
            jobId: runId,
            runId: runId,
            status: 'processing',
            error: undefined,
            type: mode
          };
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.media) {
          console.log(`✅ [SimpleGeneration] Generation completed! Found media:`, {
            id: result.media.id,
            runId: result.media.runId,
            type: result.media.type,
            url: result.media.url
          });
          
          return {
            success: true,
            jobId: runId,
            runId: runId,
            status: 'completed',
            imageUrl: result.media.type === 'video' ? undefined : result.media.url,
            videoUrl: result.media.type === 'video' ? result.media.url : undefined,
            error: undefined,
            provider: result.media.metadata?.provider || 'unknown',
            type: mode
          };
        }

        // Unexpected response format
        console.warn(`⚠️ [SimpleGeneration] Unexpected response format:`, result);
        return {
          success: false,
          status: 'failed',
          error: 'Unexpected response format from server',
          type: mode
        };

      } catch (endpointError) {
        console.warn(`⚠️ [SimpleGeneration] getMediaByRunId endpoint failed, falling back to getUserMedia:`, endpointError);
        
        // Fallback to the old getUserMedia method
        return await this.checkStatusFallback(runId, mode);
      }

    } catch (error) {
      console.error('❌ [SimpleGeneration] Status check failed:', error);

      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        type: mode
      };
    }
  }

  /**
   * Fallback status check using getUserMedia (old method)
   */
  private async checkStatusFallback(runId: string, mode: GenerationMode): Promise<SimpleGenerationResult> {
    try {
      // Get the actual user ID from auth service
      const authState = authService.getAuthState()
      const userId = authState.user?.id
      
      if (!userId) {
        console.error('❌ [SimpleGeneration] No user ID available for polling')
        throw new Error('User not authenticated')
      }
      
      // Use getUserMedia as fallback
      const response = await authenticatedFetch(`/.netlify/functions/getUserMedia?userId=${userId}&limit=50`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Look for media with exact runId match - check all possible field names
      const matchingMedia = result.items?.find((item: any) => {
        // Log the item for debugging
        console.log(`🔍 [SimpleGeneration] Checking item:`, {
          id: item.id,
          runId: item.runId,
          run_id: item.run_id,
          stability_job_id: item.stability_job_id,
          type: item.type,
          mediaType: item.mediaType
        });
        
        return (
          item.runId === runId || 
          item.run_id === runId || 
          item.stability_job_id === runId ||
          item.falJobId === runId ||
          item.stabilityJobId === runId
        );
      });

      if (matchingMedia) {
        console.log(`✅ [SimpleGeneration] Found media with exact runId match (fallback):`, {
          id: matchingMedia.id,
          runId: matchingMedia.runId,
          url: matchingMedia.finalUrl || matchingMedia.imageUrl
        });
        
        return {
          success: true,
          jobId: runId,
          runId: runId,
          status: 'completed',
          imageUrl: matchingMedia.finalUrl || matchingMedia.imageUrl || matchingMedia.image_url,
          videoUrl: matchingMedia.videoUrl || matchingMedia.video_url,
          error: undefined,
          provider: matchingMedia.provider || 'unknown',
          type: mode
        };
      }

      // No matching media found, still processing
      console.log(`⏳ [SimpleGeneration] No matching media found, still processing... (runId: ${runId})`);
      return {
        success: true,
        jobId: runId,
        runId: runId,
        status: 'processing',
        error: undefined,
        type: mode
      };

    } catch (error) {
      console.error('❌ [SimpleGeneration] Fallback status check failed:', error);

      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        type: mode
      };
    }
  }

}

export default SimpleGenerationService;
