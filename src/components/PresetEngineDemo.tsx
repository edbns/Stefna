import React, { useState } from 'react';
import { PresetSelector } from './PresetSelector';
import { getActivePresets, getPresetStats, buildPresetPayload, PresetCategory } from '../config/presetEngine';

export const PresetEngineDemo: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [apiPayload, setApiPayload] = useState<any>(null);

  const activePresets = getActivePresets();
  const stats = getPresetStats();

  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
    setCustomPrompt('');
    setApiPayload(null);
  };

  const handleCustomPromptChange = (prompt: string) => {
    setCustomPrompt(prompt);
    if (selectedPreset) {
      try {
        const payload = buildPresetPayload(selectedPreset as any, 'https://example.com/image.jpg', prompt);
        setApiPayload(payload);
      } catch (error) {
        console.error('Failed to build payload:', error);
        setApiPayload(null);
      }
    }
  };

  const handleGeneratePayload = () => {
    if (selectedPreset) {
      try {
        const payload = buildPresetPayload(selectedPreset as any, 'https://example.com/image.jpg', customPrompt);
        setApiPayload(payload);
      } catch (error) {
        console.error('Failed to build payload:', error);
        setApiPayload(null);
      }
    }
  };

  const selectedPresetData = selectedPreset ? activePresets.find(p => p.presetKey === selectedPreset) : null;

  return (
    <div className="preset-engine-demo p-6 bg-black text-white min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🎨 Preset Engine Demo</h1>
          <p className="text-xl text-white/60">
            Smart preset rotation system with 25 professional presets
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-sm text-white/60">Total Presets</div>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-400">{Object.keys(stats.byCategory).length}</div>
            <div className="text-sm text-white/60">Categories</div>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.averageStrength.toFixed(1)}</div>
            <div className="text-sm text-white/60">Avg Strength</div>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <div className="text-2xl font-bold text-orange-400">{activePresets.length}</div>
            <div className="text-sm text-white/60">Active Today</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Preset Selector */}
          <div>
            <PresetSelector />
          </div>

          {/* Right: Preset Details & API */}
          <div className="space-y-6">
            {/* Selected Preset Details */}
            {selectedPresetData && (
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">🎯 Selected Preset</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-white/60">Name:</span>
                    <span className="ml-2 font-medium">{selectedPresetData.displayName}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Category:</span>
                    <span className="ml-2 px-2 py-1 bg-white/10 text-white/60 rounded text-sm">
                      {selectedPresetData.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/60">Strength:</span>
                    <span className="ml-2 text-white">{selectedPresetData.strength}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Model:</span>
                    <span className="ml-2 text-white">{selectedPresetData.model}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Description:</span>
                    <p className="mt-1 text-white/80">{selectedPresetData.description}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Features:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedPresetData.features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-white/60">Prompt Fragment:</span>
                    <p className="mt-1 text-white/80 font-mono text-sm bg-white/5 p-2 rounded">
                      {selectedPresetData.promptFragment}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Prompt Input */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">✏️ Custom Prompt</h3>
              <div className="space-y-3">
                <textarea
                  placeholder="Add your custom prompt here..."
                  value={customPrompt}
                  onChange={(e) => handleCustomPromptChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-[#333333] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors resize-none h-20"
                />
                <button
                  onClick={handleGeneratePayload}
                  disabled={!selectedPreset}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  🚀 Generate API Payload
                </button>
              </div>
            </div>

            {/* API Payload Display */}
            {apiPayload && (
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">📡 API Payload</h3>
                <div className="bg-black/50 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-green-400 text-sm whitespace-pre-wrap">
                    {JSON.stringify(apiPayload, null, 2)}
                  </pre>
                </div>
                <div className="mt-3 text-xs text-white/60">
                  This payload can be sent directly to your AI generation API
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">📖 How to Use</h3>
              <div className="space-y-2 text-sm text-white/80">
                <p>1. <strong>Select a preset</strong> from the left panel</p>
                <p>2. <strong>Add custom prompt</strong> (optional) to enhance the preset</p>
                <p>3. <strong>Generate API payload</strong> for your backend</p>
                <p>4. <strong>Send to AI API</strong> with the generated payload</p>
                <p>5. <strong>Presets rotate automatically</strong> every 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-xl font-semibold mb-4">📊 Category Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div key={category} className="text-center">
                <div className="text-2xl font-bold text-blue-400">{count}</div>
                <div className="text-sm text-white/60">{category}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
