// src/services/simpleGenerationService.ts
// Simplified Generation Service - Direct calls to Netlify functions
// Removes the complex pipeline layers for cleaner architecture

import { authenticatedFetch } from '../utils/apiClient'
import authService from './authService';

export type GenerationMode = 'presets' | 'custom-prompt' | 'emotion-mask' | 'ghibli-reaction' | 'neo-glitch' | 'story-time';

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
  'story-time': '/.netlify/functions/unified-generate-background'
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

      // If this is a Netlify background function, it responds 202 with no body
      if (response.status === 202) {
        console.log('ℹ️ [SimpleGeneration] Background accepted (202), starting polling...');
        
        // Start polling for completion
        return await this.pollForCompletion(request.runId, request.mode);
      }

      // Read response body once for both success and error cases
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

      if (!response.ok) {
        // Use the parsed result if available, otherwise create error message
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        if (result && result.error) {
          errorMessage = result.error;
        } else if (result && result.message) {
          errorMessage = result.message;
        }
        throw new Error(errorMessage);
      }

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
      'story-time': 'story_time'
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

      default:
        return basePayload;
    }
  }

  /**
   * Check generation status with improved completion detection
   */
  async checkStatus(jobId: string, mode: GenerationMode): Promise<SimpleGenerationResult> {
    try {
      // Get the actual user ID from auth service
      const authState = authService.getAuthState()
      const userId = authState.user?.id
      
      if (!userId) {
        console.error('❌ [SimpleGeneration] No user ID available for polling')
        throw new Error('User not authenticated')
      }
      
      // For unified generation, we need to check getUserMedia to see if the generation completed
      const response = await authenticatedFetch(`/.netlify/functions/getUserMedia?userId=${userId}&limit=50`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Debug: Log the entire response to see what we're getting
      console.log(`🔍 [SimpleGeneration] getUserMedia response:`, {
        success: result.success,
        itemsCount: result.items?.length,
        firstItem: result.items?.[0],
        allItems: result.items
      });
      
      // Look for media with matching runId or created after generation started
      const generationStartTime = this.getGenerationStartTime(jobId);
      const recentMedia = result.items?.filter((item: any) => {
        // Debug: Log what we're looking for
        console.log(`🔍 [SimpleGeneration] Checking item:`, {
          itemId: item.id,
          itemRunId: item.runId,
          jobId: jobId,
          exactMatch: item.runId === jobId,
          createdAt: item.createdAt,
          generationStart: generationStartTime,
          prompt: item.prompt?.slice(0, 50)
        });
        
        // First try to match by exact runId
        if (item.runId && item.runId === jobId) {
          console.log(`🎯 [SimpleGeneration] Found media with exact runId match:`, item.runId);
          return true;
        }
        
        // Fallback: Check if this media was created after generation started
        const createdAt = new Date(item.createdAt);
        const isAfterGenerationStart = createdAt > generationStartTime;
        
        if (isAfterGenerationStart) {
          console.log(`⏰ [SimpleGeneration] Found media created after generation start:`, {
            id: item.id,
            createdAt: item.createdAt,
            runId: item.runId,
            generationStart: generationStartTime
          });
        }
        
        // Additional fallback: Check if prompt matches (for cases where runId is missing)
        const promptMatch = item.prompt && this.lastGenerationRequest?.prompt && 
                           item.prompt.includes(this.lastGenerationRequest.prompt.slice(0, 30));
        
        if (promptMatch) {
          console.log(`📝 [SimpleGeneration] Found media with prompt match:`, {
            id: item.id,
            prompt: item.prompt?.slice(0, 50),
            requestPrompt: this.lastGenerationRequest?.prompt?.slice(0, 50)
          });
        }
        
        // Additional fallback: Check if media was created within last 5 minutes (for any recent generation)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const isRecent = createdAt > fiveMinutesAgo;
        
        if (isRecent && !isAfterGenerationStart && !promptMatch) {
          console.log(`🕐 [SimpleGeneration] Found recent media (within 5 minutes):`, {
            id: item.id,
            createdAt: item.createdAt,
            runId: item.runId,
            fiveMinutesAgo: fiveMinutesAgo
          });
        }
        
        return isAfterGenerationStart || promptMatch || isRecent;
      });

      if (recentMedia && recentMedia.length > 0) {
        // Found recent media, assume generation completed
        const latestMedia = recentMedia[0];
        console.log(`✅ [SimpleGeneration] Generation completed! Found media:`, {
          id: latestMedia.id,
          createdAt: latestMedia.createdAt,
          finalUrl: latestMedia.finalUrl,
          runId: jobId,
          mode: mode
        });
        return {
          success: true,
          jobId: jobId,
          runId: jobId,
          status: 'completed',
          imageUrl: latestMedia.finalUrl || latestMedia.imageUrl,
          videoUrl: latestMedia.videoUrl,
          error: undefined,
          provider: latestMedia.provider || 'unknown',
          type: mode
        };
      }

      // No recent media found, still processing
      console.log(`⏳ [SimpleGeneration] No completion detected, still processing... (runId: ${jobId})`);
      return {
        success: true,
        jobId: jobId,
        runId: jobId,
        status: 'processing',
        error: undefined,
        type: mode
      };

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
   * Get generation start time for a given runId
   */
  private getGenerationStartTime(runId: string): Date {
    // Extract timestamp from runId (assuming runId contains timestamp)
    // If runId format is: timestamp_random, extract the timestamp part
    const timestampPart = runId.split('_')[0];
    const timestamp = parseInt(timestampPart, 10);
    
    if (!isNaN(timestamp)) {
      return new Date(timestamp);
    }
    
    // Fallback: use current time minus 15 minutes (generation should have started recently)
    return new Date(Date.now() - 15 * 60 * 1000);
  }
}

export default SimpleGenerationService;
