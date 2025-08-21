import { useState } from 'react';
import { generateNeoTokyoGlitch, NeoTokyoGlitchOptions, NeoTokyoGlitchResult } from './useNeoTokyoGlitch';

export interface NeoTokyoAIRequest {
  image: File;
  glitchOptions: NeoTokyoGlitchOptions;
  aiPrompt: string;
  model?: string;
  strength?: number;
}

export interface NeoTokyoAIResult {
  success: boolean;
  originalImage?: string;
  glitchResult?: NeoTokyoGlitchResult;
  aiGeneratedImage?: string;
  error?: string;
  processingSteps: string[];
}

export function useNeoTokyoGlitchAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [lastResult, setLastResult] = useState<NeoTokyoAIResult | null>(null);

  const generateWithGlitchAndAI = async (
    image: File,
    glitchOptions: NeoTokyoGlitchOptions,
    aiPrompt: string
  ): Promise<NeoTokyoAIResult> => {
    setIsProcessing(true);
    const processingSteps: string[] = [];
    
    try {
      // Step 1: Load image
      setCurrentStep('Loading image...');
      processingSteps.push('Image loaded');
      
      const img = new Image();
      const imageUrl = URL.createObjectURL(image);
      
      const imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject('Failed to load image');
        img.src = imageUrl;
      });

      // Step 2: Generate Neo Tokyo glitch effect
      setCurrentStep('Generating Neo Tokyo glitch...');
      processingSteps.push('Glitch effect generated');
      
      const glitchResult = await generateNeoTokyoGlitch(imageElement, glitchOptions);
      
      // Step 3: Prepare for AI generation
      setCurrentStep('Preparing for AI generation...');
      processingSteps.push('Ready for AI processing');
      
      // Convert glitch result to blob for AI API
      const glitchBlob = await new Promise<Blob>((resolve) => {
        glitchResult.mergedCanvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      });

      // Step 4: Call AI generation API
      setCurrentStep('Generating AI image...');
      processingSteps.push('AI generation in progress');
      
      const aiResult = await callAIGenerationAPI({
        image: glitchBlob,
        glitchOptions,
        aiPrompt,
        model: 'stable-diffusion-v35-large',
        strength: 0.8
      });

      // Step 5: Complete
      setCurrentStep('Processing complete!');
      processingSteps.push('AI generation completed');
      
      const result: NeoTokyoAIResult = {
        success: true,
        originalImage: imageUrl,
        glitchResult,
        aiGeneratedImage: aiResult.generatedImageUrl,
        processingSteps
      };

      setLastResult(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setCurrentStep('Error occurred');
      
      const result: NeoTokyoAIResult = {
        success: false,
        error: errorMessage,
        processingSteps: [...processingSteps, `Error: ${errorMessage}`]
      };

      setLastResult(result);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  const generateGlitchOnly = async (
    image: File,
    glitchOptions: NeoTokyoGlitchOptions
  ): Promise<NeoTokyoAIResult> => {
    setIsProcessing(true);
    const processingSteps: string[] = [];
    
    try {
      // Load image
      setCurrentStep('Loading image...');
      processingSteps.push('Image loaded');
      
      const img = new Image();
      const imageUrl = URL.createObjectURL(image);
      
      const imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject('Failed to load image');
        img.src = imageUrl;
      });

      // Generate glitch effect only
      setCurrentStep('Generating Neo Tokyo glitch...');
      processingSteps.push('Glitch effect generated');
      
      const glitchResult = await generateNeoTokyoGlitch(imageElement, glitchOptions);
      
      setCurrentStep('Glitch effect complete!');
      processingSteps.push('Processing completed');
      
      const result: NeoTokyoAIResult = {
        success: true,
        originalImage: imageUrl,
        glitchResult,
        processingSteps
      };

      setLastResult(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setCurrentStep('Error occurred');
      
      const result: NeoTokyoAIResult = {
        success: false,
        error: errorMessage,
        processingSteps: [...processingSteps, `Error: ${errorMessage}`]
      };

      setLastResult(result);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  // Mock AI generation API call - replace with your actual API
  const callAIGenerationAPI = async (request: NeoTokyoAIRequest): Promise<{ generatedImageUrl: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // This is where you'd call your actual AI generation API
    // For now, return a mock result
    return {
      generatedImageUrl: 'https://example.com/ai-generated-neo-tokyo.png'
    };
  };

  const downloadResult = (type: 'glitch' | 'merged' | 'ai') => {
    if (!lastResult?.success) return;
    
    if (type === 'glitch' && lastResult.glitchResult) {
      const link = document.createElement('a');
      link.download = `neo-tokyo-glitch-layer-${lastResult.glitchResult.metadata.mode}.png`;
      link.href = lastResult.glitchResult.glitchCanvas.toDataURL('image/png');
      link.click();
    } else if (type === 'merged' && lastResult.glitchResult) {
      const link = document.createElement('a');
      link.download = `neo-tokyo-glitch-${lastResult.glitchResult.metadata.mode}.png`;
      link.href = lastResult.glitchResult.mergedCanvas.toDataURL('image/png');
      link.click();
    } else if (type === 'ai' && lastResult.aiGeneratedImage) {
      const link = document.createElement('a');
      link.download = 'ai-generated-neo-tokyo.png';
      link.href = lastResult.aiGeneratedImage;
      link.click();
    }
  };

  const clearResults = () => {
    setLastResult(null);
    setCurrentStep('');
  };

  return {
    generateWithGlitchAndAI,
    generateGlitchOnly,
    isProcessing,
    currentStep,
    lastResult,
    downloadResult,
    clearResults
  };
}
