import * as tf from '@tensorflow/tfjs-node';
import { createDetector, SupportedModels } from '@tensorflow-models/face-landmarks-detection';

interface FaceEmbedding {
  vector: number[];
  confidence: number;
  keypoints: any[];
}

interface IPACheckResult {
  similarity: number;
  passed: boolean;
  method: string;
  fallbackUsed: boolean;
  attemptCount: number;
  qualityScore: number;
  facePreservation: number;
  animalPreservation: number;
  groupPreservation: number;
  genderPreservation: number;
}

// Load TensorFlow.js model
let detector: any = null;

async function loadModel() {
  if (!detector) {
    console.log('🤖 [TensorFlow] Loading face landmarks detection model...');
    detector = await createDetector(SupportedModels.MediaPipeFaceMesh, {
      runtime: 'tfjs',
      refineLandmarks: true,
      maxFaces: 1
    });
    console.log('✅ [TensorFlow] Model loaded successfully');
  }
  return detector;
}

// Extract face embedding from image URL
async function extractFaceEmbedding(imageUrl: string): Promise<FaceEmbedding> {
  try {
    console.log(`🔍 [TensorFlow] Extracting face embedding from: ${imageUrl.substring(0, 50)}...`);
    
    // Load image using TensorFlow.js
    const image = await tf.node.decodeImage(await fetch(imageUrl).then(r => r.arrayBuffer()));
    
    // Get face landmarks
    const model = await loadModel();
    const predictions = await model.estimateFaces(image);
    
    if (!predictions || predictions.length === 0) {
      throw new Error('No faces detected');
    }
    
    const face = predictions[0];
    if (!face.keypoints) {
      throw new Error('No keypoints detected');
    }
    
    // Convert keypoints to embedding vector
    const embedding = convertKeypointsToEmbedding(face.keypoints, image.shape[1], image.shape[0]);
    
    // Clean up
    tf.dispose(image);
    
    console.log(`✅ [TensorFlow] Face embedding extracted: ${embedding.length} dimensions`);
    
    return {
      vector: embedding,
      confidence: face.keypoints.length / 468, // Normalize by expected keypoints
      keypoints: face.keypoints
    };
    
  } catch (error) {
    console.error('❌ [TensorFlow] Failed to extract face embedding:', error);
    throw error;
  }
}

// Convert TensorFlow.js keypoints to embedding vector
function convertKeypointsToEmbedding(keypoints: any[], imageWidth: number, imageHeight: number): number[] {
  const embedding: number[] = [];
  
  // Normalize keypoints by image dimensions
  for (const keypoint of keypoints) {
    embedding.push(keypoint.x / imageWidth);
    embedding.push(keypoint.y / imageHeight);
  }
  
  // Add additional features
  if (keypoints.length > 0) {
    // Face bounding box
    const xs = keypoints.map(kp => kp.x);
    const ys = keypoints.map(kp => kp.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    embedding.push(minX / imageWidth);
    embedding.push(maxX / imageWidth);
    embedding.push(minY / imageHeight);
    embedding.push(maxY / imageHeight);
    
    // Face aspect ratio
    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;
    embedding.push(faceWidth / faceHeight);
  }
  
  return embedding;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Main TensorFlow.js IPA check function
export async function checkTensorFlowIPA(
  originalImageUrl: string,
  generatedImageUrl: string,
  threshold: number = 0.6
): Promise<IPACheckResult> {
  console.log('🔒 [TensorFlow] Starting TensorFlow.js identity preservation check...');
  
  try {
    // Extract face embeddings
    const originalEmbedding = await extractFaceEmbedding(originalImageUrl);
    const generatedEmbedding = await extractFaceEmbedding(generatedImageUrl);
    
    // Calculate similarity
    const similarity = cosineSimilarity(originalEmbedding.vector, generatedEmbedding.vector);
    const passed = similarity >= threshold;
    
    // Calculate quality score based on confidence and similarity
    const qualityScore = (originalEmbedding.confidence + generatedEmbedding.confidence) / 2 * similarity;
    
    console.log(`🔒 [TensorFlow] IPA check completed: ${(similarity * 100).toFixed(1)}% similarity, threshold: ${(threshold * 100).toFixed(1)}%, passed: ${passed}`);
    
    return {
      similarity,
      passed,
      method: 'tensorflow_face_landmarks',
      fallbackUsed: false,
      attemptCount: 1,
      qualityScore,
      facePreservation: similarity,
      animalPreservation: similarity, // Same as face for now
      groupPreservation: similarity, // Same as face for now
      genderPreservation: similarity // Same as face for now
    };
    
  } catch (error) {
    console.error('❌ [TensorFlow] IPA check failed:', error);
    
    // Return failed result
    return {
      similarity: 0,
      passed: false,
      method: 'tensorflow_face_landmarks',
      fallbackUsed: false,
      attemptCount: 1,
      qualityScore: 0,
      facePreservation: 0,
      animalPreservation: 0,
      groupPreservation: 0,
      genderPreservation: 0
    };
  }
}
