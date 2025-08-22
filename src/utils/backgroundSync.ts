// Background sync utility for immediate preview + background upload
export interface BackgroundUploadOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (result: { url: string; resource_type: string }) => void;
  onError?: (error: Error) => void;
  showPreviewImmediately?: boolean;
}

export interface BackgroundUploadResult {
  previewUrl: string;
  uploadPromise: Promise<{ url: string; resource_type: string }>;
}

// Background upload manager
export class BackgroundUploadManager {
  private static instance: BackgroundUploadManager;
  private activeUploads = new Map<string, Promise<any>>();
  private uploadProgress = new Map<string, number>();

  private constructor() {}

  static getInstance(): BackgroundUploadManager {
    if (!BackgroundUploadManager.instance) {
      BackgroundUploadManager.instance = new BackgroundUploadManager();
    }
    return BackgroundUploadManager.instance;
  }

  // Start background upload with immediate preview
  async startBackgroundUpload(
    file: File,
    uploadFn: () => Promise<{ url: string; resource_type: string }>,
    options: BackgroundUploadOptions = {}
  ): Promise<BackgroundUploadResult> {
    const uploadId = `${file.name}_${Date.now()}`;
    
    // Create immediate preview
    const previewUrl = URL.createObjectURL(file);
    
    // Start background upload
    const uploadPromise = this.executeBackgroundUpload(uploadId, uploadFn, options);
    
    // Store the upload promise
    this.activeUploads.set(uploadId, uploadPromise);
    
    // Clean up preview URL when upload completes
    uploadPromise.finally(() => {
      URL.revokeObjectURL(previewUrl);
      this.activeUploads.delete(uploadId);
      this.uploadProgress.delete(uploadId);
    });
    
    return {
      previewUrl,
      uploadPromise
    };
  }

  // Execute the actual upload in background
  private async executeBackgroundUpload(
    uploadId: string,
    uploadFn: () => Promise<{ url: string; resource_type: string }>,
    options: BackgroundUploadOptions
  ): Promise<{ url: string; resource_type: string }> {
    try {
      // Simulate progress updates if onProgress is provided
      if (options.onProgress) {
        this.simulateProgress(uploadId, options.onProgress);
      }
      
      // Execute the actual upload
      const result = await uploadFn();
      
      // Mark as complete
      this.uploadProgress.set(uploadId, 100);
      if (options.onProgress) {
        options.onProgress(100);
      }
      
      // Call completion callback
      if (options.onComplete) {
        options.onComplete(result);
      }
      
      return result;
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // Call error callback
      if (options.onError) {
        options.onError(errorObj);
      }
      
      throw errorObj;
    }
  }

  // Simulate upload progress
  private simulateProgress(uploadId: string, onProgress: (progress: number) => void): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Random increment between 5-20%
      
      if (progress >= 90) {
        progress = 90; // Don't go to 100% until actually complete
        clearInterval(interval);
      }
      
      this.uploadProgress.set(uploadId, progress);
      onProgress(progress);
    }, 200 + Math.random() * 300); // Random interval between 200-500ms
  }

  // Get upload progress for a specific upload
  getUploadProgress(uploadId: string): number {
    return this.uploadProgress.get(uploadId) || 0;
  }

  // Check if upload is active
  isUploadActive(uploadId: string): boolean {
    return this.activeUploads.has(uploadId);
  }

  // Cancel an active upload
  cancelUpload(uploadId: string): boolean {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      this.activeUploads.delete(uploadId);
      this.uploadProgress.delete(uploadId);
      return true;
    }
    return false;
  }

  // Get all active uploads
  getActiveUploads(): string[] {
    return Array.from(this.activeUploads.keys());
  }

  // Clear all uploads
  clearAllUploads(): void {
    this.activeUploads.clear();
    this.uploadProgress.clear();
  }
}

// Export singleton instance
export const backgroundUploadManager = BackgroundUploadManager.getInstance();

// Utility function for immediate preview + background upload
export async function backgroundUploadWithPreview(
  file: File,
  uploadFn: () => Promise<{ url: string; resource_type: string }>,
  options: BackgroundUploadOptions = {}
): Promise<BackgroundUploadResult> {
  return backgroundUploadManager.startBackgroundUpload(file, uploadFn, options);
}
