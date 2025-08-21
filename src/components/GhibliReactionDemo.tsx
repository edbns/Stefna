import React, { useState } from 'react';
import { GhibliReactionTool } from './GhibliReactionTool';
import { GhibliReactionAIGenerator } from './GhibliReactionAIGenerator';

type DemoMode = 'ghibli-tool' | 'ai-generator';

export const GhibliReactionDemo = () => {
  const [activeMode, setActiveMode] = useState<DemoMode>('ghibli-tool');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">🟪 Ghibli Reaction Module</h1>
          <p className="text-xl text-purple-100">
            Drop-in feature for Stefna - Apply emotional anime-style effects to real faces without altering identity
          </p>
          <div className="mt-4 flex items-center space-x-2 text-purple-200">
            <span>✨</span>
            <span>Non-destructive facial enhancement</span>
            <span>✨</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-100 border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveMode('ghibli-tool')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeMode === 'ghibli-tool'
                  ? 'border-purple-600 text-purple-800'
                  : 'border-transparent text-gray-500 hover:text-purple-700'
              }`}
            >
              🎭 Ghibli Tool
            </button>
            <button
              onClick={() => setActiveMode('ai-generator')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeMode === 'ai-generator'
                  ? 'border-purple-600 text-purple-800'
                  : 'border-transparent text-gray-500 hover:text-purple-700'
              }`}
            >
              🤖 AI Generator
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {activeMode === 'ghibli-tool' ? (
          <GhibliReactionTool />
        ) : (
          <GhibliReactionAIGenerator />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-3">🎭 Ghibli Tool</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Upload and process images</li>
                <li>• Generate emotional overlays</li>
                <li>• Customize expression intensity</li>
                <li>• Download effect layers</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">🤖 AI Generator</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Combine Ghibli effects with AI</li>
                <li>• Full generation pipeline</li>
                <li>• Step-by-step processing</li>
                <li>• Multiple output formats</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">🔧 Technology</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mediapipe Face Mesh</li>
                <li>• Canvas-based processing</li>
                <li>• React + TypeScript</li>
                <li>• Tailwind CSS</li>
              </ul>
            </div>
          </div>
          
          {/* Features Grid */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold mb-4 text-center">✨ Key Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">😢</div>
                <div className="text-sm font-medium">Crying</div>
                <div className="text-xs text-gray-500">Tear effects</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">✨</div>
                <div className="text-sm font-medium">Sparkle</div>
                <div className="text-xs text-gray-500">Eye sparkles</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">😅</div>
                <div className="text-sm font-medium">Sweat</div>
                <div className="text-xs text-gray-500">Brow drops</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">😠</div>
                <div className="text-sm font-medium">Anger</div>
                <div className="text-xs text-gray-500">Brow lines</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">😲</div>
                <div className="text-sm font-medium">Surprise</div>
                <div className="text-xs text-gray-500">Exclamation marks</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">🥰</div>
                <div className="text-sm font-medium">Love</div>
                <div className="text-xs text-gray-500">Heart effects</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">🎨</div>
                <div className="text-sm font-medium">Blend Modes</div>
                <div className="text-xs text-gray-500">Multiple options</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">📱</div>
                <div className="text-sm font-medium">Responsive</div>
                <div className="text-xs text-gray-500">Mobile friendly</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
