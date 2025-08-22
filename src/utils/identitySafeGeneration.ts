// Client-side utility for identity-safe generation using Replicate
export interface IdentitySafeGenerationRequest {
  prompt: string;
  imageUrl: string;
  strength?: number;
  guidance?: number;
}

export interface NeoTokyoGlitchRequest {
  imageUrl: string;
  preset?: 'base' | 'visor' | 'tattoos' | 'scanlines';
  customPrompt?: string;
}

export interface IdentitySafeGenerationResponse {
  id: string;
  status: string;
  created_at: string;
  urls?: {
    get?: string;
    cancel?: string;
  };
  message: string;
}

export interface ReplicatePredictionStatus {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[];
  error?: string;
  logs?: string;
}

// Start Neo Tokyo Glitch generation
export async function startNeoTokyoGlitchGeneration(
  request: NeoTokyoGlitchRequest
): Promise<IdentitySafeGenerationResponse> {
  try {
    console.log('🚀 Starting Neo Tokyo Glitch generation:', {
      preset: request.preset || 'base',
      imageUrl: request.imageUrl.substring(0, 100) + '...',
      customPrompt: request.customPrompt ? 'Custom prompt provided' : 'Using preset prompt'
    });

    const response = await fetch('/.netlify/functions/identity-safe-generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'neo-tokyo-glitch',
        ...request
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result: IdentitySafeGenerationResponse = await response.json();
    
    console.log('✅ Neo Tokyo Glitch generation started:', {
      predictionId: result.id,
      status: result.status,
      message: result.message
    });

    return result;
  } catch (error) {
    console.error('❌ Neo Tokyo Glitch generation failed:', error);
    throw error;
  }
}

// Start identity-safe generation
export async function startIdentitySafeGeneration(
  request: IdentitySafeGenerationRequest
): Promise<IdentitySafeGenerationResponse> {
  try {
    console.log('🚀 Starting identity-safe generation:', {
      prompt: request.prompt.substring(0, 100) + (request.prompt.length > 100 ? '...' : ''),
      imageUrl: request.imageUrl.substring(0, 100) + '...',
      strength: request.strength,
      guidance: request.guidance
    });

    const response = await fetch('/.netlify/functions/identity-safe-generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result: IdentitySafeGenerationResponse = await response.json();
    
    console.log('✅ Identity-safe generation started:', {
      predictionId: result.id,
      status: result.status,
      message: result.message
    });

    return result;
  } catch (error) {
    console.error('❌ Identity-safe generation failed:', error);
    throw error;
  }
}

// Check prediction status
export async function checkPredictionStatus(predictionId: string): Promise<ReplicatePredictionStatus> {
  try {
    console.log('🔍 Checking prediction status:', predictionId);
    
    // Call our Netlify function to check Replicate status
    const response = await fetch('/.netlify/functions/identity-safe-generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'check-status',
        predictionId
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📡 Status check response:', {
      id: data.id,
      status: data.status,
      output: data.output,
      error: data.error,
      logs: data.logs
    });

    return {
      id: data.id,
      status: data.status,
      output: data.output,
      error: data.error,
      logs: data.logs
    };
  } catch (error) {
    console.error('❌ Failed to check prediction status:', error);
    throw error;
  }
}

// Wait for prediction completion with polling
export async function waitForPredictionCompletion(
  predictionId: string,
  pollInterval: number = 2000,
  maxWaitTime: number = 300000 // 5 minutes
): Promise<ReplicatePredictionStatus> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const status = await checkPredictionStatus(predictionId);
      
      if (status.status === 'succeeded') {
        console.log('🎉 Identity-safe generation completed successfully:', predictionId);
        return status;
      }
      
      if (status.status === 'failed' || status.status === 'canceled') {
        throw new Error(`Generation ${status.status}: ${status.error || 'Unknown error'}`);
      }
      
      // Still processing, wait before next poll
      console.log('⏳ Generation still processing, waiting...', {
        predictionId,
        status: status.status,
        elapsed: Math.round((Date.now() - startTime) / 1000) + 's'
      });
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      console.error('❌ Error while waiting for prediction:', error);
      throw error;
    }
  }
  
  throw new Error(`Generation timed out after ${maxWaitTime / 1000}s`);
}

// Complete Neo Tokyo Glitch generation workflow
export async function runNeoTokyoGlitchGeneration(
  imageUrl: string,
  preset: 'base' | 'visor' | 'tattoos' | 'scanlines' = 'base',
  customPrompt?: string
): Promise<{ outputUrl: string; predictionId: string }> {
  try {
    console.log('🔄 Running Neo Tokyo Glitch generation...', { preset, customPrompt: !!customPrompt });
    
    // Start generation
    const startResult = await startNeoTokyoGlitchGeneration({
      imageUrl,
      preset,
      customPrompt
    });
    
    // Wait for completion
    const finalStatus = await waitForPredictionCompletion(startResult.id);
    
    if (!finalStatus.output || finalStatus.output.length === 0) {
      throw new Error('Generation completed but no output received');
    }
    
    const outputUrl = finalStatus.output[0];
    
    console.log('✅ Neo Tokyo Glitch generation completed:', {
      predictionId: startResult.id,
      outputUrl: outputUrl.substring(0, 100) + '...',
      preset
    });
    
    return {
      outputUrl,
      predictionId: startResult.id
    };
    
  } catch (error) {
    console.error('💥 Neo Tokyo Glitch generation failed:', error);
    throw error;
  }
}

// Complete identity-safe generation workflow
export async function runIdentitySafeFallback(
  prompt: string,
  imageUrl: string,
  options: { strength?: number; guidance?: number } = {}
): Promise<{ outputUrl: string; predictionId: string }> {
  try {
    console.log('🔄 Running identity-safe fallback generation...');
    
    // Start generation
    const startResult = await startIdentitySafeGeneration({
      prompt,
      imageUrl,
      strength: options.strength || 0.7,
      guidance: options.guidance || 7.5
    });
    
    // Wait for completion
    const finalStatus = await waitForPredictionCompletion(startResult.id);
    
    if (!finalStatus.output || finalStatus.output.length === 0) {
      throw new Error('Generation completed but no output received');
    }
    
    const outputUrl = finalStatus.output[0];
    
    console.log('✅ Identity-safe fallback completed:', {
      predictionId: startResult.id,
      outputUrl: outputUrl.substring(0, 100) + '...'
    });
    
    return {
      outputUrl,
      predictionId: startResult.id
    };
    
  } catch (error) {
    console.error('💥 Identity-safe fallback failed:', error);
    throw error;
  }
}

// Utility to check if identity-safe generation is available
export function isIdentitySafeGenerationAvailable(): boolean {
  // In production, you might check if the Netlify function is accessible
  // For now, assume it's available
  return true;
}

// Utility to check if Neo Tokyo Glitch generation is available
export function isNeoTokyoGlitchAvailable(): boolean {
  // In production, you might check if the Netlify function is accessible
  // For now, assume it's available
  return true;
}
