import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Preset {
  mode: string
  title: string
  description: string
}

const AuthPresetSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const presets: Preset[] = [
    {
      mode: "Parallel Self™",
      title: "Black Aura",
      description: "Calm dominance in black and white. Still poses, sharp fashion, and a silent black wolf grounded in shadow."
    },
    {
      mode: "Parallel Self™",
      title: "The Untouchable",
      description: "Grayscale icon, sharp style, cold gaze."
    },
    {
      mode: "Parallel Self™",
      title: "Neon Proof",
      description: "Streetwear with bold neon accents, shot at night in low-angle cinematic style."
    },
    {
      mode: "Parallel Self™",
      title: "The Mechanic",
      description: "Grease-stained workwear in cinematic garage settings."
    },
    {
      mode: "Parallel Self™",
      title: "Colorcore",
      description: "Randomized 2x2 grid with color themes and varied poses."
    },
    {
      mode: "Parallel Self™",
      title: "Getaway Lookbook",
      description: "Fashion fugitives styled post-getaway — edgy, dramatic, and photoreal."
    },
    {
      mode: "Unreal Reflection™",
      title: "Chromatic Bloom",
      description: "A burst of cinematic color, blooming light, layered like film."
    },
    {
      mode: "Unreal Reflection™",
      title: "Black Bloom",
      description: "Botanical portrait with black flowers in a mystical midnight garden."
    },
    {
      mode: "Unreal Reflection™",
      title: "Yakuza Heir",
      description: "Tattooed heritage, sharp fashion, stillness with power."
    },
    {
      mode: "Unreal Reflection™",
      title: "Blueberry Bliss",
      description: "Futuristic latex fashion in glossy deep blue and lilac palette."
    },
    {
      mode: "Unreal Reflection™",
      title: "Y2K Paparazzi",
      description: "Y2K fashion icons, night scene with paparazzi flash lighting."
    },
    {
      mode: "Unreal Reflection™",
      title: "Medusa's Mirror",
      description: "Goth beauty, mythic energy, stone stare, soft lighting."
    },
    {
      mode: "Unreal Reflection™",
      title: "Chromatic Smoke",
      description: "Dynamic smoke fashion with rotating color injection - black and colored smoke sculpted into high-fashion couture."
    }
  ]

  // Auto-advance slider every 4 seconds
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % presets.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, presets.length])

  const handlePrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + presets.length) % presets.length)
  }

  const handleNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % presets.length)
  }

  const handleDotClick = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(index)
  }

  const getImagePath = (preset: Preset): string => {
    const modePrefix = preset.mode === "Parallel Self™" ? "parallel_self" : "unreal_reflection"
    const titleSlug = preset.title.toLowerCase()
      .replace(/'/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim()
    
    return `/images/${modePrefix}_${titleSlug}.jpg`
  }

  const currentPreset = presets[currentIndex]

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-black to-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-8 pb-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Discover Our Presets</h2>
          <p className="text-white/60 text-sm">Professional AI-generated content</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-8 pb-8">
        <div className="relative h-full">
          {/* Image Container */}
          <div className="relative h-64 mb-6 rounded-2xl overflow-hidden bg-gray-800">
            <img
              src={getImagePath(currentPreset)}
              alt={currentPreset.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to webp if jpg doesn't exist
                const target = e.target as HTMLImageElement
                const originalSrc = target.src
                target.src = originalSrc.replace('.jpg', '.webp')
              }}
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Mode Badge */}
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentPreset.mode === "Parallel Self™" 
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                  : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              }`}>
                {currentPreset.mode}
              </span>
            </div>
          </div>

          {/* Preset Info */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{currentPreset.title}</h3>
            <p className="text-white/70 text-sm leading-relaxed px-4">
              {currentPreset.description}
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            
            {/* Dots Indicator */}
            <div className="flex space-x-2">
              {presets.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-white w-6' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
              style={{ 
                width: `${((currentIndex + 1) / presets.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPresetSlider
