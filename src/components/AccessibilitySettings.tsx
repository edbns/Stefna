import React from 'react';
import { motion } from 'framer-motion';
import { useAccessibility } from '../hooks/useAccessibility';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  isOpen,
  onClose
}) => {
  const { preferences, updatePreference, announceToScreenReader } = useAccessibility();

  const handleToggle = (key: keyof typeof preferences, value: any) => {
    updatePreference(key, value);
    announceToScreenReader(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg p-6 max-w-md w-full"
        style={{ backgroundColor: '#eee9dd', fontFamily: 'Figtree, sans-serif' }}
        role="dialog"
        aria-labelledby="accessibility-title"
        aria-describedby="accessibility-description"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="accessibility-title" className="text-xl font-semibold" style={{ color: '#2a4152' }}>
            Accessibility Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Close accessibility settings"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <p id="accessibility-description" className="text-gray-600 mb-6 text-sm">
          Customize your experience with these accessibility options.
        </p>

        <div className="space-y-4">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="reduced-motion" className="font-medium" style={{ color: '#2a4152' }}>
                Reduce Motion
              </label>
              <p className="text-sm text-gray-600">Minimize animations and transitions</p>
            </div>
            <button
              id="reduced-motion"
              role="switch"
              aria-checked={preferences.reducedMotion}
              onClick={() => handleToggle('reducedMotion', !preferences.reducedMotion)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.reducedMotion ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="high-contrast" className="font-medium" style={{ color: '#2a4152' }}>
                High Contrast
              </label>
              <p className="text-sm text-gray-600">Increase color contrast for better visibility</p>
            </div>
            <button
              id="high-contrast"
              role="switch"
              aria-checked={preferences.highContrast}
              onClick={() => handleToggle('highContrast', !preferences.highContrast)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.highContrast ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Font Size */}
          <div>
            <label className="font-medium block mb-2" style={{ color: '#2a4152' }}>
              Font Size
            </label>
            <div className="flex space-x-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => handleToggle('fontSize', size)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preferences.fontSize === size
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: preferences.fontSize === size ? '#2a4152' : 'transparent'
                  }}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            These settings are saved locally and will persist across sessions.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AccessibilitySettings;