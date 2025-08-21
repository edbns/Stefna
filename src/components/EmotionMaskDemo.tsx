import React, { useState } from 'react';
import { EmotionMaskTool } from './EmotionMaskTool';
import { EmotionMaskAIGenerator } from './EmotionMaskAIGenerator';

type DemoMode = 'mask-tool' | 'ai-generator';

export const EmotionMaskDemo = () => {
  const [activeMode, setActiveMode] = useState<DemoMode>('mask-tool');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">🎭 Emotion Mask v2.0</h1>
          <p className="text-xl text-gray-300">
            Advanced facial feature detection and AI-guided image generation using Mediapipe Face Mesh
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-100 border-b">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveMode('mask-tool')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeMode === 'mask-tool'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🎯 Mask Tool
            </button>
            <button
              onClick={() => setActiveMode('ai-generator')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeMode === 'ai-generator'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🤖 AI Generator
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {activeMode === 'mask-tool' ? (
          <EmotionMaskTool />
        ) : (
          <EmotionMaskAIGenerator />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-3">🎭 Mask Tool</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Upload and process images</li>
                <li>• Generate precise facial masks</li>
                <li>• Customize mask regions</li>
                <li>• Download masks for external use</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">🤖 AI Generator</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Combine masks with AI generation</li>
                <li>• Precise facial feature control</li>
                <li>• Compare masked vs unmasked results</li>
                <li>• Full AI generation pipeline</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">🔧 Technology</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mediapipe Face Mesh</li>
                <li>• React + TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Canvas-based processing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
