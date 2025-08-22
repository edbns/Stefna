import { useRef } from 'react';
// MediaPipe is loaded dynamically from CDN

// Function to dynamically load MediaPipe scripts
async function loadMediaPipeScripts(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).FaceMesh) {
      resolve();
      return;
    }

    // Load MediaPipe scripts
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
      script2.onload = () => resolve();
      script2.onerror = () => reject(new Error('Failed to load drawing_utils'));
      document.head.appendChild(script2);
    };
    script1.onerror = () => reject(new Error('Failed to load face_mesh'));
    document.head.appendChild(script1);
  });
}

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
      // Dynamically load MediaPipe from CDN
      let FaceMesh: any;
      let drawConnectors: any;
      
      try {
        // Load MediaPipe scripts dynamically
        await loadMediaPipeScripts();
        
        // Get MediaPipe from global scope
        FaceMesh = (window as any).FaceMesh;
        drawConnectors = (window as any).drawConnectors;
        
        if (!FaceMesh) {
          throw new Error('FaceMesh not loaded from CDN');
        }
      } catch (error) {
        console.error('Failed to load MediaPipe:', error);
        // Fallback: create basic canvas without face detection
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(image, 0, 0);
        resolve(canvas);
        return;
      }

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results: any) => {
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

  // Main function to apply Emotion Mask FX to an image URL
  async function applyEmotionMaskFX(
    imageUrl: string,
    options: EmotionMaskOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          const effects: string[] = [];
          
          // Apply cinematic lighting
          if (options.enableCinematicLighting) {
            applyCinematicLighting(ctx, img.width, img.height, options.lightingIntensity);
            effects.push('cinematic_lighting');
          }
          
          // Apply skin enhancement
          if (options.enableSkinEnhancement) {
            applySkinEnhancement(ctx, img.width, img.height, options.skinSmoothing);
            effects.push('skin_enhancement');
          }
          
          // Apply expression boost
          if (options.enableExpressionBoost) {
            applyExpressionBoost(ctx, img.width, img.height, options.expressionIntensity);
            effects.push('expression_boost');
          }
          
          // Convert canvas to data URL
          const resultUrl = canvas.toDataURL('image/jpeg', 0.9);
          
          resolve(resultUrl);
        } catch (error) {
          console.error('Emotion Mask FX failed:', error);
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image for Emotion Mask FX'));
      img.src = imageUrl;
    });
  }

  // Apply cinematic lighting effect
  function applyCinematicLighting(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
    // Create subtle vignette effect
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
    
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.3 * intensity;
    
    // Create radial gradient for vignette
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    ctx.restore();
    
    // Add subtle warm highlight
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.2 * intensity;
    
    const highlightGradient = ctx.createRadialGradient(
      centerX - width * 0.2, 
      centerY - height * 0.2, 
      0, 
      centerX - width * 0.2, 
      centerY - height * 0.2, 
      width * 0.4
    );
    highlightGradient.addColorStop(0, 'rgba(255, 220, 180, 0.6)');
    highlightGradient.addColorStop(1, 'rgba(255, 220, 180, 0)');
    
    ctx.fillStyle = highlightGradient;
    ctx.fillRect(0, 0, width, height);
    
    ctx.restore();
  }

  // Apply skin enhancement effect
  function applySkinEnhancement(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
    // Get image data for skin detection
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Simple skin tone detection and enhancement
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Basic skin tone detection (simplified)
      if (r > g && r > b && g > b * 0.8 && r < 255 && g < 240 && b < 220) {
        // Enhance skin tones
        data[i] = Math.min(255, r + (intensity * 10)); // Slight red boost
        data[i + 1] = Math.min(255, g + (intensity * 5)); // Subtle green boost
        data[i + 2] = Math.min(255, b + (intensity * 3)); // Very subtle blue boost
      }
    }
    
    // Apply the enhanced image data
    ctx.putImageData(imageData, 0, 0);
    
    // Add subtle skin smoothing overlay
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.1 * intensity;
    
    // Create soft skin overlay
    const skinGradient = ctx.createRadialGradient(
      width * 0.5, height * 0.6, 0,
      width * 0.5, height * 0.6, width * 0.3
    );
    skinGradient.addColorStop(0, 'rgba(255, 220, 200, 0.3)');
    skinGradient.addColorStop(1, 'rgba(255, 220, 200, 0)');
    
    ctx.fillStyle = skinGradient;
    ctx.fillRect(0, 0, width, height);
    
    ctx.restore();
  }

  // Apply expression boost effect
  function applyExpressionBoost(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
    // Enhance contrast slightly for better expression visibility
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.15 * intensity;
    
    // Create contrast enhancement overlay
    const contrastGradient = ctx.createLinearGradient(0, 0, width, height);
    contrastGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
    contrastGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    contrastGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    
    ctx.fillStyle = contrastGradient;
    ctx.fillRect(0, 0, width, height);
    
    ctx.restore();
    
    // Add subtle eye enhancement
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.1 * intensity;
    
    // Left eye enhancement
    const leftEyeGradient = ctx.createRadialGradient(
      width * 0.35, height * 0.45, 0,
      width * 0.35, height * 0.45, 20
    );
    leftEyeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    leftEyeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = leftEyeGradient;
    ctx.beginPath();
    ctx.arc(width * 0.35, height * 0.45, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Right eye enhancement
    const rightEyeGradient = ctx.createRadialGradient(
      width * 0.65, height * 0.45, 0,
      width * 0.65, height * 0.45, 20
    );
    rightEyeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    rightEyeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = rightEyeGradient;
    ctx.beginPath();
    ctx.arc(width * 0.65, height * 0.45, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  return { 
    canvasRef, 
    generateMaskFromImage,
    generateSimpleMask,
    generateFullFaceMask
  };
}

// Main function to apply Emotion Mask FX to an image URL
export async function applyEmotionMaskFX(
  imageUrl: string,
  options: EmotionMaskOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        const effects: string[] = [];
        
        // Apply cinematic lighting
        if (options.enableCinematicLighting) {
          applyCinematicLighting(ctx, img.width, img.height, options.lightingIntensity);
          effects.push('cinematic_lighting');
        }
        
        // Apply skin enhancement
        if (options.enableSkinEnhancement) {
          applySkinEnhancement(ctx, img.width, img.height, options.skinSmoothing);
          effects.push('skin_enhancement');
        }
        
        // Apply expression boost
        if (options.enableExpressionBoost) {
          applyExpressionBoost(ctx, img.width, img.height, options.expressionIntensity);
          effects.push('expression_boost');
        }
        
        // Convert canvas to data URL
        const resultUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        resolve(resultUrl);
      } catch (error) {
        console.error('Emotion Mask FX failed:', error);
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image for Emotion Mask FX'));
    img.src = imageUrl;
  });
}

// Apply cinematic lighting effect
function applyCinematicLighting(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  // Create subtle vignette effect
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
  
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.3 * intensity;
  
  // Create radial gradient for vignette
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  ctx.restore();
  
  // Add subtle warm highlight
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.2 * intensity;
  
  const highlightGradient = ctx.createRadialGradient(
    centerX - width * 0.2, 
    centerY - height * 0.2, 
    0, 
    centerX - width * 0.2, 
    centerY - height * 0.2, 
    width * 0.4
  );
  highlightGradient.addColorStop(0, 'rgba(255, 220, 180, 0.6)');
  highlightGradient.addColorStop(1, 'rgba(255, 220, 180, 0)');
  
  ctx.fillStyle = highlightGradient;
  ctx.fillRect(0, 0, width, height);
  
  ctx.restore();
}

// Apply skin enhancement effect
function applySkinEnhancement(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  // Get image data for skin detection
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Simple skin tone detection and enhancement
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Basic skin tone detection (simplified)
    if (r > g && r > b && g > b * 0.8 && r < 255 && g < 240 && b < 220) {
      // Enhance skin tones
      data[i] = Math.min(255, r + (intensity * 10)); // Slight red boost
      data[i + 1] = Math.min(255, g + (intensity * 5)); // Subtle green boost
      data[i + 2] = Math.min(255, b + (intensity * 3)); // Very subtle blue boost
    }
  }
  
  // Apply the enhanced image data
  ctx.putImageData(imageData, 0, 0);
  
  // Add subtle skin smoothing overlay
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.1 * intensity;
  
  // Create soft skin overlay
  const skinGradient = ctx.createRadialGradient(
    width * 0.5, height * 0.6, 0,
    width * 0.5, height * 0.4, width * 0.3
  );
  skinGradient.addColorStop(0, 'rgba(255, 220, 200, 0.3)');
  skinGradient.addColorStop(1, 'rgba(255, 220, 200, 0)');
  
  ctx.fillStyle = skinGradient;
  ctx.fillRect(0, 0, width, height);
  
  ctx.restore();
}

// Apply expression boost effect
function applyExpressionBoost(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  // Enhance contrast slightly for better expression visibility
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.15 * intensity;
  
  // Create contrast enhancement overlay
  const contrastGradient = ctx.createLinearGradient(0, 0, width, height);
  contrastGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
  contrastGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
  contrastGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  
  ctx.fillStyle = contrastGradient;
  ctx.fillRect(0, 0, width, height);
  
  ctx.restore();
  
  // Add subtle eye enhancement
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.1 * intensity;
  
  // Left eye enhancement
  const leftEyeGradient = ctx.createRadialGradient(
    width * 0.35, height * 0.45, 0,
    width * 0.35, height * 0.45, 20
  );
  leftEyeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  leftEyeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = leftEyeGradient;
  ctx.beginPath();
  ctx.arc(width * 0.35, height * 0.45, 20, 0, Math.PI * 2);
  ctx.fill();
  
  // Right eye enhancement
  const rightEyeGradient = ctx.createRadialGradient(
    width * 0.65, height * 0.45, 0,
    width * 0.65, height * 0.45, 20
  );
  rightEyeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  rightEyeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = rightEyeGradient;
  ctx.beginPath();
  ctx.arc(width * 0.65, height * 0.45, 20, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}
