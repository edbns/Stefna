export interface GhibliReactionOptions {
  enableTears: boolean;
  enableHearts: boolean;
  enableBlush: boolean;
  enableEyeShine: boolean;
  tearIntensity: number; // 0.1-1.0
  heartOpacity: number; // 0.1-1.0
  blushIntensity: number; // 0.1-1.0
  eyeShineBrightness: number; // 0.1-1.0
}

export interface GhibliReactionResult {
  processedImage: string;
  metadata: {
    effects: string[];
    intensity: number;
    timestamp: string;
  };
}

// Main function to apply Ghibli Reaction FX to an image URL
export async function applyGhibliReactionFX(
  imageUrl: string,
  options: GhibliReactionOptions
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
        
        // Apply tears effect
        if (options.enableTears) {
          drawTears(ctx, img.width, img.height, options.tearIntensity);
          effects.push('tears');
        }
        
        // Apply hearts effect
        if (options.enableHearts) {
          drawHearts(ctx, img.width, img.height, options.heartOpacity);
          effects.push('hearts');
        }
        
        // Apply blush effect
        if (options.enableBlush) {
          drawBlush(ctx, img.width, img.height, options.blushIntensity);
          effects.push('blush');
        }
        
        // Apply eye shine effect
        if (options.enableEyeShine) {
          drawEyeShine(ctx, img.width, img.height, options.eyeShineBrightness);
          effects.push('eye_shine');
        }
        
        // Convert canvas to data URL
        const resultUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        resolve(resultUrl);
      } catch (error) {
        console.error('Ghibli Reaction FX failed:', error);
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image for Ghibli Reaction FX'));
    img.src = imageUrl;
  });
}

// Draw animated tears
function drawTears(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  const tearCount = Math.floor(intensity * 5) + 1;
  
  for (let i = 0; i < tearCount; i++) {
    const x = width * 0.3 + (i * width * 0.1);
    const y = height * 0.2 + (i * height * 0.05);
    
    ctx.save();
    ctx.globalAlpha = 0.7 * intensity;
    
    // Tear drop shape
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 5, y + 10, x, y + 20);
    ctx.quadraticCurveTo(x - 5, y + 10, x, y);
    ctx.fillStyle = '#87CEEB'; // Light blue
    ctx.fill();
    
    // Tear highlight
    ctx.beginPath();
    ctx.arc(x - 2, y + 5, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    ctx.restore();
  }
}

// Draw floating hearts
function drawHearts(ctx: CanvasRenderingContext2D, width: number, height: number, opacity: number) {
  const heartCount = 3;
  
  for (let i = 0; i < heartCount; i++) {
    const x = width * 0.7 + (i * width * 0.1);
    const y = height * 0.3 + (i * height * 0.1);
    const size = 15 + (i * 5);
    
    ctx.save();
    ctx.globalAlpha = opacity;
    
    // Heart shape
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
    ctx.bezierCurveTo(x - size * 0.5, y + size * 0.6, x, y + size * 0.8, x, y + size * 0.8);
    ctx.bezierCurveTo(x, y + size * 0.8, x + size * 0.5, y + size * 0.6, x + size * 0.5, y + size * 0.3);
    ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
    ctx.fillStyle = '#FF69B4'; // Hot pink
    ctx.fill();
    
    ctx.restore();
  }
}

// Draw blush effect
function drawBlush(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  const blushRadius = 30 * intensity;
  
  // Left cheek blush
  const leftX = width * 0.25;
  const leftY = height * 0.6;
  
  // Right cheek blush
  const rightX = width * 0.75;
  const rightY = height * 0.6;
  
  ctx.save();
  ctx.globalAlpha = 0.4 * intensity;
  
  // Create blush gradient
  const leftGradient = ctx.createRadialGradient(leftX, leftY, 0, leftX, leftY, blushRadius);
  leftGradient.addColorStop(0, 'rgba(255, 182, 193, 0.8)');
  leftGradient.addColorStop(1, 'rgba(255, 182, 193, 0)');
  
  const rightGradient = ctx.createRadialGradient(rightX, rightY, 0, rightX, rightY, blushRadius);
  rightGradient.addColorStop(0, 'rgba(255, 182, 193, 0.8)');
  rightGradient.addColorStop(1, 'rgba(255, 182, 193, 0)');
  
  // Draw left blush
  ctx.fillStyle = leftGradient;
  ctx.beginPath();
  ctx.arc(leftX, leftY, blushRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw right blush
  ctx.fillStyle = rightGradient;
  ctx.beginPath();
  ctx.arc(rightX, rightY, blushRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// Draw eye shine effect
function drawEyeShine(ctx: CanvasRenderingContext2D, width: number, height: number, brightness: number) {
  const eyeSize = 8 * brightness;
  
  // Left eye shine
  const leftX = width * 0.35;
  const leftY = height * 0.45;
  
  // Right eye shine
  const rightX = width * 0.65;
  const rightY = height * 0.45;
  
  ctx.save();
  ctx.globalAlpha = 0.9 * brightness;
  
  // Create eye shine gradient
  const leftGradient = ctx.createRadialGradient(leftX, leftY, 0, leftX, leftY, eyeSize);
  leftGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  leftGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
  leftGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  const rightGradient = ctx.createRadialGradient(rightX, rightY, 0, rightX, rightY, eyeSize);
  rightGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  rightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
  rightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  // Draw left eye shine
  ctx.fillStyle = leftGradient;
  ctx.beginPath();
  ctx.arc(leftX, leftY, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw right eye shine
  ctx.fillStyle = rightGradient;
  ctx.beginPath();
  ctx.arc(rightX, rightY, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}
