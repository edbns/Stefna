// Cloudinary URL Optimization Utilities
// Centralized image optimization for consistent performance

export interface CloudinaryOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'crop'
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west'
  dpr?: 'auto' | number
  blur?: number
  sharpen?: boolean
  progressive?: boolean
  placeholder?: boolean
}

export interface ProgressiveImageUrls {
  placeholder: string    // Blurry, tiny, fast loading
  thumbnail: string      // Small, clear, medium loading  
  preview: string        // Medium size, good quality
  full: string           // Full size, best quality
}

export interface ResponsiveImageSet {
  src: string
  srcSet: string
  sizes: string
  placeholder: string
}

/**
 * Optimize a Cloudinary URL with performance-focused transformations
 */
export function optimizeCloudinaryUrl(
  url: string, 
  options: CloudinaryOptions = {}
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url
  }

  const {
    width,
    height,
    quality = 75, // Reduced from 80 for better compression
    format = 'auto', // Will choose WebP/AVIF automatically
    crop = 'limit',
    gravity = 'auto',
    dpr = 'auto',
    blur,
    sharpen = false,
    progressive = true
  } = options

  try {
    const [baseUrl, imagePath] = url.split('/upload/')
    if (!baseUrl || !imagePath) return url

    const transformations: string[] = []

    // Format and quality (most important for performance)
    transformations.push(`f_${format}`)
    transformations.push(`q_${quality}`)

    // Dimensions
    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
    if (width || height) transformations.push(`c_${crop}`)

    // Responsive and device optimization
    transformations.push(`dpr_${dpr}`)

    // Visual enhancements
    if (gravity !== 'auto') transformations.push(`g_${gravity}`)
    if (blur) transformations.push(`e_blur:${blur}`)
    if (sharpen) transformations.push('e_sharpen')

    // Performance optimizations
    if (progressive !== false) {
      transformations.push('fl_progressive') // Progressive JPEG
    }
    transformations.push('fl_immutable_cache') // Better caching
    transformations.push('fl_force_strip') // Remove metadata for smaller files
    transformations.push('fl_attachment') // Prevent download prompts

    const transformationString = transformations.join(',')
    return `${baseUrl}/upload/${transformationString}/${imagePath}`
  } catch (error) {
    console.warn('Failed to optimize Cloudinary URL:', error)
    return url
  }
}

/**
 * Ultra-aggressive optimization for feed images (maximum performance)
 * Uses smallest possible sizes and highest compression
 */
export function optimizeFeedImage(url: string): string {
  return optimizeCloudinaryUrl(url, {
    width: 400, // Smaller size for feed
    quality: 70, // Higher compression
    format: 'auto', // WebP/AVIF
    progressive: true,
    crop: 'limit'
  })
}

/**
 * Generate responsive image set for different screen sizes
 */
export function generateResponsiveImageSet(
  url: string,
  options: CloudinaryOptions = {}
): ResponsiveImageSet {
  if (!url.includes('cloudinary.com')) {
    return {
      src: url,
      srcSet: url,
      sizes: '100vw',
      placeholder: url
    }
  }

  const baseOptions = { format: 'auto' as const, quality: 75, ...options } // Reduced quality for better compression

  // Generate different sizes for responsive loading (optimized for performance)
  const sizes = [
    { width: 300, descriptor: '300w' }, // Mobile
    { width: 600, descriptor: '600w' }, // Tablet
    { width: 900, descriptor: '900w' }, // Desktop
    { width: 1200, descriptor: '1200w' } // Large screens
  ]

  const srcSet = sizes
    .map(({ width, descriptor }) => 
      `${optimizeCloudinaryUrl(url, { ...baseOptions, width })} ${descriptor}`
    )
    .join(', ')

  // Default src (600px width for better performance)
  const src = optimizeCloudinaryUrl(url, { ...baseOptions, width: 600 })

  // Ultra-low-quality placeholder (LQIP) for faster loading
  const placeholder = optimizeCloudinaryUrl(url, {
    ...baseOptions,
    width: 30,
    quality: 5,
    blur: 500
  })

  // Responsive sizes attribute
  const responsiveSizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'

  return {
    src,
    srcSet,
    sizes: responsiveSizes,
    placeholder
  }
}

/**
 * Preload critical images for better performance
 */
export function preloadImage(url: string, options: CloudinaryOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const optimizedUrl = optimizeCloudinaryUrl(url, options)
    
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload image: ${optimizedUrl}`))
    img.src = optimizedUrl
  })
}

/**
 * Batch preload multiple images
 */
export async function preloadImages(
  urls: string[], 
  options: CloudinaryOptions = {}
): Promise<void> {
  const preloadPromises = urls.map(url => preloadImage(url, options))
  
  try {
    await Promise.allSettled(preloadPromises)
  } catch (error) {
    console.warn('Some images failed to preload:', error)
  }
}

/**
 * Get optimal image dimensions based on container size
 */
export function getOptimalDimensions(
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio: number = window.devicePixelRatio || 1
): { width: number; height: number } {
  // Account for device pixel ratio but cap at 2x for performance
  const dpr = Math.min(devicePixelRatio, 2)
  
  return {
    width: Math.ceil(containerWidth * dpr),
    height: Math.ceil(containerHeight * dpr)
  }
}

/**
 * Video thumbnail optimization
 */
export function optimizeVideoThumbnail(
  videoUrl: string,
  options: CloudinaryOptions & { timeOffset?: number } = {}
): string {
  if (!videoUrl.includes('cloudinary.com')) {
    return videoUrl
  }

  const { timeOffset = 0, ...imageOptions } = options
  
  try {
    const [baseUrl, videoPath] = videoUrl.split('/upload/')
    if (!baseUrl || !videoPath) return videoUrl

    // Convert video to image thumbnail
    const transformations = [
      `so_${timeOffset}`, // Time offset for thumbnail
      'f_auto', // Auto format
      'q_80', // Good quality
      'c_limit',
      'w_800',
      'h_600'
    ]

    const transformationString = transformations.join(',')
    return `${baseUrl}/upload/${transformationString}/${videoPath.replace(/\.[^.]+$/, '.jpg')}`
  } catch (error) {
    console.warn('Failed to optimize video thumbnail:', error)
    return videoUrl
  }
}

/**
 * 🚀 PROGRESSIVE ENHANCEMENT: Generate multiple quality levels for progressive loading
 * Perfect for poor network conditions - users see something immediately!
 */
export function generateProgressiveImageUrls(
  url: string,
  options: CloudinaryOptions = {}
): ProgressiveImageUrls {
  if (!url.includes('cloudinary.com')) {
    return {
      placeholder: url,
      thumbnail: url,
      preview: url,
      full: url
    }
  }

  const baseOptions = { format: 'auto' as const, ...options }

  return {
    // 🚀 PLACEHOLDER: Blurry, tiny, loads in ~100ms
    placeholder: optimizeCloudinaryUrl(url, {
      ...baseOptions,
      quality: 10,
      width: 50,
      blur: 1000,
      progressive: true
    }),

    // 🚀 THUMBNAIL: Small, clear, loads in ~200ms  
    thumbnail: optimizeCloudinaryUrl(url, {
      ...baseOptions,
      quality: 40,
      width: 600,
      progressive: true
    }),

    // 🚀 PREVIEW: Medium size, good quality, loads in ~500ms
    preview: optimizeCloudinaryUrl(url, {
      ...baseOptions,
      quality: 70,
      width: 800,
      progressive: true
    }),

    // 🚀 FULL: Full size, best quality, loads in ~1000ms
    full: optimizeCloudinaryUrl(url, {
      ...baseOptions,
      quality: 80,
      width: 1024,
      progressive: true
    })
  }
}

/**
 * 🚀 SMART LOADING: Progressive image loader with automatic enhancement
 * Loads images progressively: placeholder → thumbnail → preview → full
 */
export async function loadProgressiveImage(
  url: string,
  options: CloudinaryOptions = {},
  onProgress?: (stage: 'placeholder' | 'thumbnail' | 'preview' | 'full') => void
): Promise<HTMLImageElement> {
  const urls = generateProgressiveImageUrls(url, options)
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    // 🚀 STAGE 1: Load placeholder immediately
    img.src = urls.placeholder
    onProgress?.('placeholder')
    
    img.onload = () => {
      // 🚀 STAGE 2: Load thumbnail
      img.src = urls.thumbnail
      onProgress?.('thumbnail')
      
      img.onload = () => {
        // 🚀 STAGE 3: Load preview
        img.src = urls.preview
        onProgress?.('preview')
        
        img.onload = () => {
          // 🚀 STAGE 4: Load full quality
          img.src = urls.full
          onProgress?.('full')
          
          img.onload = () => {
            resolve(img)
          }
          
          img.onerror = reject
        }
        
        img.onerror = () => {
          // If preview fails, use thumbnail as final
          resolve(img)
        }
      }
      
      img.onerror = () => {
        // If thumbnail fails, use placeholder as final
        resolve(img)
      }
    }
    
    img.onerror = reject
  })
}
