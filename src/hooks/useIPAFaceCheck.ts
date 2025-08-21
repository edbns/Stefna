import { useState, useCallback, useRef } from 'react';

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

// MediaPipe Face Mesh model loading state
let faceMeshModel: any = null;
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

  // Load MediaPipe Face Mesh model
  const loadFaceMeshModel = useCallback(async (): Promise<any> => {
    if (faceMeshModel) {
      return faceMeshModel;
    }

    if (isModelLoading && modelLoadPromise.current) {
      return modelLoadPromise.current;
    }

    if (isModelLoading) {
      return new Promise((resolve, reject) => {
        const checkModel = () => {
          if (faceMeshModel) {
            resolve(faceMeshModel);
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
      // Dynamic import of MediaPipe Face Mesh
      const { FaceMesh } = await import('@mediapipe/face_mesh');
      const { Camera } = await import('@mediapipe/camera_utils');
      const { drawConnectors } = await import('@mediapipe/drawing_utils');
      
      // Initialize Face Mesh
      const faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      // Configure Face Mesh
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      // Wait for model to load
      await new Promise<void>((resolve) => {
        faceMesh.onResults(() => {
          resolve();
        });
      });

      faceMeshModel = faceMesh;
      setState(prev => ({ ...prev, isReady: true }));
      return faceMesh;
    } catch (error) {
      console.error('Failed to load MediaPipe Face Mesh model:', error);
      isModelLoading = false;
      throw error;
    } finally {
      isModelLoading = false;
    }
  }, []);

  // Extract face embedding from image using MediaPipe
  const extractFaceEmbedding = useCallback(async (imageUrl: string): Promise<FaceEmbedding> => {
    const model = await loadFaceMeshModel();
    
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
          
          // Process image with MediaPipe Face Mesh
          const results = await new Promise<any>((resolveResults) => {
            model.onResults((results: any) => {
              resolveResults(results);
            });
            
            // Send image to MediaPipe
            model.send({ image: canvas });
          });
          
          if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            reject(new Error('No faces detected in image'));
            return;
          }
          
          // Get the first (main) face landmarks
          const landmarks = results.multiFaceLandmarks[0];
          
          // Convert landmarks to pseudo-embedding vector
          // MediaPipe provides 468 3D points, we'll select key landmarks for identity
          const embedding = convertLandmarksToPseudoEmbedding(landmarks, canvas.width, canvas.height);
          
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
  }, [loadFaceMeshModel]);

  // Convert MediaPipe landmarks to pseudo-embedding vector
  const convertLandmarksToPseudoEmbedding = useCallback((landmarks: any[], imageWidth: number, imageHeight: number): number[] => {
    if (!landmarks || landmarks.length === 0) {
      throw new Error('No landmarks provided');
    }
    
    // Select key facial landmarks for identity comparison
    // Focus on eyes, nose, mouth, face outline, and key facial features
    const keyLandmarkIndices = [
      // Face outline (jawline) - key for face shape
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
      
      // Eyes - crucial for identity
      33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
      
      // Nose - important for facial structure
      1, 2, 3, 4, 5, 6, 19, 20, 61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318,
      
      // Mouth - key for expression and identity
      61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318
    ];
    
    const pseudoEmbedding: number[] = [];
    
    keyLandmarkIndices.forEach(index => {
      if (landmarks[index]) {
        const landmark = landmarks[index];
        
        // Normalize coordinates to [0, 1] range for consistent comparison
        const normalizedX = landmark.x / imageWidth;
        const normalizedY = landmark.y / imageHeight;
        
        // Add normalized coordinates to pseudo-embedding
        pseudoEmbedding.push(normalizedX);
        pseudoEmbedding.push(normalizedY);
        
        // Optionally include Z coordinate for depth (normalized)
        // const normalizedZ = (landmark.z + 1) / 2; // Z ranges from -1 to 1
        // pseudoEmbedding.push(normalizedZ);
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

  return {
    // State
    ...state,
    
    // Actions
    performIPACheck,
    loadFaceMeshModel,
    extractFaceEmbedding,
    calculateCosineSimilarity,
    checkReadinessToScale,
    getStylesNeedingRefinement,
    resetStyleFailureCount,
    updateThreshold,
    clearHistory,
    checkIdentityPreservation
  };
}
