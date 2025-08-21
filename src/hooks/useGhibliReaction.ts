import { FaceMesh } from '@mediapipe/face_mesh';

export type ExpressionType = 'crying' | 'sparkle' | 'sweat' | 'anger' | 'surprise' | 'love';

export interface GhibliReactionResult {
  baseImage: File;
  ghibliLayer: HTMLCanvasElement;
  mergedCanvas: HTMLCanvasElement;
  metadata: {
    expression: ExpressionType;
    intensity: number;
    timestamp: string;
  };
}

export interface GhibliReactionOptions {
  expression: ExpressionType;
  intensity: number; // 1-5
  opacity?: number; // 0.1-1.0
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay';
  enableShadows?: boolean;
  enableHighlights?: boolean;
}

export async function generateGhibliOverlay(
  image: HTMLImageElement,
  options: GhibliReactionOptions
): Promise<HTMLCanvasElement> {
  const {
    expression,
    intensity,
    opacity = 0.8,
    blendMode = 'normal',
    enableShadows = true,
    enableHighlights = true
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
      if (!results.multiFaceLandmarks?.length) return reject('No face found');

      const landmarks = results.multiFaceLandmarks[0];
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set blend mode
      ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;
      ctx.globalAlpha = opacity;

      const w = canvas.width;
      const h = canvas.height;

      // Enhanced facial landmark coordinates
      const eyeLeft = landmarks[33];
      const eyeRight = landmarks[263];
      const eyeLeftInner = landmarks[133];
      const eyeRightInner = landmarks[362];
      const cheekLeft = landmarks[205];
      const cheekRight = landmarks[425];
      const browLeft = landmarks[70];
      const browRight = landmarks[300];
      const nose = landmarks[168];
      const mouth = landmarks[61];

      // Helper function for smooth gradients
      const createGradient = (x: number, y: number, radius: number, color1: string, color2: string) => {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
      };

      // Enhanced tear effect with multiple drops
      const drawTears = () => {
        const tearColor = `rgba(135, 206, 250, ${opacity})`;
        const tearShadow = `rgba(70, 130, 180, ${opacity * 0.6})`;
        
        [cheekLeft, cheekRight].forEach((pt, index) => {
          const x = pt.x * w;
          const y = pt.y * h;
          const offset = index === 0 ? -15 : 15;
          
          // Main tear drop
          ctx.fillStyle = tearColor;
          ctx.beginPath();
          ctx.ellipse(x + offset, y + 20, 8 + intensity * 2, 20 + intensity * 3, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Smaller tear drops
          for (let i = 0; i < intensity; i++) {
            const dropX = x + offset + (Math.random() - 0.5) * 20;
            const dropY = y + 30 + i * 15;
            const dropSize = 3 + Math.random() * 4;
            
            ctx.fillStyle = `rgba(135, 206, 250, ${opacity * 0.7})`;
            ctx.beginPath();
            ctx.arc(dropX, dropY, dropSize, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Shadow effect
          if (enableShadows) {
            ctx.fillStyle = tearShadow;
            ctx.beginPath();
            ctx.ellipse(x + offset + 2, y + 22, 8 + intensity * 2, 20 + intensity * 3, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      };

      // Enhanced sparkle effect with multiple sparkles
      const drawSparkles = () => {
        const sparkleColor = `rgba(255, 255, 100, ${opacity})`;
        const sparkleHighlight = `rgba(255, 255, 255, ${opacity})`;
        
        [eyeLeft, eyeRight].forEach((pt) => {
          const x = pt.x * w;
          const y = pt.y * h;
          
          // Multiple sparkles around eyes
          for (let i = 0; i < intensity + 2; i++) {
            const sparkleX = x + (Math.random() - 0.5) * 40;
            const sparkleY = y + (Math.random() - 0.5) * 40;
            const size = 3 + Math.random() * 6;
            
            // Main sparkle
            ctx.fillStyle = sparkleColor;
            ctx.beginPath();
            ctx.moveTo(sparkleX, sparkleY - size);
            ctx.lineTo(sparkleX + size * 0.5, sparkleY);
            ctx.lineTo(sparkleX, sparkleY + size);
            ctx.lineTo(sparkleX - size * 0.5, sparkleY);
            ctx.closePath();
            ctx.fill();
            
            // Highlight
            if (enableHighlights) {
              ctx.fillStyle = sparkleHighlight;
              ctx.beginPath();
              ctx.arc(sparkleX - size * 0.3, sparkleY - size * 0.3, size * 0.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
      };

      // Enhanced sweat effect with multiple drops
      const drawSweat = () => {
        const sweatColor = `rgba(173, 216, 230, ${opacity})`;
        const sweatShadow = `rgba(100, 149, 237, ${opacity * 0.6})`;
        
        // Multiple sweat drops
        for (let i = 0; i < intensity; i++) {
          const pt = landmarks[70 + i * 5]; // Use different brow points
          const x = pt.x * w + 10 + i * 8;
          const y = pt.y * h - 10 - i * 5;
          const size = 8 + Math.random() * 8;
          
          ctx.fillStyle = sweatColor;
          ctx.beginPath();
          ctx.ellipse(x, y, size, size * 1.6, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Shadow
          if (enableShadows) {
            ctx.fillStyle = sweatShadow;
            ctx.beginPath();
            ctx.ellipse(x + 1, y + 1, size, size * 1.6, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      };

      // Enhanced anger effect with multiple lines
      const drawAnger = () => {
        const angerColor = `rgba(255, 0, 0, ${opacity})`;
        const angerShadow = `rgba(139, 0, 0, ${opacity * 0.8})`;
        
        ctx.strokeStyle = angerColor;
        ctx.lineWidth = 2 + intensity;
        ctx.lineCap = 'round';
        
        // Multiple anger lines on brows
        [browLeft, browRight].forEach((pt, index) => {
          const x = pt.x * w;
          const y = pt.y * h;
          const offset = index === 0 ? -1 : 1;
          
          for (let i = 0; i < intensity; i++) {
            const lineX = x + (i * 8 - intensity * 4) * offset;
            const lineY = y - 10 + i * 3;
            
            ctx.beginPath();
            ctx.moveTo(lineX - 15, lineY - 10);
            ctx.lineTo(lineX + 15, lineY + 10);
            ctx.stroke();
            
            // Shadow
            if (enableShadows) {
              ctx.strokeStyle = angerShadow;
              ctx.beginPath();
              ctx.moveTo(lineX - 14, lineY - 9);
              ctx.lineTo(lineX + 16, lineY + 11);
              ctx.stroke();
              ctx.strokeStyle = angerColor;
            }
          }
        });
      };

      // New: Surprise effect with exclamation marks
      const drawSurprise = () => {
        const surpriseColor = `rgba(255, 215, 0, ${opacity})`;
        const surpriseShadow = `rgba(255, 165, 0, ${opacity * 0.6})`;
        
        [eyeLeft, eyeRight].forEach((pt) => {
          const x = pt.x * w;
          const y = pt.y * h;
          
          // Exclamation mark
          ctx.fillStyle = surpriseColor;
          ctx.fillRect(x - 2, y - 20, 4, 20);
          ctx.beginPath();
          ctx.arc(x, y + 5, 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Shadow
          if (enableShadows) {
            ctx.fillStyle = surpriseShadow;
            ctx.fillRect(x - 1, y - 19, 4, 20);
            ctx.beginPath();
            ctx.arc(x + 1, y + 6, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      };

      // New: Love effect with hearts
      const drawLove = () => {
        const loveColor = `rgba(255, 20, 147, ${opacity})`;
        const loveShadow = `rgba(199, 21, 133, ${opacity * 0.6})`;
        
        [cheekLeft, cheekRight].forEach((pt, index) => {
          const x = pt.x * w;
          const y = pt.y * h;
          const offset = index === 0 ? -1 : 1;
          
          for (let i = 0; i < intensity; i++) {
            const heartX = x + (i * 15 - intensity * 7) * offset;
            const heartY = y - 15 + i * 8;
            const size = 8 + Math.random() * 6;
            
            // Draw heart
            ctx.fillStyle = loveColor;
            ctx.beginPath();
            ctx.moveTo(heartX, heartY + size * 0.3);
            ctx.bezierCurveTo(
              heartX, heartY, 
              heartX - size, heartY, 
              heartX - size, heartY + size * 0.3
            );
            ctx.bezierCurveTo(
              heartX - size, heartY + size * 0.6, 
              heartX, heartY + size * 0.8, 
              heartX, heartY + size * 0.8
            );
            ctx.bezierCurveTo(
              heartX, heartY + size * 0.6, 
              heartX + size, heartY + size * 0.6, 
              heartX + size, heartY + size * 0.3
            );
            ctx.bezierCurveTo(
              heartX + size, heartY, 
              heartX, heartY, 
              heartX, heartY + size * 0.3
            );
            ctx.fill();
            
            // Shadow
            if (enableShadows) {
              ctx.fillStyle = loveShadow;
              ctx.beginPath();
              ctx.moveTo(heartX + 1, heartY + size * 0.3 + 1);
              ctx.bezierCurveTo(
                heartX + 1, heartY + 1, 
                heartX - size + 1, heartY + 1, 
                heartX - size + 1, heartY + size * 0.3 + 1
              );
              ctx.bezierCurveTo(
                heartX - size + 1, heartY + size * 0.6 + 1, 
                heartX + 1, heartY + size * 0.8 + 1, 
                heartX + 1, heartY + size * 0.8 + 1
              );
              ctx.bezierCurveTo(
                heartX + 1, heartY + size * 0.6 + 1, 
                heartX + size + 1, heartY + size * 0.6 + 1, 
                heartX + size + 1, heartY + size * 0.3 + 1
              );
              ctx.bezierCurveTo(
                heartX + size + 1, heartY + 1, 
                heartX + 1, heartY + 1, 
                heartX + 1, heartY + size * 0.3 + 1
              );
              ctx.fill();
            }
          }
        });
      };

      // Apply selected expression
      switch (expression) {
        case 'crying':
          drawTears();
          break;
        case 'sparkle':
          drawSparkles();
          break;
        case 'sweat':
          drawSweat();
          break;
        case 'anger':
          drawAnger();
          break;
        case 'surprise':
          drawSurprise();
          break;
        case 'love':
          drawLove();
          break;
      }

      // Reset blend mode
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;

      resolve(canvas);
    });

    image.onload = () => faceMesh.send({ image });
    image.onerror = () => reject('Image load error');
    image.src = image.src;
  });
}

export async function generateGhibliReaction(
  image: HTMLImageElement,
  options: GhibliReactionOptions
): Promise<GhibliReactionResult> {
  const ghibliLayer = await generateGhibliOverlay(image, options);
  
  // Create merged canvas
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = image.width;
  mergedCanvas.height = image.height;
  const ctx = mergedCanvas.getContext('2d')!;
  
  // Draw base image
  ctx.drawImage(image, 0, 0);
  
  // Draw Ghibli layer on top
  ctx.drawImage(ghibliLayer, 0, 0);
  
  // Create File object from merged canvas
  const blob = await new Promise<Blob>((resolve) => {
    mergedCanvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
  
  const baseImage = new File([blob], 'ghibli_reaction.png', { type: 'image/png' });
  
  return {
    baseImage,
    ghibliLayer,
    mergedCanvas,
    metadata: {
      expression: options.expression,
      intensity: options.intensity,
      timestamp: new Date().toISOString()
    }
  };
}
