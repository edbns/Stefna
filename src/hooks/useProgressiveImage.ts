import { useState, useEffect, useCallback } from 'react'
import { generateProgressiveImageUrls, loadProgressiveImage, CloudinaryOptions } from '../utils/cloudinaryOptimization'

export type LoadingStage = 'placeholder' | 'thumbnail' | 'preview' | 'full'

export interface ProgressiveImageState {
  currentStage: LoadingStage
  isLoading: boolean
  error: string | null
  urls: {
    placeholder: string
    thumbnail: string
    preview: string
    full: string
  } | null
}

export interface UseProgressiveImageOptions {
  options?: CloudinaryOptions
  autoLoad?: boolean
  onStageChange?: (stage: LoadingStage) => void
  onComplete?: () => void
  onError?: (error: Error) => void
}

export function useProgressiveImage(
  src: string | null,
  hookOptions: UseProgressiveImageOptions = {}
): ProgressiveImageState & {
  loadImage: () => Promise<void>
  setStage: (stage: LoadingStage) => void
} {
  const {
    options = {},
    autoLoad = true,
    onStageChange,
    onComplete,
    onError
  } = hookOptions

  const [state, setState] = useState<ProgressiveImageState>({
    currentStage: 'placeholder',
    isLoading: false,
    error: null,
    urls: null
  })

  // Generate URLs when src changes
  useEffect(() => {
    if (!src) {
      setState(prev => ({ ...prev, urls: null, error: null }))
      return
    }

    try {
      const urls = generateProgressiveImageUrls(src, options)
      setState(prev => ({ ...prev, urls }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to generate URLs' 
      }))
    }
  }, [src, options])

  // Auto-load when src changes and autoLoad is true
  useEffect(() => {
    if (autoLoad && src && state.urls) {
      loadImage()
    }
  }, [autoLoad, src, state.urls])

  const setStage = useCallback((stage: LoadingStage) => {
    setState(prev => ({ ...prev, currentStage: stage }))
    onStageChange?.(stage)
  }, [onStageChange])

  const loadImage = useCallback(async () => {
    if (!src || !state.urls) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))
    setStage('placeholder')

    try {
      await loadProgressiveImage(
        src,
        options,
        (stage) => {
          setStage(stage)
          if (stage === 'full') {
            setState(prev => ({ ...prev, isLoading: false }))
            onComplete?.()
          }
        }
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load image'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [src, state.urls, options, setStage, onComplete, onError])

  return {
    ...state,
    loadImage,
    setStage
  }
}

// 🚀 NETWORK-AWARE PROGRESSIVE LOADING
export function useNetworkAwareProgressiveImage(
  src: string | null,
  hookOptions: UseProgressiveImageOptions = {}
): ProgressiveImageState & {
  loadImage: () => Promise<void>
  setStage: (stage: LoadingStage) => void
  networkQuality: 'slow' | 'medium' | 'fast'
} {
  const [networkQuality, setNetworkQuality] = useState<'slow' | 'medium' | 'fast'>('medium')

  // Detect network quality
  useEffect(() => {
    const detectNetworkQuality = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection

      if (connection) {
        const { effectiveType, downlink } = connection
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 0.5) {
          setNetworkQuality('slow')
        } else if (effectiveType === '3g' || downlink < 2) {
          setNetworkQuality('medium')
        } else {
          setNetworkQuality('fast')
        }
      }
    }

    detectNetworkQuality()
    
    // Listen for network changes
    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', detectNetworkQuality)
      return () => {
        (navigator as any).connection?.removeEventListener('change', detectNetworkQuality)
      }
    }
  }, [])

  // Adjust options based on network quality
  const adjustedOptions: CloudinaryOptions = {
    ...hookOptions.options,
    quality: networkQuality === 'slow' ? 60 : networkQuality === 'medium' ? 70 : 80,
    width: networkQuality === 'slow' ? 600 : networkQuality === 'medium' ? 800 : 1024
  }

  const baseHook = useProgressiveImage(src, {
    ...hookOptions,
    options: adjustedOptions
  })

  return {
    ...baseHook,
    networkQuality
  }
}
