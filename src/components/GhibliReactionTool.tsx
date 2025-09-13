import React, { useRef, useState } from 'react';
import {
  applyGhibliReactionFX,
  GhibliReactionOptions
} from '../hooks/useGhibliReaction';

export const GhibliReactionTool = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [mergedResult, setMergedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ghibli reaction options
  const [options, setOptions] = useState<GhibliReactionOptions>({
    enableTears: true,
    enableHearts: false,
    enableBlush: false,
    enableEyeShine: false,
    tearIntensity: 0.8,
    heartOpacity: 0.7,
    blushIntensity: 0.6,
    eyeShineBrightness: 0.9
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setMergedResult(null);

    try {
      const img = new Image();
      img.onload = async () => {
        try {
          setOriginalImage(URL.createObjectURL(file));

          // Generate Ghibli reaction
          const imageUrl = URL.createObjectURL(file);
          const processedImageUrl = await applyGhibliReactionFX(imageUrl, options);

          setOriginalImage(imageUrl);
          setMergedResult(processedImageUrl);
          
          console.log('Ghibli reaction generated successfully');
        } catch (reactionError) {
          setError(`Ghibli reaction generation failed: ${reactionError}`);
          console.error('Reaction generation error:', reactionError);
        } finally {
          setIsProcessing(false);
        }
      };
      
      img.onerror = () => {
        setError('Failed to load image');
        setIsProcessing(false);
      };
      
      img.src = URL.createObjectURL(file);
    } catch (error) {
      setError(`File processing failed: ${error}`);
      setIsProcessing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const img = new Image();
      img.onload = async () => {
        try {
          const processedImageUrl = await applyGhibliReactionFX(originalImage!, options);

          setMergedResult(processedImageUrl);

          console.log('Ghibli reaction regenerated successfully');
        } catch (reactionError) {
          setError(`Regeneration failed: ${reactionError}`);
        } finally {
          setIsProcessing(false);
        }
      };
      
      img.src = originalImage;
    } catch (error) {
      setError(`Regeneration failed: ${error}`);
      setIsProcessing(false);
    }
  };

  const updateOption = <K extends keyof GhibliReactionOptions>(
    key: K,
    value: GhibliReactionOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    setOriginalImage(null);
    setMergedResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🟪 Ghibli Reaction Module</h2>
      
      {/* File Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select Image for Ghibli Reaction
        </label>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload}
          accept="image/*"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
        />
      </div>

      {/* Reaction Options */}
      {originalImage && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="font-semibold mb-3 text-purple-800">Ghibli Reaction Effects</h3>

          {/* Effect Toggles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableTears"
                checked={options.enableTears}
                onChange={(e) => updateOption('enableTears', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="enableTears" className="text-sm font-medium">Tears 😢</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableHearts"
                checked={options.enableHearts}
                onChange={(e) => updateOption('enableHearts', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="enableHearts" className="text-sm font-medium">Hearts 💖</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableBlush"
                checked={options.enableBlush}
                onChange={(e) => updateOption('enableBlush', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="enableBlush" className="text-sm font-medium">Blush 😊</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableEyeShine"
                checked={options.enableEyeShine}
                onChange={(e) => updateOption('enableEyeShine', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="enableEyeShine" className="text-sm font-medium">Eye Shine</label>
            </div>
          </div>

          {/* Intensity Controls */}
          {options.enableTears && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Tear Intensity</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={options.tearIntensity}
                onChange={(e) => updateOption('tearIntensity', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Light</span>
                <span className="font-medium">{Math.round(options.tearIntensity * 100)}%</span>
                <span>Heavy</span>
              </div>
            </div>
          )}

          {options.enableHearts && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Heart Opacity</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={options.heartOpacity}
                onChange={(e) => updateOption('heartOpacity', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Faint</span>
                <span className="font-medium">{Math.round(options.heartOpacity * 100)}%</span>
                <span>Bright</span>
              </div>
            </div>
          )}

          {options.enableBlush && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Blush Intensity</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={options.blushIntensity}
                onChange={(e) => updateOption('blushIntensity', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtle</span>
                <span className="font-medium">{Math.round(options.blushIntensity * 100)}%</span>
                <span>Strong</span>
              </div>
            </div>
          )}

          {options.enableEyeShine && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Eye Shine Brightness</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={options.eyeShineBrightness}
                onChange={(e) => updateOption('eyeShineBrightness', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Dim</span>
                <span className="font-medium">{Math.round(options.eyeShineBrightness * 100)}%</span>
                <span>Brilliant</span>
              </div>
            </div>
          )}

          {/* Regenerate Button */}
          <div className="mt-4">
            <button
              onClick={handleRegenerate}
              disabled={isProcessing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              🔄 Regenerate with New Options
            </button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
            <span className="text-purple-800">Processing image and generating Ghibli reaction...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Results Display */}
      {originalImage && mergedResult && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">🎭 Generated Results</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Image */}
            <div>
              <h4 className="font-medium mb-2">Original Image</h4>
              <img
                src={originalImage}
                alt="Original"
                className="w-full h-auto rounded-lg border border-gray-200"
              />
            </div>

            {/* Processed Result */}
            <div>
              <h4 className="font-medium mb-2">Ghibli Reaction Result</h4>
              <img
                src={mergedResult}
                alt="Ghibli Reaction Result"
                className="w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          </div>

          {/* Effect Summary */}
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium mb-2">Applied Effects</h4>
            <div className="text-sm text-purple-800 space-y-1">
              {options.enableTears && <div>😢 Tears: {Math.round(options.tearIntensity * 100)}% intensity</div>}
              {options.enableHearts && <div>💖 Hearts: {Math.round(options.heartOpacity * 100)}% opacity</div>}
              {options.enableBlush && <div>😊 Blush: {Math.round(options.blushIntensity * 100)}% intensity</div>}
              {options.enableEyeShine && <div>✨ Eye Shine: {Math.round(options.eyeShineBrightness * 100)}% brightness</div>}
              {!options.enableTears && !options.enableHearts && !options.enableBlush && !options.enableEyeShine && (
                <div className="text-gray-500">No effects enabled</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {originalImage && mergedResult && (
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => handleDownload(mergedResult!, 'ghibli-reaction-result.png')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            📥 Download Result
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            🗑️ Clear All
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Upload an image with a clear face</li>
          <li>• Enable the Ghibli reaction effects you want to apply</li>
          <li>• Adjust intensity levels for each effect</li>
          <li>• Generate and preview the result</li>
          <li>• Download the processed image with Ghibli-style effects</li>
          <li>• Non-destructive: keeps original image intact</li>
        </ul>
      </div>
    </div>
  );
};
