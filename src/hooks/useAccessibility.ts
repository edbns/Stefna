import { useEffect, useState, useCallback } from 'react';

interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
}

interface UseAccessibilityReturn {
  preferences: AccessibilityPreferences;
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void;
  announceToScreenReader: (message: string) => void;
  focusElement: (selector: string) => void;
}

export const useAccessibility = (): UseAccessibilityReturn => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium',
    screenReader: false,
  });

  // Detect system preferences
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
    };

    const updatePreferences = () => {
      setPreferences(prev => ({
        ...prev,
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: mediaQueries.highContrast.matches,
        screenReader: !!navigator.userAgent.match(/NVDA|JAWS|VoiceOver|ORCA/i),
      }));
    };

    updatePreferences();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem('accessibility-preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse accessibility preferences:', error);
      }
    }
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
    
    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--font-size-multiplier', 
      preferences.fontSize === 'small' ? '0.875' :
      preferences.fontSize === 'large' ? '1.125' : '1'
    );
    
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (preferences.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [preferences]);

  const updatePreference = useCallback(<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return {
    preferences,
    updatePreference,
    announceToScreenReader,
    focusElement,
  };
};