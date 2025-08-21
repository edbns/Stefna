import { useState } from 'react';
import { useEmotionMask } from './useEmotionMask';

export interface AIGenerationRequest {
  image: File;
  mask?: string; // base64 mask data
  prompt: string;
  strength?: number;
  model?: string;
}

export interface AIGenerationResult {
  success: boolean;
  result?: string; // generated image URL
  error?: string;
  maskUsed?: boolean;
}

export function useEmotionMaskAI() {
  const { generateMaskFromImage, generateSimpleMask, generateFullFaceMask } = useEmotionMask();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastMask, setLastMask] = useState<string | null>(null);

  const generateWithMask = async (
    image: File,
    prompt: string,
    maskOptions?: any
  ): Promise<AIGenerationResult> => {
    setIsGenerating(true);
    
    try {
      // Create image element from file
      const img = new Image();
      const imageUrl = URL.createObjectURL(image);
      
      const maskCanvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
        img.onload = () => {
          if (maskOptions) {
            generateMaskFromImage(img, maskOptions).then(resolve).catch(reject);
          } else {
            generateSimpleMask(img).then(resolve).catch(reject);
          }
        };
        img.onerror = () => reject('Failed to load image');
        img.src = imageUrl;
      });

      // Convert mask to base64
      const maskData = maskCanvas.toDataURL('image/png');
      setLastMask(maskData);

      // Prepare the AI generation request
      const request: AIGenerationRequest = {
        image,
        mask: maskData,
        prompt,
        strength: 0.8,
        model: 'stable-diffusion-v35-large'
      };

      // Call your existing AI generation API
      const result = await callAIGenerationAPI(request);
      
      return {
        success: true,
        result: result.generatedImageUrl,
        maskUsed: true
      };

    } catch (error) {
      console.error('Mask generation failed:', error);
      return {
        success: false,
        error: `Mask generation failed: ${error}`,
        maskUsed: false
      };
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithoutMask = async (
    image: File,
    prompt: string
  ): Promise<AIGenerationResult> => {
    setIsGenerating(true);
    
    try {
      const request: AIGenerationRequest = {
        image,
        prompt,
        strength: 0.8,
        model: 'stable-diffusion-v35-large'
      };

      const result = await callAIGenerationAPI(request);
      
      return {
        success: true,
        result: result.generatedImageUrl,
        maskUsed: false
      };

    } catch (error) {
      console.error('AI generation failed:', error);
      return {
        success: false,
        error: `AI generation failed: ${error}`,
        maskUsed: false
      };
    } finally {
      setIsGenerating(false);
    }
  };

  // Mock AI generation API call - replace with your actual API
  const callAIGenerationAPI = async (request: AIGenerationRequest): Promise<{ generatedImageUrl: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // This is where you'd call your actual AI generation API
    // For now, return a mock result
    return {
      generatedImageUrl: 'https://example.com/generated-image.png'
    };
  };

  const downloadLastMask = () => {
    if (!lastMask) return;
    
    const link = document.createElement('a');
    link.download = 'emotion-mask.png';
    link.href = lastMask;
    link.click();
  };

  return {
    generateWithMask,
    generateWithoutMask,
    isGenerating,
    lastMask,
    downloadLastMask,
    generateMaskFromImage,
    generateSimpleMask,
    generateFullFaceMask
  };
}
