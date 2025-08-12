import React, { useState, useCallback } from 'react'
import { Image, Video, Upload, Settings, Play, Square, RotateCcw } from 'lucide-react'
import ImageToImageUpload from './ImageToImageUpload'
import aiGenerationService, { GenerationRequest, GenerationStatus } from '../services/aiGenerationService'
import fileUploadService from '../services/fileUploadService'
import aimlModelService from '../services/aimlModelService'
import { requireUserIntent } from '../utils/generationGuards'

interface I2IV2VInterfaceProps {
  userId: string
  userTier: any
  onGenerationComplete: (result: any) => void
  onError: (error: string) => void
  className?: string
}

const I2IV2VInterface: React.FC<I2IV2VInterfaceProps> = ({
  userId,
  userTier,
  onGenerationComplete,
  onError,
  className = ''
}) => {
  const [mode, setMode] = useState<'i2i' | 'v2v'>('i2i')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null)
  const [quality, setQuality] = useState<'standard' | 'high'>('high')

  // Get available models for the current mode
  const getAvailableModels = useCallback(() => {
    if (mode === 'i2i') {
      return aimlModelService.getModelsByCapability('image-to-image')
    } else {
      return aimlModelService.getModelsByCapability('video-to-video')
    }
  }, [mode])

  const handleFileSelect = useCallback((file: File, url: string) => {
    setSelectedFile(file)
    setFileUrl(url)
  }, [])

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null)
    setFileUrl(null)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!selectedFile || !fileUrl) {
      onError('Please select a file first')
      return
    }

    if (!prompt.trim()) {
      onError('Please enter a prompt')
      return
    }
    
    // Apply user intent guard
    if (requireUserIntent({ userInitiated: true, source: 'custom' })) {
      onError('Generation blocked by guard');
      return;
    }

    setIsGenerating(true)
    setGenerationStatus({
      isGenerating: true,
      progress: 0,
      status: 'processing'
    })

    try {
      // Use existing smart detection - let the system decide based on file type
      const request: GenerationRequest = {
        prompt: prompt.trim(),
        type: mode === 'i2i' ? 'photo' : 'video',
        quality,
        userId,
        userTier,
        imageFile: mode === 'i2i' ? selectedFile : undefined,
        videoFile: mode === 'v2v' ? selectedFile : undefined,
        imageUrl: mode === 'i2i' ? fileUrl : undefined,
        videoUrl: mode === 'v2v' ? fileUrl : undefined
      }

      const result = await aiGenerationService.generateContent(request)

      if (result.success && result.result) {
        onGenerationComplete(result.result)
        setGenerationStatus({
          isGenerating: false,
          progress: 100,
          status: 'completed'
        })
      } else {
        onError(result.error || 'Generation failed')
        setGenerationStatus({
          isGenerating: false,
          progress: 0,
          status: 'error',
          error: result.error
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed'
      onError(errorMessage)
      setGenerationStatus({
        isGenerating: false,
        progress: 0,
        status: 'error',
        error: errorMessage
      })
    } finally {
      setIsGenerating(false)
    }
  }, [selectedFile, fileUrl, prompt, mode, quality, userId, userTier, selectedModel, onGenerationComplete, onError])

  const handleReset = useCallback(() => {
    setSelectedFile(null)
    setFileUrl(null)
    setPrompt('')
    setSelectedModel('')
    setGenerationStatus(null)
    setIsGenerating(false)
  }, [])

  const availableModels = getAvailableModels()

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {mode === 'i2i' ? 'Image-to-Image' : 'Video-to-Video'} Transformation
        </h2>
        <p className="text-gray-600">
          Transform your {mode === 'i2i' ? 'images' : 'videos'} with AI-powered style transfer and enhancement
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setMode('i2i')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            mode === 'i2i'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Image size={16} />
          <span>Image-to-Image</span>
        </button>
        <button
          onClick={() => setMode('v2v')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            mode === 'v2v'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Video size={16} />
          <span>Video-to-Video</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - File Upload and Preview */}
        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Upload {mode === 'i2i' ? 'Image' : 'Video'}
            </h3>
            <ImageToImageUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              acceptedTypes={mode === 'i2i' ? 'image' : 'video'}
              maxSize={mode === 'i2i' ? 8 : 50} // 8MB images, 50MB videos
            />
          </div>

          {/* Preview */}
          {selectedFile && fileUrl && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                {mode === 'i2i' ? (
                  <img
                    src={fileUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded"
                  />
                ) : (
                  <video
                    src={fileUrl}
                    className="w-full h-64 object-cover rounded"
                    controls
                  />
                )}
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>File:</strong> {selectedFile.name}</p>
                  <p><strong>Size:</strong> {fileUploadService.getFileSizeString(selectedFile.size)}</p>
                  <p><strong>Type:</strong> {selectedFile.type}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Settings and Generation */}
        <div className="space-y-6">
          {/* Prompt Input */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Transformation Prompt</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe how you want to transform your ${mode === 'i2i' ? 'image' : 'video'}...`}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Be specific about the style, mood, or transformation you want to apply
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Model</h3>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Auto-select best model</option>
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>

          {/* Quality Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality</h3>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="standard"
                  checked={quality === 'standard'}
                  onChange={(e) => setQuality(e.target.value as 'standard' | 'high')}
                  className="text-black focus:ring-black"
                />
                <span>Standard (faster)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="high"
                  checked={quality === 'high'}
                  onChange={(e) => setQuality(e.target.value as 'standard' | 'high')}
                  className="text-black focus:ring-black"
                />
                <span>High Quality</span>
              </label>
            </div>
          </div>



          {/* Generation Status */}
          {generationStatus && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Status</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {generationStatus.status === 'processing' && 'Processing...'}
                    {generationStatus.status === 'completed' && 'Completed'}
                    {generationStatus.status === 'error' && 'Error'}
                  </span>
                  {generationStatus.status === 'processing' && (
                    <span className="text-sm text-gray-500">
                      {Math.round(generationStatus.progress)}%
                    </span>
                  )}
                </div>
                {generationStatus.status === 'processing' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationStatus.progress}%` }}
                    />
                  </div>
                )}
                {generationStatus.error && (
                  <p className="text-sm text-red-600 mt-2">{generationStatus.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleGenerate}
              disabled={!selectedFile || !prompt.trim() || isGenerating}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                !selectedFile || !prompt.trim() || isGenerating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Generate Transformation</span>
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default I2IV2VInterface
