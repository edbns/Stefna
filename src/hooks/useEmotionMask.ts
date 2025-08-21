import { useRef } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { drawConnectors } from '@mediapipe/drawing_utils';

export interface FaceMaskOptions {
  includeEyes?: boolean;
  includeMouth?: boolean;
  includeEyebrows?: boolean;
  includeNose?: boolean;
  maskOpacity?: number;
  smoothEdges?: boolean;
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

    return new Promise<HTMLCanvasElement>((resolve, reject) => {
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results) => {
        if (!results.multiFaceLandmarks?.length) return reject('No face detected');
        const landmarks = results.multiFaceLandmarks[0];
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

        // Define face regions with more precise landmark ranges
        const faceRegions = {
          leftEye: [33, 133, 157, 158, 159, 160, 161, 246],
          rightEye: [362, 263, 386, 387, 388, 389, 390, 466],
          leftEyebrow: [70, 63, 105, 66, 107],
          rightEyebrow: [336, 296, 334, 293, 300],
          mouth: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318],
          nose: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0, 11, 12, 14, 15, 16, 18, 200, 199, 175]
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
      });

      const imgElement = document.createElement('img');
      imgElement.onload = () => faceMesh.send({ image: imgElement });
      imgElement.src = image.src;
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
    const x = firstPt.x * canvasWidth;
    const y = firstPt.y * canvasHeight;
    ctx.moveTo(x, y);

    // Draw lines to subsequent points
    for (let i = 1; i < regionIndices.length; i++) {
      const pt = landmarks[regionIndices[i]];
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
    // Full face mask with all regions
    return generateMaskFromImage(image, {
      includeEyes: true,
      includeMouth: true,
      includeEyebrows: true,
      includeNose: true,
      maskOpacity: 0.6,
      smoothEdges: true
    });
  };

  return { 
    canvasRef, 
    generateMaskFromImage,
    generateSimpleMask,
    generateFullFaceMask
  };
}
