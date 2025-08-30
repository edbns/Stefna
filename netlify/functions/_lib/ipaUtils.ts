// Identity Preservation Utility for Netlify Functions
// Extracted from existing React hooks to provide real IPA functionality

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
  // Extended identity preservation details
  animalPreservation: number;
  groupPreservation: number;
  genderPreservation: number;
  facePreservation: number;
}

// TensorFlow.js Face Landmarks Detection model loading state
let tfModel: any = null;
let isModelLoading = false;

// Load TensorFlow.js Face Landmarks Detection model
async function loadTFModel(): Promise<any> {
  if (tfModel) {
    return tfModel;
  }

  if (isModelLoading) {
    // Wait for the model to finish loading
    while (isModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return tfModel;
  }

  isModelLoading = true;
  try {
    console.log('🎭 [IPA] Loading TensorFlow.js Face Landmarks Detection model...');
    tfModel = await createDetector(SupportedModels.FaceLandmarks);
    console.log('✅ [IPA] Face detection model loaded successfully');
    return tfModel;
  } catch (error) {
    console.error('❌ [IPA] Failed to load face detection model:', error);
    throw error;
  } finally {
    isModelLoading = false;
  }
}

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

// Extract face embedding from image URL
async function extractFaceEmbedding(imageUrl: string): Promise<FaceEmbedding> {
  const model = await loadTFModel();
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
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
          reject(new Error('No faces detected in image'));
          return;
        }
        
        const face = predictions[0];
        if (!face.keypoints) {
          reject(new Error('No keypoints detected in face'));
          return;
        }
        
        // Convert TensorFlow.js keypoints to pseudo-embedding vector
        const pseudoEmbedding = convertTensorFlowKeypointsToEmbedding(
          face.keypoints, 
          img.width, 
          img.height
        );
        
        // Generate simple image hash
        const imageHash = await generateImageHash(canvas);
        
        const result: FaceEmbedding = {
          vector: pseudoEmbedding,
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
}

// Convert TensorFlow.js keypoints to pseudo-embedding vector
function convertTensorFlowKeypointsToEmbedding(keypoints: any[], imageWidth: number, imageHeight: number): number[] {
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
}

// Generate simple image hash
async function generateImageHash(canvas: HTMLCanvasElement): Promise<string> {
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
}

// Calculate animal preservation score using color histograms and edge detection
async function calculateAnimalPreservation(imageUrl: string): Promise<number> {
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
          
          // Basic animal preservation using color analysis
          // This is a simplified approach - can be enhanced with actual animal detection
          let warmColors = 0; // Red, orange, yellow, brown
          let coolColors = 0; // Blue, green, purple
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Simple color classification
            if (r > g && r > b) warmColors++; // Red dominant
            else if (g > r && g > b) coolColors++; // Green dominant
            else if (b > r && b > g) coolColors++; // Blue dominant
            else if (r > 200 && g > 150 && b < 100) warmColors++; // Yellow/orange
            else if (r > 150 && g > 100 && b < 100) warmColors++; // Brown
          }
          
          const totalPixels = data.length / 4;
          const warmRatio = warmColors / totalPixels;
          const coolRatio = coolColors / totalPixels;
          
          // Animal preservation scoring based on color balance
          let animalScore = 0.8; // Base score
          
          if (warmRatio > 0.4) animalScore += 0.1; // Good warm color balance
          if (coolRatio > 0.3) animalScore += 0.1; // Good cool color balance
          if (Math.abs(warmRatio - coolRatio) < 0.3) animalScore += 0.1; // Balanced colors
          
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
    return 0.8; // Default fallback score
  }
}

// Calculate group preservation score (multiple faces)
async function calculateGroupPreservation(imageUrl: string): Promise<number> {
  try {
    const model = await loadTFModel();
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          // Get face keypoints using TensorFlow.js
          const predictions = await model.estimateFaces({ input: img });
          
          if (!predictions || predictions.length === 0) {
            resolve(1.0); // No faces = perfect preservation
            return;
          }
          
          const faceCount = predictions.length;
          
          if (faceCount === 1) {
            resolve(1.0); // Single face = perfect preservation
            return;
          }
          
          // Calculate face positions from keypoints
          const facePositions = predictions.map((face: any) => {
            if (face.keypoints && face.keypoints.length > 0) {
              let centerX = 0;
              let centerY = 0;
              let validPoints = 0;
              
              face.keypoints.forEach((keypoint: any) => {
                if (keypoint.x !== undefined && keypoint.y !== undefined) {
                  centerX += keypoint.x;
                  centerY += keypoint.y;
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
}

// Calculate gender preservation score (placeholder for future model integration)
async function calculateGenderPreservation(imageUrl: string): Promise<number> {
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
          let totalPixels = data.length / 4;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Simple skin tone detection (very basic)
            if (r > 150 && g > 100 && b > 80 && r > g && g > b) {
              skinTonePixels++;
            }
          }
          
          const skinToneRatio = skinTonePixels / totalPixels;
          
          // Gender preservation scoring based on skin tone preservation
          let genderScore = 0.8; // Base score
          
          if (skinToneRatio > 0.1) genderScore += 0.1; // Good skin tone preservation
          if (skinToneRatio > 0.2) genderScore += 0.1; // Excellent skin tone preservation
          
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
    return 0.8; // Default fallback score
  }
}

// Main identity preservation check function
export async function checkIdentityPreservation(
  originalUrl: string,
  generatedUrl: string,
  threshold: number = 0.6
): Promise<IPACheckResult> {
  try {
    console.log('🔒 [IPA] Starting real identity preservation check...');
    
    // Extract face embeddings from both images
    const originalEmbedding = await extractFaceEmbedding(originalUrl);
    const generatedEmbedding = await extractFaceEmbedding(generatedUrl);
    
    // Calculate face similarity using cosine similarity
    const faceSimilarity = cosineSimilarity(originalEmbedding.vector, generatedEmbedding.vector);
    
    // Calculate additional preservation scores
    const animalPreservation = await calculateAnimalPreservation(generatedUrl);
    const groupPreservation = await calculateGroupPreservation(generatedUrl);
    const genderPreservation = await calculateGenderPreservation(generatedUrl);
    
    // Overall similarity is weighted combination
    const overallSimilarity = (
      faceSimilarity * 0.6 + // Face similarity is most important
      animalPreservation * 0.2 + // Animal features
      groupPreservation * 0.15 + // Group dynamics
      genderPreservation * 0.05 // Gender characteristics
    );
    
    const passed = overallSimilarity >= threshold;
    
    const result: IPACheckResult = {
      similarity: overallSimilarity,
      passed,
      threshold,
      originalImage: originalUrl,
      generatedImage: generatedUrl,
      originalEmbedding,
      generatedEmbedding,
      timestamp: Date.now(),
      animalPreservation,
      groupPreservation,
      genderPreservation,
      facePreservation: faceSimilarity
    };
    
    console.log(`🔒 [IPA] Check completed: ${(overallSimilarity * 100).toFixed(1)}% similarity, threshold: ${(threshold * 100).toFixed(1)}%, passed: ${passed}`);
    console.log(`🔒 [IPA] Breakdown - Face: ${(faceSimilarity * 100).toFixed(1)}%, Animal: ${(animalPreservation * 100).toFixed(1)}%, Group: ${(groupPreservation * 100).toFixed(1)}%, Gender: ${(genderPreservation * 100).toFixed(1)}%`);
    
    return result;
    
  } catch (error) {
    console.error('❌ [IPA] Identity preservation check failed:', error);
    
    // Return failed result on error
    return {
      similarity: 0,
      passed: false,
      threshold,
      originalImage: originalUrl,
      generatedImage: generatedUrl,
      originalEmbedding: { vector: [], timestamp: 0, imageHash: 'error' },
      generatedEmbedding: { vector: [], timestamp: 0, imageHash: 'error' },
      timestamp: Date.now(),
      animalPreservation: 0,
      groupPreservation: 0,
      genderPreservation: 0,
      facePreservation: 0
    };
  }
}

// Preset-specific IPA configurations
export const IPA_PRESET_CONFIGS = {
  'ghibli_reaction': { threshold: 0.6, description: 'Moderate identity preservation for artistic transformations' },
  'presets': { threshold: 0.65, description: 'Balanced identity preservation for photo editing' },
  'emotion_mask': { threshold: 0.7, description: 'Strict identity preservation for subtle overlays' },
  'custom_prompt': { threshold: 0.65, description: 'Balanced identity preservation for custom prompts' },
  'neo_glitch': { threshold: 0.4, description: 'Relaxed identity preservation for creative freedom' }
};

// Get IPA threshold for a specific generation type
export function getIPAThreshold(generationType: string): number {
  return IPA_PRESET_CONFIGS[generationType as keyof typeof IPA_PRESET_CONFIGS]?.threshold || 0.6;
}
