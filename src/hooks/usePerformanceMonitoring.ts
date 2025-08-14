// Performance Monitoring Hook
// Track Core Web Vitals and media loading performance

import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  
  // Custom metrics
  imageLoadTime?: number
  apiResponseTime?: number
  renderTime?: number
}

interface PerformanceConfig {
  enableCoreWebVitals?: boolean
  enableCustomMetrics?: boolean
  sampleRate?: number // 0-1, percentage of sessions to monitor
  onMetric?: (metric: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') => void
}

export function usePerformanceMonitoring(config: PerformanceConfig = {}) {
  const {
    enableCoreWebVitals = false, // Temporarily disabled
    enableCustomMetrics = false, // Temporarily disabled
    sampleRate = 0.1, // Monitor 10% of sessions by default
    onMetric
  } = config

  const metricsRef = useRef<PerformanceMetrics>({})
  const shouldMonitor = useRef(false) // Temporarily disabled

  useEffect(() => {
    // PERFORMANCE MONITORING COMPLETELY DISABLED
    // The web-vitals import was causing "TypeError: ii is not a constructor" in production
    // All monitoring code is disabled until the constructor issue is resolved
    
    // Early return - no monitoring code will execute
    return
    
    // All monitoring code below is unreachable and disabled
    if (!shouldMonitor.current) return

    // Core Web Vitals monitoring - DISABLED (web-vitals import causes constructor errors)
    if (false && enableCoreWebVitals) {
      // web-vitals import completely removed to prevent constructor errors
    }

    // Custom performance monitoring - DISABLED
    if (false && enableCustomMetrics) {
      // Custom metrics disabled
    }
  }, [enableCoreWebVitals, enableCustomMetrics, onMetric])

  // Track image loading performance
  const trackImageLoad = (startTime: number, endTime: number, imageUrl: string) => {
    if (!shouldMonitor.current) return

    const loadTime = endTime - startTime
    metricsRef.current.imageLoadTime = loadTime
    
    const rating = loadTime < 500 ? 'good' : loadTime < 1500 ? 'needs-improvement' : 'poor'
    onMetric?.('imageLoadTime', loadTime, rating)

    // Log slow images for debugging
    if (loadTime > 2000) {
      console.warn(`Slow image load: ${imageUrl} took ${loadTime}ms`)
    }
  }

  // Track API response time
  const trackApiCall = (endpoint: string, startTime: number, endTime: number) => {
    if (!shouldMonitor.current) return

    const responseTime = endTime - startTime
    metricsRef.current.apiResponseTime = responseTime
    
    const rating = responseTime < 200 ? 'good' : responseTime < 1000 ? 'needs-improvement' : 'poor'
    onMetric?.('apiResponseTime', responseTime, rating)

    // Log slow API calls
    if (responseTime > 3000) {
      console.warn(`Slow API call: ${endpoint} took ${responseTime}ms`)
    }
  }

  // Get current metrics snapshot
  const getMetrics = (): PerformanceMetrics => ({ ...metricsRef.current })

  // Report metrics to analytics service
  const reportMetrics = () => {
    if (!shouldMonitor.current) return

    const metrics = getMetrics()
    
    // Send to analytics service (replace with your analytics provider)
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics, DataDog, etc.
      console.log('Performance metrics:', metrics)
    }
  }

  return {
    trackImageLoad,
    trackApiCall,
    getMetrics,
    reportMetrics,
    isMonitoring: shouldMonitor.current
  }
}

// Enhanced LazyImage with performance tracking - DISABLED
export function useImagePerformanceTracking() {
  // Temporarily disabled - return mock functions
  const trackImage = (imageUrl: string) => {
    return { onLoadStart: () => {}, onLoadEnd: () => {} }
  }

  return { trackImage }
}

// Performance-aware fetch wrapper - DISABLED
export function usePerformantFetch() {
  // Temporarily disabled - return standard fetch
  const performantFetch = async (url: string, options?: RequestInit) => {
    return fetch(url, options)
  }

  return { performantFetch }
}
