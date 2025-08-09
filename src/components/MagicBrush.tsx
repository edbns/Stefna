import React, { useState, useEffect } from 'react'
import { Sparkles, Wand2, Check, X } from 'lucide-react'
import aimlModelService, { AIMLModel } from '../services/aimlModelService'

interface MagicBrushProps {
  prompt: string
  onPromptEnhance: (enhancedPrompt: string, modelId: string) => void
  className?: string
  disabled?: boolean
}

const MagicBrush: React.FC<MagicBrushProps> = ({
  prompt,
  onPromptEnhance,
  className = '',
  disabled = false
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [recommendedModels, setRecommendedModels] = useState<AIMLModel[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (prompt.trim() && isOpen) {
      setIsLoading(true)
      // Simulate AI processing delay
      setTimeout(() => {
        const models = aimlModelService.getRecommendedModels(prompt)
        setRecommendedModels(models.slice(0, 3)) // Show top 3 recommendations
        setIsLoading(false)
      }, 500)
    }
  }, [prompt, isOpen])

  const handleEnhance = (model: AIMLModel) => {
    // Enhance the prompt with model-specific keywords
    let enhancedPrompt = prompt
    
    // Add model-specific enhancements
    switch (model.id) {
      case 'sdxl':
        enhancedPrompt += ', high quality, detailed, photorealistic'
        break
      case 'anything-v5':
        enhancedPrompt += ', anime style, vibrant colors, detailed'
        break
      case 'realistic-vision':
        enhancedPrompt += ', ultra realistic, professional photography'
        break
      case 'dreamshaper':
        enhancedPrompt += ', artistic, creative, dreamy atmosphere'
        break
      case 'portraitplus':
        enhancedPrompt += ', professional portrait, studio lighting'
        break
      case 'landscape-pro':
        enhancedPrompt += ', stunning landscape, natural lighting'
        break
      case 'abstract-vision':
        enhancedPrompt += ', abstract art, modern, conceptual'
        break
      case '3d-render':
        enhancedPrompt += ', 3D render, CGI, realistic lighting'
        break
      case 'fantasy-art':
        enhancedPrompt += ', fantasy, magical, imaginative'
        break
      case 'sci-fi-pro':
        enhancedPrompt += ', sci-fi, futuristic, technology'
        break
      default:
        enhancedPrompt += ', enhanced, high quality'
    }

    onPromptEnhance(enhancedPrompt, model.id)
    setIsOpen(false)
  }

  const getModelIcon = (category: string) => {
    switch (category) {
      case 'realistic':
        return '📸'
      case 'anime':
        return '🌸'
      case 'art':
        return '🎨'
      case 'photography':
        return '📷'
      case 'portrait':
        return '👤'
      case 'landscape':
        return '🏔️'
      case 'abstract':
        return '🌌'
      case '3d':
        return '🎯'
      case 'fantasy':
        return '🧙‍♂️'
      case 'sci-fi':
        return '🚀'
      default:
        return '✨'
    }
  }

  const getModelColor = (category: string) => {
    switch (category) {
      case 'realistic':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'anime':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30'
      case 'art':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'photography':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'portrait':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'landscape':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'abstract':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
      case '3d':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      case 'fantasy':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'sci-fi':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (disabled) return null

  return (
    <div className={`relative ${className}`}>
      {/* Magic Brush Button */}
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute right-0 top-0 p-2 rounded-full transition-all duration-300 ${
          isHovered || isOpen
            ? 'bg-white/20 text-white shadow-lg'
            : 'bg-white/10 text-white/60 hover:bg-white/15'
        }`}
        title="Enhance your prompt"
      >
        <Sparkles size={16} className={isHovered || isOpen ? 'animate-pulse' : ''} />
      </button>

      {/* Tooltip */}
      {isHovered && !isOpen && (
        <div className="absolute right-12 top-0 bg-black/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-50">
          Enhance your prompt
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black/90 rotate-45"></div>
        </div>
      )}

      {/* Recommendations Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-black/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Wand2 size={16} className="text-white" />
              <span className="text-white font-medium">AI Enhancement</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={16} className="text-white/60" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2 text-white/60">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm">Analyzing your prompt...</span>
                </div>
              </div>
            ) : recommendedModels.length > 0 ? (
              <>
                <div className="text-white/80 text-sm mb-3">
                  Choose an AI model to enhance your prompt:
                </div>
                <div className="space-y-2">
                  {recommendedModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleEnhance(model)}
                      className={`w-full p-3 rounded-lg border transition-all duration-300 hover:scale-105 ${getModelColor(model.category)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getModelIcon(model.category)}</span>
                          <div className="text-left">
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs opacity-80">{model.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-white/20 px-2 py-1 rounded">
                            {model.cost} token{model.cost !== 1 ? 's' : ''}
                          </span>
                          <Check size={14} className="opacity-60" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-white/60">
                <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No AI enhancements found for this prompt.</p>
                <p className="text-xs mt-1">Try adding more details to your prompt.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MagicBrush
