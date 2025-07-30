import React, { useEffect } from 'react';

interface LaunchScreenProps {
  onComplete: () => void;
}

const LaunchScreen: React.FC<LaunchScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Auto-complete after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center z-50">
      {/* Glass Effect Background */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-gray-600/20 to-gray-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-gray-500/20 to-gray-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Main Content - No Container */}
      <div className="relative z-10 text-center">
        {/* STEFNA Text with Bounce Animations - Smaller Size */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-wider font-figtree">
          <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>S</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>t</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>e</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.6s' }}>f</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '0.8s' }}>n</span>
          <span className="inline-block animate-bounce" style={{ animationDelay: '1.0s' }}>a</span>
        </h1>
        
        {/* Loading Animation */}
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaunchScreen;