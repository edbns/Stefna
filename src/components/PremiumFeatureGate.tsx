import React from 'react';
import { Lock, Star, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PremiumFeatureGateProps {
  feature: string;
  description: string;
  children?: React.ReactNode;
  onAuthPrompt: () => void;
  showTeaser?: boolean;
  teaserContent?: React.ReactNode;
}

const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  feature,
  description,
  children,
  onAuthPrompt,
  showTeaser = true,
  teaserContent
}) => {
  const { user } = useAuth();

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Teaser Content with Blur Effect */}
      {showTeaser && teaserContent && (
        <div className="relative">
          <div className="filter blur-sm pointer-events-none opacity-60">
            {teaserContent}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent" />
        </div>
      )}
      
      {/* Premium Prompt Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg border-2 border-dashed border-purple-300">
        <div className="text-center p-6 max-w-sm">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature}</h3>
          <p className="text-gray-600 text-sm mb-4">{description}</p>
          <button
            onClick={onAuthPrompt}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <Star className="w-4 h-4" />
            Unlock Premium
          </button>
          <p className="text-xs text-gray-500 mt-2">Free account • No credit card required</p>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeatureGate;