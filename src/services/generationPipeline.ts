// src/services/generationPipeline.ts
// Dedicated Generation Pipeline - Direct routing to specialized services
// 
// 🎯 PIPELINE STRATEGY:
// 1. Direct routing to dedicated generation functions
// 2. Each generation type has its own optimized service
// 3. No more feature flags or fallbacks - clean, direct architecture
// 4. Scalable and maintainable design

import { authenticatedFetch } from '../utils/apiClient';
import EmotionMaskService from './emotionMaskService';
import PresetsService from './presetsService';
import GhibliReactionService from './ghibliReactionService';
import CustomPromptService from './customPromptService';

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

export interface GenerationType {
  type: 'emotion-mask' | 'presets' | 'ghibli-reaction' | 'custom-prompt' | 'neo-glitch';
}

class GenerationPipeline {
  private static instance: GenerationPipeline;
  private emotionMaskService: EmotionMaskService;
  private presetsService: PresetsService;
  private ghibliReactionService: GhibliReactionService;
  private customPromptService: CustomPromptService;

  private constructor() {
    // Initialize service instances for dedicated functions
    this.emotionMaskService = EmotionMaskService.getInstance();
    this.presetsService = PresetsService.getInstance();
    this.ghibliReactionService = GhibliReactionService.getInstance();
    this.customPromptService = CustomPromptService.getInstance();

    console.log('🚀 [GenerationPipeline] Initialized with dedicated services');
  }

  static getInstance(): GenerationPipeline {
    if (!GenerationPipeline.instance) {
      GenerationPipeline.instance = new GenerationPipeline();
    }
    return GenerationPipeline.instance;
  }

  /**
   * Determine if a user should use the new system
   * This enables gradual rollout and A/B testing
   */
  private shouldUseNewSystem(type: string): boolean {
    // Check environment variables for feature flags (browser-compatible)
    try {
      const envFlag = import.meta.env[`VITE_${type.toUpperCase().replace('-', '_')}_NEW_SYSTEM`];
      if (envFlag) {
        return envFlag === 'true';
      }
    } catch (error) {
      console.log('🔄 [GenerationPipeline] Environment check failed, using fallback logic');
    }

    // Check user ID for beta testing (last 2 digits determine system)
    // This enables 50/50 split for testing
    const userId = this.getCurrentUserId();
    if (userId) {
      const lastTwoDigits = parseInt(userId.slice(-2));
      return lastTwoDigits >= 50; // 50% of users get new system
    }

    // Default to old system for safety
    return false;
  }

  /**
   * Get current user ID from auth context
   */
  private getCurrentUserId(): string | null {
    // This should be implemented based on your auth system
    // For now, return null to use environment-based flags
    return null;
  }



  /**
   * Main generation method - routes to appropriate system
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    try {
      console.log('🚀 [GenerationPipeline] Starting generation:', {
        type: request.type,
        presetKey: request.presetKey,
        runId: request.runId,
        userId: request.userId
      });

      // Route to appropriate system based on type and feature flags
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
        system: 'new', // All systems now use new architecture
        type: request.type
      };
    }
  }

  /**
   * Handle Emotion Mask generation
   */
  private async handleEmotionMaskGeneration(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🆕 [GenerationPipeline] Using NEW Emotion Mask system');
    try {
      const result = await this.emotionMaskService.startGeneration({
        prompt: request.prompt,
        presetKey: request.presetKey,
        sourceAssetId: request.sourceAssetId,
        userId: request.userId,
        runId: request.runId,
        meta: request.meta
      });

      return {
        ...result,
        system: 'new',
        type: 'emotion-mask'
      };
    } catch (error) {
      console.error('❌ [GenerationPipeline] Emotion Mask generation failed:', error);
      throw error; // No fallback - let error bubble up
    }
  }

  /**
   * Handle Professional Presets generation
   */
  private async handlePresetsGeneration(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🆕 [GenerationPipeline] Using NEW Presets system');
    try {
      const result = await this.presetsService.startGeneration({
        prompt: request.prompt,
        presetKey: request.presetKey,
        sourceAssetId: request.sourceAssetId,
        userId: request.userId,
        runId: request.runId,
        meta: request.meta
      });

      return {
        ...result,
        system: 'new',
        type: 'presets'
      };
    } catch (error) {
      console.error('❌ [GenerationPipeline] Presets generation failed:', error);
      throw error; // No fallback - let error bubble up
    }
  }

  /**
   * Handle Ghibli Reaction generation
   */
  private async handleGhibliReactionGeneration(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🆕 [GenerationPipeline] Using NEW Ghibli Reaction system');
    try {
      const result = await this.ghibliReactionService.startGeneration({
        prompt: request.prompt,
        presetKey: request.presetKey,
        sourceAssetId: request.sourceAssetId,
        userId: request.userId,
        runId: request.runId,
        meta: request.meta
      });

      return {
        ...result,
        system: 'new',
        type: 'ghibli-reaction'
      };
    } catch (error) {
      console.error('❌ [GenerationPipeline] Ghibli Reaction generation failed:', error);
      throw error; // No fallback - let error bubble up
    }
  }

  /**
   * Handle Custom Prompt generation
   */
  private async handleCustomPromptGeneration(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🆕 [GenerationPipeline] Using NEW Custom Prompt system');
    try {
      const result = await this.customPromptService.startGeneration({
        prompt: request.prompt,
        presetKey: request.presetKey,
        sourceAssetId: request.sourceAssetId,
        userId: request.userId,
        runId: request.runId,
        meta: request.meta
      });

      return {
        ...result,
        system: 'new',
        type: 'custom-prompt'
      };
    } catch (error) {
      console.error('❌ [GenerationPipeline] Custom Prompt generation failed:', error);
      throw error; // No fallback - let error bubble up
    }
  }

  /**
   * Handle NeoGlitch generation (always uses new system)
   */
  private async handleNeoGlitchGeneration(request: GenerationRequest): Promise<GenerationResult> {
    console.log('🆕 [GenerationPipeline] Using NEW NeoGlitch system (always stable)');
    
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
      system: 'dedicated',
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
