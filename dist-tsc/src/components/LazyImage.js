import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { useImagePerformanceTracking } from '../hooks/usePerformanceMonitoring';
import { motion, AnimatePresence } from '../utils/motionShim';
import { optimizeCloudinaryUrl } from '../utils/cloudinaryOptimization';
const LazyImage = ({ src, alt, className = '', placeholder, onLoad, onError, priority = false, sizes, quality = 80, format = 'auto' }) => {
    // EMERGENCY FALLBACK - if anything fails, just render a simple img
    try {
        const [isLoaded, setIsLoaded] = useState(false);
        const [isError, setIsError] = useState(false);
        const [isInView, setIsInView] = useState(priority); // Priority images load immediately
        const [lowResLoaded, setLowResLoaded] = useState(false);
        const imgRef = useRef(null);
        const containerRef = useRef(null);
        // Motion components are always available from motionShim
        // Performance tracking (now using safe mock implementation)
        const { trackImage } = useImagePerformanceTracking();
        const imageTracker = trackImage(src);
        // Optimize Cloudinary URLs for performance using centralized utility
        const optimizedSrc = optimizeCloudinaryUrl(src, {
            format,
            quality,
            width: 800,
            height: 600,
            dpr: 'auto'
        });
        const lowResSrc = optimizeCloudinaryUrl(src, {
            format: 'auto',
            quality: 10,
            width: 50,
            height: 38,
            blur: 300
        });
        useEffect(() => {
            // Skip intersection observer for priority images
            if (priority)
                return;
            const observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            }, {
                rootMargin: '100px 0px', // Increased for better UX
                threshold: 0.1
            });
            if (containerRef.current) {
                observer.observe(containerRef.current);
            }
            return () => observer.disconnect();
        }, [priority]);
        // Progressive loading: Load low-res first, then high-res
        useEffect(() => {
            if (!isInView)
                return;
            // Load low-res placeholder first using native Image constructor
            const NativeImage = typeof window !== 'undefined' && 'Image' in window ? window.Image : null;
            if (NativeImage) {
                const lowResImg = new NativeImage();
                lowResImg.onload = () => setLowResLoaded(true);
                lowResImg.src = lowResSrc;
            }
            else {
                // SSR or very old env: skip preloading
                setLowResLoaded(true);
            }
        }, [isInView, lowResSrc]);
        const handleLoad = () => {
            setIsLoaded(true);
            imageTracker.onLoadEnd(); // Track performance
            onLoad?.();
        };
        const handleError = () => {
            setIsError(true);
            imageTracker.onLoadEnd(); // Track even failed loads
            onError?.();
        };
        const handleLoadStart = () => {
            imageTracker.onLoadStart(); // Start performance tracking
        };
        // Motion components are always defined from motionShim
        return (_jsx("div", { ref: containerRef, className: `relative overflow-hidden ${className}`, children: _jsxs(AnimatePresence, { children: [lowResLoaded && !isLoaded && !isError && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0", style: {
                            backgroundImage: `url(${lowResSrc})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(2px)',
                            transform: 'scale(1.05)' // Prevent blur edge artifacts
                        } })), !lowResLoaded && !isLoaded && !isError && (_jsx(motion.div, { initial: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 bg-gray-100 flex items-center justify-center", children: _jsxs("div", { className: "flex items-center space-x-2 text-gray-500", children: [_jsx(Loader2, { size: 20, className: "animate-spin" }), _jsx("span", { className: "text-sm", children: "Loading..." })] }) })), isError && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "absolute inset-0 bg-gray-100 flex items-center justify-center", children: _jsxs("div", { className: "flex flex-col items-center space-y-2 text-gray-500", children: [_jsx(ImageIcon, { size: 24 }), _jsx("span", { className: "text-sm", children: "Failed to load" })] }) })), isInView && (_jsx(motion.img, { ref: imgRef, src: optimizedSrc, alt: alt, sizes: sizes, onLoadStart: handleLoadStart, onLoad: handleLoad, onError: handleError, className: `w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`, initial: { scale: 1.02 }, animate: { scale: 1 }, transition: { duration: 0.5, ease: 'easeOut' }, loading: priority ? 'eager' : 'lazy' }))] }) }));
    }
    catch (error) {
        console.error('🚨 LazyImage failed, using simple fallback:', error);
        // Emergency fallback - just a simple img tag
        return (_jsx("img", { src: src, alt: alt, className: className, onLoad: onLoad, onError: onError, loading: priority ? 'eager' : 'lazy' }));
    }
};
export default LazyImage;
