import React, { useState } from 'react';
import { NeoTokyoTool } from './NeoTokyoTool';
import { NeoTokyoGlitchAIGenerator } from './NeoTokyoGlitchAIGenerator';

type DemoMode = 'glitch-tool' | 'ai-generator';

export const NeoTokyoGlitchDemo = () => {
  const [activeMode, setActiveMode] = useState<DemoMode>('glitch-tool');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-purple-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">🟥 Neo Tokyo Glitch Module</h1>
          <p className="text-xl text-red-100">
            Drop-in feature for Stefna - Cyberpunk, cel-shaded, neon-glitched transformation while preserving identity
          </p>
          <div className="mt-4 flex items-center space-x-2 text-red-200">
            <span>💀</span>
            <span>Identity-safe face preservation</span>
            <span>💀</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-100 border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveMode('glitch-tool')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeMode === 'glitch-tool'
                  ? 'border-red-600 text-red-800'
                  : 'border-transparent text-gray-500 hover:text-red-700'
              }`}
            >
              🎮 Glitch Tool
            </button>
            <button
              onClick={() => setActiveMode('ai-generator')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeMode === 'ai-generator'
                  ? 'border-red-600 text-red-800'
                  : 'border-transparent text-gray-500 hover:text-red-700'
              }`}
            >
              🤖 AI Generator
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {activeMode === 'glitch-tool' ? (
          <NeoTokyoTool />
        ) : (
          <NeoTokyoGlitchAIGenerator />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-3">🎮 Glitch Tool</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Upload and process images</li>
                <li>• Generate cyberpunk glitch effects</li>
                <li>• Customize intensity and effects</li>
                <li>• Download effect layers</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">🤖 AI Generator</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Combine glitch effects with AI</li>
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
                <div className="text-2xl mb-2">🏙️</div>
                <div className="text-sm font-medium">Neo Tokyo</div>
                <div className="text-xs text-gray-500">Cyberpunk city</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">🤖</div>
                <div className="text-sm font-medium">Cyberpunk</div>
                <div className="text-xs text-gray-500">High-tech dystopian</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">💻</div>
                <div className="text-sm font-medium">Digital Glitch</div>
                <div className="text-xs text-gray-500">Pure artifacts</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">🌈</div>
                <div className="text-sm font-medium">Neon Wave</div>
                <div className="text-xs text-gray-500">Smooth aesthetics</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">💀</div>
                <div className="text-sm font-medium">Face Safe</div>
                <div className="text-xs text-gray-500">Identity preserved</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">🎨</div>
                <div className="text-sm font-medium">Cel Shading</div>
                <div className="text-xs text-gray-500">Anime style</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">✨</div>
                <div className="text-sm font-medium">Neon Glow</div>
                <div className="text-xs text-gray-500">Luminous effects</div>
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
