// Generation Event Bus - Ensures spinners stop reliably
// This provides a centralized way to signal generation state changes

import { useState, useEffect } from 'react';

export interface GenerationEvent {
  kind: 'image' | 'video' | 'error' | 'timeout' | 'start';
  message?: string;
  status?: number;
  data?: any;
  publicId?: string;
  url?: string;
  resultUrl?: string;
}

// Global state for generation running status
let isGenerationRunning = false;
const listeners = new Set<() => void>();

/**
 * Dispatch a generation start event
 */
export const generationStart = (detail?: Partial<GenerationEvent>) => {
  isGenerationRunning = true;
  notifyListeners();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('generation:start', { detail }));
  }
};

/**
 * Dispatch a generation completion event
 * This ensures all UI components can react to generation ending
 */
export const generationDone = (detail?: GenerationEvent) => {
  isGenerationRunning = false;
  notifyListeners();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('generation:done', { detail }));
  }
};

/**
 * Get current generation running status
 */
export const getIsGenerationRunning = () => isGenerationRunning;

/**
 * Notify all listeners of state change
 */
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

/**
 * Hook to track generation running state
 * Use this in components that show loading spinners
 */
export const useGenerationEvents = () => {
  const [isRunning, setIsRunning] = useState(isGenerationRunning);
  const [lastEvent, setLastEvent] = useState<GenerationEvent | null>(null);

  useEffect(() => {
    const updateState = () => setIsRunning(isGenerationRunning);
    listeners.add(updateState);

    const handleStart = (event: CustomEvent<GenerationEvent>) => {
      setLastEvent(event.detail || null);
    };

    const handleDone = (event: CustomEvent<GenerationEvent>) => {
      setLastEvent(event.detail || null);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('generation:start', handleStart as EventListener);
      window.addEventListener('generation:done', handleDone as EventListener);
    }

    return () => {
      listeners.delete(updateState);
      if (typeof window !== 'undefined') {
        window.removeEventListener('generation:start', handleStart as EventListener);
        window.removeEventListener('generation:done', handleDone as EventListener);
      }
    };
  }, []);

  return { isRunning, lastEvent };
};

/**
 * Utility to wrap async generation calls with automatic state management
 */
export const withGenerationCompletion = async <T>(
  operation: () => Promise<T>,
  kind: 'image' | 'video' = 'image'
): Promise<T> => {
  generationStart({ kind });
  
  try {
    const result = await operation();
    generationDone({ kind, data: result });
    return result;
  } catch (error) {
    generationDone({ 
      kind: 'error', 
      message: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
};

/**
 * Safety timeout to ensure generation doesn't run forever
 */
export const withGenerationTimeout = (timeoutMs: number = 90000) => {
  const timeoutId = setTimeout(() => {
    if (isGenerationRunning) {
      generationDone({ kind: 'timeout', message: 'Generation timed out' });
    }
  }, timeoutMs);

  return () => clearTimeout(timeoutId);
};
