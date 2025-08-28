// src/services/neoGlitchAsyncService.ts
// NeoGlitch Async Generation Service
// 
// 🎯 PURPOSE: Handle NeoGlitch generation using the new async job system
// This avoids timeout issues by using start → poll pattern
// 
// 🔄 FLOW: Start Job → Show Queue Toast → Poll Status → Show Ready Toast
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
  private static readonly POLL_INTERVAL = 3000; // 3 seconds
  private static readonly MAX_POLL_ATTEMPTS = 60; // 3 minutes max

  /**
   * Start a NeoGlitch generation job
   */
  static async startJob(request: NeoGlitchJobRequest, authToken: string): Promise<string> {
    try {
      const response = await fetch('/.netlify/functions/start-glitch-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start job: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.message || 'Failed to start job');
      }

      return result.jobId;
    } catch (error: any) {
      throw new Error(`Job start failed: ${error.message}`);
    }
  }

  /**
   * Poll for job status
   */
  static async pollJobStatus(jobId: string, authToken: string): Promise<NeoGlitchJobStatus> {
    try {
      const response = await fetch(`/.netlify/functions/poll-glitch-job?jobId=${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': authToken
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to poll job: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.message || 'Failed to poll job');
      }

      return result;
    } catch (error: any) {
      throw new Error(`Job polling failed: ${error.message}`);
    }
  }

  /**
   * Start job and poll until completion
   */
  static async generateWithPolling(
    request: NeoGlitchJobRequest, 
    authToken: string,
    onProgress?: (status: NeoGlitchJobStatus) => void
  ): Promise<NeoGlitchJobStatus> {
    
    // Start the job
    const jobId = await this.startJob(request, authToken);
    console.log('[NeoGlitch] Job started:', jobId);

    // Poll for completion
    let pollAttempts = 0;
    
    while (pollAttempts < this.MAX_POLL_ATTEMPTS) {
      pollAttempts++;
      
      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL));
      
      // Check status
      const status = await this.pollJobStatus(jobId, authToken);
      console.log(`[NeoGlitch] Poll ${pollAttempts}:`, status.status);
      
      // Report progress
      if (onProgress) {
        onProgress(status);
      }
      
      // Check if complete
      if (status.status === 'completed') {
        console.log('[NeoGlitch] Job completed successfully');
        return status;
      }
      
      if (status.status === 'failed') {
        console.log('[NeoGlitch] Job failed');
        throw new Error(status.errorMessage || 'Generation failed');
      }
      
      // Still processing, continue polling
      console.log('[NeoGlitch] Job still processing, continuing to poll...');
    }
    
    throw new Error('Job timed out after maximum polling attempts');
  }
}

/**
 * React Hook for NeoGlitch Async Generation
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

      // Start generation with polling
      const result = await NeoGlitchAsyncService.generateWithPolling(
        request,
        authToken,
        (status) => {
          // Progress updates (optional)
          if (status.status === 'processing') {
            console.log('[NeoGlitch] Processing...');
          }
        }
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
