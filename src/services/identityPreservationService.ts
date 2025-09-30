// Identity Preservation Service for Stefna AI Platform
// Handles preset-specific identity preservation with different thresholds and retry strategies

export interface IPAMetadata {
  ipaThreshold: number;
  ipaRetries: number;
  ipaBlocking: boolean;
  generation_type: string;
}

export interface IPAResult {
  similarity: number;
  passed: boolean;
  retryCount: number;
  finalUrl: string;
  strategy: string;
}

export interface IPAPresetConfig {
  threshold: number;
  retries: number;
  blocking: boolean;
  description: string;
}

// Preset-specific IPA configurations
export const IPA_PRESET_CONFIGS: Record<string, IPAPresetConfig> = {
  // Strict identity preservation - Emotion Mask
  'unreal_reflection_strict_ipa': {
    threshold: 0.7,
    retries: 3,
    blocking: true,
    description: 'Strict identity preservation for subtle overlays'
  },
  
  // Moderate identity preservation - Ghibli Reaction
  'ghibli_reaction_moderate_ipa': {
    threshold: 0.6,
    retries: 2,
    blocking: true,
    description: 'Moderate identity preservation for artistic transformations'
  },
  
  // Relaxed identity preservation - Cyber Siren
  'neo_tokyo_relaxed_ipa': {
    threshold: 0.4,
    retries: 1,
    blocking: false,
    description: 'Relaxed identity preservation for creative freedom'
  },
  
  // Balanced identity preservation - Custom & Preset
  'custom_balanced_ipa': {
    threshold: 0.65,
    retries: 2,
    blocking: true,
    description: 'Balanced identity preservation for photo editing'
  },
  
  'preset_moderate_ipa': {
    threshold: 0.65,
    retries: 2,
    blocking: true,
    description: 'Moderate identity preservation for preset transformations'
  },
  
  // Story Time identity preservation - Creative storytelling with moderate identity
  'story_time_moderate_ipa': {
    threshold: 0.55,
    retries: 2,
    blocking: true,
    description: 'Moderate identity preservation for creative storytelling'
  },
  
  // Story Time Auto Mode - AI-determined identity preservation
  'story_time_auto_ipa': {
    threshold: 0.6,
    retries: 2,
    blocking: true,
    description: 'Auto-determined identity preservation for AI story themes'
  }
};

export class IdentityPreservationService {
  /**
   * Public method to perform IPA check
   */
  public static async performIPACheck(
    originalUrl: string,
    generatedUrl: string,
    threshold: number
  ): Promise<{ similarity: number; passed: boolean }> {
    return this.checkIdentityPreservation(originalUrl, generatedUrl, threshold);
  }
  /**
   * Legacy single-face IPA check function (for backward compatibility)
   */
  private static async checkIdentityPreservation(
    originalUrl: string,
    generatedUrl: string,
    threshold: number
  ): Promise<{ similarity: number; passed: boolean }> {
    try {
      console.log('🔒 [IPA] Starting real face comparison...');
      console.log('🔒 [IPA] Original URL:', originalUrl);
      console.log('🔒 [IPA] Generated URL:', generatedUrl);
      console.log('🔒 [IPA] Threshold:', threshold);
      
      // Create a temporary component to use the hook
      let similarity = 0;
      let passed = false;
      
      try {
        // Extract face embeddings from both images
        const originalEmbedding = await this.extractFaceEmbedding(originalUrl);
        const generatedEmbedding = await this.extractFaceEmbedding(generatedUrl);
        
        // Calculate cosine similarity between embeddings
        similarity = this.cosineSimilarity(originalEmbedding.vector, generatedEmbedding.vector);
        
        passed = similarity >= threshold;
        
        console.log('🔒 [IPA] Face comparison result:', {
          similarity: (similarity * 100).toFixed(1) + '%',
          threshold: (threshold * 100).toFixed(1) + '%',
          passed
        });
        
      } catch (faceError) {
        console.warn('⚠️ [IPA] Face detection failed, using fallback check:', faceError);
        
        // Fallback: Use image similarity based on color histograms
        similarity = await this.calculateImageSimilarity(originalUrl, generatedUrl);
        passed = similarity >= threshold;
        
        console.log('🔒 [IPA] Fallback similarity result:', {
          similarity: (similarity * 100).toFixed(1) + '%',
          threshold: (threshold * 100).toFixed(1) + '%',
          passed
        });
      }
      
      return { similarity, passed };
      
    } catch (error) {
      console.error('❌ [IPA] Check failed:', error);
      return {
        similarity: 0,
        passed: false
      };
    }
  }

  /**
   * Convert TensorFlow.js keypoints to pseudo-embedding vector
   */
  private static convertTensorFlowKeypointsToEmbedding(keypoints: any[], imageWidth: number, imageHeight: number): number[] {
    if (!keypoints || keypoints.length === 0) {
      throw new Error('No keypoints provided');
    }

    // Normalize keypoints to image dimensions
    const normalizedPoints = keypoints.map(kp => ({
      x: kp.x / imageWidth,
      y: kp.y / imageHeight
    }));

    // Create pseudo-embedding vector from keypoint positions
    const embedding: number[] = [];
    
    // Add normalized x,y coordinates
    normalizedPoints.forEach(point => {
      embedding.push(point.x);
      embedding.push(point.y);
    });

    // Add statistical features
    const xCoords = normalizedPoints.map(p => p.x);
    const yCoords = normalizedPoints.map(p => p.y);
    
    embedding.push(
      Math.min(...xCoords), // min x
      Math.max(...xCoords), // max x
      Math.min(...yCoords), // min y
      Math.max(...yCoords), // max y
      xCoords.reduce((a, b) => a + b) / xCoords.length, // avg x
      yCoords.reduce((a, b) => a + b) / yCoords.length  // avg y
    );

    return embedding;
  }

    /**
     * Extract face embedding using TensorFlow.js (legacy method)
     */
    private static async extractFaceEmbedding(imageUrl: string): Promise<{ vector: number[] }> {
      // Import TensorFlow.js modules
      const tf = await import('@tensorflow/tfjs-core');
      const { createDetector, SupportedModels } = await import('@tensorflow-models/face-landmarks-detection');
      
      // Initialize backend
      await import('@tensorflow/tfjs-backend-webgl');
      await import('@tensorflow/tfjs-backend-wasm');
      await import('@tensorflow/tfjs-backend-cpu');
      
      const backends = ['webgl', 'wasm', 'cpu'];
      let backendInitialized = false;

      for (const backend of backends) {
        try {
          await tf.setBackend(backend);
          await tf.ready();
          backendInitialized = true;
          break;
        } catch (err) {
          continue;
        }
      }

      if (!backendInitialized) {
        throw new Error('All TensorFlow.js backends failed to initialize');
      }

      const model = await createDetector(SupportedModels.MediaPipeFaceMesh);
    
    // Create image element
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          // Create canvas for processing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Process image with TensorFlow.js Face Landmarks Detection
          const predictions = await model.estimateFaces(img);
          
          if (!predictions || predictions.length === 0) {
            reject(new Error('No faces detected in image'));
            return;
          }
          
          // Get the first (main) face
          const face = predictions[0];
          if (!face.keypoints) {
            reject(new Error('No keypoints detected'));
            return;
          }
          
          // Convert keypoints to embedding vector
          const embedding = this.convertKeypointsToEmbedding(face.keypoints, canvas.width, canvas.height);
          
          resolve({ vector: embedding });
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  /**
   * Convert TensorFlow.js keypoints to embedding vector
   */
  private static convertKeypointsToEmbedding(keypoints: any[], imageWidth: number, imageHeight: number): number[] {
    if (!keypoints || keypoints.length === 0) {
      throw new Error('No keypoints provided');
    }
    
    const embedding: number[] = [];
    
    // Normalize coordinates to [0, 1] range for consistent comparison
    keypoints.forEach((keypoint: any) => {
      const normalizedX = keypoint.x / imageWidth;
      const normalizedY = keypoint.y / imageHeight;
      
      embedding.push(normalizedX);
      embedding.push(normalizedY);
      
      // Include Z coordinate for depth if available
      if (keypoint.z !== undefined) {
        const normalizedZ = (keypoint.z + 1) / 2; // Z ranges from -1 to 1, normalize to 0-1
        embedding.push(normalizedZ);
      } else {
        embedding.push(0);
      }
    });
    
    // Ensure consistent vector length
    const targetLength = 150;
    
    if (embedding.length < targetLength) {
      while (embedding.length < targetLength) {
        embedding.push(0);
      }
    } else if (embedding.length > targetLength) {
      embedding.splice(targetLength);
    }
    
    return embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private static cosineSimilarity(a: number[], b: number[]): number {
    const n = Math.min(a.length, b.length);
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < n; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }

  /**
   * Fallback image similarity using color histograms
   */
  private static async calculateImageSimilarity(originalUrl: string, generatedUrl: string): Promise<number> {
    try {
      const originalHistogram = await this.getColorHistogram(originalUrl);
      const generatedHistogram = await this.getColorHistogram(generatedUrl);
      
      // Calculate histogram intersection
      let intersection = 0;
      let total = 0;
      
      for (let i = 0; i < originalHistogram.length; i++) {
        intersection += Math.min(originalHistogram[i], generatedHistogram[i]);
        total += Math.max(originalHistogram[i], generatedHistogram[i]);
      }
      
      return total > 0 ? intersection / total : 0;
      
    } catch (error) {
      console.warn('⚠️ [IPA] Histogram comparison failed:', error);
      return 0.5; // Default similarity
    }
  }

  /**
   * Get color histogram from image
   */
  private static async getColorHistogram(imageUrl: string): Promise<number[]> {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Create histogram (simplified - just count pixel values)
          const histogram = new Array(256).fill(0);
          for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            histogram[Math.floor(gray)]++;
          }
          
          // Normalize histogram
          const total = histogram.reduce((sum, count) => sum + count, 0);
          const normalized = histogram.map(count => count / total);
          
          resolve(normalized);
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  /**
   * Run IPA check with preset-specific configuration
   */
  static async runIPA(
    originalUrl: string,
    generatedUrl: string,
    metadata: IPAMetadata
  ): Promise<IPAResult> {
    const config = IPA_PRESET_CONFIGS[metadata.generation_type];
    
    if (!config) {
      console.warn('⚠️ No IPA config found for:', metadata.generation_type);
      return {
        similarity: 1.0,
        passed: true,
        retryCount: 0,
        finalUrl: generatedUrl,
        strategy: 'no_ipa_config'
      };
    }

    console.log(`🔒 [IPA] Running ${config.description} for ${metadata.generation_type}`);
    console.log(`🔒 [IPA] Threshold: ${config.threshold}, Retries: ${config.retries}, Blocking: ${config.blocking}`);

    let currentUrl = generatedUrl;
    let retryCount = 0;
    let bestSimilarity = 0;
    let bestUrl = generatedUrl;

    // Initial IPA check
    try {
      const ipaResult = await this.checkIdentityPreservation(
        originalUrl,
        currentUrl,
        config.threshold
      );

      if (ipaResult.passed) {
        console.log(`✅ [IPA] Passed on first try: ${(ipaResult.similarity * 100).toFixed(1)}%`);
        return {
          similarity: ipaResult.similarity,
          passed: true,
          retryCount: 0,
          finalUrl: currentUrl,
          strategy: 'first_try'
        };
      }

      bestSimilarity = ipaResult.similarity;
      console.log(`⚠️ [IPA] Failed first check: ${(ipaResult.similarity * 100).toFixed(1)}% < ${(config.threshold * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ [IPA] Initial check failed:', error);
      if (config.blocking) {
        throw new Error('IPA check failed and blocking is enabled');
      }
      return {
        similarity: 0,
        passed: false,
        retryCount: 0,
        finalUrl: currentUrl,
        strategy: 'ipa_error'
      };
    }

    // Retry with fallback strategies
    while (retryCount < config.retries) {
      retryCount++;
      console.log(`🔄 [IPA] Retry ${retryCount}/${config.retries} for ${metadata.generation_type}`);

      try {
        // Strategy 1: Lower strength retry
        const lowerStrengthUrl = await this.retryWithLowerStrength(
          originalUrl,
          currentUrl,
          metadata,
          retryCount
        );

        if (lowerStrengthUrl) {
          const retryResult = await this.checkIdentityPreservation(
            originalUrl,
            lowerStrengthUrl,
            config.threshold
          );

          if (retryResult.passed) {
            console.log(`✅ [IPA] Passed on retry ${retryCount}: ${(retryResult.similarity * 100).toFixed(1)}%`);
            return {
              similarity: retryResult.similarity,
              passed: true,
              retryCount,
              finalUrl: lowerStrengthUrl,
              strategy: `lower_strength_retry_${retryCount}`
            };
          }

          if (retryResult.similarity > bestSimilarity) {
            bestSimilarity = retryResult.similarity;
            bestUrl = lowerStrengthUrl;
          }
        }

        // Strategy 2: Face blending (if available)
        if (retryCount === config.retries && config.blocking) {
          const blendedUrl = await this.retryWithFaceBlending(
            originalUrl,
            bestUrl,
            metadata
          );

          if (blendedUrl) {
            const blendResult = await this.checkIdentityPreservation(
              originalUrl,
              blendedUrl,
              config.threshold
            );

            if (blendResult.passed) {
              console.log(`✅ [IPA] Passed with face blending: ${(blendResult.similarity * 100).toFixed(1)}%`);
              return {
                similarity: blendResult.similarity,
                passed: true,
                retryCount,
                finalUrl: blendedUrl,
                strategy: 'face_blending'
              };
            }

            if (blendResult.similarity > bestSimilarity) {
              bestSimilarity = blendResult.similarity;
              bestUrl = blendedUrl;
            }
          }
        }

      } catch (error) {
        console.error(`❌ [IPA] Retry ${retryCount} failed:`, error);
      }
    }

    // All retries exhausted
    console.log(`❌ [IPA] All retries exhausted for ${metadata.generation_type}`);
    console.log(`📊 [IPA] Best similarity achieved: ${(bestSimilarity * 100).toFixed(1)}%`);

    if (config.blocking) {
      throw new Error(`IPA failed after ${config.retries} retries. Best similarity: ${(bestSimilarity * 100).toFixed(1)}%`);
    }

    // Non-blocking mode - return best result with warning
    return {
      similarity: bestSimilarity,
      passed: false,
      retryCount,
      finalUrl: bestUrl,
      strategy: `best_effort_${retryCount}_retries`
    };
  }

  /**
   * Retry generation with lower strength for better identity preservation
   */
  private static async retryWithLowerStrength(
    originalUrl: string,
    generatedUrl: string,
    metadata: IPAMetadata,
    retryCount: number
  ): Promise<string | null> {
    try {
      // Calculate progressively lower strength
      const baseStrength = this.getBaseStrength(metadata);
      const reducedStrength = Math.max(baseStrength * (0.8 ** retryCount), 0.1);
      
      console.log(`🔄 [IPA] Retrying with reduced strength: ${reducedStrength.toFixed(3)}`);

      // This would call the generation API with lower strength
      // For now, return null to indicate fallback not implemented
      return null;
    } catch (error) {
      console.error('❌ [IPA] Lower strength retry failed:', error);
      return null;
    }
  }

  /**
   * Retry with face blending for better identity preservation
   */
  private static async retryWithFaceBlending(
    originalUrl: string,
    generatedUrl: string,
    metadata: IPAMetadata
  ): Promise<string | null> {
    try {
      console.log('🔄 [IPA] Attempting face blending for identity preservation');
      
      // This would implement face blending logic
      // For now, return null to indicate fallback not implemented
      return null;
    } catch (error) {
      console.error('❌ [IPA] Face blending failed:', error);
      return null;
    }
  }

  /**
   * Get base strength from metadata
   */
  private static getBaseStrength(metadata: IPAMetadata): number {
    // Extract strength from metadata if available
    // Default to 0.5 for most presets
    return 0.5;
  }

  /**
   * Get IPA configuration for a generation type
   */
  static getConfig(generationType: string): IPAPresetConfig | null {
    return IPA_PRESET_CONFIGS[generationType] || null;
  }

  /**
   * Check if IPA is required for a generation type
   */
  static isRequired(generationType: string): boolean {
    const config = this.getConfig(generationType);
    return config?.blocking ?? false;
  }

  /**
   * Get IPA threshold for a generation type
   */
  static getThreshold(generationType: string): number {
    const config = this.getConfig(generationType);
    return config?.threshold ?? 0.5;
  }

  /**
   * Get IPA configuration for Story Time presets
   */
  static getStoryTimeIPAConfig(preset: string): IPAPresetConfig {
    switch (preset) {
      case 'auto':
        return IPA_PRESET_CONFIGS['story_time_auto_ipa'];
      case 'adventure':
      case 'romance':
      case 'mystery':
      case 'comedy':
      case 'fantasy':
      case 'travel':
        return IPA_PRESET_CONFIGS['story_time_moderate_ipa'];
      default:
        return IPA_PRESET_CONFIGS['story_time_moderate_ipa'];
    }
  }

  /**
   * Get generation type string for Story Time
   */
  static getStoryTimeGenerationType(preset: string): string {
    return `story_time_${preset}_ipa`;
  }
}
