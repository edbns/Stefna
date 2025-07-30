import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Cookie, Shield, FileText } from 'lucide-react';

interface ConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
}

const ConsentBanner: React.FC<ConsentBannerProps> = ({ onAccept, onDecline }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleAccept = () => {
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    setIsVisible(false);
    onDecline();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Consent Banner */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Cookie className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Cookie Consent
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                We use cookies and similar technologies to enhance your browsing experience, provide personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  What we use cookies for:
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Essential website functionality</li>
                  <li>• Remembering your preferences</li>
                  <li>• Analytics and performance monitoring</li>
                  <li>• Improving user experience</li>
                </ul>
              </div>

              {/* Legal Links */}
              <div className="flex flex-wrap gap-4 text-sm">
                <Link 
                  to="/privacy-policy" 
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Privacy Policy
                </Link>
                <Link 
                  to="/cookies-policy" 
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Cookie className="w-4 h-4 mr-1" />
                  Cookies Policy
                </Link>
                <Link 
                  to="/terms-and-conditions" 
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Terms & Conditions
                </Link>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleAccept}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Accept All Cookies
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Decline Non-Essential
              </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              You can change your preferences at any time in your browser settings.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConsentBanner;