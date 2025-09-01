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
  'presets': '/.netlify/functions/unified-generate',
  'custom-prompt': '/.netlify/functions/unified-generate',
  'emotion-mask': '/.netlify/functions/unified-generate',
  'ghibli-reaction': '/.netlify/functions/unified-generate',
  'neo-glitch': '/.netlify/functions/unified-generate',
  'story-time': '/.netlify/functions/unified-generate'
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
   * Generate content using direct function calls
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

      if (!response.ok) {
        // Try to get detailed error message from response body
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If we can't parse the error body, use the default message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      console.log('✅ [SimpleGeneration] Generation completed:', {
        success: result.success,
        status: result.status,
        hasImage: !!result.imageUrl,
        hasVideo: !!result.videoUrl
      });

      return {
        success: result.success,
        jobId: result.jobId,
        runId: result.runId,
        status: result.status,
        imageUrl: result.imageUrl,
        videoUrl: result.videoUrl,
        error: result.error,
        provider: result.provider,
        type: request.mode
      };

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
      const endpoint = FUNCTION_ENDPOINTS[mode];
      if (!endpoint) {
        throw new Error(`Unknown generation mode: ${mode}`);
      }

      // Convert mode names to match unified function expectations
      const modeMap: Record<GenerationMode, string> = {
        'presets': 'presets',
        'custom-prompt': 'custom',
        'emotion-mask': 'emotion_mask',
        'ghibli-reaction': 'ghibli_reaction',
        'neo-glitch': 'neo_glitch',
        'story-time': 'story_time'
      };

      const response = await authenticatedFetch(`${endpoint}?jobId=${jobId}&mode=${modeMap[mode]}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        // Try to get detailed error message from response body
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If we can't parse the error body, use the default message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      return {
        success: result.success,
        jobId: result.jobId,
        runId: result.runId,
        status: result.status,
        imageUrl: result.imageUrl,
        videoUrl: result.videoUrl,
        error: result.error,
        provider: result.provider,
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
