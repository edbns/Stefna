import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield, Settings, Check } from 'lucide-react';

interface CookiesConsentProps {
  onAccept: (preferences: CookiePreferences) => void;
  onDecline: () => void;
}

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const CookiesConsent: React.FC<CookiesConsentProps> = ({ onAccept, onDecline }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsented = localStorage.getItem('cookies-consent');
    if (!hasConsented) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    localStorage.setItem('cookies-consent', JSON.stringify(allPreferences));
    onAccept(allPreferences);
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('cookies-consent', JSON.stringify(preferences));
    onAccept(preferences);
    setIsVisible(false);
  };

  const handleDecline = () => {
    const minimalPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    localStorage.setItem('cookies-consent', JSON.stringify(minimalPreferences));
    onDecline();
    setIsVisible(false);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Can't disable necessary cookies
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <Cookie className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-black mb-1">
                  We use cookies to enhance your experience
                </h3>
                <p className="text-sm text-gray-600">
                  We use cookies and similar technologies to help personalize content, provide a better user experience, and analyze our traffic. 
                  By clicking "Accept All", you consent to our use of cookies.
                </p>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Cookie Categories */}
            {showDetails && (
              <div className="mb-4 space-y-3">
                {/* Necessary Cookies */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-black" />
                    <div>
                      <h4 className="font-medium text-black">Necessary</h4>
                      <p className="text-xs text-gray-600">Required for the website to function properly</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Always active</span>
                    <Check className="w-4 h-4 text-black" />
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-black" />
                    <div>
                      <h4 className="font-medium text-black">Analytics</h4>
                      <p className="text-xs text-gray-600">Help us understand how visitors interact with our website</p>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePreference('analytics')}
                    className={`w-6 h-6 rounded-md border-2 transition-colors ${
                      preferences.analytics
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {preferences.analytics && <Check className="w-3 h-3 text-white mx-auto" />}
                  </button>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Cookie className="w-5 h-5 text-black" />
                    <div>
                      <h4 className="font-medium text-black">Marketing</h4>
                      <p className="text-xs text-gray-600">Used to deliver personalized advertisements</p>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePreference('marketing')}
                    className={`w-6 h-6 rounded-md border-2 transition-colors ${
                      preferences.marketing
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {preferences.marketing && <Check className="w-3 h-3 text-white mx-auto" />}
                  </button>
                </div>

                {/* Functional Cookies */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-black" />
                    <div>
                      <h4 className="font-medium text-black">Functional</h4>
                      <p className="text-xs text-gray-600">Enable enhanced functionality and personalization</p>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePreference('functional')}
                    className={`w-6 h-6 rounded-md border-2 transition-colors ${
                      preferences.functional
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {preferences.functional && <Check className="w-3 h-3 text-white mx-auto" />}
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={handleAcceptSelected}
                className="px-6 py-2 bg-white text-black border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Accept Selected
              </button>
              <button
                onClick={handleDecline}
                className="px-6 py-2 bg-white text-gray-600 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-6 py-2 text-black underline hover:no-underline transition-colors"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesConsent; 