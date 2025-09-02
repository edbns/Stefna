// src/services/simpleGenerationService.ts
// Simplified Generation Service - Direct calls to Netlify functions
// Removes the complex pipeline layers for cleaner architecture

import { authenticatedFetch } from '../utils/apiClient';

export type GenerationMode = 'presets' | 'custom-prompt' | 'emotion-mask' | 'ghibli-reaction' | 'neo-glitch' | 'story-time';

export interface SimpleGenerationRequest {
  mode: GenerationMode;
  prompt: string;
  presetKey?: string;
  sourceAssetId: string;
  userId: string;
  runId: string;
  emotionMaskPresetId?: string;
  ghibliReactionPresetId?: string;
  neoGlitchPresetId?: string;
  storyTimePresetId?: string;
  additionalImages?: File[];
  meta?: any;
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
   * Poll for generation completion
   */
  private async pollForCompletion(runId: string, mode: GenerationMode): Promise<SimpleGenerationResult> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    const pollInterval = 5000; // 5 seconds
    
    console.log(`🔄 [SimpleGeneration] Starting polling for runId: ${runId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📡 [SimpleGeneration] Polling attempt ${attempt}/${maxAttempts} for runId: ${runId}`);
        
        const statusResult = await this.checkStatus(runId, mode);
        
        if (statusResult.status === 'completed') {
          console.log(`✅ [SimpleGeneration] Generation completed after ${attempt} attempts`);
          return statusResult;
        }
        
        if (statusResult.status === 'failed') {
          console.log(`❌ [SimpleGeneration] Generation failed after ${attempt} attempts`);
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
    console.log(`⏰ [SimpleGeneration] Polling timeout reached for runId: ${runId}`);
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
      userId: request.userId,
      runId: request.runId,
      meta: request.meta || {}
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
   * Check generation status (for polling)
   */
  async checkStatus(jobId: string, mode: GenerationMode): Promise<SimpleGenerationResult> {
    try {
      // For unified generation, we need to check getUserMedia to see if the generation completed
      // The unified function doesn't have a status endpoint, so we check user media instead
      const response = await authenticatedFetch('/.netlify/functions/getUserMedia', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Look for media with matching runId or recent timestamp
      const recentMedia = result.media?.filter((item: any) => {
        // Check if this media was created recently (within last 10 minutes)
        const createdAt = new Date(item.created_at);
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        return createdAt > tenMinutesAgo;
      });

      if (recentMedia && recentMedia.length > 0) {
        // Found recent media, assume generation completed
        const latestMedia = recentMedia[0];
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
}

export default SimpleGenerationService;
