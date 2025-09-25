import '@tensorflow/tfjs-backend-webgl';
import { createDetector, SupportedModels } from '@tensorflow-models/face-landmarks-detection';

export type GlitchMode = 'neo_tokyo' | 'cyberpunk' | 'digital_glitch' | 'neon_wave';

export interface CyberSirenOptions {
  mode: GlitchMode;
  intensity: number; // 1-5
  neonColor: string; // hex color
  glitchAmount: number; // 0.1-1.0
  scanlineOpacity: number; // 0.1-1.0
  preserveFace: boolean; // default: true
  enableGlow: boolean; // default: true
  enableScanlines: boolean; // default: true
  enableGlitch: boolean; // default: true
  enableNeon: boolean; // default: true
}

export interface CyberSirenResult {
  baseImage: File;
  glitchCanvas: HTMLCanvasElement;
  mergedCanvas: HTMLCanvasElement;
  metadata: {
    mode: GlitchMode;
    fx: string[];
    intensity: number;
    timestamp: string;
  };
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
    console.log('🎭 Loading TensorFlow.js Face Landmarks Detection model...');
    tfModel = await createDetector(SupportedModels.MediaPipeFaceMesh);
    console.log('✅ Face detection model loaded successfully');
    return tfModel;
  } catch (error) {
    console.error('❌ Failed to load face detection model:', error);
    throw error;
  } finally {
    isModelLoading = false;
  }
}

// Main function to apply Cyber Siren FX to an image URL
export async function applyCyberSiren(
  imageUrl: string,
  options: Partial<CyberSirenOptions> = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      try {
        const canvas = await generateCyberSirenOverlay(img, {
          mode: 'neo_tokyo',
          intensity: 3,
          neonColor: '#ff00ff',
          glitchAmount: 0.5,
          scanlineOpacity: 0.3,
          preserveFace: true,
          enableGlow: true,
          enableScanlines: true,
          enableGlitch: true,
          enableNeon: true,
          ...options
        });
        
        // Convert canvas to data URL
        const resultUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(resultUrl);
      } catch (error) {
        console.error('Cyber Siren FX failed:', error);
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image for Neo Tokyo FX'));
    img.src = imageUrl;
  });
}

export async function generateCyberSirenOverlay(
  image: HTMLImageElement,
  options: CyberSirenOptions = {
    mode: 'neo_tokyo',
    intensity: 3,
    neonColor: '#ff00ff',
    glitchAmount: 0.5,
    scanlineOpacity: 0.3,
    preserveFace: true,
    enableGlow: true,
    enableScanlines: true,
    enableGlitch: true,
    enableNeon: true
  }
): Promise<HTMLCanvasElement> {
  const {
    mode,
    intensity,
    neonColor,
    glitchAmount,
    scanlineOpacity,
    preserveFace,
    enableGlow,
    enableScanlines,
    enableGlitch,
    enableNeon
  } = options;

  return new Promise<HTMLCanvasElement>(async (resolve, reject) => {
    try {
      // Create canvas for glitch effects
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const w = canvas.width;
      const h = canvas.height;

      // Helper function for neon glow effect
      const drawNeonGlow = (x: number, y: number, radius: number, color: string, alpha: number) => {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      };

      // Helper function for glitch displacement
      const applyGlitchDisplacement = (x: number, y: number, width: number, height: number) => {
        const displacement = (intensity * glitchAmount * 20);
        const offsetX = (Math.random() - 0.5) * displacement;
        const offsetY = (Math.random() - 0.5) * displacement;
        return { x: x + offsetX, y: y + offsetY, width, height };
      };

      // Base layer: glitch scanlines
      if (enableScanlines) {
        ctx.fillStyle = `rgba(0, 255, 255, ${scanlineOpacity * 0.03})`;
        for (let y = 0; y < h; y += 3) {
          ctx.fillRect(0, y, w, 1);
        }
      }

      // FX: vertical neon stripes
      if (enableNeon) {
        const neonAlpha = 0.2 + (intensity * 0.1);
        ctx.strokeStyle = `${neonColor}${Math.floor(neonAlpha * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2 + intensity;
        
        for (let x = 0; x < w; x += 30 + intensity * 5) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
          
          // Add neon glow
          if (enableGlow) {
            drawNeonGlow(x, h / 2, 50 + intensity * 10, neonColor, neonAlpha * 0.3);
          }
        }
      }

      // FX: horizontal neon lines
      if (enableNeon) {
        const horizontalNeonColor = '#00ffff';
        const neonAlpha = 0.15 + (intensity * 0.08);
        ctx.strokeStyle = `${horizontalNeonColor}${Math.floor(neonAlpha * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1 + intensity * 0.5;
        
        for (let y = 0; y < h; y += 40 + intensity * 8) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
          
          // Add neon glow
          if (enableGlow) {
            drawNeonGlow(w / 2, y, 30 + intensity * 8, horizontalNeonColor, neonAlpha * 0.2);
          }
        }
      }

      // FX: glitch strips with displacement
      if (enableGlitch) {
        const glitchCount = 3 + intensity * 2;
        
        for (let i = 0; i < glitchCount; i++) {
          const glitchY = Math.random() * h;
          const glitchH = 10 + Math.random() * 20 + intensity * 5;
          const glitchW = w * (0.8 + Math.random() * 0.4);
          const glitchX = (w - glitchW) / 2;
          
          ctx.globalAlpha = 0.3 + (intensity * 0.1);
          
          // Create glitch displacement
          const displacement = applyGlitchDisplacement(glitchX, glitchY, glitchW, glitchH);
          
          // Draw glitch strip
          ctx.fillStyle = `rgba(255, 0, 255, ${0.4 + intensity * 0.1})`;
          ctx.fillRect(displacement.x, displacement.y, displacement.width, displacement.height);
          
          // Add glitch scanlines within the strip
          ctx.fillStyle = `rgba(0, 255, 255, ${0.6 + intensity * 0.2})`;
          for (let y = displacement.y; y < displacement.y + displacement.height; y += 2) {
            ctx.fillRect(displacement.x, y, displacement.width, 1);
          }
        }
        
        ctx.globalAlpha = 1;
      }

      // FX: Digital artifacts and noise
      if (enableGlitch) {
        const artifactCount = intensity * 10;
        
        for (let i = 0; i < artifactCount; i++) {
          const x = Math.random() * w;
          const y = Math.random() * h;
          const size = 2 + Math.random() * 8 + intensity * 2;
          
          ctx.fillStyle = `rgba(255, 0, 255, ${0.3 + intensity * 0.1})`;
          ctx.fillRect(x, y, size, size);
          
          // Add neon glow to artifacts
          if (enableGlow) {
            drawNeonGlow(x + size/2, y + size/2, size * 2, '#ff00ff', 0.2);
          }
        }
      }

      // FX: Cel-shading effect
      if (mode === 'neo_tokyo' || mode === 'cyberpunk') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + intensity * 0.05})`;
        
        // Add subtle shadows
        for (let x = 0; x < w; x += 50) {
          for (let y = 0; y < h; y += 50) {
            if (Math.random() > 0.7) {
              ctx.fillRect(x, y, 30, 30);
            }
          }
        }
        
        ctx.globalCompositeOperation = 'source-over';
      }

      // FX: Neon grid overlay
      if (enableNeon && (mode === 'neo_tokyo' || mode === 'cyberpunk')) {
        const gridSize = 50 + intensity * 10;
        const gridAlpha = 0.1 + (intensity * 0.05);
        
        ctx.strokeStyle = `${neonColor}${Math.floor(gridAlpha * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let x = 0; x < w; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let y = 0; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      // Face detection to clear face region (so we don't glitch it)
      if (preserveFace) {
        try {
          const model = await loadTFModel();
          const faces = await model.estimateFaces(image);
          
          if (faces && faces.length > 0) {
            const face = faces[0];
            const keypoints = face.keypoints;
            
            if (keypoints && keypoints.length > 0) {
              ctx.save();
              ctx.beginPath();
              
              // Create face mask using key facial landmarks
              // TensorFlow.js provides keypoints in a different format than MediaPipe
              // We'll use a simplified face outline based on available keypoints
              
              // Try to find key facial points
              const leftEye = keypoints.find((kp: any) => kp.name === 'leftEye');
              const rightEye = keypoints.find((kp: any) => kp.name === 'rightEye');
              const nose = keypoints.find((kp: any) => kp.name === 'noseTip');
              const leftMouth = keypoints.find((kp: any) => kp.name === 'leftMouth');
              const rightMouth = keypoints.find((kp: any) => kp.name === 'rightMouth');
              
              if (leftEye && rightEye && nose && leftMouth && rightMouth) {
                // Create a simple face mask using the key points
                const centerX = (leftEye.x + rightEye.x) / 2;
                const centerY = (leftEye.y + rightEye.y) / 2;
                const faceWidth = Math.abs(rightEye.x - leftEye.x) * 2.5;
                const faceHeight = Math.abs(nose.y - centerY) * 3;
                
                // Draw elliptical face mask
                ctx.ellipse(centerX, centerY, faceWidth / 2, faceHeight / 2, 0, 0, Math.PI * 2);
                ctx.clip();
                
                // Clear the face region
                ctx.clearRect(0, 0, w, h);
              }
              
              ctx.restore();
            }
          }
        } catch (faceError) {
          console.warn('⚠️ Face detection failed, continuing without face preservation:', faceError);
          // Continue without face preservation if detection fails
        }
      }

      resolve(canvas);
    } catch (error) {
      console.error('❌ Cyber Siren generation failed:', error);
      reject(error);
    }
  });
}

export async function generateCyberSiren(
  image: HTMLImageElement,
  options: CyberSirenOptions
): Promise<CyberSirenResult> {
  const glitchCanvas = await generateCyberSirenOverlay(image, options);
  
  // Create merged canvas
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = image.width;
  mergedCanvas.height = image.height;
  const ctx = mergedCanvas.getContext('2d')!;
  
  // Draw base image
  ctx.drawImage(image, 0, 0);
  
  // Draw glitch layer on top
  ctx.drawImage(glitchCanvas, 0, 0);
  
  // Create File object from merged canvas
  const blob = await new Promise<Blob>((resolve) => {
    mergedCanvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
  
  const baseImage = new File([blob], 'neo_tokyo_glitch.png', { type: 'image/png' });
  
  // Determine which effects were applied
  const appliedFX: string[] = [];
  if (options.enableGlow) appliedFX.push('glow');
  if (options.enableScanlines) appliedFX.push('scanlines');
  if (options.enableGlitch) appliedFX.push('glitch');
  if (options.enableNeon) appliedFX.push('neon');
  
  return {
    baseImage,
    glitchCanvas,
    mergedCanvas,
    metadata: {
      mode: options.mode,
      fx: appliedFX,
      intensity: options.intensity,
      timestamp: new Date().toISOString()
    }
  };
}
