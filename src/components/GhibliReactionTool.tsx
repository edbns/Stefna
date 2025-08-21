import React, { useRef, useState } from 'react';
import { 
  generateGhibliOverlay, 
  generateGhibliReaction,
  ExpressionType,
  GhibliReactionOptions,
  GhibliReactionResult 
} from '../hooks/useGhibliReaction';

export const GhibliReactionTool = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [ghibliLayer, setGhibliLayer] = useState<string | null>(null);
  const [mergedResult, setMergedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GhibliReactionResult | null>(null);

  // Ghibli reaction options
  const [options, setOptions] = useState<GhibliReactionOptions>({
    expression: 'crying',
    intensity: 3,
    opacity: 0.8,
    blendMode: 'normal',
    enableShadows: true,
    enableHighlights: true
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setGhibliLayer(null);
    setMergedResult(null);
    setResult(null);

    try {
      const img = new Image();
      img.onload = async () => {
        try {
          setOriginalImage(URL.createObjectURL(file));

          // Generate Ghibli reaction
          const reactionResult = await generateGhibliReaction(img, options);
          
          // Convert canvases to data URLs for display
          const ghibliDataUrl = reactionResult.ghibliLayer.toDataURL('image/png');
          const mergedDataUrl = reactionResult.mergedCanvas.toDataURL('image/png');
          
          setGhibliLayer(ghibliDataUrl);
          setMergedResult(mergedDataUrl);
          setResult(reactionResult);
          
          console.log('Ghibli reaction generated:', reactionResult.metadata);
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
          const reactionResult = await generateGhibliReaction(img, options);
          
          const ghibliDataUrl = reactionResult.ghibliLayer.toDataURL('image/png');
          const mergedDataUrl = reactionResult.mergedCanvas.toDataURL('image/png');
          
          setGhibliLayer(ghibliDataUrl);
          setMergedResult(mergedDataUrl);
          setResult(reactionResult);
          
          console.log('Ghibli reaction regenerated:', reactionResult.metadata);
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

  const handleDownload = (type: 'ghibli' | 'merged') => {
    if (type === 'ghibli' && ghibliLayer) {
      const link = document.createElement('a');
      link.download = `ghibli-layer-${options.expression}.png`;
      link.href = ghibliLayer;
      link.click();
    } else if (type === 'merged' && mergedResult) {
      const link = document.createElement('a');
      link.download = `ghibli-reaction-${options.expression}.png`;
      link.href = mergedResult;
      link.click();
    }
  };

  const handleClear = () => {
    setOriginalImage(null);
    setGhibliLayer(null);
    setMergedResult(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateOption = (key: keyof GhibliReactionOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
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
          <h3 className="font-semibold mb-3 text-purple-800">🎭 Reaction Options</h3>
          
          {/* Expression Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Expression</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {expressions.map((expr) => (
                <button
                  key={expr.value}
                  onClick={() => updateOption('expression', expr.value)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    options.expression === expr.value
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
                value={options.intensity}
                onChange={(e) => updateOption('intensity', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtle</span>
                <span className="font-medium">{options.intensity}</span>
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
                value={options.opacity}
                onChange={(e) => updateOption('opacity', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Transparent</span>
                <span className="font-medium">{Math.round(options.opacity! * 100)}%</span>
                <span>Opaque</span>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Blend Mode</label>
              <select
                value={options.blendMode}
                onChange={(e) => updateOption('blendMode', e.target.value)}
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
                  checked={options.enableShadows}
                  onChange={(e) => updateOption('enableShadows', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Shadows</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.enableHighlights}
                  onChange={(e) => updateOption('enableHighlights', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Highlights</span>
              </label>
            </div>
          </div>

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
      {originalImage && ghibliLayer && mergedResult && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">🎭 Generated Results</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Original Image */}
            <div>
              <h4 className="font-medium mb-2">Original Image</h4>
              <img 
                src={originalImage} 
                alt="Original" 
                className="w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
            
            {/* Ghibli Layer */}
            <div>
              <h4 className="font-medium mb-2">Ghibli Effect Layer</h4>
              <img 
                src={ghibliLayer} 
                alt="Ghibli Layer" 
                className="w-full h-auto rounded-lg border border-gray-200 bg-gray-100"
              />
            </div>
            
            {/* Merged Result */}
            <div>
              <h4 className="font-medium mb-2">Final Result</h4>
              <img 
                src={mergedResult} 
                alt="Merged Result" 
                className="w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          </div>

          {/* Metadata */}
          {result && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium mb-2">Generated Metadata</h4>
              <div className="text-sm text-purple-800 space-y-1">
                <div>Expression: <span className="font-medium">{result.metadata.expression}</span></div>
                <div>Intensity: <span className="font-medium">{result.metadata.intensity}</span></div>
                <div>Timestamp: <span className="font-medium">{new Date(result.metadata.timestamp).toLocaleString()}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {ghibliLayer && mergedResult && (
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => handleDownload('ghibli')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📥 Download Effect Layer
          </button>
          <button
            onClick={() => handleDownload('merged')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            📥 Download Final Result
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
          <li>• Mediapipe detects facial landmarks for precise placement</li>
          <li>• Choose from 6 emotional expressions with customizable intensity</li>
          <li>• Adjust opacity, blend modes, shadows, and highlights</li>
          <li>• Download the effect layer or final merged result</li>
          <li>• Non-destructive: keeps real facial structure intact</li>
        </ul>
      </div>
    </div>
  );
};
