// Neo Tokyo Glitch Service
// Handles the complete pipeline from Stability.ai generation to permanent Cloudinary storage
// Eliminates duplicate/desync issues by using a dedicated table and flow

import { authenticatedFetch } from '../utils/authFetch';

export interface NeoGlitchGenerationRequest {
  prompt: string;
  presetKey: string;
  sourceAssetId?: string;
  userId: string;
  runId: string;
  meta?: any;
}

export interface NeoGlitchGenerationResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stabilityJobId?: string;
  cloudinaryUrl?: string;
  runId: string;
  inputHash?: string;
  provider: 'stability' | 'unknown';
}

export interface NeoGlitchStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  cloudinaryUrl?: string;
  error?: string;
  meta?: any;
  mediaId?: string;
  sourceUrl?: string;
  generationMeta?: any;
}

class NeoGlitchService {
  private static instance: NeoGlitchService;

  private constructor() {}

  static getInstance(): NeoGlitchService {
    if (!NeoGlitchService.instance) {
      NeoGlitchService.instance = new NeoGlitchService();
    }
    return NeoGlitchService.instance;
  }

  /**
   * Start a Neo Tokyo Glitch generation using Stability.ai
   * Creates record in neo_glitch_media and starts Stability.ai generation
   */
  async startGeneration(request: NeoGlitchGenerationRequest): Promise<NeoGlitchGenerationResult> {
    try {
      console.log('🎭 [NeoGlitch] Starting generation with Stability.ai:', {
        presetKey: request.presetKey,
        runId: request.runId,
        hasSource: !!request.sourceAssetId
      });

      // Start Stability.ai generation directly
      const stabilityRes = await authenticatedFetch('/.netlify/functions/neo-glitch-generate', {
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

      if (!stabilityRes.ok) {
        const error = await stabilityRes.json().catch(() => ({}));
        throw new Error(error.error || `Failed to start Stability.ai generation: ${stabilityRes.status}`);
      }

      const stabilityResult = await stabilityRes.json();
      console.log('🚀 [NeoGlitch] Stability.ai generation started:', {
        provider: stabilityResult.provider,
        strategy: stabilityResult.strategy,
        stabilityJobId: stabilityResult.stabilityJobId,
        imageUrl: stabilityResult.imageUrl
      });

      // Handle Stability.ai response
      if (stabilityResult.provider === 'stability') {
        if (stabilityResult.imageUrl && stabilityResult.status === 'completed') {
          // Stability.ai returned immediate result
          console.log('✅ [NeoGlitch] Stability.ai generation completed immediately:', stabilityResult.imageUrl);
          return {
            id: stabilityResult.stabilityJobId || `stability_${request.runId}`,
            status: 'completed',
            runId: request.runId,
            cloudinaryUrl: stabilityResult.imageUrl,
            provider: 'stability'
          };
        } else {
          // Stability.ai is processing
          console.log('🔄 [NeoGlitch] Stability.ai generation in progress:', stabilityResult.stabilityJobId);
          return {
            id: stabilityResult.stabilityJobId || `stability_${request.runId}`,
            status: 'pending',
            runId: request.runId,
            provider: 'stability'
          };
        }
      } else {
        // Fallback for unexpected provider
        console.warn('⚠️ [NeoGlitch] Unexpected provider:', stabilityResult.provider);
        return {
          id: stabilityResult.stabilityJobId || `unknown_${request.runId}`,
          status: 'pending',
          runId: request.runId,
          provider: 'unknown'
        };
      }

    } catch (error) {
      console.error('❌ [NeoGlitch] Start generation failed:', error);
      throw error;
    }
  }

  /**
   * Check the status of a Neo Tokyo Glitch generation
   */
  async checkStatus(jobId: string, provider: string = 'stability'): Promise<NeoGlitchStatus> {
    try {
      const endpoint = '/.netlify/functions/neo-glitch-status';
      const body = { stabilityJobId: jobId };

      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to check status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ [NeoGlitch] Status check failed:', error);
      throw error;
    }
  }

  /**
   * Poll for completion of a Neo Tokyo Glitch generation using dedicated architecture
   */
  async pollForCompletion(stabilityJobId: string, maxAttempts: number = 60): Promise<NeoGlitchStatus> {
    console.log('🔄 [NeoGlitch] Polling for completion with dedicated architecture:', stabilityJobId);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const status = await this.checkStatus(stabilityJobId);
        
        console.log(`🔍 [NeoGlitch] Poll attempt ${attempt}/${maxAttempts}:`, status.status);

        if (status.status === 'completed') {
          console.log('✅ [NeoGlitch] Generation completed successfully');
          
          // Use dedicated save function for complete workflow
          if (status.cloudinaryUrl) {
            console.log('🔄 [NeoGlitch] Using dedicated save function...');
            try {
              const saveResult = await this.saveNeoGlitchMedia(stabilityJobId, status);
              if (saveResult.success) {
                console.log('✅ [NeoGlitch] Media saved successfully:', saveResult.cloudinaryUrl);
                return {
                  ...status,
                  cloudinaryUrl: saveResult.cloudinaryUrl,
                  mediaId: saveResult.mediaId
                };
              } else {
                console.warn('⚠️ [NeoGlitch] Media save failed:', saveResult.error);
                return status;
              }
            } catch (saveError) {
              console.error('❌ [NeoGlitch] Media save error:', saveError);
              return status;
            }
          }
          
          return status;
        }

        if (status.status === 'failed') {
          console.error('❌ [NeoGlitch] Generation failed:', status.error);
          throw new Error(status.error || 'Generation failed');
        }

        // Wait before next poll attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ [NeoGlitch] Poll attempt ${attempt} failed:`, error);
        
        if (attempt === maxAttempts) {
          throw new Error(`Generation polling failed after ${maxAttempts} attempts`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error(`Generation did not complete within ${maxAttempts} attempts`);
  }

  /**
   * Save Neo Tokyo Glitch media using dedicated save function
   */
  private async saveNeoGlitchMedia(stabilityJobId: string, status: NeoGlitchStatus): Promise<any> {
    try {
      console.log('💾 [NeoGlitch] Saving media with dedicated function...');
      
      const saveResponse = await authenticatedFetch('/.netlify/functions/save-neo-glitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetKey: 'neotokyoglitch', // Default preset key
          sourceUrl: status.sourceUrl,
          cloudinaryUrl: status.cloudinaryUrl,
          stabilityJobId,
          userId: status.generationMeta?.userId,
          generationMeta: status.generationMeta
        })
      });

      if (!saveResponse.ok) {
        const error = await saveResponse.json().catch(() => ({}));
        throw new Error(error.error || `Failed to save media: ${saveResponse.status}`);
      }

      const saveResult = await saveResponse.json();
      console.log('✅ [NeoGlitch] Media saved successfully:', saveResult);
      return saveResult;
    } catch (error) {
      console.error('❌ [NeoGlitch] Save media failed:', error);
      throw error;
    }
  }

  /**
   * Get Neo Tokyo Glitch media by ID
   */
  async getNeoGlitchMedia(mediaId: string): Promise<any> {
    try {
      const response = await authenticatedFetch(`/.netlify/functions/getNeoGlitchFeed?mediaId=${mediaId}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to get media: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ [NeoGlitch] Get media failed:', error);
      throw error;
    }
  }

  /**
   * Get Neo Tokyo Glitch feed
   */
  async getNeoGlitchFeed(limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      const response = await authenticatedFetch(`/.netlify/functions/getNeoGlitchFeed?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to get feed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ [NeoGlitch] Get feed failed:', error);
      throw error;
    }
  }
}

export default NeoGlitchService;
