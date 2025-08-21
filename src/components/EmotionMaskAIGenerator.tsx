import React, { useRef, useState } from 'react';
import { useEmotionMaskAI, AIGenerationResult } from '../hooks/useEmotionMaskAI';
import { FaceMaskOptions } from '../hooks/useEmotionMask';

export const EmotionMaskAIGenerator = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const { 
    generateWithMask, 
    generateWithoutMask, 
    isGenerating, 
    lastMask,
    downloadLastMask 
  } = useEmotionMaskAI();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generationResult, setGenerationResult] = useState<AIGenerationResult | null>(null);
  const [maskOptions, setMaskOptions] = useState<FaceMaskOptions>({
    includeEyes: true,
    includeMouth: true,
    includeEyebrows: false,
    includeNose: false,
    maskOpacity: 0.8,
    smoothEdges: true
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setGenerationResult(null);
    }
  };

  const handleGenerateWithMask = async () => {
    if (!selectedImage || !prompt.trim()) return;

    const result = await generateWithMask(selectedImage, prompt, maskOptions);
    setGenerationResult(result);
  };

  const handleGenerateWithoutMask = async () => {
    if (!selectedImage || !prompt.trim()) return;

    const result = await generateWithoutMask(selectedImage, prompt);
    setGenerationResult(result);
  };

  const updateMaskOption = (key: keyof FaceMaskOptions, value: any) => {
    setMaskOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    setSelectedImage(null);
    setPrompt('');
    setGenerationResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (promptInputRef.current) promptInputRef.current.value = '';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🎭 Emotion Mask + AI Generator</h2>
      
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

      {/* Prompt Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          AI Generation Prompt
        </label>
        <textarea
          ref={promptInputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe how you want to transform the image..."
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      {/* Mask Options */}
      {selectedImage && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Mask Options</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={maskOptions.includeEyes}
                onChange={(e) => updateMaskOption('includeEyes', e.target.checked)}
                className="mr-2"
              />
              Eyes
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={maskOptions.includeMouth}
                onChange={(e) => updateMaskOption('includeMouth', e.target.checked)}
                className="mr-2"
              />
              Mouth
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={maskOptions.includeEyebrows}
                onChange={(e) => updateMaskOption('includeEyebrows', e.target.checked)}
                className="mr-2"
              />
              Eyebrows
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={maskOptions.includeNose}
                onChange={(e) => updateMaskOption('includeNose', e.target.checked)}
                className="mr-2"
              />
              Nose
            </label>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Opacity</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={maskOptions.maskOpacity}
                onChange={(e) => updateMaskOption('maskOpacity', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{Math.round(maskOptions.maskOpacity! * 100)}%</span>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={maskOptions.smoothEdges}
                  onChange={(e) => updateMaskOption('smoothEdges', e.target.checked)}
                  className="mr-2"
                />
                Smooth Edges
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Generation Buttons */}
      {selectedImage && prompt.trim() && (
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleGenerateWithMask}
            disabled={isGenerating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            🎭 Generate with Mask
          </button>
          <button
            onClick={handleGenerateWithoutMask}
            disabled={isGenerating}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium"
          >
            🖼️ Generate without Mask
          </button>
        </div>
      )}

      {/* Processing State */}
      {isGenerating && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">Generating AI image...</span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {generationResult && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {generationResult.success ? '✅ Generation Complete' : '❌ Generation Failed'}
          </h3>
          
          {generationResult.success ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Image */}
                {selectedImage && (
                  <div>
                    <h4 className="font-medium mb-2">Original Image</h4>
                    <img 
                      src={URL.createObjectURL(selectedImage)} 
                      alt="Original" 
                      className="w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                
                {/* Generated Image */}
                <div>
                  <h4 className="font-medium mb-2">Generated Image</h4>
                  <img 
                    src={generationResult.result} 
                    alt="Generated" 
                    className="w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              </div>
              
              {/* Mask Info */}
              {generationResult.maskUsed && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    🎭 Generated with emotion mask for precise facial feature control
                  </p>
                  {lastMask && (
                    <button
                      onClick={downloadLastMask}
                      className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      📥 Download Used Mask
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{generationResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
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
          <li>• Write a prompt describing your desired transformation</li>
          <li>• Choose mask options for facial feature control</li>
          <li>• Generate with mask for precise control, or without for full transformation</li>
          <li>• Download the generated image and mask for further use</li>
        </ul>
      </div>
    </div>
  );
};
