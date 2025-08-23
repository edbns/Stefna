// Neo Tokyo Glitch Service
// Handles the complete pipeline from Replicate generation to permanent Cloudinary storage
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
  replicateUrl?: string;
  cloudinaryUrl?: string;
  runId: string;
  inputHash: string;
}

export interface NeoGlitchStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  replicateUrl?: string;
  cloudinaryUrl?: string;
  error?: string;
  meta?: any;
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
   * Start a Neo Tokyo Glitch generation
   * Creates the initial record and starts Replicate generation
   */
  async startGeneration(request: NeoGlitchGenerationRequest): Promise<NeoGlitchGenerationResult> {
    try {
      console.log('🎭 [NeoGlitch] Starting generation:', {
        presetKey: request.presetKey,
        runId: request.runId,
        hasSource: !!request.sourceAssetId
      });

      // Calculate input hash for deduplication
      const inputHash = await this.generateInputHash(
        request.prompt,
        request.presetKey,
        request.sourceAssetId
      );

      console.log('🎭 [NeoGlitch] Input hash generated:', inputHash);

      // Create the initial glitch record
      const createRes = await authenticatedFetch('/.netlify/functions/neo-glitch-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: request.prompt,
          presetKey: request.presetKey,
          sourceAssetId: request.sourceAssetId,
          userId: request.userId,
          runId: request.runId,
          inputHash: inputHash,
          meta: request.meta || {}
        })
      });

      if (!createRes.ok) {
        const error = await createRes.json().catch(() => ({}));
        throw new Error(error.error || `Failed to create glitch record: ${createRes.status}`);
      }

      const result = await createRes.json();
      console.log('✅ [NeoGlitch] Generation record created:', result.id);

      // Start the actual Replicate generation
      const replicateRes = await authenticatedFetch('/.netlify/functions/neo-glitch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          glitchId: result.id,
          prompt: request.prompt,
          presetKey: request.presetKey,
          sourceAssetId: request.sourceAssetId,
          runId: request.runId
        })
      });

      if (!replicateRes.ok) {
        const error = await replicateRes.json().catch(() => ({}));
        throw new Error(error.error || `Failed to start Replicate generation: ${replicateRes.status}`);
      }

      const replicateResult = await replicateRes.json();
      console.log('🚀 [NeoGlitch] Replicate generation started:', replicateResult.predictionId);

      return {
        id: result.id,
        status: 'pending',
        runId: request.runId,
        inputHash: inputHash
      };

    } catch (error) {
      console.error('❌ [NeoGlitch] Start generation failed:', error);
      throw error;
    }
  }

  /**
   * Check the status of a Neo Tokyo Glitch generation
   */
  async checkStatus(glitchId: string): Promise<NeoGlitchStatus> {
    try {
      const response = await authenticatedFetch('/.netlify/functions/neo-glitch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glitchId })
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
   * Poll for completion of a Neo Tokyo Glitch generation
   */
  async pollForCompletion(glitchId: string, maxAttempts: number = 60): Promise<NeoGlitchStatus> {
    console.log('🔄 [NeoGlitch] Polling for completion:', glitchId);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const status = await this.checkStatus(glitchId);
        
        console.log(`🔍 [NeoGlitch] Poll attempt ${attempt}/${maxAttempts}:`, status.status);

        if (status.status === 'completed') {
          console.log('✅ [NeoGlitch] Generation completed successfully');
          
          // If we have a Replicate URL, backup to Cloudinary using existing function
          if (status.replicateUrl) {
            console.log('🔄 [NeoGlitch] Backing up Replicate URL to Cloudinary...');
            try {
              const backupResult = await this.backupToCloudinary(glitchId, status.replicateUrl);
              if (backupResult.success) {
                console.log('✅ [NeoGlitch] Cloudinary backup successful:', backupResult.permanentUrl);
                return {
                  ...status,
                  cloudinaryUrl: backupResult.permanentUrl
                };
              } else {
                console.warn('⚠️ [NeoGlitch] Cloudinary backup failed:', backupResult.error);
                // Return status without Cloudinary URL if backup fails
                return status;
              }
            } catch (backupError) {
              console.error('❌ [NeoGlitch] Cloudinary backup error:', backupError);
              return status;
            }
          }
          
          return status;
        }

        if (status.status === 'failed') {
          console.error('❌ [NeoGlitch] Generation failed:', status.error);
          throw new Error(status.error || 'Generation failed');
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ [NeoGlitch] Poll attempt ${attempt} failed:`, error);
        
        if (attempt === maxAttempts) {
          throw new Error('Max polling attempts reached');
        }
      }
    }

    throw new Error('Generation timed out');
  }

  /**
   * Backup Replicate URL to Cloudinary using existing backup function
   */
  private async backupToCloudinary(glitchId: string, replicateUrl: string): Promise<any> {
    try {
      const response = await authenticatedFetch('/.netlify/functions/backup-replicate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replicateUrl,
          mediaId: glitchId,
          userId: await this.getCurrentUserId()
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Backup failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ [NeoGlitch] Cloudinary backup failed:', error);
      throw error;
    }
  }

  /**
   * Get current user ID from auth service
   */
  private async getCurrentUserId(): Promise<string> {
    // Import auth service dynamically to avoid circular dependencies
    const { default: authService } = await import('../lib/auth');
    const user = authService.getCurrentUser();
    
    if (!user?.id) {
      throw new Error('User not authenticated or no user ID available');
    }
    
    return user.id;
  }

  /**
   * Generate input hash for deduplication
   */
  private async generateInputHash(prompt: string, presetKey: string, sourceAssetId?: string): Promise<string> {
    // Use Web Crypto API to generate SHA256 hash
    const input = `${prompt}|${presetKey}|${sourceAssetId || ''}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * Get user's Neo Tokyo Glitch generations
   */
  async getUserGenerations(userId: string): Promise<NeoGlitchStatus[]> {
    try {
      const response = await authenticatedFetch('/.netlify/functions/neo-glitch-user-generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to get user generations: ${response.status}`);
      }

      const result = await response.json();
      return result.generations || [];
    } catch (error) {
      console.error('❌ [NeoGlitch] Get user generations failed:', error);
      throw error;
    }
  }

  /**
   * Get public Neo Tokyo Glitch feed
   */
  async getPublicFeed(): Promise<NeoGlitchStatus[]> {
    try {
      const response = await authenticatedFetch('/.netlify/functions/neo-glitch-public-feed', {
        method: 'GET'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to get public feed: ${response.status}`);
      }

      const result = await response.json();
      return result.generations || [];
    } catch (error) {
      console.error('❌ [NeoGlitch] Get public feed failed:', error);
      throw error;
    }
  }
}

export default NeoGlitchService;
