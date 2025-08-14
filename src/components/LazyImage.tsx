import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Loader2 } from 'lucide-react'
// import { useImagePerformanceTracking } from '../hooks/usePerformanceMonitoring' // Temporarily disabled
import { optimizeCloudinaryUrl } from '../utils/cloudinaryOptimization'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
  // Performance optimizations
  priority?: boolean // Skip lazy loading for above-fold images
  sizes?: string // Responsive image sizes
  quality?: number // Image quality (1-100)
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
}

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder,
  onLoad,
  onError,
  priority = false,
  sizes,
  quality = 80,
  format = 'auto'
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // Priority images load immediately
  const [lowResLoaded, setLowResLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Performance tracking - temporarily disabled
  // const { trackImage } = useImagePerformanceTracking()
  // const imageTracker = trackImage(src)
  const imageTracker = { onLoadStart: () => {}, onLoadEnd: () => {} } // Mock tracker

  // Optimize Cloudinary URLs for performance using centralized utility
  const optimizedSrc = optimizeCloudinaryUrl(src, {
    format,
    quality,
    width: 800,
    height: 600,
    dpr: 'auto'
  })
  
  const lowResSrc = optimizeCloudinaryUrl(src, {
    format: 'auto',
    quality: 10,
    width: 50,
    height: 38,
    blur: 300
  })

  useEffect(() => {
    // Skip intersection observer for priority images
    if (priority) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px 0px', // Increased for better UX
        threshold: 0.1
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  // Progressive loading: Load low-res first, then high-res
  useEffect(() => {
    if (!isInView) return

    // Load low-res placeholder first
    const lowResImg = new Image()
    lowResImg.onload = () => setLowResLoaded(true)
    lowResImg.src = lowResSrc
  }, [isInView, lowResSrc])

  const handleLoad = () => {
    setIsLoaded(true)
    imageTracker.onLoadEnd() // Track performance
    onLoad?.()
  }

  const handleError = () => {
    setIsError(true)
    imageTracker.onLoadEnd() // Track even failed loads
    onError?.()
  }

  const handleLoadStart = () => {
    imageTracker.onLoadStart() // Start performance tracking
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <AnimatePresence>
        {/* Low-res placeholder (progressive loading) */}
        {lowResLoaded && !isLoaded && !isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${lowResSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(2px)',
              transform: 'scale(1.05)' // Prevent blur edge artifacts
            }}
          />
        )}

        {/* Loading State */}
        {!lowResLoaded && !isLoaded && !isError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          >
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          >
            <div className="flex flex-col items-center space-y-2 text-gray-500">
              <Image size={24} />
              <span className="text-sm">Failed to load</span>
            </div>
          </motion.div>
        )}

        {/* High-quality Image */}
        {isInView && (
          <motion.img
            ref={imgRef}
            src={optimizedSrc}
            alt={alt}
            sizes={sizes}
            onLoadStart={handleLoadStart}
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            initial={{ scale: 1.02 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            loading={priority ? 'eager' : 'lazy'}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default LazyImage 