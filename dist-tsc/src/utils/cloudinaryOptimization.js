// Cloudinary URL Optimization Utilities
// Centralized image optimization for consistent performance
/**
 * Optimize a Cloudinary URL with performance-focused transformations
 */
export function optimizeCloudinaryUrl(url, options = {}) {
    if (!url || !url.includes('cloudinary.com')) {
        return url;
    }
    const { width, height, quality = 80, format = 'auto', crop = 'limit', gravity = 'auto', dpr = 'auto', blur, sharpen = false } = options;
    try {
        const [baseUrl, imagePath] = url.split('/upload/');
        if (!baseUrl || !imagePath)
            return url;
        const transformations = [];
        // Format and quality (most important for performance)
        transformations.push(`f_${format}`);
        transformations.push(`q_${quality}`);
        // Dimensions
        if (width)
            transformations.push(`w_${width}`);
        if (height)
            transformations.push(`h_${height}`);
        if (width || height)
            transformations.push(`c_${crop}`);
        // Responsive and device optimization
        transformations.push(`dpr_${dpr}`);
        // Visual enhancements
        if (gravity !== 'auto')
            transformations.push(`g_${gravity}`);
        if (blur)
            transformations.push(`e_blur:${blur}`);
        if (sharpen)
            transformations.push('e_sharpen');
        // Auto-optimize for best performance
        transformations.push('fl_progressive'); // Progressive JPEG
        transformations.push('fl_immutable_cache'); // Better caching
        const transformationString = transformations.join(',');
        return `${baseUrl}/upload/${transformationString}/${imagePath}`;
    }
    catch (error) {
        console.warn('Failed to optimize Cloudinary URL:', error);
        return url;
    }
}
/**
 * Generate responsive image set for different screen sizes
 */
export function generateResponsiveImageSet(url, options = {}) {
    if (!url.includes('cloudinary.com')) {
        return {
            src: url,
            srcSet: url,
            sizes: '100vw',
            placeholder: url
        };
    }
    const baseOptions = { format: 'auto', quality: 80, ...options };
    // Generate different sizes for responsive loading
    const sizes = [
        { width: 400, descriptor: '400w' },
        { width: 800, descriptor: '800w' },
        { width: 1200, descriptor: '1200w' },
        { width: 1600, descriptor: '1600w' }
    ];
    const srcSet = sizes
        .map(({ width, descriptor }) => `${optimizeCloudinaryUrl(url, { ...baseOptions, width })} ${descriptor}`)
        .join(', ');
    // Default src (800px width)
    const src = optimizeCloudinaryUrl(url, { ...baseOptions, width: 800 });
    // Low-quality placeholder (LQIP)
    const placeholder = optimizeCloudinaryUrl(url, {
        ...baseOptions,
        width: 50,
        quality: 10,
        blur: 300
    });
    // Responsive sizes attribute
    const responsiveSizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
    return {
        src,
        srcSet,
        sizes: responsiveSizes,
        placeholder
    };
}
/**
 * Preload critical images for better performance
 */
export function preloadImage(url, options = {}) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const optimizedUrl = optimizeCloudinaryUrl(url, options);
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload image: ${optimizedUrl}`));
        img.src = optimizedUrl;
    });
}
/**
 * Batch preload multiple images
 */
export async function preloadImages(urls, options = {}) {
    const preloadPromises = urls.map(url => preloadImage(url, options));
    try {
        await Promise.allSettled(preloadPromises);
    }
    catch (error) {
        console.warn('Some images failed to preload:', error);
    }
}
/**
 * Get optimal image dimensions based on container size
 */
export function getOptimalDimensions(containerWidth, containerHeight, devicePixelRatio = window.devicePixelRatio || 1) {
    // Account for device pixel ratio but cap at 2x for performance
    const dpr = Math.min(devicePixelRatio, 2);
    return {
        width: Math.ceil(containerWidth * dpr),
        height: Math.ceil(containerHeight * dpr)
    };
}
/**
 * Video thumbnail optimization
 */
export function optimizeVideoThumbnail(videoUrl, options = {}) {
    if (!videoUrl.includes('cloudinary.com')) {
        return videoUrl;
    }
    const { timeOffset = 0, ...imageOptions } = options;
    try {
        const [baseUrl, videoPath] = videoUrl.split('/upload/');
        if (!baseUrl || !videoPath)
            return videoUrl;
        // Convert video to image thumbnail
        const transformations = [
            `so_${timeOffset}`, // Time offset for thumbnail
            'f_auto', // Auto format
            'q_80', // Good quality
            'c_limit',
            'w_800',
            'h_600'
        ];
        const transformationString = transformations.join(',');
        return `${baseUrl}/upload/${transformationString}/${videoPath.replace(/\.[^.]+$/, '.jpg')}`;
    }
    catch (error) {
        console.warn('Failed to optimize video thumbnail:', error);
        return videoUrl;
    }
}
