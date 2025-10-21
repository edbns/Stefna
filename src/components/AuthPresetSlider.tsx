import React, { useState, useEffect } from 'react'

interface Preset {
  mode: string
  title: string
  description: string
}

const AuthPresetSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

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
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % presets.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [presets.length])

  const getImagePath = (preset: Preset): string => {
    const modePrefix = preset.mode === "Parallel Self™" ? "parallel_self" : "unreal_reflection"
    
    // Handle special cases for image naming
    let titleSlug = preset.title.toLowerCase()
      .replace(/'/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim()
    
    // Special cases for specific presets
    if (preset.title === "Y2K Paparazzi") {
      titleSlug = "Y2K_Paparazzi"
    }
    
    // Try .jpg first, then fallback to .webp
    return `/images/${modePrefix}_${titleSlug}.jpg`
  }

  const currentPreset = presets[currentIndex]

  return (
    <div className="h-full w-full bg-black relative overflow-hidden">
      {/* Full Screen Image */}
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
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      
      {/* Preset Title */}
      <div className="absolute bottom-8 left-8 right-8">
        <h2 className="text-white text-2xl font-bold text-center drop-shadow-lg">
          {currentPreset.title}
        </h2>
      </div>
    </div>
  )
}

export default AuthPresetSlider
