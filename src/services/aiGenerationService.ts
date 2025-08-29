// src/services/aiGenerationService.ts
// AI Generation Service - Centralized interface for all AI generation operations

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
  url?: string; // Alias for imageUrl to match component expectations
  imageUrl?: string;
  aimlJobId?: string;
  provider?: string;
  error?: string;
  prompt?: string;
  style?: string;
}

export interface GenerationStatus {
  status: 'idle' | 'processing' | 'completed' | 'failed' | 'error';
  message?: string;
  progress?: number;
}

class AIGenerationService {
  private static instance: AIGenerationService;

  static getInstance(): AIGenerationService {
    if (!AIGenerationService.instance) {
      AIGenerationService.instance = new AIGenerationService();
    }
    return AIGenerationService.instance;
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    try {
      // Route to appropriate service based on type
      switch (request.type) {
        case 'neo-glitch':
          return await this.generateNeoGlitch(request);
        case 'emotion-mask':
          return await this.generateEmotionMask(request);
        case 'presets':
          return await this.generatePreset(request);
        case 'ghibli-reaction':
          return await this.generateGhibliReaction(request);
        case 'custom-prompt':
          return await this.generateCustomPrompt(request);
        default:
          throw new Error(`Unsupported generation type: ${request.type}`);
      }
    } catch (error) {
      console.error('AI Generation failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async generateNeoGlitch(request: GenerationRequest): Promise<GenerationResult> {
    // Implement Neo Glitch generation
    const response = await fetch('/.netlify/functions/neo-glitch-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        userId: request.userId,
        runId: request.runId,
        presetKey: request.presetKey,
        sourceUrl: request.sourceAssetId,
        prompt: request.prompt,
        metadata: request.meta
      })
    });

    const result = await response.json();

    return {
      success: result.success,
      jobId: result.jobId,
      runId: result.runId,
      status: result.status,
      url: result.imageUrl,
      imageUrl: result.imageUrl,
      provider: result.provider,
      error: result.error
    };
  }

  private async generateEmotionMask(request: GenerationRequest): Promise<GenerationResult> {
    // Implement Emotion Mask generation
    const response = await fetch('/.netlify/functions/emotion-mask-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        userId: request.userId,
        runId: request.runId,
        presetKey: request.presetKey,
        sourceUrl: request.sourceAssetId,
        prompt: request.prompt,
        metadata: request.meta
      })
    });

    const result = await response.json();

    return {
      success: result.success,
      jobId: result.jobId,
      runId: result.runId,
      status: result.status,
      url: result.imageUrl,
      imageUrl: result.imageUrl,
      aimlJobId: result.aimlJobId,
      provider: result.provider,
      error: result.error
    };
  }

  private async generatePreset(request: GenerationRequest): Promise<GenerationResult> {
    // Implement Preset generation
    const response = await fetch('/.netlify/functions/presets-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        userId: request.userId,
        runId: request.runId,
        presetKey: request.presetKey,
        sourceUrl: request.sourceAssetId,
        prompt: request.prompt,
        metadata: request.meta
      })
    });

    const result = await response.json();

    return {
      success: result.success,
      jobId: result.jobId,
      runId: result.runId,
      status: result.status,
      url: result.imageUrl,
      imageUrl: result.imageUrl,
      aimlJobId: result.aimlJobId,
      provider: result.provider,
      error: result.error
    };
  }

  private async generateGhibliReaction(request: GenerationRequest): Promise<GenerationResult> {
    // Implement Ghibli Reaction generation
    const response = await fetch('/.netlify/functions/ghibli-reaction-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        userId: request.userId,
        runId: request.runId,
        presetKey: request.presetKey,
        sourceUrl: request.sourceAssetId,
        prompt: request.prompt,
        metadata: request.meta
      })
    });

    const result = await response.json();

    return {
      success: result.success,
      jobId: result.jobId,
      runId: result.runId,
      status: result.status,
      url: result.imageUrl,
      imageUrl: result.imageUrl,
      aimlJobId: result.aimlJobId,
      provider: result.provider,
      error: result.error
    };
  }

  private async generateCustomPrompt(request: GenerationRequest): Promise<GenerationResult> {
    // Implement Custom Prompt generation
    const response = await fetch('/.netlify/functions/custom-prompt-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        userId: request.userId,
        runId: request.runId,
        presetKey: request.presetKey,
        sourceUrl: request.sourceAssetId,
        prompt: request.prompt,
        metadata: request.meta
      })
    });

    const result = await response.json();

    return {
      success: result.success,
      jobId: result.jobId,
      runId: result.runId,
      status: result.status,
      url: result.imageUrl,
      imageUrl: result.imageUrl,
      aimlJobId: result.aimlJobId,
      provider: result.provider,
      error: result.error
    };
  }

  async getStatus(jobId: string): Promise<GenerationStatus> {
    // Implement status checking - this would typically poll the backend
    // For now, return a placeholder
    return GenerationStatus.IDLE;
  }
}

// Export singleton instance
const aiGenerationService = AIGenerationService.getInstance();
export default aiGenerationService;
