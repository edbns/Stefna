import React, { useRef, useState } from 'react';
import { useNeoTokyoGlitchAI, NeoTokyoAIResult } from '../hooks/useNeoTokyoGlitchAI';
import { NeoTokyoGlitchOptions, GlitchMode } from '../hooks/useNeoTokyoGlitch';

export const NeoTokyoGlitchAIGenerator = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const { 
    generateWithGlitchAndAI, 
    generateGlitchOnly, 
    isProcessing, 
    currentStep, 
    lastResult,
    downloadResult,
    clearResults
  } = useNeoTokyoGlitchAI();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [glitchOptions, setGlitchOptions] = useState<NeoTokyoGlitchOptions>({
    mode: 'neo_tokyo',
    intensity: 3,
    neonColor: '#ff00ff',
    glitchAmount: 0.5,
    scanlineOpacity: 0.3,
    preserveFace: true,
    enableGlow: true,
    enableScanlines: true,
    enableGlitch: true,
    enableNeon: true
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      clearResults();
    }
  };

  const handleGenerateWithAI = async () => {
    if (!selectedImage || !aiPrompt.trim()) return;

    const result = await generateWithGlitchAndAI(selectedImage, glitchOptions, aiPrompt);
    console.log('AI generation result:', result);
  };

  const handleGenerateGlitchOnly = async () => {
    if (!selectedImage) return;

    const result = await generateGlitchOnly(selectedImage, glitchOptions);
    console.log('Glitch only result:', result);
  };

  const updateGlitchOption = (key: keyof NeoTokyoGlitchOptions, value: any) => {
    setGlitchOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    setSelectedImage(null);
    setAiPrompt('');
    clearResults();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (promptInputRef.current) promptInputRef.current.value = '';
  };

  const glitchModes: { value: GlitchMode; label: string; emoji: string; description: string }[] = [
    { value: 'neo_tokyo', label: 'Neo Tokyo', emoji: '🏙️', description: 'Cyberpunk city aesthetic' },
    { value: 'cyberpunk', label: 'Cyberpunk', emoji: '🤖', description: 'High-tech dystopian' },
    { value: 'digital_glitch', label: 'Digital Glitch', emoji: '💻', description: 'Pure digital artifacts' },
    { value: 'neon_wave', label: 'Neon Wave', emoji: '🌈', description: 'Smooth neon aesthetics' }
  ];

  const neonColors = [
    { value: '#ff00ff', label: 'Magenta', preview: '🟪' },
    { value: '#00ffff', label: 'Cyan', preview: '🟦' },
    { value: '#ffff00', label: 'Yellow', preview: '🟨' },
    { value: '#ff0080', label: 'Pink', preview: '💗' },
    { value: '#00ff80', label: 'Green', preview: '🟢' },
    { value: '#8000ff', label: 'Purple', preview: '🟣' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🟥 Neo Tokyo Glitch + AI Generator</h2>
      
      {/* Image Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select Source Image
        </label>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageSelect}
          accept="image/*"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
        />
      </div>

      {/* AI Prompt Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          AI Generation Prompt
        </label>
        <textarea
          ref={promptInputRef}
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Describe how you want to transform the image with AI..."
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Neo Tokyo Glitch Options */}
      {selectedImage && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <h3 className="font-semibold mb-3 text-red-800">🎮 Neo Tokyo Glitch Options</h3>
          
          {/* Mode Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Glitch Mode</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {glitchModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => updateGlitchOption('mode', mode.value)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    glitchOptions.mode === mode.value
                      ? 'border-red-600 bg-red-100 text-red-800'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{mode.emoji}</div>
                  <div className="text-sm font-medium">{mode.label}</div>
                  <div className="text-xs text-gray-600">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Intensity and Glitch Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Intensity</label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={glitchOptions.intensity}
                onChange={(e) => updateGlitchOption('intensity', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtle</span>
                <span className="font-medium">{glitchOptions.intensity}</span>
                <span>Intense</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Glitch Amount</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={glitchOptions.glitchAmount}
                onChange={(e) => updateGlitchOption('glitchAmount', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Minimal</span>
                <span className="font-medium">{Math.round(glitchOptions.glitchAmount * 100)}%</span>
                <span>Maximum</span>
              </div>
            </div>
          </div>

          {/* Neon Color and Scanline Opacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Neon Color</label>
              <div className="grid grid-cols-3 gap-2">
                {neonColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateGlitchOption('neonColor', color.value)}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                      glitchOptions.neonColor === color.value
                        ? 'border-red-600 bg-red-100'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{color.preview}</div>
                    <div className="text-xs">{color.label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Scanline Opacity</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={glitchOptions.scanlineOpacity}
                onChange={(e) => updateGlitchOption('scanlineOpacity', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Faint</span>
                <span className="font-medium">{Math.round(glitchOptions.scanlineOpacity * 100)}%</span>
                <span>Bold</span>
              </div>
            </div>
          </div>

          {/* Effect Toggles */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={glitchOptions.preserveFace}
                onChange={(e) => updateGlitchOption('preserveFace', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Preserve Face</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={glitchOptions.enableGlow}
                onChange={(e) => updateGlitchOption('enableGlow', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Neon Glow</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={glitchOptions.enableScanlines}
                onChange={(e) => updateGlitchOption('enableScanlines', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Scanlines</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={glitchOptions.enableGlitch}
                onChange={(e) => updateGlitchOption('enableGlitch', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Glitch FX</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={glitchOptions.enableNeon}
                onChange={(e) => updateGlitchOption('enableNeon', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Neon Lines</span>
            </label>
          </div>
        </div>
      )}

      {/* Generation Buttons */}
      {selectedImage && (
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleGenerateGlitchOnly}
            disabled={isProcessing}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
          >
            🎮 Neo Tokyo Glitch Only
          </button>
          <button
            onClick={handleGenerateWithAI}
            disabled={isProcessing || !aiPrompt.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            🤖 Glitch + AI Generation
          </button>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800 font-medium">{currentStep}</span>
          </div>
          <div className="text-sm text-blue-600">
            Processing your request...
          </div>
        </div>
      )}

      {/* Results Display */}
      {lastResult && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {lastResult.success ? '✅ Generation Complete' : '❌ Generation Failed'}
          </h3>
          
          {lastResult.success ? (
            <div className="space-y-6">
              {/* Processing Steps */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium mb-2 text-green-800">Processing Steps</h4>
                <div className="space-y-1">
                  {lastResult.processingSteps.map((step, index) => (
                    <div key={index} className="text-sm text-green-700 flex items-center">
                      <span className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-xs mr-2">
                        {index + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Results */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Original Image */}
                {lastResult.originalImage && (
                  <div>
                    <h4 className="font-medium mb-2">Original Image</h4>
                    <img 
                      src={lastResult.originalImage} 
                      alt="Original" 
                      className="w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                
                {/* Glitch Result */}
                {lastResult.glitchResult && (
                  <div>
                    <h4 className="font-medium mb-2">Neo Tokyo Glitch</h4>
                    <img 
                      src={lastResult.glitchResult.mergedCanvas.toDataURL('image/png')} 
                      alt="Neo Tokyo Glitch" 
                      className="w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                
                {/* AI Generated Image */}
                {lastResult.aiGeneratedImage && (
                  <div>
                    <h4 className="font-medium mb-2">AI Generated Result</h4>
                    <img 
                      src={lastResult.aiGeneratedImage} 
                      alt="AI Generated" 
                      className="w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              {/* Metadata */}
              {lastResult.glitchResult && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium mb-2">Neo Tokyo Glitch Metadata</h4>
                  <div className="text-sm text-red-800 space-y-1">
                    <div>Mode: <span className="font-medium">{lastResult.glitchResult.metadata.mode}</span></div>
                    <div>Effects: <span className="font-medium">{lastResult.glitchResult.metadata.fx.join(', ')}</span></div>
                    <div>Intensity: <span className="font-medium">{lastResult.glitchResult.metadata.intensity}</span></div>
                    <div>Timestamp: <span className="font-medium">{new Date(lastResult.glitchResult.metadata.timestamp).toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{lastResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {lastResult?.success && (
        <div className="flex flex-wrap gap-4 mb-6">
          {lastResult.glitchResult && (
            <>
              <button
                onClick={() => downloadResult('glitch')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📥 Download Glitch Layer
              </button>
              <button
                onClick={() => downloadResult('merged')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                📥 Download Glitch Result
              </button>
            </>
          )}
          {lastResult.aiGeneratedImage && (
            <button
              onClick={() => downloadResult('ai')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📥 Download AI Result
            </button>
          )}
        </div>
      )}

      {/* Clear Button */}
      <div className="flex gap-4">
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          🗑️ Clear All
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">How to use:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Select an image with a clear face</li>
          <li>• Choose Neo Tokyo glitch mode and settings</li>
          <li>• Write AI prompt for transformation (optional)</li>
          <li>• Generate glitch effect only or with AI enhancement</li>
          <li>• Download individual layers or final results</li>
          <li>• Identity-safe: face stays untouched while body gets cyberpunk treatment</li>
        </ul>
      </div>
    </div>
  );
};
