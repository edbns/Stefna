import React, { useState, useRef, useEffect } from 'react'
import { optimizeFeedImage } from '../utils/cloudinaryOptimization'

interface LQIPImageProps {
  src: string
  alt: string
  className?: string
  onClick?: () => void
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
  // Aspect ratio for skeleton placeholder
  aspectRatio?: number
  // Custom LQIP URL (if not using Cloudinary)
  lqipUrl?: string
  // Skip LQIP loading state (for initial feed loading)
  skipLoadingState?: boolean
}

const LQIPImage: React.FC<LQIPImageProps> = ({
  src,
  alt,
  className = '',
  onClick,
  loading = 'lazy',
  decoding = 'async',
  aspectRatio,
  lqipUrl,
  skipLoadingState = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLQIPLoaded, setIsLQIPLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Generate LQIP URL from Cloudinary URL
  const generateLQIPUrl = (url: string): string => {
    if (lqipUrl) return lqipUrl
    
    // Check if it's a Cloudinary URL
    if (url.includes('cloudinary.com')) {
      return url.replace('/upload/', '/upload/w_30,e_blur:1000,q_5,f_auto/')
    }
    
    // For non-Cloudinary URLs, return the original (will be handled by browser)
    return url
  }

  const lqipSrc = generateLQIPUrl(src)

  const handleImageLoad = () => {
    setIsLoaded(true)
  }

  const handleImageError = () => {
    setHasError(true)
  }

  const handleLQIPLoad = () => {
    setIsLQIPLoaded(true)
  }

  // Preload the main image when LQIP is loaded
  useEffect(() => {
    if (isLQIPLoaded && imgRef.current) {
      const mainImg = new Image()
      mainImg.onload = handleImageLoad
      mainImg.onerror = handleImageError
      mainImg.src = src
    }
  }, [isLQIPLoaded, src])

  // Show error state
  if (hasError) {
    return (
      <div 
        className={`bg-gray-800 flex items-center justify-center ${className}`}
        style={aspectRatio ? { aspectRatio } : undefined}
        onClick={onClick}
      >
        <div className="text-gray-400 text-sm">Failed to load</div>
      </div>
    )
  }

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
      onClick={onClick}
    >
      {/* Dark grey placeholder while loading - skip during initial feed loading */}
      {!isLoaded && !skipLoadingState && (
        <div className="absolute inset-0 w-full h-full bg-gray-800">
          {/* LQIP Placeholder - hidden until loaded to avoid flash */}
          <img
            src={lqipSrc}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover filter blur-lg scale-110 transition-opacity duration-200 ${
              isLQIPLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLQIPLoad}
            loading="eager"
            decoding="async"
          />
        </div>
      )}

      {/* Main Image */}
      <img
        ref={imgRef}
        src={isLQIPLoaded ? src : ''}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-300 ${
          isLoaded 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-105'
        }`}
        loading={loading}
        decoding={decoding}
        style={{
          filter: isLoaded ? 'blur(0)' : 'blur(20px)',
        }}
        onLoad={() => {
          setIsLoaded(true);
          // Add loaded class for additional CSS effects
          if (imgRef.current) {
            imgRef.current.classList.add('loaded');
          }
        }}
      />

      {/* Removed loading spinner - the LQIP is enough visual feedback */}
    </div>
  )
}

export default LQIPImage
