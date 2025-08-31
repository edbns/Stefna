// src/services/generationPipeline.ts
// Dedicated Generation Pipeline - Direct routing to specialized services
// 
// 🎯 PIPELINE STRATEGY:
// 1. Direct routing to dedicated generation functions
// 2. Each generation type has its own optimized service
// 3. No more feature flags or fallbacks - clean, direct architecture
// 4. Scalable and maintainable design

import { authenticatedFetch } from '../utils/apiClient';
import { IdentityPreservationService } from './identityPreservationService';

// Import all services for the unified pipeline
import EmotionMaskService from './emotionMaskService';
import GhibliReactionService from './ghibliReactionService';
import CustomPromptService from './customPromptService';
import PresetsService from './presetsService';

export interface GenerationRequest {
  type: 'emotion-mask' | 'presets' | 'ghibli-reaction' | 'custom-prompt' | 'neo-glitch';
  prompt: string;
  presetKey: string;
  sourceAssetId: string;
  userId: string;
  runId: string;
  meta?: any;
}

export interface GenerationResult {
  success: boolean;
  jobId?: string;
  runId?: string;
  status: 'completed' | 'processing' | 'failed';
  imageUrl?: string;
  aimlJobId?: string;
  provider?: string;
  error?: string;
  system: 'new' | 'old';
  type: string;
}

class GenerationPipeline {
  private static instance: GenerationPipeline;
  
  // Initialize all services
  private emotionMaskService = EmotionMaskService.getInstance();
  private ghibliReactionService = GhibliReactionService.getInstance();
  private customPromptService = CustomPromptService.getInstance();
  private presetsService = PresetsService.getInstance();

  private constructor() {}

  static getInstance(): GenerationPipeline {
    if (!GenerationPipeline.instance) {
      GenerationPipeline.instance = new GenerationPipeline();
    }
    return GenerationPipeline.instance;
  }

  /**
   * Unified generation entry point for ALL generation types
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🆕 [GenerationPipeline] Unified generation for:', request.type);
    
    try {
      // Route to appropriate handler based on type
      switch (request.type) {
        case 'emotion-mask':
          return await this.handleEmotionMaskGeneration(request);
        case 'presets':
          return await this.handlePresetsGeneration(request);
        case 'ghibli-reaction':
          return await this.handleGhibliReactionGeneration(request);
        case 'custom-prompt':
          return await this.handleCustomPromptGeneration(request);
        case 'neo-glitch':
          return await this.handleNeoGlitchGeneration(request);
        default:
          throw new Error(`Unknown generation type: ${request.type}`);
      }
    } catch (error) {
      console.error('❌ [GenerationPipeline] Generation failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        system: 'new',
        type: request.type
      };
    }
  }

  /**
   * Handle Emotion Mask generation (unified)
   */
  private async handleEmotionMaskGeneration(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🆕 [GenerationPipeline] Using UNIFIED Emotion Mask system');
    try {
      const result = await this.emotionMaskService.startGeneration({
        prompt: request.prompt,
        presetKey: request.presetKey,
        sourceAssetId: request.sourceAssetId,
        userId: request.userId,
        runId: request.runId,
        meta: request.meta
      });

      // 🔒 Apply IPA check for Emotion Mask
      if (result.success && result.imageUrl && request.sourceAssetId) {
        try {
          console.log('🔒 [IPA] Running Emotion Mask identity preservation check...');
          
          const ipaResult = await IdentityPreservationService.runIPA(
            request.sourceAssetId,
            result.imageUrl,
            {
              ipaThreshold: 0.7, // Strict threshold for Emotion Mask
              ipaRetries: 3,
              ipaBlocking: true,
              generation_type: 'emotion_mask_strict_ipa'
            }
          );
          
          console.log('🔒 [IPA] Emotion Mask result:', {
            similarity: (ipaResult.similarity * 100).toFixed(1) + '%',
            passed: ipaResult.passed,
            strategy: ipaResult.strategy
          });

          if (ipaResult.passed) {
            console.log('✅ [IPA] Emotion Mask identity preservation passed');
            return {
              ...result,
              system: 'new',
              type: 'emotion-mask',
              imageUrl: ipaResult.finalUrl // Use IPA-verified URL
            };
          } else {
            console.log('❌ [IPA] Emotion Mask identity preservation failed');
            throw new Error(`IPA failed: ${(ipaResult.similarity * 100).toFixed(1)}% similarity < 70% threshold`);
          }
        } catch (ipaError) {
          console.error('❌ [IPA] Emotion Mask IPA check failed:', ipaError);
          throw new Error('Identity preservation check failed');
        }
      }

      return {
        ...result,
        system: 'new',
        type: 'emotion-mask'
      };
    } catch (error) {
      console.error('❌ [GenerationPipeline] Emotion Mask generation failed:', error);
      throw error;
    }
  }

  /**
   * Handle Professional Presets generation (unified)
   */
  private async handlePresetsGeneration(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🆕 [GenerationPipeline] Using UNIFIED Presets system');
    try {
      const result = await this.presetsService.startGeneration({
        prompt: request.prompt,
        presetKey: request.presetKey,
        sourceAssetId: request.sourceAssetId,
        userId: request.userId,
        runId: request.runId,
        meta: request.meta
      });

      // 🔒 Apply IPA check for Professional Presets
      if (result.success && result.imageUrl && request.sourceAssetId) {
        try {
          console.log('🔒 [IPA] Running Professional Presets identity preservation check...');
          
          const ipaResult = await IdentityPreservationService.runIPA(
            request.sourceAssetId,
            result.imageUrl,
            {
              ipaThreshold: 0.65, // Balanced threshold for Presets
              ipaRetries: 2,
              ipaBlocking: true,
              generation_type: 'preset_moderate_ipa'
            }
          );
          
          console.log('🔒 [IPA] Professional Presets result:', {
            similarity: (ipaResult.similarity * 100).toFixed(1) + '%',
            passed: ipaResult.passed,
            strategy: ipaResult.strategy
          });

          if (ipaResult.passed) {
            console.log('✅ [IPA] Professional Presets identity preservation passed');
            return {
              ...result,
              system: 'new',
              type: 'presets',
              imageUrl: ipaResult.finalUrl // Use IPA-verified URL
            };
          } else {
            console.log('❌ [IPA] Professional Presets identity preservation failed');
            throw new Error(`IPA failed: ${(ipaResult.similarity * 100).toFixed(1)}% similarity < 65% threshold`);
          }
        } catch (ipaError) {
          console.error('❌ [IPA] Professional Presets IPA check failed:', ipaError);
          throw new Error('Identity preservation check failed');
        }
      }

      return {
        ...result,
        system: 'new',
        type: 'presets'
      };
    } catch (error) {
      console.error('❌ [GenerationPipeline] Presets generation failed:', error);
      throw error;
    }
  }

  /**
   * Handle Ghibli Reaction generation (unified)
   */
  private async handleGhibliReactionGeneration(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🆕 [GenerationPipeline] Using UNIFIED Ghibli Reaction system');
    try {
      const result = await this.ghibliReactionService.startGeneration({
        prompt: request.prompt,
        presetKey: request.presetKey,
        sourceAssetId: request.sourceAssetId,
        userId: request.userId,
        runId: request.runId,
        meta: request.meta
      });

      // 🔒 Apply IPA check for Ghibli Reaction
      if (result.success && result.imageUrl && request.sourceAssetId) {
        try {
          console.log('🔒 [IPA] Running Ghibli Reaction identity preservation check...');
          
          const ipaResult = await IdentityPreservationService.runIPA(
            request.sourceAssetId,
            result.imageUrl,
            {
              ipaThreshold: 0.6, // Moderate threshold for Ghibli Reaction
              ipaRetries: 2,
              ipaBlocking: true,
              generation_type: 'ghibli_reaction_moderate_ipa'
            }
          );
          
          console.log('🔒 [IPA] Ghibli Reaction result:', {
            similarity: (ipaResult.similarity * 100).toFixed(1) + '%',
            passed: ipaResult.passed,
            strategy: ipaResult.strategy
          });

          if (ipaResult.passed) {
            console.log('✅ [IPA] Ghibli Reaction identity preservation passed');
            return {
              ...result,
              system: 'new',
              type: 'ghibli-reaction',
              imageUrl: ipaResult.finalUrl // Use IPA-verified URL
            };
          } else {
            console.log('❌ [IPA] Ghibli Reaction identity preservation failed');
            throw new Error(`IPA failed: ${(ipaResult.similarity * 100).toFixed(1)}% similarity < 60% threshold`);
          }
        } catch (ipaError) {
          console.error('❌ [IPA] Ghibli Reaction IPA check failed:', ipaError);
          throw new Error('Identity preservation check failed');
        }
      }

      return {
        ...result,
        system: 'new',
        type: 'ghibli-reaction'
      };
    } catch (error) {
      console.error('❌ [GenerationPipeline] Ghibli Reaction generation failed:', error);
      throw error;
    }
  }

  /**
   * Handle Custom Prompt generation (unified)
   */
  private async handleCustomPromptGeneration(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🆕 [GenerationPipeline] Using UNIFIED Custom Prompt system');
    try {
      const result = await this.customPromptService.startGeneration({
        prompt: request.prompt,
        presetKey: request.presetKey,
        sourceAssetId: request.sourceAssetId,
        userId: request.userId,
        runId: request.runId,
        meta: request.meta
      });

      // 🔒 Apply IPA check for Custom Prompt
      if (result.success && result.imageUrl && request.sourceAssetId) {
        try {
          console.log('🔒 [IPA] Running Custom Prompt identity preservation check...');
          
          const ipaResult = await IdentityPreservationService.runIPA(
            request.sourceAssetId,
            result.imageUrl,
            {
              ipaThreshold: 0.65, // Balanced threshold for Custom Prompt
              ipaRetries: 2,
              ipaBlocking: true,
              generation_type: 'custom_balanced_ipa'
            }
          );
          
          console.log('🔒 [IPA] Custom Prompt result:', {
            similarity: (ipaResult.similarity * 100).toFixed(1) + '%',
            passed: ipaResult.passed,
            strategy: ipaResult.strategy
          });

          if (ipaResult.passed) {
            console.log('✅ [IPA] Custom Prompt identity preservation passed');
            return {
              ...result,
              system: 'new',
              type: 'custom-prompt',
              imageUrl: ipaResult.finalUrl // Use IPA-verified URL
            };
          } else {
            console.log('❌ [IPA] Custom Prompt identity preservation failed');
            throw new Error(`IPA failed: ${(ipaResult.similarity * 100).toFixed(1)}% similarity < 65% threshold`);
          }
        } catch (ipaError) {
          console.error('❌ [IPA] Custom Prompt IPA check failed:', ipaError);
          throw new Error('Identity preservation check failed');
        }
      }

      return {
        ...result,
        system: 'new',
        type: 'custom-prompt'
      };
    } catch (error) {
      console.error('❌ [GenerationPipeline] Custom Prompt generation failed:', error);
      throw error;
    }
  }

  /**
   * Handle NeoGlitch generation (unified)
   */
  private async handleNeoGlitchGeneration(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🆕 [GenerationPipeline] Using UNIFIED NeoGlitch system');
    
    try {
      const response = await authenticatedFetch('/.netlify/functions/neo-glitch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: request.prompt,
          presetKey: request.presetKey,
          sourceUrl: request.sourceAssetId,
          userId: request.userId,
          runId: request.runId,
          generationMeta: request.meta
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `NeoGlitch generation failed: ${response.status}`);
      }

      const result = await response.json();
      
      // 🔒 Apply IPA check for Neo Tokyo Glitch (relaxed threshold)
      if (result.success && result.imageUrl && request.sourceAssetId) {
        try {
          console.log('🔒 [IPA] Running Neo Tokyo Glitch identity preservation check...');
          
          const ipaResult = await IdentityPreservationService.runIPA(
            request.sourceAssetId,
            result.imageUrl,
            {
              ipaThreshold: 0.4, // Relaxed threshold for Neo Tokyo Glitch (creative freedom)
              ipaRetries: 1,
              ipaBlocking: false, // Non-blocking for creative freedom
              generation_type: 'neo_tokyo_relaxed_ipa'
            }
          );
          
          console.log('🔒 [IPA] Neo Tokyo Glitch result:', {
            similarity: (ipaResult.similarity * 100).toFixed(1) + '%',
            passed: ipaResult.passed,
            strategy: ipaResult.strategy
          });

          if (ipaResult.passed) {
            console.log('✅ [IPA] Neo Tokyo Glitch identity preservation passed');
            return {
              success: true,
              jobId: result.jobId,
              runId: result.runId,
              status: result.status,
              imageUrl: ipaResult.finalUrl, // Use IPA-verified URL
              aimlJobId: result.aimlJobId,
              provider: result.provider,
              system: 'new',
              type: 'neo-glitch'
            };
          } else {
            console.log('⚠️ [IPA] Neo Tokyo Glitch identity preservation failed but non-blocking');
            return {
              success: true,
              jobId: result.jobId,
              runId: result.runId,
              status: result.status,
              imageUrl: ipaResult.finalUrl, // Use best available result
              aimlJobId: result.aimlJobId,
              provider: result.provider,
              system: 'new',
              type: 'neo-glitch'
            };
          }
        } catch (ipaError) {
          console.error('❌ [IPA] Neo Tokyo Glitch IPA check failed:', ipaError);
          // Continue with original result for Neo Tokyo Glitch (creative freedom)
          return {
            success: true,
            jobId: result.jobId,
            runId: result.runId,
            status: result.status,
            imageUrl: result.imageUrl,
            aimlJobId: result.aimlJobId,
            provider: result.provider,
            system: 'new',
            type: 'neo-glitch'
          };
        }
      }
      
      return {
        success: true,
        jobId: result.jobId,
        runId: result.runId,
        status: result.status,
        imageUrl: result.imageUrl,
        aimlJobId: result.aimlJobId,
        provider: result.provider,
        system: 'new',
        type: 'neo-glitch'
      };

    } catch (error) {
      console.error('❌ [GenerationPipeline] NeoGlitch generation failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'NeoGlitch generation failed',
        system: 'new',
        type: 'neo-glitch'
      };
    }
  }

  /**
   * Get system status for monitoring
   */
  getSystemStatus(): {
    system: string;
    status: string;
  } {
    return {
      system: 'unified',
      status: 'active'
    };
  }
}

export default GenerationPipeline;

// Export the missing functions that other files are trying to import
export async function runGeneration(request: GenerationRequest): Promise<GenerationResult> {
  const pipeline = GenerationPipeline.getInstance();
  return pipeline.generate(request);
}

export function setupNavigationCleanup(): void {
  // Cleanup function for navigation - can be implemented as needed
  console.log('🧹 [GenerationPipeline] Navigation cleanup setup');
}
