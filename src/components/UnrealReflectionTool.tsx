import React, { useRef, useState } from 'react';
import { useUnrealReflection, FaceMaskOptions } from '../hooks/useUnrealReflection';

export const UnrealReflectionTool = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generateMaskFromImage, generateSimpleMask, generateFullFaceMask } = useUnrealReflection();
  const [isProcessing, setIsProcessing] = useState(false);
  const [maskData, setMaskData] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Mask options state
  const [maskOptions, setMaskOptions] = useState<FaceMaskOptions>({
    includeEyes: true,
    includeMouth: true,
    includeEyebrows: false,
    includeNose: false,
    maskOpacity: 0.8,
    smoothEdges: true
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    
    try {
      const img = new Image();
      img.onload = async () => {
        try {
          const maskCanvas = await generateMaskFromImage(img, maskOptions);
          const maskDataUrl = maskCanvas.toDataURL('image/png');
          
          setMaskData(maskDataUrl);
          setOriginalImage(URL.createObjectURL(file));
          console.log('Unreal Reflection Mask ready:', maskDataUrl);
        } catch (maskError) {
          setError(`Mask generation failed: ${maskError}`);
          console.error('Mask generation error:', maskError);
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

  const handleQuickMask = async (type: 'simple' | 'full') => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const img = new Image();
      img.onload = async () => {
        try {
          let maskCanvas;
          if (type === 'simple') {
            maskCanvas = await generateSimpleMask(img);
          } else {
            maskCanvas = await generateFullFaceMask(img);
          }
          
          const maskDataUrl = maskCanvas.toDataURL('image/png');
          setMaskData(maskDataUrl);
          console.log(`${type} mask generated:`, maskDataUrl);
        } catch (maskError) {
          setError(`${type} mask generation failed: ${maskError}`);
          console.error('Mask generation error:', maskError);
        } finally {
          setIsProcessing(false);
        }
      };
      
      img.src = originalImage;
    } catch (error) {
      setError(`${type} mask generation failed: ${error}`);
      setIsProcessing(false);
    }
  };

  const handleDownloadMask = () => {
    if (!maskData) return;
    
    const link = document.createElement('a');
    link.download = 'unreal-reflection.png';
    link.href = maskData;
    link.click();
  };

  const handleClear = () => {
    setMaskData(null);
    setOriginalImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateMaskOption = (key: keyof FaceMaskOptions, value: any) => {
    setMaskOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🎭 Unreal Reflection Tool</h2>
      
      {/* File Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select Image for Face Mask Generation
        </label>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept="image/*"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
        />
      </div>

      {/* Mask Options */}
      {originalImage && (
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

      {/* Processing State */}
      {isProcessing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">Processing image and generating face mask...</span>
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
      {originalImage && maskData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Original Image */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Original Image</h3>
            <img 
              src={originalImage} 
              alt="Original" 
              className="w-full h-auto rounded-lg border border-gray-200"
            />
          </div>
          
          {/* Generated Mask */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Generated Mask</h3>
            <img 
              src={maskData} 
              alt="Unreal Reflection Mask" 
              className="w-full h-auto rounded-lg border border-gray-200 bg-gray-100"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {originalImage && (
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => handleQuickMask('simple')}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            🎯 Simple Mask
          </button>
          <button
            onClick={() => handleQuickMask('full')}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            🎭 Full Face Mask
          </button>
          <button
            onClick={() => handleFileChange({ target: { files: [{ src: originalImage }] } } as any)}
            disabled={isProcessing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            🔄 Regenerate with Options
          </button>
        </div>
      )}

      {maskData && (
        <div className="flex gap-4">
          <button
            onClick={handleDownloadMask}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            📥 Download Mask
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            🗑️ Clear
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Upload an image with a clear face</li>
          <li>• TensorFlow.js detects facial landmarks</li>
          <li>• Customize which face regions to include</li>
          <li>• Adjust opacity and edge smoothing</li>
          <li>• Download the mask for use with AI generation</li>
        </ul>
      </div>
    </div>
  );
};
