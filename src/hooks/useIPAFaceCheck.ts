import { useState, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import '@tensorflow/tfjs-backend-cpu';
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
  fxType: 'unrealReflection' | 'ghibliReaction' | 'neoTokyoGlitch' | 'preset' | 'custom';
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
      // 🔧 FIX: Proper TensorFlow.js backend initialization with fallback
      const backends = ['webgl', 'wasm', 'cpu'];
      let backendInitialized = false;
      
      for (const backend of backends) {
        try {
          console.log(`[IPA] Attempting TFJS backend: ${backend}`);
          await tf.setBackend(backend);
          await tf.ready();
          console.log(`✅ [IPA] TFJS backend initialized: ${backend}`);
          backendInitialized = true;
          break;
        } catch (err) {
          console.warn(`⚠️ [IPA] Backend ${backend} failed:`, err);
          continue;
        }
      }
      
      if (!backendInitialized) {
        throw new Error('All TensorFlow.js backends failed to initialize');
      }
      
      // Load face landmarks detection model
      const model = await createDetector(SupportedModels.MediaPipeFaceMesh);

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
          const predictions = await model.estimateFaces(img);
          
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

  // Calculate animal preservation score using color histograms and edge detection
  const calculateAnimalPreservation = useCallback(async (imageUrl: string): Promise<number> => {
    try {
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
            
            // Color histogram analysis
            const colorHistogram = new Array(256).fill(0);
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
              colorHistogram[gray]++;
            }
            
            // Edge detection using Sobel operator
            const edgeData = new Uint8ClampedArray(data.length);
            for (let y = 1; y < canvas.height - 1; y++) {
              for (let x = 1; x < canvas.width - 1; x++) {
                const idx = (y * canvas.width + x) * 4;
                
                // Sobel X
                const gx = 
                  data[idx - 4] + 2 * data[idx] + data[idx + 4] -
                  data[idx - 4 + canvas.width * 4] - 2 * data[idx + canvas.width * 4] - data[idx + 4 + canvas.width * 4];
                
                // Sobel Y
                const gy = 
                  data[idx - canvas.width * 4] + 2 * data[idx + canvas.width * 4] + data[idx + canvas.width * 4 + 4] -
                  data[idx - 4] - 2 * data[idx + 4] - data[idx + 4 + canvas.width * 4];
                
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const edgeValue = Math.min(255, magnitude / 4);
                
                edgeData[idx] = edgeValue;
                edgeData[idx + 1] = edgeValue;
                edgeData[idx + 2] = edgeValue;
                edgeData[idx + 3] = data[idx + 3];
              }
            }
            
            // Calculate edge density
            let edgePixels = 0;
            for (let i = 0; i < edgeData.length; i += 4) {
              if (edgeData[i] > 50) edgePixels++;
            }
            const edgeDensity = edgePixels / (canvas.width * canvas.height);
            
            // Combine color histogram and edge analysis for animal preservation score
            // Higher score = better preservation of animal features
            const colorVariety = colorHistogram.filter(count => count > 0).length / 256;
            const edgePreservation = Math.min(1, edgeDensity * 10); // Normalize edge density
            
            const animalScore = (colorVariety * 0.6 + edgePreservation * 0.4);
            resolve(Math.min(1, Math.max(0, animalScore)));
            
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => reject(new Error('Failed to load image for animal analysis'));
        img.src = imageUrl;
      });
    } catch (error) {
      console.warn('Animal preservation calculation failed:', error);
      return 0.5; // Default fallback score
    }
  }, []);

  // Calculate group preservation score using face count and spatial analysis
  const calculateGroupPreservation = useCallback(async (imageUrl: string): Promise<number> => {
    try {
      const model = await loadTFModel();
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            // Detect faces in the image
            const predictions = await model.estimateFaces(img);
            
            if (!predictions || predictions.length === 0) {
              resolve(1.0); // No faces = perfect group preservation
              return;
            }
            
            const faceCount = predictions.length;
            
            // Spatial positioning analysis
            const facePositions = predictions.map((face: any) => {
              if (face.keypoints && face.keypoints.length > 0) {
                // Calculate center of face using keypoints
                let centerX = 0, centerY = 0;
                let validPoints = 0;
                
                face.keypoints.forEach((kp: any) => {
                  if (kp.x !== undefined && kp.y !== undefined) {
                    centerX += kp.x;
                    centerY += kp.y;
                    validPoints++;
                  }
                });
                
                if (validPoints > 0) {
                  return {
                    x: centerX / validPoints,
                    y: centerY / validPoints
                  };
                }
              }
              return null;
            }).filter((pos: any) => pos !== null);
            
            // Calculate group density and spacing
            let totalDistance = 0;
            let distanceCount = 0;
            
            for (let i = 0; i < facePositions.length; i++) {
              for (let j = i + 1; j < facePositions.length; j++) {
                const pos1 = facePositions[i];
                const pos2 = facePositions[j];
                if (pos1 && pos2) {
                  const distance = Math.sqrt(
                    Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
                  );
                  totalDistance += distance;
                  distanceCount++;
                }
              }
            }
            
            const avgDistance = distanceCount > 0 ? totalDistance / distanceCount : 0;
            const imageDiagonal = Math.sqrt(img.width * img.width + img.height * img.height);
            const normalizedDistance = avgDistance / imageDiagonal;
            
            // Group preservation scoring:
            // - Single face: perfect preservation (1.0)
            // - Multiple faces: score based on spacing and count
            let groupScore = 1.0;
            
            if (faceCount > 1) {
              // Penalize very close faces (overlapping)
              if (normalizedDistance < 0.1) {
                groupScore *= 0.3;
              }
              // Penalize too many faces (crowding)
              if (faceCount > 4) {
                groupScore *= 0.7;
              }
              // Reward good spacing
              if (normalizedDistance > 0.2 && normalizedDistance < 0.8) {
                groupScore *= 1.2;
              }
            }
            
            resolve(Math.min(1, Math.max(0, groupScore)));
            
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => reject(new Error('Failed to load image for group analysis'));
        img.src = imageUrl;
      });
    } catch (error) {
      console.warn('Group preservation calculation failed:', error);
      return 0.8; // Default fallback score
    }
  }, [loadTFModel]);

  // Calculate gender preservation score (placeholder for future model integration)
  const calculateGenderPreservation = useCallback(async (imageUrl: string): Promise<number> => {
    try {
      // TODO: Integrate with gender detection model when available
      // For now, use basic image analysis as placeholder
      
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
            
            // Basic gender preservation placeholder using skin tone analysis
            // This is a simplified approach - replace with actual gender detection model
            let skinTonePixels = 0;
            let totalPixels = 0;
            
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              
              // Basic skin tone detection (simplified)
              if (r > 95 && g > 40 && b > 20 && 
                  Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                  Math.abs(r - g) > 15 && r > g && r > b) {
                skinTonePixels++;
              }
              totalPixels++;
            }
            
            const skinToneRatio = skinTonePixels / totalPixels;
            
            // Placeholder gender preservation score
            // In reality, this would use a trained gender detection model
            const genderScore = 0.7 + (skinToneRatio * 0.3); // Basic heuristic
            
            resolve(Math.min(1, Math.max(0, genderScore)));
            
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => reject(new Error('Failed to load image for gender analysis'));
        img.src = imageUrl;
      });
    } catch (error) {
      console.warn('Gender preservation calculation failed:', error);
      return 0.7; // Default fallback score
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

  // Calculate face preservation score (enhanced version of existing face detection)
  const calculateFacePreservation = useCallback(async (originalUrl: string, generatedUrl: string): Promise<number> => {
    try {
      // Use existing face detection logic
      const [originalEmbedding, generatedEmbedding] = await Promise.all([
        extractFaceEmbedding(originalUrl),
        extractFaceEmbedding(generatedUrl)
      ]);
      
      // Calculate similarity using existing cosine similarity
      const similarity = calculateCosineSimilarity(
        originalEmbedding.vector,
        generatedEmbedding.vector
      );
      
      // Enhanced face preservation scoring
      let faceScore = similarity;
      
      // Bonus for maintaining face count consistency
      try {
        const model = await loadTFModel();
        const [origImg, genImg] = await Promise.all([
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = originalUrl;
          }),
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = generatedUrl;
          })
        ]);
        
        const [origFaces, genFaces] = await Promise.all([
          model.estimateFaces(origImg),
          model.estimateFaces(genImg)
        ]);
        
        // Penalize if face count changes
        if (origFaces.length !== genFaces.length) {
          faceScore *= 0.8;
        }
        
        // Bonus for maintaining single face
        if (origFaces.length === 1 && genFaces.length === 1) {
          faceScore *= 1.1;
        }
        
      } catch (faceError) {
        console.warn('Face count analysis failed, using basic similarity:', faceError);
      }
      
      return Math.min(1, Math.max(0, faceScore));
      
    } catch (error) {
      console.warn('Face preservation calculation failed:', error);
      return 0.5; // Default fallback score
    }
  }, [extractFaceEmbedding, calculateCosineSimilarity, loadTFModel]);

  // Perform IPA check
  const performIPACheck = useCallback(async (
    originalImageUrl: string,
    generatedImageUrl: string,
    metadata: {
      presetId?: string;
      fxType: 'unrealReflection' | 'ghibliReaction' | 'neoTokyoGlitch' | 'preset' | 'custom';
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
      
      // Calculate preservation scores
      const animalPreservation = await calculateAnimalPreservation(originalImageUrl);
      const groupPreservation = await calculateGroupPreservation(originalImageUrl);
      const genderPreservation = await calculateGenderPreservation(originalImageUrl);
      const facePreservation = await calculateFacePreservation(originalImageUrl, generatedImageUrl);

      const result: IPACheckResult = {
        similarity,
        passed,
        threshold: state.threshold,
        originalImage: originalImageUrl,
        generatedImage: generatedImageUrl,
        originalEmbedding,
        generatedEmbedding,
        timestamp: Date.now(),
        animalPreservation,
        groupPreservation,
        genderPreservation,
        facePreservation
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
  }, [state.threshold, extractFaceEmbedding, calculateCosineSimilarity, calculateAnimalPreservation, calculateGroupPreservation, calculateGenderPreservation, calculateFacePreservation]);

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
    const fxTypes = ['unrealReflection', 'ghibliReaction', 'neoTokyoGlitch'];
    
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
          const predictions = await model.estimateFaces(img);
          
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
    blendOriginalFace,
    
    // Extended Protection Functions
    calculateAnimalPreservation,
    calculateGroupPreservation,
    calculateGenderPreservation,
    calculateFacePreservation
  };
}
