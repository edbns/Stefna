// src/services/customPromptService.ts
// Custom Prompt Service - Following NeoGlitch pattern for rock-solid stability
// 
// 🎯 SERVICE STRATEGY:
// 1. Clean, focused service for Custom Prompt only
// 2. Same pattern as NeoGlitchService (which works perfectly)
// 3. Handles generation, status checking, and media management
// 4. Integrates with new custom_prompt_media table

import { authenticatedFetch } from '../utils/apiClient';

export interface CustomPromptGenerationRequest {
  prompt: string;
  presetKey: string;
  sourceAssetId: string;
  userId: string;
  runId: string;
  meta?: any;
}

export interface CustomPromptGenerationResult {
  success: boolean;
  jobId?: string;
  runId?: string;
  status: 'completed' | 'processing' | 'failed';
  imageUrl?: string;
  aimlJobId?: string;
  provider?: string;
  error?: string;
  customPrompt?: string;
}

export interface CustomPromptStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  aimlJobId?: string;
  createdAt: Date;
  preset: string;
  prompt: string;
}

class CustomPromptService {
  private static instance: CustomPromptService;

  private constructor() {}

  static getInstance(): CustomPromptService {
    if (!CustomPromptService.instance) {
      CustomPromptService.instance = new CustomPromptService();
    }
    return CustomPromptService.instance;
  }

  /**
   * Start a Custom Prompt generation using AIML API
   * Creates record in custom_prompt_media and starts AIML generation
   */
  async startGeneration(request: CustomPromptGenerationRequest): Promise<CustomPromptGenerationResult> {
    try {
      console.log('🎭 [CustomPrompt] Starting generation with AIML API:', {
        presetKey: request.presetKey,
        runId: request.runId,
        hasSource: !!request.sourceAssetId,
        customPrompt: request.prompt.substring(0, 100) + '...'
      });

      // Start AIML generation directly
      const aimlRes = await authenticatedFetch('/.netlify/functions/custom-prompt-generate', {
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
      console.log('🚀 [CustomPrompt] AIML generation response:', {
        status: aimlResult.status,
        provider: aimlResult.provider,
        jobId: aimlResult.jobId,
        imageUrl: aimlResult.imageUrl,
        customPrompt: aimlResult.customPrompt,
        fullResponse: aimlResult
      });

      // Handle immediate completion from backend
      if (aimlResult.status === 'completed' && aimlResult.imageUrl) {
        console.log('🎉 [CustomPrompt] Generation completed immediately!');
        return {
          success: true,
          jobId: aimlResult.jobId,
          runId: aimlResult.runId,
          status: 'completed',
          imageUrl: aimlResult.imageUrl,
          aimlJobId: aimlResult.aimlJobId,
          provider: aimlResult.provider,
          customPrompt: aimlResult.customPrompt
        };
      }

      // Handle processing status
      if (aimlResult.status === 'processing' || aimlResult.status === 'pending') {
        console.log('🔄 [CustomPrompt] Generation in progress, will need polling');
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
        console.error('❌ [CustomPrompt] Generation failed:', aimlResult);
        return {
          success: false,
          status: 'failed',
          error: aimlResult.error || 'Generation failed'
        };
      }

      // Unexpected response
      console.warn('⚠️ [CustomPrompt] Unexpected response status:', aimlResult.status);
      return {
        success: false,
        status: 'failed',
        error: `Unexpected status: ${aimlResult.status}`
      };

    } catch (error) {
      console.error('❌ [CustomPrompt] Start generation failed:', error);
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
  async pollForCompletion(aimlJobId: string, maxAttempts: number = 10): Promise<CustomPromptStatus> {
    try {
      console.log('🔍 [CustomPrompt] Polling for completion:', aimlJobId);
      
      // For Custom Prompt, AIML usually returns immediately
      // This polling is mainly for status verification
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔍 [CustomPrompt] Poll attempt ${attempt}/${maxAttempts}`);
        
        try {
          // Check status by querying the database directly
          const statusRes = await authenticatedFetch('/.netlify/functions/custom-prompt-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aimlJobId })
          });

          if (statusRes.ok) {
            const status = await statusRes.json();
            console.log('✅ [CustomPrompt] Status check successful:', status);
            
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
          console.warn(`⚠️ [CustomPrompt] Poll attempt ${attempt} failed:`, pollError);
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      throw new Error('Polling completed unexpectedly');
    } catch (error) {
      console.error('❌ [CustomPrompt] Polling failed:', error);
      throw error;
    }
  }

  /**
   * Get Custom Prompt media for a user
   */
  async getUserCustomPromptMedia(userId: string, limit: number = 50): Promise<CustomPromptStatus[]> {
    try {
      console.log('🔍 [CustomPrompt] Getting user media:', userId);
      
      const response = await authenticatedFetch('/.netlify/functions/getUserMedia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, limit, type: 'custom-prompt' })
      });

      if (!response.ok) {
        throw new Error(`Failed to get user media: ${response.status}`);
      }

      const result = await response.json();
      return result.items || [];
    } catch (error) {
      console.error('❌ [CustomPrompt] Get user media failed:', error);
      throw error;
    }
  }

  /**
   * Delete Custom Prompt media
   */
  async deleteMedia(mediaId: string, userId: string): Promise<boolean> {
    try {
      console.log('🗑️ [CustomPrompt] Deleting media:', mediaId);
      
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
      console.error('❌ [CustomPrompt] Delete media failed:', error);
      throw error;
    }
  }

  /**
   * Get available Custom Prompt presets
   */
  getAvailablePresets(): string[] {
    return ['custom'];
  }

  /**
   * Validate preset key
   */
  isValidPreset(presetKey: string): boolean {
    return this.getAvailablePresets().includes(presetKey);
  }

  /**
   * Validate custom prompt
   */
  validateCustomPrompt(prompt: string): { isValid: boolean; error?: string } {
    if (!prompt || prompt.trim().length < 10) {
      return {
        isValid: false,
        error: 'Custom prompt must be at least 10 characters long'
      };
    }

    if (prompt.length > 1000) {
      return {
        isValid: false,
        error: 'Custom prompt must be less than 1000 characters'
      };
    }

    // Check for inappropriate content (basic validation)
    const inappropriateWords = ['hate', 'violence', 'explicit', 'nsfw'];
    const lowerPrompt = prompt.toLowerCase();
    
    for (const word of inappropriateWords) {
      if (lowerPrompt.includes(word)) {
        return {
          isValid: false,
          error: 'Custom prompt contains inappropriate content'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Get prompt suggestions for users
   */
  getPromptSuggestions(): string[] {
    return [
      'Transform this image with a cyberpunk aesthetic, neon lights, and futuristic cityscape',
      'Give this image a vintage film noir style with dramatic shadows and high contrast',
      'Apply a watercolor painting effect with soft, flowing colors and artistic brushstrokes',
      'Transform this into a comic book style with bold outlines and vibrant colors',
      'Apply a dreamy, ethereal atmosphere with soft lighting and mystical elements',
      'Give this image a retro 80s aesthetic with vibrant colors and nostalgic vibes',
      'Transform this with a minimalist design, clean lines, and simple composition',
      'Apply a fantasy art style with magical elements and enchanting atmosphere'
    ];
  }
}

export default CustomPromptService;
