// src/services/emotionMaskService.ts
// Emotion Mask Service - Following NeoGlitch pattern for rock-solid stability
// 
// 🎯 SERVICE STRATEGY:
// 1. Clean, focused service for Emotion Mask only
// 2. Same pattern as NeoGlitchService (which works perfectly)
// 3. Handles generation, status checking, and media management
// 4. Integrates with new emotion_mask_media table

import { authenticatedFetch } from '../utils/apiClient';

export interface EmotionMaskGenerationRequest {
  prompt: string;
  presetKey: string;
  sourceAssetId: string;
  userId: string;
  runId: string;
  meta?: any;
}

export interface EmotionMaskGenerationResult {
  success: boolean;
  jobId?: string;
  runId?: string;
  status: 'completed' | 'processing' | 'failed';
  imageUrl?: string;
  aimlJobId?: string;
  provider?: string;
  error?: string;
}

export interface EmotionMaskStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  aimlJobId?: string;
  createdAt: Date;
  preset: string;
  prompt: string;
}

class EmotionMaskService {
  private static instance: EmotionMaskService;

  private constructor() {}

  static getInstance(): EmotionMaskService {
    if (!EmotionMaskService.instance) {
      EmotionMaskService.instance = new EmotionMaskService();
    }
    return EmotionMaskService.instance;
  }

  /**
   * Start an Emotion Mask generation using AIML API
   * Creates record in emotion_mask_media and starts AIML generation
   */
  async startGeneration(request: EmotionMaskGenerationRequest): Promise<EmotionMaskGenerationResult> {
    try {
      console.log('🎭 [EmotionMask] Starting generation with AIML API:', {
        presetKey: request.presetKey,
        runId: request.runId,
        hasSource: !!request.sourceAssetId
      });

      // Start AIML generation directly
      const aimlRes = await authenticatedFetch('/.netlify/functions/emotion-mask-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: request.prompt,
          presetKey: request.presetKey,
          sourceUrl: request.sourceAssetId, // Use sourceUrl for clarity
          userId: request.userId,
          runId: request.runId,
          generationMeta: request.meta || {}
        })
      });

      if (!aimlRes.ok) {
        const error = await aimlRes.json().catch(() => ({}));
        throw new Error(error.error || `Failed to start AIML generation: ${aimlRes.status}`);
      }

      const aimlResult = await aimlRes.json();
      console.log('🚀 [EmotionMask] AIML generation response:', {
        status: aimlResult.status,
        provider: aimlResult.provider,
        jobId: aimlResult.jobId,
        imageUrl: aimlResult.imageUrl,
        fullResponse: aimlResult
      });

      // Handle immediate completion from backend
      if (aimlResult.status === 'completed' && aimlResult.imageUrl) {
        console.log('🎉 [EmotionMask] Generation completed immediately!');
        return {
          success: true,
          jobId: aimlResult.jobId,
          runId: aimlResult.runId,
          status: 'completed',
          imageUrl: aimlResult.imageUrl,
          aimlJobId: aimlResult.aimlJobId,
          provider: aimlResult.provider
        };
      }

      // Handle processing status
      if (aimlResult.status === 'processing' || aimlResult.status === 'pending') {
        console.log('🔄 [EmotionMask] Generation in progress, will need polling');
        return {
          success: true,
          jobId: aimlResult.jobId,
          runId: aimlResult.runId,
          status: 'processing',
          aimlJobId: aimlResult.aimlJobId,
          provider: aimlResult.provider
        };
      }

      // Handle failed status
      if (aimlResult.status === 'failed') {
        console.error('❌ [EmotionMask] Generation failed:', aimlResult);
        return {
          success: false,
          status: 'failed',
          error: aimlResult.error || 'Generation failed'
        };
      }

      // Unexpected response
      console.warn('⚠️ [EmotionMask] Unexpected response status:', aimlResult.status);
      return {
        success: false,
        status: 'failed',
        error: `Unexpected status: ${aimlResult.status}`
      };

    } catch (error) {
      console.error('❌ [EmotionMask] Start generation failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Poll for generation completion
   * Since AIML returns immediately, this is mainly for status checking
   */
  async pollForCompletion(aimlJobId: string, maxAttempts: number = 10): Promise<EmotionMaskStatus> {
    try {
      console.log('🔍 [EmotionMask] Polling for completion:', aimlJobId);
      
      // For Emotion Mask, AIML usually returns immediately
      // This polling is mainly for status verification
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔍 [EmotionMask] Poll attempt ${attempt}/${maxAttempts}`);
        
        try {
          // Check status by querying the database directly
          const statusRes = await authenticatedFetch('/.netlify/functions/emotion-mask-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aimlJobId })
          });

          if (statusRes.ok) {
            const status = await statusRes.json();
            console.log('✅ [EmotionMask] Status check successful:', status);
            
            if (status.status === 'completed' && status.imageUrl) {
              return {
                id: status.id,
                status: 'completed',
                imageUrl: status.imageUrl,
                aimlJobId: status.aimlJobId,
                createdAt: new Date(status.createdAt),
                preset: status.preset,
                prompt: status.prompt
              };
            }
            
            if (status.status === 'failed') {
              throw new Error('Generation failed');
            }
          }
        } catch (pollError) {
          console.warn(`⚠️ [EmotionMask] Poll attempt ${attempt} failed:`, pollError);
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      throw new Error('Polling completed unexpectedly');
    } catch (error) {
      console.error('❌ [EmotionMask] Polling failed:', error);
      throw error;
    }
  }

  /**
   * Get Emotion Mask media for a user
   */
  async getUserEmotionMaskMedia(userId: string, limit: number = 50): Promise<EmotionMaskStatus[]> {
    try {
      console.log('🔍 [EmotionMask] Getting user media:', userId);
      
      const response = await authenticatedFetch('/.netlify/functions/getUserMedia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, limit, type: 'emotion-mask' })
      });

      if (!response.ok) {
        throw new Error(`Failed to get user media: ${response.status}`);
      }

      const result = await response.json();
      return result.items || [];
    } catch (error) {
      console.error('❌ [EmotionMask] Get user media failed:', error);
      throw error;
    }
  }

  /**
   * Delete Emotion Mask media
   */
  async deleteMedia(mediaId: string, userId: string): Promise<boolean> {
    try {
      console.log('🗑️ [EmotionMask] Deleting media:', mediaId);
      
      const response = await authenticatedFetch('/.netlify/functions/delete-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, userId })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete media: ${response.status}`);
      }

      const result = await response.json();
      return result.success || false;
    } catch (error) {
      console.error('❌ [EmotionMask] Delete media failed:', error);
      throw error;
    }
  }

  /**
   * Get available Emotion Mask presets
   */
  getAvailablePresets(): string[] {
    return ['happy', 'sad', 'angry', 'surprised', 'disgusted', 'fearful', 'neutral'];
  }

  /**
   * Validate preset key
   */
  isValidPreset(presetKey: string): boolean {
    return this.getAvailablePresets().includes(presetKey);
  }
}

export default EmotionMaskService;
