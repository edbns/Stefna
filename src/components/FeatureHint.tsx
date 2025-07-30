import React, { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

interface FeatureHintProps {
  title: string;
  description: string;
  onAuthPrompt: () => void;
  onDismiss: () => void;
}

const FeatureHint: React.FC<FeatureHintProps> = ({ title, description, onAuthPrompt, onDismiss }) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-purple-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-purple-900">{title}</h4>
          <p className="text-purple-700 text-sm mt-1">{description}</p>
          <button
            onClick={onAuthPrompt}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium mt-2"
          >
            Learn more →
          </button>
        </div>
        <button onClick={onDismiss} className="text-purple-400 hover:text-purple-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FeatureHint;