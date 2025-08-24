import { useRef } from 'react';
import '@tensorflow/tfjs-backend-webgl';
import { createDetector, SupportedModels } from '@tensorflow-models/face-landmarks-detection';

export interface FaceMaskOptions {
  includeEyes?: boolean;
  includeMouth?: boolean;
  includeEyebrows?: boolean;
  includeNose?: boolean;
  maskOpacity?: number;
  smoothEdges?: boolean;
}

export interface EmotionMaskOptions {
  enableCinematicLighting: boolean;
  enableSkinEnhancement: boolean;
  enableExpressionBoost: boolean;
  lightingIntensity: number; // 0.1-1.0
  skinSmoothing: number; // 0.1-1.0
  expressionIntensity: number; // 0.1-1.0
}

export interface EmotionMaskResult {
  processedImage: string;
  metadata: {
    effects: string[];
    intensity: number;
    timestamp: string;
  };
}

export function useEmotionMask() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateMaskFromImage = async (
    image: HTMLImageElement, 
    options: FaceMaskOptions = {}
  ) => {
    const {
      includeEyes = true,
      includeMouth = true,
      includeEyebrows = false,
      includeNose = false,
      maskOpacity = 0.8,
      smoothEdges = true
    } = options;

    return new Promise<HTMLCanvasElement>(async (resolve, reject) => {
      try {
        // Use TensorFlow.js face landmarks detection
        const detector = await createDetector(SupportedModels.FaceLandmarks);
        
        if (!detector) {
          throw new Error('Face detector not initialized');
        }

        // Detect face landmarks
        const faces = await detector.estimateFaces(image);
        
        if (!faces || faces.length === 0) {
          throw new Error('No face detected');
        }

        const landmarks = faces[0].keypoints;
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set mask properties
        ctx.fillStyle = `rgba(255, 255, 255, ${maskOpacity})`;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = smoothEdges ? 2 : 1;

        // Define face regions using TensorFlow.js keypoint indices
        // TensorFlow.js has different keypoint indices than MediaPipe
        const faceRegions = {
          leftEye: [159, 145, 158, 153, 144, 145, 160, 158], // Approximate eye region
          rightEye: [386, 374, 385, 380, 373, 374, 387, 385], // Approximate eye region
          leftEyebrow: [70, 63, 105, 66, 107], // Approximate eyebrow region
          rightEyebrow: [336, 296, 334, 293, 300], // Approximate eyebrow region
          mouth: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318], // Approximate mouth region
          nose: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0, 11, 12, 14, 15, 16, 18, 200, 199, 175] // Approximate nose region
        };

        // Draw selected regions
        if (includeEyes) {
          drawRegion(ctx, landmarks, faceRegions.leftEye, canvas.width, canvas.height);
          drawRegion(ctx, landmarks, faceRegions.rightEye, canvas.width, canvas.height);
        }

        if (includeEyebrows) {
          drawRegion(ctx, landmarks, faceRegions.leftEyebrow, canvas.width, canvas.height);
          drawRegion(ctx, landmarks, faceRegions.rightEyebrow, canvas.width, canvas.height);
        }

        if (includeMouth) {
          drawRegion(ctx, landmarks, faceRegions.mouth, canvas.width, canvas.height);
        }

        if (includeNose) {
          drawRegion(ctx, landmarks, faceRegions.nose, canvas.width, canvas.height);
        }

        resolve(canvas);
      } catch (error) {
        console.error('Failed to generate face mask:', error);
        // Fallback: create basic canvas without face detection
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(image, 0, 0);
        resolve(canvas);
      }
    });
  };

  const drawRegion = (
    ctx: CanvasRenderingContext2D, 
    landmarks: any[], 
    regionIndices: number[], 
    canvasWidth: number, 
    canvasHeight: number
  ) => {
    if (regionIndices.length < 3) return;

    ctx.beginPath();
    
    // Start with first point
    const firstPt = landmarks[regionIndices[0]];
    if (!firstPt) return;
    
    const x = firstPt.x * canvasWidth;
    const y = firstPt.y * canvasHeight;
    ctx.moveTo(x, y);

    // Draw lines to subsequent points
    for (let i = 1; i < regionIndices.length; i++) {
      const pt = landmarks[regionIndices[i]];
      if (!pt) continue;
      
      const x = pt.x * canvasWidth;
      const y = pt.y * canvasHeight;
      ctx.lineTo(x, y);
    }

    // Close the path
    ctx.closePath();
    
    // Fill and optionally stroke
    ctx.fill();
    if (ctx.lineWidth > 0) {
      ctx.stroke();
    }
  };

  const generateSimpleMask = async (image: HTMLImageElement) => {
    // Simple mask with just eyes and mouth (original behavior)
    return generateMaskFromImage(image, {
      includeEyes: true,
      includeMouth: true,
      includeEyebrows: false,
      includeNose: false,
      maskOpacity: 0.8,
      smoothEdges: true
    });
  };

  const generateFullFaceMask = async (image: HTMLImageElement) => {
    // Full face mask including all features
    return generateMaskFromImage(image, {
      includeEyes: true,
      includeMouth: true,
      includeEyebrows: true,
      includeNose: true,
      maskOpacity: 0.9,
      smoothEdges: true
    });
  };

  const generateCustomMask = async (
    image: HTMLImageElement, 
    options: FaceMaskOptions
  ) => {
    return generateMaskFromImage(image, options);
  };

  return { 
    generateMaskFromImage,
    generateSimpleMask,
    generateFullFaceMask,
    generateCustomMask,
    canvasRef
  };
}
