import { useState } from 'react';
import { generateGhibliReaction, GhibliReactionOptions, GhibliReactionResult } from './useGhibliReaction';

export interface GhibliAIRequest {
  image: File;
  ghibliOptions: GhibliReactionOptions;
  aiPrompt: string;
  model?: string;
  strength?: number;
}

export interface GhibliAIResult {
  success: boolean;
  originalImage?: string;
  ghibliResult?: GhibliReactionResult;
  aiGeneratedImage?: string;
  error?: string;
  processingSteps: string[];
}

export function useGhibliReactionAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [lastResult, setLastResult] = useState<GhibliAIResult | null>(null);

  const generateWithGhibliAndAI = async (
    image: File,
    ghibliOptions: GhibliReactionOptions,
    aiPrompt: string
  ): Promise<GhibliAIResult> => {
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

      // Step 2: Generate Ghibli reaction
      setCurrentStep('Generating Ghibli reaction...');
      processingSteps.push('Ghibli reaction generated');
      
      const ghibliResult = await generateGhibliReaction(imageElement, ghibliOptions);
      
      // Step 3: Prepare for AI generation
      setCurrentStep('Preparing for AI generation...');
      processingSteps.push('Ready for AI processing');
      
      // Convert Ghibli result to blob for AI API
      const ghibliBlob = await new Promise<Blob>((resolve) => {
        ghibliResult.mergedCanvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      });

      // Step 4: Call AI generation API
      setCurrentStep('Generating AI image...');
      processingSteps.push('AI generation in progress');
      
      const aiResult = await callAIGenerationAPI({
        image: ghibliBlob,
        ghibliOptions,
        aiPrompt,
        model: 'stable-diffusion-v35-large',
        strength: 0.8
      });

      // Step 5: Complete
      setCurrentStep('Processing complete!');
      processingSteps.push('AI generation completed');
      
      const result: GhibliAIResult = {
        success: true,
        originalImage: imageUrl,
        ghibliResult,
        aiGeneratedImage: aiResult.generatedImageUrl,
        processingSteps
      };

      setLastResult(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setCurrentStep('Error occurred');
      
      const result: GhibliAIResult = {
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

  const generateGhibliOnly = async (
    image: File,
    ghibliOptions: GhibliReactionOptions
  ): Promise<GhibliAIResult> => {
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

      // Generate Ghibli reaction only
      setCurrentStep('Generating Ghibli reaction...');
      processingSteps.push('Ghibli reaction generated');
      
      const ghibliResult = await generateGhibliReaction(imageElement, ghibliOptions);
      
      setCurrentStep('Ghibli reaction complete!');
      processingSteps.push('Processing completed');
      
      const result: GhibliAIResult = {
        success: true,
        originalImage: imageUrl,
        ghibliResult,
        processingSteps
      };

      setLastResult(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setCurrentStep('Error occurred');
      
      const result: GhibliAIResult = {
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
  const callAIGenerationAPI = async (request: GhibliAIRequest): Promise<{ generatedImageUrl: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // This is where you'd call your actual AI generation API
    // For now, return a mock result
    return {
      generatedImageUrl: 'https://example.com/ai-generated-image.png'
    };
  };

  const downloadResult = (type: 'ghibli' | 'merged' | 'ai') => {
    if (!lastResult?.success) return;
    
    if (type === 'ghibli' && lastResult.ghibliResult) {
      const link = document.createElement('a');
      link.download = `ghibli-layer-${lastResult.ghibliResult.metadata.expression}.png`;
      link.href = lastResult.ghibliResult.ghibliLayer.toDataURL('image/png');
      link.click();
    } else if (type === 'merged' && lastResult.ghibliResult) {
      const link = document.createElement('a');
      link.download = `ghibli-reaction-${lastResult.ghibliResult.metadata.expression}.png`;
      link.href = lastResult.ghibliResult.mergedCanvas.toDataURL('image/png');
      link.click();
    } else if (type === 'ai' && lastResult.aiGeneratedImage) {
      const link = document.createElement('a');
      link.download = 'ai-generated-image.png';
      link.href = lastResult.aiGeneratedImage;
      link.click();
    }
  };

  const clearResults = () => {
    setLastResult(null);
    setCurrentStep('');
  };

  return {
    generateWithGhibliAndAI,
    generateGhibliOnly,
    isProcessing,
    currentStep,
    lastResult,
    downloadResult,
    clearResults
  };
}
