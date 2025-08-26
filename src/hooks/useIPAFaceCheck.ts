import { useState, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { createDetector, SupportedModels } from '@tensorflow-models/face-landmarks-detection';

export interface FaceEmbedding {
  vector: number[];
  timestamp: number;
  imageHash: string;
}

export interface IPACheckResult {
  similarity: number;
  passed: boolean;
  threshold: number;
  originalImage: string;
  generatedImage: string;
  originalEmbedding: FaceEmbedding;
  generatedEmbedding: FaceEmbedding;
  timestamp: number;
  // NEW: Extended identity preservation details
  animalPreservation: number;
  groupPreservation: number;
  genderPreservation: number;
  facePreservation: number;
}

export interface IPALogEntry {
  id: string;
  timestamp: number;
  presetId: string;
  fxType: 'emotionMask' | 'ghibliReaction' | 'neoTokyoGlitch' | 'preset' | 'custom';
  originalImage: string;
  generatedImage: string;
  similarity: number;
  passed: boolean;
  threshold: number;
  metadata: {
    prompt: string;
    strength: number;
    model: string;
    processingTime: number;
  };
}

export interface IPAStyleFailure {
  styleId: string;
  fxType: string;
  failureCount: number;
  lastFailure: number;
  totalAttempts: number;
  averageSimilarity: number;
  needsRefinement: boolean;
}

export interface IPAState {
  isChecking: boolean;
  lastCheck: IPACheckResult | null;
  checkHistory: IPACheckResult[];
  failureLog: IPALogEntry[];
  styleFailures: IPAStyleFailure[];
  threshold: number;
  isReady: boolean;
}

// Default threshold for face similarity (cosine similarity)
const DEFAULT_THRESHOLD = 0.35;

// Cosine similarity helper function
export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

// TensorFlow.js Face Landmarks Detection model loading state
let tfModel: any = null;
let isModelLoading = false;

export function useIPAFaceCheck(threshold: number = DEFAULT_THRESHOLD) {
  const [state, setState] = useState<IPAState>({
    isChecking: false,
    lastCheck: null,
    checkHistory: [],
    failureLog: [],
    styleFailures: [],
    threshold,
    isReady: false
  });

  const modelLoadPromise = useRef<Promise<any> | null>(null);

  // Load TensorFlow.js Face Landmarks Detection model
  const loadTFModel = useCallback(async (): Promise<any> => {
    if (tfModel) {
      return tfModel;
    }

    if (isModelLoading && modelLoadPromise.current) {
      return modelLoadPromise.current;
    }

    if (isModelLoading) {
      return new Promise((resolve, reject) => {
        const checkModel = () => {
          if (tfModel) {
            resolve(tfModel);
          } else if (isModelLoading) {
            setTimeout(checkModel, 100);
          } else {
            reject(new Error('Model loading failed'));
          }
        };
        checkModel();
      });
    }

    isModelLoading = true;
    
    try {
      // Set TensorFlow.js backend
      await tf.setBackend('webgl');
      
      // Load face landmarks detection model
      const model = await createDetector(SupportedModels.FaceLandmarks);

      // Store model and update state
      tfModel = model;
      setState(prev => ({ ...prev, isReady: true }));
      return model;
    } catch (error) {
      console.error('Failed to load TensorFlow.js Face Landmarks Detection model:', error);
      isModelLoading = false;
      throw error;
    } finally {
      isModelLoading = false;
    }
  }, []);

  // Extract face embedding from image using TensorFlow.js
  const extractFaceEmbedding = useCallback(async (imageUrl: string): Promise<FaceEmbedding> => {
    const model = await loadTFModel();
    
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
          const predictions = await model.estimateFaces({ input: img });
          
          if (!predictions || predictions.length === 0) {
            reject(new Error('No faces detected in image'));
            return;
          }
          
          // Check for identity hallucination (multiple faces)
          if (predictions.length > 1) {
            console.warn(`⚠️ Multiple faces detected (${predictions.length}) - possible identity hallucination`);
            // For now, use the first face but log the issue
            // In production, this could trigger immediate fallback
          }
          
          // Get the first (main) face
          const face = predictions[0];
          if (!face.keypoints) {
            reject(new Error('No keypoints detected'));
            return;
          }
          
          // Convert keypoints to pseudo-embedding vector
          // TensorFlow.js provides keypoints, we'll use them for identity
          const embedding = convertTensorFlowKeypointsToEmbedding(face.keypoints, canvas.width, canvas.height);
          
          // Generate simple hash for image
          const imageHash = await generateImageHash(canvas);
          
          const result: FaceEmbedding = {
            vector: embedding,
            timestamp: Date.now(),
            imageHash
          };
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }, [loadTFModel]);

  // Convert TensorFlow.js keypoints to pseudo-embedding vector
  const convertTensorFlowKeypointsToEmbedding = useCallback((keypoints: any[], imageWidth: number, imageHeight: number): number[] => {
    if (!keypoints || keypoints.length === 0) {
      throw new Error('No keypoints provided');
    }
    
    const pseudoEmbedding: number[] = [];
    
    // TensorFlow.js keypoints are already in the right format
    // Each keypoint has x, y, z coordinates
    keypoints.forEach((keypoint: any) => {
      // Normalize coordinates to [0, 1] range for consistent comparison
      const normalizedX = keypoint.x / imageWidth;
      const normalizedY = keypoint.y / imageHeight;
      
      // Add normalized coordinates to pseudo-embedding
      pseudoEmbedding.push(normalizedX);
      pseudoEmbedding.push(normalizedY);
      
      // Include Z coordinate for depth if available
      if (keypoint.z !== undefined) {
        const normalizedZ = (keypoint.z + 1) / 2; // Z ranges from -1 to 1, normalize to 0-1
        pseudoEmbedding.push(normalizedZ);
      } else {
        pseudoEmbedding.push(0); // Default Z if not available
      }
    });
    
    // Ensure consistent vector length by padding or truncating
    const targetLength = 150; // Target pseudo-embedding dimension
    
    if (pseudoEmbedding.length < targetLength) {
      // Pad with zeros if too short
      while (pseudoEmbedding.length < targetLength) {
        pseudoEmbedding.push(0);
      }
    } else if (pseudoEmbedding.length > targetLength) {
      // Truncate if too long
      pseudoEmbedding.splice(targetLength);
    }
    
    return pseudoEmbedding;
  }, []);

  // Generate simple image hash
  const generateImageHash = useCallback(async (canvas: HTMLCanvasElement): Promise<string> => {
    try {
      const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        return 'unknown';
      }
      
      // Simple hash based on pixel data
      let hash = 0;
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        hash = ((hash << 5) - hash + data[i] + data[i + 1] + data[i + 2]) & 0xffffffff;
      }
      
      return hash.toString(16);
    } catch (error) {
      console.warn('Failed to generate image hash:', error);
      return 'unknown';
    }
  }, []);

  // Calculate cosine similarity between two vectors
  const calculateCosineSimilarity = useCallback((vector1: number[], vector2: number[]): number => {
    if (vector1.length !== vector2.length) {
      throw new Error('Vector dimensions must match');
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }
    
    return dotProduct / (norm1 * norm2);
  }, []);

  // Perform IPA check
  const performIPACheck = useCallback(async (
    originalImageUrl: string,
    generatedImageUrl: string,
    metadata: {
      presetId?: string;
      fxType: 'emotionMask' | 'ghibliReaction' | 'neoTokyoGlitch' | 'preset' | 'custom';
      prompt: string;
      strength: number;
      model: string;
      processingTime: number;
    }
  ): Promise<IPACheckResult> => {
    setState(prev => ({ ...prev, isChecking: true }));
    
    try {
      const startTime = Date.now();
      
      // Extract embeddings from both images
      const [originalEmbedding, generatedEmbedding] = await Promise.all([
        extractFaceEmbedding(originalImageUrl),
        extractFaceEmbedding(generatedImageUrl)
      ]);
      
      // Calculate similarity
      const similarity = calculateCosineSimilarity(
        originalEmbedding.vector,
        generatedEmbedding.vector
      );
      
      // Check if similarity meets threshold
      const passed = similarity >= state.threshold;
      
      const result: IPACheckResult = {
        similarity,
        passed,
        threshold: state.threshold,
        originalImage: originalImageUrl,
        generatedImage: generatedImageUrl,
        originalEmbedding,
        generatedEmbedding,
        timestamp: Date.now()
      };
      
      // Log the check
      const logEntry: IPALogEntry = {
        id: `ipa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        presetId: metadata.presetId || 'unknown',
        fxType: metadata.fxType,
        originalImage: originalImageUrl,
        generatedImage: generatedImageUrl,
        similarity,
        passed,
        threshold: state.threshold,
        metadata: {
          prompt: metadata.prompt,
          strength: metadata.strength,
          model: metadata.model,
          processingTime: Date.now() - startTime
        }
      };
      
      // Update state
      setState(prev => ({
        ...prev,
        isChecking: false,
        lastCheck: result,
        checkHistory: [result, ...prev.checkHistory.slice(0, 49)], // Keep last 50
        failureLog: [logEntry, ...prev.failureLog.slice(0, 99)] // Keep last 100
      }));
      
      // Log failures for style refinement
      if (!passed) {
        logStyleFailure(metadata.fxType, metadata.presetId || 'unknown', similarity);
      }
      
      return result;
    } catch (error) {
      console.error('IPA check failed:', error);
      setState(prev => ({ ...prev, isChecking: false }));
      throw error;
    }
  }, [state.threshold, extractFaceEmbedding, calculateCosineSimilarity]);

  // Log style failures for refinement tracking
  const logStyleFailure = useCallback((fxType: string, styleId: string, similarity: number) => {
    setState(prev => {
      const existingFailure = prev.styleFailures.find(f => 
        f.styleId === styleId && f.fxType === fxType
      );
      
      if (existingFailure) {
        // Update existing failure record
        const updatedFailures = prev.styleFailures.map(f => {
          if (f.styleId === styleId && f.fxType === fxType) {
            return {
              ...f,
              failureCount: f.failureCount + 1,
              lastFailure: Date.now(),
              totalAttempts: f.totalAttempts + 1,
              averageSimilarity: (f.averageSimilarity * f.totalAttempts + similarity) / (f.totalAttempts + 1),
              needsRefinement: f.failureCount >= 2 // Mark for refinement after 3+ failures
            };
          }
          return f;
        });
        
        return { ...prev, styleFailures: updatedFailures };
      } else {
        // Create new failure record
        const newFailure: IPAStyleFailure = {
          styleId,
          fxType,
          failureCount: 1,
          lastFailure: Date.now(),
          totalAttempts: 1,
          averageSimilarity: similarity,
          needsRefinement: false
        };
        
        return {
          ...prev,
          styleFailures: [...prev.styleFailures, newFailure]
        };
      }
    });
  }, []);

  // Check if all 3 FX pass IPA (ready to scale)
  const checkReadinessToScale = useCallback((): boolean => {
    const recentChecks = state.checkHistory.slice(0, 10); // Last 10 checks
    const fxTypes = ['emotionMask', 'ghibliReaction', 'neoTokyoGlitch'];
    
    // Check if each FX type has at least one recent successful check
    const fxSuccess = fxTypes.every(fxType => {
      return recentChecks.some(check => {
        const logEntry = state.failureLog.find(log => 
          log.generatedImage === check.generatedImage
        );
        return logEntry?.fxType === fxType && logEntry.passed;
      });
    });
    
    return fxSuccess;
  }, [state.checkHistory, state.failureLog]);

  // Get styles that need refinement
  const getStylesNeedingRefinement = useCallback((): IPAStyleFailure[] => {
    return state.styleFailures.filter(style => style.needsRefinement);
  }, [state.styleFailures]);

  // Reset failure count for a style
  const resetStyleFailureCount = useCallback((styleId: string, fxType: string) => {
    setState(prev => ({
      ...prev,
      styleFailures: prev.styleFailures.map(style => {
        if (style.styleId === styleId && style.fxType === fxType) {
          return {
            ...style,
            failureCount: 0,
            needsRefinement: false
          };
        }
        return style;
      })
    }));
  }, []);

  // Update threshold
  const updateThreshold = useCallback((newThreshold: number) => {
    setState(prev => ({ ...prev, threshold: newThreshold }));
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      checkHistory: [],
      failureLog: [],
      styleFailures: []
    }));
  }, []);

  // Identity preservation check function
  const checkIdentityPreservation = useCallback(async ({
    originalUrl,
    generatedUrl,
    threshold: customThreshold = threshold,
  }: {
    originalUrl: string;
    generatedUrl: string;
    threshold?: number;
  }): Promise<{
    similarity: number;
    passed: boolean;
    originalEmbedding?: FaceEmbedding;
    generatedEmbedding?: FaceEmbedding;
  }> => {
    try {
      const orig = await extractFaceEmbedding(originalUrl);
      const gen = await extractFaceEmbedding(generatedUrl);
      const similarity = cosineSimilarity(orig.vector, gen.vector);
      
      return {
        similarity,
        passed: similarity >= customThreshold,
        originalEmbedding: orig,
        generatedEmbedding: gen,
      };
    } catch (err) {
      console.warn('IPA check failed', err);
      return {
        similarity: 0,
        passed: false,
      };
    }
  }, [extractFaceEmbedding, threshold]);

  // Build face mask from TensorFlow.js keypoints
  const buildFaceMask = useCallback(async (
    imageUrl: string, 
    featherSize: number = 12
  ): Promise<{ mask: ImageData; landmarks: any[] }> => {
    const model = await loadTFModel();
    
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
          
          // Get face keypoints using TensorFlow.js
          const predictions = await model.estimateFaces({ input: img });
          
          if (!predictions || predictions.length === 0) {
            reject(new Error('No faces detected for mask creation'));
            return;
          }
          
          const face = predictions[0];
          if (!face.keypoints) {
            reject(new Error('No keypoints detected for mask creation'));
            return;
          }
          
          // Create face mask from keypoints
          const maskCanvas = document.createElement('canvas');
          const maskCtx = maskCanvas.getContext('2d')!;
          maskCanvas.width = canvas.width;
          maskCanvas.height = canvas.height;
          
          // Create face mask path from keypoints
          maskCtx.fillStyle = 'white';
          maskCtx.beginPath();
          
          // Use keypoints to create face outline
          face.keypoints.forEach((keypoint: any, i: number) => {
            const x = keypoint.x;
            const y = keypoint.y;
            if (i === 0) maskCtx.moveTo(x, y);
            else maskCtx.lineTo(x, y);
          });
          
          maskCtx.closePath();
          maskCtx.fill();
          
          // Apply feathering with blur
          if (featherSize > 0) {
            maskCtx.filter = `blur(${featherSize}px)`;
            maskCtx.globalCompositeOperation = 'source-atop';
            maskCtx.drawImage(maskCanvas, 0, 0);
          }
          
          const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
          
          resolve({
            mask: maskData,
            landmarks: face.keypoints
          });
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image for mask'));
      img.src = imageUrl;
    });
  }, [loadTFModel]);

  // Blend original face with AI output
  const blendOriginalFace = useCallback(async (
    originalImageUrl: string,
    aiOutputUrl: string,
    featherSize: number = 12
  ): Promise<string> => {
    try {
      // Load both images
      const [originalImg, aiImg] = await Promise.all([
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = originalImageUrl;
        }),
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = aiOutputUrl;
        })
      ]);
      
      // Create final canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = aiImg.width;
      canvas.height = aiImg.height;
      
      // Get face mask from original image
      const { mask: faceMask } = await buildFaceMask(originalImageUrl, featherSize);
      
      // Draw AI output as base
      ctx.drawImage(aiImg, 0, 0);
      const aiImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Resize and draw original image
      ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
      const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Blend pixels using face mask
      for (let i = 0; i < aiImageData.data.length; i += 4) {
        // Use red channel of mask as alpha (assuming white mask)
        const maskAlpha = faceMask.data[i] / 255;
        
        // Blend: final = aiOutput * (1 - maskAlpha) + original * maskAlpha
        aiImageData.data[i] = aiImageData.data[i] * (1 - maskAlpha) + originalImageData.data[i] * maskAlpha;
        aiImageData.data[i + 1] = aiImageData.data[i + 1] * (1 - maskAlpha) + originalImageData.data[i + 1] * maskAlpha;
        aiImageData.data[i + 2] = aiImageData.data[i + 2] * (1 - maskAlpha) + originalImageData.data[i + 2] * maskAlpha;
      }
      
      // Put blended result back
      ctx.putImageData(aiImageData, 0, 0);
      
      // Return as data URL
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (error) {
      console.error('Face blending failed:', error);
      throw error;
    }
  }, [buildFaceMask]);

  return {
    // State
    ...state,
    
    // Actions
    performIPACheck,
    loadTFModel,
    extractFaceEmbedding,
    calculateCosineSimilarity,
    checkReadinessToScale,
    getStylesNeedingRefinement,
    resetStyleFailureCount,
    updateThreshold,
    clearHistory,
    checkIdentityPreservation,
    buildFaceMask,
    blendOriginalFace
  };
}
