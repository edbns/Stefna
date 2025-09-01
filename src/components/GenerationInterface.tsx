// GenerationInterface.tsx - Simple, clean generation UI
import React, { useState, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import simpleGenerationService, { GenerationMode } from '../services/simpleGenerationService'
import { uploadSourceToCloudinary } from '../services/uploadSource'
import { useToasts } from './ui/Toasts'
import authService from '../services/authService'

// Mode selector component
const ModeSelector: React.FC<{
  selectedMode: GenerationMode | null
  onModeSelect: (mode: GenerationMode) => void
}> = ({ selectedMode, onModeSelect }) => {
  const modes: { id: GenerationMode; label: string; emoji: string }[] = [
    { id: 'custom-prompt', label: 'Custom Prompt', emoji: '✍️' },
    { id: 'presets', label: 'Presets', emoji: '🎨' },
    { id: 'emotion-mask', label: 'Emotion Mask', emoji: '😊' },
    { id: 'ghibli-reaction', label: 'Ghibli', emoji: '🌸' },
    { id: 'neo-glitch', label: 'Neo Glitch', emoji: '🌃' },
    { id: 'story-time', label: 'Story Time', emoji: '📖' }
  ]

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {modes.map(mode => (
        <button
          key={mode.id}
          onClick={() => onModeSelect(mode.id)}
          className={`p-3 rounded-lg border-2 transition-all ${
            selectedMode === mode.id
              ? 'border-white bg-white text-black'
              : 'border-gray-600 bg-transparent text-white hover:border-gray-400'
          }`}
        >
          <div className="text-2xl mb-1">{mode.emoji}</div>
          <div className="text-sm">{mode.label}</div>
        </button>
      ))}
    </div>
  )
}

export const GenerationInterface: React.FC<{
  onGenerationComplete?: (result: any) => void
}> = ({ onGenerationComplete }) => {
  const { notifyQueue, notifyReady, notifyError } = useToasts()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedMode, setSelectedMode] = useState<GenerationMode | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleGenerate = async () => {
    if (!selectedFile || !selectedMode) {
      notifyError({ title: 'Missing input', message: 'Please select a file and generation mode' })
      return
    }

    if (selectedMode === 'custom-prompt' && !customPrompt.trim()) {
      notifyError({ title: 'Missing prompt', message: 'Please enter a prompt' })
      return
    }

    setIsGenerating(true)
    notifyQueue({ title: 'Generating...', message: 'Your image is being processed' })

    try {
      // Upload to Cloudinary
      const uploadResult = await uploadSourceToCloudinary(selectedFile)
      if (!uploadResult.secure_url) throw new Error('Upload failed')

      // Generate using simple service
      const user = authService.getCurrentUser()
      const result = await simpleGenerationService.getInstance().generate({
        mode: selectedMode,
        prompt: customPrompt || `Transform image in ${selectedMode} style`,
        sourceAssetId: uploadResult.secure_url,
        userId: user?.id || '',
        runId: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })

      if (result.success && result.imageUrl) {
        notifyReady({ title: 'Complete!', message: 'Your image is ready' })
        onGenerationComplete?.(result)
        
        // Reset form
        setSelectedFile(null)
        setPreviewUrl(null)
        setCustomPrompt('')
      } else {
        throw new Error(result.error || 'Generation failed')
      }
    } catch (error: any) {
      notifyError({ title: 'Generation failed', message: error.message })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Create AI Art</h2>
      
      {/* Mode Selection */}
      <ModeSelector selectedMode={selectedMode} onModeSelect={setSelectedMode} />

      {/* File Upload */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {!previewUrl ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-64 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"
          >
            <div className="text-center">
              <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400">Click to upload image</p>
            </div>
          </button>
        ) : (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <button
              onClick={() => {
                setSelectedFile(null)
                setPreviewUrl(null)
              }}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Custom Prompt (only for custom mode) */}
      {selectedMode === 'custom-prompt' && (
        <div className="mb-6">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe how you want to transform the image..."
            className="w-full h-24 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white"
          />
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!selectedFile || !selectedMode || isGenerating}
        className={`w-full py-3 rounded-lg font-semibold transition-all ${
          !selectedFile || !selectedMode || isGenerating
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-white text-black hover:bg-gray-200'
        }`}
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
    </div>
  )
}
