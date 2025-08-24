// Client-side utility for identity-safe generation using AIML API
// This replaces the old Replicate-based system with AIML API integration

export interface IdentitySafeGenerationRequest {
  prompt: string;
  imageUrl: string;
  strength?: number;
  guidance?: number;
  mode?: 'identity-safe' | 'neo-tokyo-glitch' | 'check-status';
  preset?: string;
}

export interface IdentitySafeGenerationResponse {
  success: boolean;
  id: string;
  status: string;
  created_at: string;
  urls?: {
    get: string;
    cancel: string;
  };
  output?: string[];
  message: string;
}

export interface PredictionStatus {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  created_at: string;
  completed_at?: string;
  output?: string[];
  error?: string;
  logs?: string;
}

// Check if identity-safe generation is available
export function isIdentitySafeGenerationAvailable(): boolean {
  // Check if AIML API is configured
  const hasAimlKey = !!import.meta.env.VITE_AIML_API_KEY;
  
  console.log('🔍 Identity-safe generation availability:', {
    hasAimlKey,
    available: hasAimlKey
  });
  
  return hasAimlKey;
}

// Start identity-safe generation with AIML API
export async function startIdentitySafeGeneration(
  request: IdentitySafeGenerationRequest
): Promise<IdentitySafeGenerationResponse> {
  try {
    console.log('🚀 Starting identity-safe generation:', {
      mode: request.mode || 'identity-safe',
      preset: request.preset,
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
      id: result.id,
      status: result.status,
      hasOutput: !!result.output
    });

    return result;

  } catch (error: any) {
    console.error('❌ Identity-safe generation failed:', error);
    throw new Error(`Identity-safe generation failed: ${error.message}`);
  }
}

// Check prediction status (for compatibility - AIML is synchronous)
export async function checkPredictionStatus(predictionId: string): Promise<PredictionStatus> {
  try {
    // Call our Netlify function to check status
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Convert to expected format
    return {
      id: predictionId,
      status: 'succeeded', // AIML is synchronous, so always succeeded if we get here
      created_at: result.created_at,
      completed_at: result.created_at,
      output: result.output || []
    };

  } catch (error: any) {
    console.error('❌ Status check failed:', error);
    return {
      id: predictionId,
      status: 'failed',
      created_at: new Date().toISOString(),
      error: error.message
    };
  }
}

// Wait for prediction completion (for compatibility - AIML is synchronous)
export async function waitForPredictionCompletion(
  predictionId: string,
  maxWaitTime: number = 120000 // 2 minutes
): Promise<PredictionStatus> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const status = await checkPredictionStatus(predictionId);
      
      if (status.status === 'succeeded' || status.status === 'failed') {
        if (status.status === 'succeeded' && status.output && status.output.length > 0) {
          console.log('🎉 Identity-safe generation completed successfully:', predictionId);
        }
        return status;
      }
      
      // Wait before next check (though AIML is synchronous)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('❌ Error checking prediction status:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Timeout
  return {
    id: predictionId,
    status: 'failed',
    created_at: new Date().toISOString(),
    error: 'Timeout waiting for completion'
  };
}

// Complete identity-safe generation workflow
export async function runIdentitySafeFallback(
  prompt: string,
  imageUrl: string,
  options: {
    strength?: number;
    guidance?: number;
    mode?: 'identity-safe' | 'neo-tokyo-glitch';
    preset?: string;
  } = {}
): Promise<{ outputUrl: string; predictionId: string }> {
  try {
    console.log('🔄 Running identity-safe fallback generation...');

    // Start generation
    const startResult = await startIdentitySafeGeneration({
      prompt,
      imageUrl,
      strength: options.strength || 0.4,
      guidance: options.guidance || 6.0,
      mode: options.mode || 'identity-safe',
      preset: options.preset
    });

    // Since AIML is synchronous, we should have the result immediately
    if (startResult.output && startResult.output.length > 0) {
      console.log('✅ Identity-safe fallback completed:', {
        outputUrl: startResult.output[0],
        predictionId: startResult.id
      });

      return {
        outputUrl: startResult.output[0],
        predictionId: startResult.id
      };
    }

    // If no immediate output, wait for completion (shouldn't happen with AIML)
    const finalResult = await waitForPredictionCompletion(startResult.id);
    
    if (finalResult.status !== 'succeeded' || !finalResult.output || finalResult.output.length === 0) {
      throw new Error(finalResult.error || 'Generation failed to produce output');
    }

    return {
      outputUrl: finalResult.output[0],
      predictionId: finalResult.id
    };

  } catch (error: any) {
    console.error('💥 Identity-safe fallback failed:', error);
    throw new Error(`Identity-safe fallback failed: ${error.message}`);
  }
}


