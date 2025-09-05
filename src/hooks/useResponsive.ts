// Mobile detection and responsive utilities
import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile device
 * FORCES mobile view even if user requests desktop site
 * @returns boolean indicating if the device is mobile
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Check screen width (primary detection)
      const isSmallScreen = window.innerWidth <= 768;
      
      // Check user agent for mobile devices (even if desktop site is requested)
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Check for touch capability
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // FORCE mobile view if ANY of these conditions are true
      // This overrides "Request Desktop Site" in mobile browsers
      setIsMobile(isSmallScreen || isMobileUserAgent || isTouchDevice);
    };

    // Check on mount
    checkIsMobile();

    // Listen for resize events
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
}

/**
 * Hook to get responsive breakpoint information
 * @returns object with breakpoint information
 */
export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width <= 768) {
        setBreakpoint('mobile');
      } else if (width <= 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop'
  };
}

/**
 * Get CSS classes for responsive design
 * @param mobileClasses - Classes to apply on mobile
 * @param desktopClasses - Classes to apply on desktop
 * @param isMobile - Whether the device is mobile
 * @returns Combined CSS classes
 */
export function getResponsiveClasses(
  mobileClasses: string,
  desktopClasses: string,
  isMobile: boolean
): string {
  return isMobile ? mobileClasses : desktopClasses;
}

/**
 * Check if a feature should be hidden on mobile
 * @param feature - The feature to check
 * @param isMobile - Whether the device is mobile
 * @returns boolean indicating if the feature should be hidden
 */
export function shouldHideOnMobile(feature: 'login' | 'upload' | 'profile' | 'generation', isMobile: boolean): boolean {
  if (!isMobile) return false;
  
  // Hide these features on mobile for view-only experience
  const hiddenFeatures = ['login', 'upload', 'profile', 'generation'];
  return hiddenFeatures.includes(feature);
}
