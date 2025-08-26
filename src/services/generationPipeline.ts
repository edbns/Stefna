// src/services/generationPipeline.ts
// Unified Generation Pipeline - Routes between old and new systems
// 
// 🎯 PIPELINE STRATEGY:
// 1. Feature flag system for gradual user migration
// 2. Routes to new NeoGlitch-style functions when enabled
// 3. Falls back to old system for backward compatibility
// 4. Enables zero-risk migration with A/B testing
// 
// ⚠️ IMPORTANT: This makes the migration seamless and risk-free

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

export interface FeatureFlags {
  emotionMaskNewSystem: boolean;
  presetsNewSystem: boolean;
  ghibliReactionNewSystem: boolean;
  customPromptNewSystem: boolean;
  neoGlitchNewSystem: boolean; // Already working
}

class GenerationPipeline {
  private static instance: GenerationPipeline;
  private featureFlags: FeatureFlags;
  private emotionMaskService: EmotionMaskService;
  private presetsService: PresetsService;
  private ghibliReactionService: GhibliReactionService;
  private customPromptService: CustomPromptService;

  private constructor() {
    // Initialize feature flags (can be loaded from environment or API)
    this.featureFlags = {
      emotionMaskNewSystem: this.shouldUseNewSystem('emotion-mask'),
      presetsNewSystem: this.shouldUseNewSystem('presets'),
      ghibliReactionNewSystem: this.shouldUseNewSystem('ghibli-reaction'),
      customPromptNewSystem: this.shouldUseNewSystem('custom-prompt'),
      neoGlitchNewSystem: true // Always use new system (already working)
    };

    // Initialize service instances
    this.emotionMaskService = EmotionMaskService.getInstance();
    this.presetsService = PresetsService.getInstance();
    this.ghibliReactionService = GhibliReactionService.getInstance();
    this.customPromptService = CustomPromptService.getInstance();

    console.log('🚀 [GenerationPipeline] Initialized with feature flags:', this.featureFlags);
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
   * Update feature flags dynamically
   */
  updateFeatureFlags(flags: Partial<FeatureFlags>): void {
    this.featureFlags = { ...this.featureFlags, ...flags };
    console.log('🔄 [GenerationPipeline] Feature flags updated:', this.featureFlags);
  }

  /**
   * Get current feature flags
   */
  getFeatureFlags(): FeatureFlags {
    return { ...this.featureFlags };
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
        system: 'old',
        type: request.type
      };
    }
  }

  /**
   * Handle Emotion Mask generation
   */
  private async handleEmotionMaskGeneration(request: GenerationRequest): Promise<GenerationResult> {
    if (this.featureFlags.emotionMaskNewSystem) {
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
        console.warn('⚠️ [GenerationPipeline] New system failed, falling back to old:', error);
        // Fall through to old system
      }
    }

    // Use old system
    console.log('🔄 [GenerationPipeline] Using OLD Emotion Mask system');
    return await this.useOldSystem(request);
  }

  /**
   * Handle Professional Presets generation
   */
  private async handlePresetsGeneration(request: GenerationRequest): Promise<GenerationResult> {
    if (this.featureFlags.presetsNewSystem) {
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
        console.warn('⚠️ [GenerationPipeline] New system failed, falling back to old:', error);
        // Fall through to old system
      }
    }

    // Use old system
    console.log('🔄 [GenerationPipeline] Using OLD Presets system');
    return await this.useOldSystem(request);
  }

  /**
   * Handle Ghibli Reaction generation
   */
  private async handleGhibliReactionGeneration(request: GenerationRequest): Promise<GenerationResult> {
    if (this.featureFlags.ghibliReactionNewSystem) {
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
        console.warn('⚠️ [GenerationPipeline] New system failed, falling back to old:', error);
        // Fall through to old system
      }
    }

    // Use old system
    console.log('🔄 [GenerationPipeline] Using OLD Ghibli Reaction system');
    return await this.useOldSystem(request);
  }

  /**
   * Handle Custom Prompt generation
   */
  private async handleCustomPromptGeneration(request: GenerationRequest): Promise<GenerationResult> {
    if (this.featureFlags.customPromptNewSystem) {
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
        console.warn('⚠️ [GenerationPipeline] New system failed, falling back to old:', error);
        // Fall through to old system
      }
    }

    // Use old system
    console.log('🔄 [GenerationPipeline] Using OLD Custom Prompt system');
    return await this.useOldSystem(request);
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
   * Use old generation system as fallback
   */
  private async useOldSystem(request: GenerationRequest): Promise<GenerationResult> {
    try {
      console.log('🔄 [GenerationPipeline] Using old system for:', request.type);
      
      // Use the old start-gen function
      const response = await authenticatedFetch('/.netlify/functions/start-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: request.prompt,
          image_url: request.sourceAssetId, // Fix: use image_url instead of sourceAssetId
          presetKey: request.presetKey,
          userId: request.userId,
          runId: request.runId,
          generationMeta: request.meta
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Old system generation failed: ${response.status}`);
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
        system: 'old',
        type: request.type
      };

    } catch (error) {
      console.error('❌ [GenerationPipeline] Old system generation failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Old system generation failed',
        system: 'old',
        type: request.type
      };
    }
  }

  /**
   * Get system status for monitoring
   */
  getSystemStatus(): {
    newSystemEnabled: boolean;
    oldSystemEnabled: boolean;
    featureFlags: FeatureFlags;
    migrationProgress: number;
  } {
    const enabledFeatures = Object.values(this.featureFlags).filter(Boolean).length;
    const totalFeatures = Object.keys(this.featureFlags).length;
    const migrationProgress = (enabledFeatures / totalFeatures) * 100;

    return {
      newSystemEnabled: enabledFeatures > 0,
      oldSystemEnabled: enabledFeatures < totalFeatures,
      featureFlags: this.featureFlags,
      migrationProgress: Math.round(migrationProgress)
    };
  }

  /**
   * Enable new system for all features (complete migration)
   */
  enableCompleteMigration(): void {
    this.featureFlags = {
      emotionMaskNewSystem: true,
      presetsNewSystem: true,
      ghibliReactionNewSystem: true,
      customPromptNewSystem: true,
      neoGlitchNewSystem: true
    };
    console.log('🎉 [GenerationPipeline] Complete migration enabled! All features using new system.');
  }

  /**
   * Rollback to old system for all features (emergency rollback)
   */
  emergencyRollback(): void {
    this.featureFlags = {
      emotionMaskNewSystem: false,
      presetsNewSystem: false,
      ghibliReactionNewSystem: false,
      customPromptNewSystem: false,
      neoGlitchNewSystem: true // Keep NeoGlitch on new system (it works)
    };
    console.log('🚨 [GenerationPipeline] Emergency rollback activated! All features using old system.');
  }
}

export default GenerationPipeline;
