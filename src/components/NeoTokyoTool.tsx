import React, { useRef, useState } from 'react';
import { 
  generateNeoTokyoGlitchOverlay, 
  generateNeoTokyoGlitch,
  GlitchMode,
  NeoTokyoGlitchOptions,
  NeoTokyoGlitchResult 
} from '../hooks/useNeoTokyoGlitch';

export const NeoTokyoTool = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [glitchLayer, setGlitchLayer] = useState<string | null>(null);
  const [mergedResult, setMergedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NeoTokyoGlitchResult | null>(null);

  // Neo Tokyo glitch options
  const [options, setOptions] = useState<NeoTokyoGlitchOptions>({
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setGlitchLayer(null);
    setMergedResult(null);
    setResult(null);

    try {
      const img = new Image();
      img.onload = async () => {
        try {
          setOriginalImage(URL.createObjectURL(file));

          // Generate Neo Tokyo glitch effect
          const glitchResult = await generateNeoTokyoGlitch(img, options);
          
          // Convert canvases to data URLs for display
          const glitchDataUrl = glitchResult.glitchCanvas.toDataURL('image/png');
          const mergedDataUrl = glitchResult.mergedCanvas.toDataURL('image/png');
          
          setGlitchLayer(glitchDataUrl);
          setMergedResult(mergedDataUrl);
          setResult(glitchResult);
          
          console.log('Neo Tokyo glitch generated:', glitchResult.metadata);
        } catch (glitchError) {
          setError(`Glitch generation failed: ${glitchError}`);
          console.error('Glitch generation error:', glitchError);
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
          const glitchResult = await generateNeoTokyoGlitch(img, options);
          
          const glitchDataUrl = glitchResult.glitchCanvas.toDataURL('image/png');
          const mergedDataUrl = glitchResult.mergedCanvas.toDataURL('image/png');
          
          setGlitchLayer(glitchDataUrl);
          setMergedResult(mergedDataUrl);
          setResult(glitchResult);
          
          console.log('Neo Tokyo glitch regenerated:', glitchResult.metadata);
        } catch (glitchError) {
          setError(`Regeneration failed: ${glitchError}`);
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

  const handleDownload = (type: 'glitch' | 'merged') => {
    if (type === 'glitch' && glitchLayer) {
      const link = document.createElement('a');
      link.download = `neo-tokyo-glitch-layer-${options.mode}.png`;
      link.href = glitchLayer;
      link.click();
    } else if (type === 'merged' && mergedResult) {
      const link = document.createElement('a');
      link.download = `neo-tokyo-glitch-${options.mode}.png`;
      link.href = mergedResult;
      link.click();
    }
  };

  const handleClear = () => {
    setOriginalImage(null);
    setGlitchLayer(null);
    setMergedResult(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateOption = (key: keyof NeoTokyoGlitchOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
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
      <h2 className="text-2xl font-bold mb-6">🟥 Neo Tokyo Glitch Module</h2>
      
      {/* File Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select Image for Neo Tokyo Glitch
        </label>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload}
          accept="image/*"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
        />
      </div>

      {/* Glitch Options */}
      {originalImage && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <h3 className="font-semibold mb-3 text-red-800">🎮 Glitch Options</h3>
          
          {/* Mode Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Glitch Mode</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {glitchModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => updateOption('mode', mode.value)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    options.mode === mode.value
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
                value={options.intensity}
                onChange={(e) => updateOption('intensity', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtle</span>
                <span className="font-medium">{options.intensity}</span>
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
                value={options.glitchAmount}
                onChange={(e) => updateOption('glitchAmount', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Minimal</span>
                <span className="font-medium">{Math.round(options.glitchAmount * 100)}%</span>
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
                    onClick={() => updateOption('neonColor', color.value)}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                      options.neonColor === color.value
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
                value={options.scanlineOpacity}
                onChange={(e) => updateOption('scanlineOpacity', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Faint</span>
                <span className="font-medium">{Math.round(options.scanlineOpacity * 100)}%</span>
                <span>Bold</span>
              </div>
            </div>
          </div>

          {/* Effect Toggles */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.preserveFace}
                onChange={(e) => updateOption('preserveFace', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Preserve Face</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.enableGlow}
                onChange={(e) => updateOption('enableGlow', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Neon Glow</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.enableScanlines}
                onChange={(e) => updateOption('enableScanlines', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Scanlines</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.enableGlitch}
                onChange={(e) => updateOption('enableGlitch', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Glitch FX</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.enableNeon}
                onChange={(e) => updateOption('enableNeon', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Neon Lines</span>
            </label>
          </div>

          {/* Regenerate Button */}
          <div className="mt-4">
            <button
              onClick={handleRegenerate}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              🔄 Regenerate with New Options
            </button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
            <span className="text-red-800">Processing image and generating Neo Tokyo glitch...</span>
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
      {originalImage && glitchLayer && mergedResult && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">🎮 Generated Results</h3>
          
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
            
            {/* Glitch Layer */}
            <div>
              <h4 className="font-medium mb-2">Glitch Effect Layer</h4>
              <img 
                src={glitchLayer} 
                alt="Glitch Layer" 
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
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium mb-2">Generated Metadata</h4>
              <div className="text-sm text-red-800 space-y-1">
                <div>Mode: <span className="font-medium">{result.metadata.mode}</span></div>
                <div>Effects: <span className="font-medium">{result.metadata.fx.join(', ')}</span></div>
                <div>Intensity: <span className="font-medium">{result.metadata.intensity}</span></div>
                <div>Timestamp: <span className="font-medium">{new Date(result.metadata.timestamp).toLocaleString()}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {glitchLayer && mergedResult && (
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => handleDownload('glitch')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📥 Download Glitch Layer
          </button>
          <button
            onClick={() => handleDownload('merged')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
          <li>• TensorFlow.js detects facial landmarks for identity preservation</li>
          <li>• Choose from 4 glitch modes with customizable intensity</li>
          <li>• Adjust neon colors, glitch amount, and scanline opacity</li>
          <li>• Toggle individual effects on/off</li>
          <li>• Download the glitch layer or final merged result</li>
          <li>• Identity-safe: face stays untouched while body gets cyberpunk treatment</li>
        </ul>
      </div>
    </div>
  );
};
