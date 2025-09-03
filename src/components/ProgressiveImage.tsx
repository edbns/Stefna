import React, { useState, useEffect, useRef } from 'react'
import { generateProgressiveImageUrls, loadProgressiveImage, CloudinaryOptions } from '../utils/cloudinaryOptimization'

interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: (error: Error) => void
  options?: CloudinaryOptions
  showLoadingStages?: boolean
  placeholderClassName?: string
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  style = {},
  onLoad,
  onError,
  options = {},
  showLoadingStages = false,
  placeholderClassName = ''
}) => {
  const [currentStage, setCurrentStage] = useState<'placeholder' | 'thumbnail' | 'preview' | 'full'>('placeholder')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!src) return

    // Abort previous loading if component unmounts or src changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)
    setCurrentStage('placeholder')

    // Generate progressive URLs
    const urls = generateProgressiveImageUrls(src, options)
    
    // Start with placeholder
    if (imgRef.current) {
      imgRef.current.src = urls.placeholder
      setCurrentStage('placeholder')
    }

    // Progressive loading function
    const loadProgressively = async () => {
      try {
        await loadProgressiveImage(
          src,
          options,
          (stage) => {
            if (!controller.signal.aborted) {
              setCurrentStage(stage)
              if (stage === 'full') {
                setIsLoading(false)
                onLoad?.()
              }
            }
          }
        )
      } catch (err) {
        if (!controller.signal.aborted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load image'
          setError(errorMessage)
          onError?.(err instanceof Error ? err : new Error(errorMessage))
        }
      }
    }

    loadProgressively()

    return () => {
      controller.abort()
    }
  }, [src, options, onLoad, onError])

  // Loading stage indicator
  const getStageIndicator = () => {
    if (!showLoadingStages) return null
    
    const stages = ['placeholder', 'thumbnail', 'preview', 'full']
    const currentIndex = stages.indexOf(currentStage)
    
    return (
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        {stages.map((stage, index) => (
          <span
            key={stage}
            className={`mr-1 ${index <= currentIndex ? 'text-green-400' : 'text-gray-400'}`}
          >
            {stage === 'placeholder' ? 'P' : stage === 'thumbnail' ? 'T' : stage === 'preview' ? 'P' : 'F'}
          </span>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className} bg-gray-800 flex items-center justify-center`} style={style}>
        <div className="text-center text-gray-500">
          <div className="text-sm">⚠️ Failed to load</div>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={style}>
      <img
        ref={imgRef}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-70' : 'opacity-100'
        } ${placeholderClassName}`}
        style={style}
      />
      
      {getStageIndicator()}
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
          <div className="text-xs text-gray-500">
            Loading... {currentStage}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressiveImage
