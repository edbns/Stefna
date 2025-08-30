// src/services/neoGlitchAsyncService.ts
// NeoGlitch Synchronous Generation Service
// 
// 🎯 PURPOSE: Handle NeoGlitch generation synchronously
// No more polling - direct generation with timeout
// 
// 🔄 FLOW: Generate → Wait → Return Result
import { useToasts } from '../components/ui/Toasts';

export interface NeoGlitchJobRequest {
  sourceUrl: string;
  prompt: string;
  presetKey: string;
}

export interface NeoGlitchJobStatus {
  ok: boolean;
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  errorMessage?: string;
}

export class NeoGlitchAsyncService {
  /**
   * Generate NeoGlitch synchronously - no polling needed
   */
  static async generateSynchronously(
    request: NeoGlitchJobRequest, 
    authToken: string
  ): Promise<NeoGlitchJobStatus> {
    try {
      console.log('🚀 [NeoGlitch] Starting synchronous generation...');
      
      // Call the generate function directly
      const response = await fetch('/.netlify/functions/neo-glitch-generate', {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [NeoGlitch] Generation failed: ${response.status} - ${errorText}`);
        throw new Error(`Generation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [NeoGlitch] Generation completed!', result);
      return result;

    } catch (error: any) {
      console.error('❌ [NeoGlitch] Synchronous generation failed:', error);
      throw error;
    }
  }
}

/**
 * React Hook for NeoGlitch Synchronous Generation
 * Integrates with your unified toast system
 */
export function useNeoGlitchAsync() {
  const { notifyQueue, notifyReady, notifyError } = useToasts();

  const generateAsync = async (
    request: NeoGlitchJobRequest,
    authToken: string
  ): Promise<string> => {
    
    try {
      // Show "Added to queue" toast
      notifyQueue({
        title: "Added to queue",
        message: "We'll start processing shortly."
      });

      // Generate synchronously
      const result = await NeoGlitchAsyncService.generateSynchronously(
        request,
        authToken
      );

      // Show "Ready" toast with thumbnail
      notifyReady({
        title: "Your media is ready",
        message: "Tap to open",
        thumbUrl: result.imageUrl
      });

      return result.imageUrl!;

    } catch (error: any) {
      // Show error toast
      notifyError({
        title: "Generation failed",
        message: error.message || "Please try again."
      });

      throw error;
    }
  };

  return { generateAsync };
}
