// src/services/ghibliReactionService.ts
// Ghibli Reaction Service - Following NeoGlitch pattern for rock-solid stability
// 
// 🎯 SERVICE STRATEGY:
// 1. Clean, focused service for Ghibli Reaction only
// 2. Same pattern as NeoGlitchService (which works perfectly)
// 3. Handles generation, status checking, and media management
// 4. Integrates with new ghibli_reaction_media table

import { authenticatedFetch } from '../utils/apiClient';

export interface GhibliReactionGenerationRequest {
  prompt: string;
  presetKey: string;
  sourceAssetId: string;
  userId: string;
  runId: string;
  meta?: any;
}

export interface GhibliReactionGenerationResult {
  success: boolean;
  jobId?: string;
  runId?: string;
  status: 'completed' | 'processing' | 'failed';
  imageUrl?: string;
  aimlJobId?: string;
  provider?: string;
  error?: string;
}

export interface GhibliReactionStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  aimlJobId?: string;
  createdAt: Date;
  preset: string;
  prompt: string;
}

class GhibliReactionService {
  private static instance: GhibliReactionService;

  private constructor() {}

  static getInstance(): GhibliReactionService {
    if (!GhibliReactionService.instance) {
      GhibliReactionService.instance = new GhibliReactionService();
    }
    return GhibliReactionService.instance;
  }

  /**
   * Start a Ghibli Reaction generation using fal.ai
   * Creates record in ghibli_reaction_media and starts fal.ai generation
   */
  async startGeneration(request: GhibliReactionGenerationRequest): Promise<GhibliReactionGenerationResult> {
    try {
      console.log('🎭 [GhibliReaction] Starting generation with fal.ai:', {
        presetKey: request.presetKey,
        runId: request.runId,
        hasSource: !!request.sourceAssetId
      });

      // Start fal.ai generation via backend function
      const falRes = await authenticatedFetch('/.netlify/functions/ghibli-reaction-generate', {
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

      if (!falRes.ok) {
        const error = await falRes.json().catch(() => ({}));
        throw new Error(error.error || `Failed to start fal.ai generation: ${falRes.status}`);
      }

      const falResult = await falRes.json();
      console.log('🚀 [GhibliReaction] fal.ai generation response:', {
        status: falResult.status,
        provider: falResult.provider,
        jobId: falResult.jobId,
        imageUrl: falResult.imageUrl,
        fullResponse: falResult
      });

      // Handle immediate completion from backend
      if (falResult.status === 'completed' && falResult.imageUrl) {
        console.log('🎉 [GhibliReaction] Generation completed immediately!');
        return {
          success: true,
          jobId: falResult.jobId,
          runId: falResult.runId,
          status: 'completed',
          imageUrl: falResult.imageUrl,
          provider: falResult.provider
        };
      }

      // Handle processing status
      if (falResult.status === 'processing' || falResult.status === 'pending') {
        console.log('🔄 [GhibliReaction] Generation in progress, will need polling');
        return {
          success: true,
          jobId: falResult.jobId,
          runId: falResult.runId,
          status: 'processing',
          provider: falResult.provider
        };
      }

      // Handle failed status
      if (falResult.status === 'failed') {
        console.error('❌ [GhibliReaction] Generation failed:', falResult);
        return {
          success: false,
          status: 'failed',
          error: falResult.error || 'Generation failed'
        };
      }

      // Unexpected response
      console.warn('⚠️ [GhibliReaction] Unexpected response status:', falResult.status);
      return {
        success: false,
        status: 'failed',
        error: `Unexpected status: ${falResult.status}`
      };

    } catch (error) {
      console.error('❌ [GhibliReaction] Start generation failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Poll for generation completion
   * Since fal.ai returns immediately, this is mainly for status verification
   */
  async pollForCompletion(jobId: string, maxAttempts: number = 10): Promise<GhibliReactionStatus> {
    try {
      console.log('🔍 [GhibliReaction] Polling for completion:', jobId);
      
      // For Ghibli Reaction, fal.ai usually returns immediately
      // This polling is mainly for status verification
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔍 [GhibliReaction] Poll attempt ${attempt}/${maxAttempts}`);
        
        try {
          // Check status by querying the database directly via a status endpoint
          const statusRes = await authenticatedFetch(`/.netlify/functions/ghibli-reaction-generate?jobId=${jobId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });

          if (statusRes.ok) {
            const status = await statusRes.json();
            console.log('✅ [GhibliReaction] Status check successful:', status);
            
            if (status.status === 'completed' && status.imageUrl) {
              return {
                id: status.id,
                status: 'completed',
                imageUrl: status.imageUrl,
                aimlJobId: status.fal_job_id,
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
          console.warn(`⚠️ [GhibliReaction] Poll attempt ${attempt} failed:`, pollError);
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      throw new Error('Polling completed unexpectedly');
    } catch (error) {
      console.error('❌ [GhibliReaction] Polling failed:', error);
      throw error;
    }
  }

  /**
   * Get Ghibli Reaction media for a user
   */
  async getUserGhibliReactionMedia(userId: string, limit: number = 50): Promise<GhibliReactionStatus[]> {
    try {
      console.log('🔍 [GhibliReaction] Getting user media:', userId);
      
      const response = await authenticatedFetch('/.netlify/functions/getUserMedia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, limit, type: 'ghibli-reaction' })
      });

      if (!response.ok) {
        throw new Error(`Failed to get user media: ${response.status}`);
      }

      const result = await response.json();
      return result.items || [];
    } catch (error) {
      console.error('❌ [GhibliReaction] Get user media failed:', error);
      throw error;
    }
  }

  /**
   * Delete Ghibli Reaction media
   */
  async deleteMedia(mediaId: string, userId: string): Promise<boolean> {
    try {
      console.log('🗑️ [GhibliReaction] Deleting media:', mediaId);
      
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
      console.error('❌ [GhibliReaction] Delete media failed:', error);
      throw error;
    }
  }

  /**
   * Get available Ghibli Reaction presets
   */
  getAvailablePresets(): string[] {
    return ['ghibli_reaction'];
  }

  /**
   * Validate preset key
   */
  isValidPreset(presetKey: string): boolean {
    return this.getAvailablePresets().includes(presetKey);
  }
}

export default GhibliReactionService;
