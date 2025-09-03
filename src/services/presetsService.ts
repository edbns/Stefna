// src/services/presetsService.ts
// Professional Presets Service - Following NeoGlitch pattern for rock-solid stability
// 
// 🎯 SERVICE STRATEGY:
// 1. Clean, focused service for Professional Presets only
// 2. Same pattern as NeoGlitchService (which works perfectly)
// 3. Handles 25 preset rotation system (6 per week)
// 4. Integrates with new presets_media table and presets_config

import { authenticatedFetch } from '../utils/apiClient';

export interface PresetGenerationRequest {
  prompt: string;
  presetKey: string;
  sourceAssetId: string;
  userId: string;
  runId: string;
  meta?: any;
}

export interface PresetGenerationResult {
  success: boolean;
  jobId?: string;
  runId?: string;
  status: 'completed' | 'processing' | 'failed';
  imageUrl?: string;
  falJobId?: string;
  provider?: string;
  error?: string;
  presetInfo?: {
    name: string;
    description: string;
    category: string;
    week: number;
    rotationIndex: number;
  };
}

export interface PresetStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  falJobId?: string;
  createdAt: Date;
  preset: string;
  prompt: string;
  presetWeek?: number;
  presetRotationIndex?: number;
}

export interface PresetConfig {
  id: string;
  presetKey: string;
  presetName: string;
  presetDescription: string;
  presetCategory: string;
  presetPrompt: string;
  presetNegativePrompt: string;
  presetStrength: number;
  presetRotationIndex: number;
  presetWeek: number;
  isActive: boolean;
  isCurrentlyAvailable: boolean;
}

export interface DatabasePreset {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
  prompt: string;
  negativePrompt: string;
  strength: number;
  rotationIndex: number;
  week: number;
  isActive: boolean;
}

export interface PresetsResponse {
  success: boolean;
  data?: {
    presets: DatabasePreset[];
    currentWeek: number;
    totalAvailable: number;
    rotationInfo: {
      totalPresetsInSystem: number;
      weeksInCycle: number;
      presetsPerWeek: number;
    };
  };
  error?: string;
  message?: string;
}

class PresetsService {
  private static instance: PresetsService;

  private constructor() {}

  static getInstance(): PresetsService {
    if (!PresetsService.instance) {
      PresetsService.instance = new PresetsService();
    }
    return PresetsService.instance;
  }

  /**
   * Fetch available presets from database with rotation system
   * Returns currently available presets for the main presets mode
   */
  async getAvailablePresets(): Promise<PresetsResponse> {
    try {
      console.log('🎨 [PresetsService] Fetching available presets from database');

      const response = await authenticatedFetch('/.netlify/functions/get-presets', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PresetsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to fetch presets');
      }

      console.log('✅ [PresetsService] Successfully fetched', data.data?.totalAvailable, 'presets');
      return data;

    } catch (error) {
      console.error('❌ [PresetsService] Failed to fetch presets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
 * Start a Professional Preset generation using unified generation system
 * Creates record in presets_media and starts BFL generation
 */
  async startGeneration(request: PresetGenerationRequest): Promise<PresetGenerationResult> {
    try {
      console.log('🎭 [Presets] Starting generation with unified generation system:', {
        presetKey: request.presetKey,
        runId: request.runId,
        hasSource: !!request.sourceAssetId
      });

      // Use unified generation system instead of separate presets-generate
      const unifiedRes = await authenticatedFetch('/.netlify/functions/unified-generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'presets',
          prompt: request.prompt,
          presetKey: request.presetKey,
          sourceAssetId: request.sourceAssetId,
          userId: request.userId,
          runId: request.runId,
          meta: request.meta || {}
        })
      });

      if (!unifiedRes.ok) {
        const error = await unifiedRes.json().catch(() => ({}));
        throw new Error(error.error || `Failed to start unified generation: ${unifiedRes.status}`);
      }

      const unifiedResult = await unifiedRes.json();
      console.log('🚀 [Presets] Unified generation response:', {
        status: unifiedResult.status,
        provider: unifiedResult.provider,
        jobId: unifiedResult.jobId,
        imageUrl: unifiedResult.imageUrl,
        presetInfo: unifiedResult.presetInfo,
        fullResponse: unifiedResult
      });

      // Handle immediate completion from backend
      if (unifiedResult.status === 'completed' && unifiedResult.imageUrl) {
        console.log('🎉 [Presets] Generation completed immediately!');
        return {
          success: true,
          jobId: unifiedResult.jobId,
          runId: unifiedResult.runId,
          status: 'completed',
          imageUrl: unifiedResult.imageUrl,
          falJobId: unifiedResult.falJobId,
          provider: unifiedResult.provider,
          presetInfo: unifiedResult.presetInfo
        };
      }

      // Handle processing status
      if (unifiedResult.status === 'processing' || unifiedResult.status === 'pending') {
        console.log('🔄 [Presets] Generation in progress, will need polling');
        return {
          success: true,
          jobId: unifiedResult.jobId,
          runId: unifiedResult.runId,
          status: 'processing',
          falJobId: unifiedResult.falJobId,
          provider: unifiedResult.provider
        };
      }

      // Handle failed status
      if (unifiedResult.status === 'failed') {
        console.error('❌ [Presets] Generation failed:', unifiedResult);
        return {
          success: false,
          status: 'failed',
          error: unifiedResult.error || 'Generation failed'
        };
      }

      // Unexpected response
      console.warn('⚠️ [Presets] Unexpected response status:', unifiedResult.status);
      return {
        success: false,
        status: 'failed',
        error: `Unexpected status: ${unifiedResult.status}`
      };

    } catch (error) {
      console.error('❌ [Presets] Start generation failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Poll for generation completion
   * Since unified generation returns immediately, this is mainly for status verification
   */
  async pollForCompletion(jobId: string, maxAttempts: number = 10): Promise<PresetStatus> {
    try {
      console.log('🔍 [Presets] Polling for completion:', jobId);
      
      // For Professional Presets, unified generation usually returns immediately
      // This polling is mainly for status verification
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔍 [Presets] Poll attempt ${attempt}/${maxAttempts}`);
        
        try {
          // Check status by querying the database directly via getMediaByRunId
          const statusRes = await authenticatedFetch(`/.netlify/functions/getMediaByRunId?runId=${jobId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });

          if (statusRes.ok) {
            const status = await statusRes.json();
            console.log('✅ [Presets] Status check successful:', status);
            
            if (status.status === 'completed' && status.imageUrl) {
              return {
                id: status.id,
                status: 'completed',
                imageUrl: status.imageUrl,
                falJobId: status.fal_job_id,
                createdAt: new Date(status.createdAt),
                preset: status.preset,
                prompt: status.prompt,
                presetWeek: status.preset_week,
                presetRotationIndex: status.preset_rotation_index
              };
            }
            
            if (status.status === 'failed') {
              throw new Error('Generation failed');
            }
          }
        } catch (pollError) {
          console.warn(`⚠️ [Presets] Poll attempt ${attempt} failed:`, pollError);
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      throw new Error('Polling completed unexpectedly');
    } catch (error) {
      console.error('❌ [Presets] Polling failed:', error);
      throw error;
    }
  }

  /**
   * Get current week's available presets (6 presets)
   */
  async getCurrentWeekPresets(): Promise<PresetConfig[]> {
    try {
      console.log('🔍 [Presets] Getting current week presets');
      
      const response = await authenticatedFetch('/.netlify/functions/get-current-week-presets', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to get current week presets: ${response.status}`);
      }

      const presets = await response.json();
      console.log('✅ [Presets] Current week presets:', presets.length);
      return presets;
    } catch (error) {
      console.error('❌ [Presets] Get current week presets failed:', error);
      // Fallback to hardcoded current week presets
      return this.getFallbackCurrentWeekPresets();
    }
  }

  /**
   * Get all available presets (25 total)
   */
  async getAllPresets(): Promise<PresetConfig[]> {
    try {
      console.log('🔍 [Presets] Getting all presets');
      
      const response = await authenticatedFetch('/.netlify/functions/get-all-presets', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to get all presets: ${response.status}`);
      }

      const presets = await response.json();
      console.log('✅ [Presets] All presets:', presets.length);
      return presets;
    } catch (error) {
      console.error('❌ [Presets] Get all presets failed:', error);
      // Fallback to hardcoded presets
      return this.getFallbackAllPresets();
    }
  }

  /**
   * Get Professional Preset media for a user
   */
  async getUserPresetsMedia(userId: string, limit: number = 50): Promise<PresetStatus[]> {
    try {
      console.log('🔍 [Presets] Getting user media:', userId);
      
      const response = await authenticatedFetch('/.netlify/functions/getUserMedia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, limit, type: 'preset' })
      });

      if (!response.ok) {
        throw new Error(`Failed to get user media: ${response.status}`);
      }

      const result = await response.json();
      return result.items || [];
    } catch (error) {
      console.error('❌ [Presets] Get user media failed:', error);
      throw error;
    }
  }

  /**
   * Delete Professional Preset media
   */
  async deleteMedia(mediaId: string, userId: string): Promise<boolean> {
    try {
      console.log('🗑️ [Presets] Deleting media:', mediaId);
      
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
      console.error('❌ [Presets] Delete media failed:', error);
      throw error;
    }
  }

  /**
   * Get available preset keys for current week
   */
  getAvailablePresetKeys(): string[] {
    return [
      'cinematic', 'portrait', 'landscape', 'street', 'vintage', 'black_white',
      'artistic', 'fashion', 'documentary', 'minimalist', 'dramatic', 'soft',
      'bold', 'elegant', 'dynamic', 'serene', 'mysterious', 'vibrant',
      'subtle', 'powerful', 'delicate', 'intense', 'tranquil', 'striking',
      'timeless'
    ];
  }

  /**
   * Validate preset key
   */
  isValidPreset(presetKey: string): boolean {
    return this.getAvailablePresetKeys().includes(presetKey);
  }

  /**
   * Get current week number (1-5)
   */
  getCurrentWeek(): number {
    const month = new Date().getMonth();
    const currentWeek = Math.floor((month * 5) / 12) + 1;
    return Math.max(1, Math.min(5, currentWeek));
  }

  /**
   * Check if preset is available in current week
   */
  isPresetAvailableThisWeek(presetKey: string): boolean {
    const currentWeek = this.getCurrentWeek();
    const weekPresets = this.getWeekPresets(currentWeek);
    return weekPresets.includes(presetKey);
  }

  /**
   * Get presets for a specific week
   */
  getWeekPresets(week: number): string[] {
    const weekPresets: { [key: number]: string[] } = {
      1: ['cinematic', 'portrait', 'landscape', 'street', 'vintage', 'black_white'],
      2: ['artistic', 'fashion', 'documentary', 'minimalist', 'dramatic', 'soft'],
      3: ['bold', 'elegant', 'dynamic', 'serene', 'mysterious', 'vibrant'],
      4: ['subtle', 'powerful', 'delicate', 'intense', 'tranquil', 'striking'],
      5: ['timeless']
    };
    return weekPresets[week] || [];
  }

  /**
   * Fallback current week presets (when API fails)
   */
  private getFallbackCurrentWeekPresets(): PresetConfig[] {
    const currentWeek = this.getCurrentWeek();
    const weekPresets = this.getWeekPresets(currentWeek);
    
    return weekPresets.map((presetKey, index) => ({
      id: `fallback_${presetKey}`,
      presetKey,
      presetName: this.getPresetDisplayName(presetKey),
      presetDescription: this.getPresetDescription(presetKey),
      presetCategory: this.getPresetCategory(presetKey),
      presetPrompt: `Transform this image with ${this.getPresetDescription(presetKey).toLowerCase()}. Keep the original composition and subject identity intact.`,
      presetNegativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs',
      presetStrength: 0.8,
      presetRotationIndex: (currentWeek - 1) * 6 + index + 1,
      presetWeek: currentWeek,
      isActive: true,
      isCurrentlyAvailable: true
    }));
  }

  /**
   * Fallback all presets (when API fails)
   */
  private getFallbackAllPresets(): PresetConfig[] {
    const allPresets = this.getAvailablePresetKeys();
    
    return allPresets.map((presetKey, index) => {
      const week = Math.floor(index / 6) + 1;
      return {
        id: `fallback_${presetKey}`,
        presetKey,
        presetName: this.getPresetDisplayName(presetKey),
        presetDescription: this.getPresetDescription(presetKey),
        presetCategory: this.getPresetCategory(presetKey),
        presetPrompt: `Transform this image with ${this.getPresetDescription(presetKey).toLowerCase()}. Keep the original composition and subject identity intact.`,
        presetNegativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs',
        presetStrength: 0.8,
        presetRotationIndex: index + 1,
        presetWeek: week,
        isActive: true,
        isCurrentlyAvailable: week === this.getCurrentWeek()
      };
    });
  }

  /**
   * Get preset display name
   */
  private getPresetDisplayName(presetKey: string): string {
    const names: { [key: string]: string } = {
      'cinematic': 'Cinematic',
      'portrait': 'Portrait',
      'landscape': 'Landscape',
      'street': 'Street',
      'vintage': 'Vintage',
      'black_white': 'Black & White',
      'artistic': 'Artistic',
      'fashion': 'Fashion',
      'documentary': 'Documentary',
      'minimalist': 'Minimalist',
      'dramatic': 'Dramatic',
      'soft': 'Soft',
      'bold': 'Bold',
      'elegant': 'Elegant',
      'dynamic': 'Dynamic',
      'serene': 'Serene',
      'mysterious': 'Mysterious',
      'vibrant': 'Vibrant',
      'subtle': 'Subtle',
      'powerful': 'Powerful',
      'delicate': 'Delicate',
      'intense': 'Intense',
      'tranquil': 'Tranquil',
      'striking': 'Striking',
      'timeless': 'Timeless'
    };
    return names[presetKey] || presetKey;
  }

  /**
   * Get preset description
   */
  private getPresetDescription(presetKey: string): string {
    const descriptions: { [key: string]: string } = {
      'cinematic': 'Hollywood movie poster style',
      'portrait': 'Professional portrait photography',
      'landscape': 'Breathtaking landscape photography',
      'street': 'Urban street photography style',
      'vintage': 'Classic vintage film look',
      'black_white': 'Timeless monochrome',
      'artistic': 'Fine art photography style',
      'fashion': 'High-end fashion photography',
      'documentary': 'Photojournalism style',
      'minimalist': 'Clean, simple aesthetics',
      'dramatic': 'High contrast dramatic style',
      'soft': 'Gentle, dreamy aesthetics',
      'bold': 'Strong, impactful style',
      'elegant': 'Sophisticated luxury style',
      'dynamic': 'Energetic movement style',
      'serene': 'Peaceful, calm style',
      'mysterious': 'Enigmatic, intriguing style',
      'vibrant': 'Colorful, energetic style',
      'subtle': 'Understated, refined style',
      'powerful': 'Strong, commanding style',
      'delicate': 'Fragile, intricate style',
      'intense': 'High energy, focused style',
      'tranquil': 'Peaceful, meditative style',
      'striking': 'Bold, attention-grabbing style',
      'timeless': 'Classic, enduring style'
    };
    return descriptions[presetKey] || 'Professional photography style';
  }

  /**
   * Get preset category
   */
  private getPresetCategory(presetKey: string): string {
    const categories: { [key: string]: string } = {
      'cinematic': 'cinematic',
      'portrait': 'portrait',
      'landscape': 'landscape',
      'street': 'street',
      'vintage': 'vintage',
      'black_white': 'monochrome',
      'artistic': 'artistic',
      'fashion': 'fashion',
      'documentary': 'documentary',
      'minimalist': 'minimalist',
      'dramatic': 'dramatic',
      'soft': 'soft',
      'bold': 'bold',
      'elegant': 'elegant',
      'dynamic': 'dynamic',
      'serene': 'serene',
      'mysterious': 'mysterious',
      'vibrant': 'vibrant',
      'subtle': 'subtle',
      'powerful': 'powerful',
      'delicate': 'delicate',
      'intense': 'intense',
      'tranquil': 'tranquil',
      'striking': 'striking',
      'timeless': 'timeless'
    };
    return categories[presetKey] || 'professional';
  }
}

export default PresetsService;
