// Client-side utility for identity-safe generation using Replicate
export interface IdentitySafeGenerationRequest {
  prompt: string;
  imageUrl: string;
  strength?: number;
  guidance?: number;
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
    // Note: This would typically call Replicate's status endpoint
    // For now, we'll return a mock status since we need the Replicate API key
    // In production, you'd implement the actual status checking
    
    console.log('🔍 Checking prediction status:', predictionId);
    
    // Mock response for development
    return {
      id: predictionId,
      status: 'processing' as const,
      logs: 'Identity-safe generation in progress...'
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
