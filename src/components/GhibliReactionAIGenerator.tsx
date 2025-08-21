import React, { useRef, useState } from 'react';
import { useGhibliReactionAI, GhibliAIResult } from '../hooks/useGhibliReactionAI';
import { GhibliReactionOptions, ExpressionType } from '../hooks/useGhibliReaction';

export const GhibliReactionAIGenerator = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const { 
    generateWithGhibliAndAI, 
    generateGhibliOnly, 
    isProcessing, 
    currentStep, 
    lastResult,
    downloadResult,
    clearResults
  } = useGhibliReactionAI();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [ghibliOptions, setGhibliOptions] = useState<GhibliReactionOptions>({
    expression: 'crying',
    intensity: 3,
    opacity: 0.8,
    blendMode: 'normal',
    enableShadows: true,
    enableHighlights: true
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

    const result = await generateWithGhibliAndAI(selectedImage, ghibliOptions, aiPrompt);
    console.log('AI generation result:', result);
  };

  const handleGenerateGhibliOnly = async () => {
    if (!selectedImage) return;

    const result = await generateGhibliOnly(selectedImage, ghibliOptions);
    console.log('Ghibli only result:', result);
  };

  const updateGhibliOption = (key: keyof GhibliReactionOptions, value: any) => {
    setGhibliOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    setSelectedImage(null);
    setAiPrompt('');
    clearResults();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (promptInputRef.current) promptInputRef.current.value = '';
  };

  const expressions: { value: ExpressionType; label: string; emoji: string }[] = [
    { value: 'crying', label: 'Crying', emoji: '😢' },
    { value: 'sparkle', label: 'Sparkle', emoji: '✨' },
    { value: 'sweat', label: 'Sweat', emoji: '😅' },
    { value: 'anger', label: 'Anger', emoji: '😠' },
    { value: 'surprise', label: 'Surprise', emoji: '😲' },
    { value: 'love', label: 'Love', emoji: '🥰' }
  ];

  const blendModes = [
    { value: 'normal', label: 'Normal' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'screen', label: 'Screen' },
    { value: 'overlay', label: 'Overlay' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🟪 Ghibli Reaction + AI Generator</h2>
      
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
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Ghibli Reaction Options */}
      {selectedImage && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="font-semibold mb-3 text-purple-800">🎭 Ghibli Reaction Options</h3>
          
          {/* Expression Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Expression</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {expressions.map((expr) => (
                <button
                  key={expr.value}
                  onClick={() => updateGhibliOption('expression', expr.value)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    ghibliOptions.expression === expr.value
                      ? 'border-purple-600 bg-purple-100 text-purple-800'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{expr.emoji}</div>
                  <div className="text-xs">{expr.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Intensity and Opacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Intensity</label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={ghibliOptions.intensity}
                onChange={(e) => updateGhibliOption('intensity', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtle</span>
                <span className="font-medium">{ghibliOptions.intensity}</span>
                <span>Dramatic</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Opacity</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={ghibliOptions.opacity}
                onChange={(e) => updateGhibliOption('opacity', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Transparent</span>
                <span className="font-medium">{Math.round(ghibliOptions.opacity! * 100)}%</span>
                <span>Opaque</span>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Blend Mode</label>
              <select
                value={ghibliOptions.blendMode}
                onChange={(e) => updateGhibliOption('blendMode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {blendModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={ghibliOptions.enableShadows}
                  onChange={(e) => updateGhibliOption('enableShadows', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Shadows</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={ghibliOptions.enableHighlights}
                  onChange={(e) => updateGhibliOption('enableHighlights', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Highlights</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Generation Buttons */}
      {selectedImage && (
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleGenerateGhibliOnly}
            disabled={isProcessing}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
          >
            🎭 Ghibli Reaction Only
          </button>
          <button
            onClick={handleGenerateWithAI}
            disabled={isProcessing || !aiPrompt.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            🤖 Ghibli + AI Generation
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
                
                {/* Ghibli Result */}
                {lastResult.ghibliResult && (
                  <div>
                    <h4 className="font-medium mb-2">Ghibli Reaction</h4>
                    <img 
                      src={lastResult.ghibliResult.mergedCanvas.toDataURL('image/png')} 
                      alt="Ghibli Reaction" 
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
              {lastResult.ghibliResult && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium mb-2">Ghibli Reaction Metadata</h4>
                  <div className="text-sm text-purple-800 space-y-1">
                    <div>Expression: <span className="font-medium">{lastResult.ghibliResult.metadata.expression}</span></div>
                    <div>Intensity: <span className="font-medium">{lastResult.ghibliResult.metadata.intensity}</span></div>
                    <div>Timestamp: <span className="font-medium">{new Date(lastResult.ghibliResult.metadata.timestamp).toLocaleString()}</span></div>
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
          {lastResult.ghibliResult && (
            <>
              <button
                onClick={() => downloadResult('ghibli')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📥 Download Ghibli Layer
              </button>
              <button
                onClick={() => downloadResult('merged')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                📥 Download Ghibli Result
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
          <li>• Choose Ghibli reaction expression and settings</li>
          <li>• Write AI prompt for transformation (optional)</li>
          <li>• Generate Ghibli reaction only or with AI enhancement</li>
          <li>• Download individual layers or final results</li>
          <li>• Non-destructive: keeps real facial structure intact</li>
        </ul>
      </div>
    </div>
  );
};
