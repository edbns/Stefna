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
    const imageMap: Record<string, string> = {
      'Black Aura': '/images/parallel_self_black_aura.webp',
      'The Untouchable': '/images/parallel_self_untouchable.webp',
      'Neon Proof': '/images/parallel_self_neon_proof.webp',
      'The Mechanic': '/images/parallel_self_the_mechanic.webp',
      'Colorcore': '/images/parallel_self_colorcore.webp',
      'Getaway Lookbook': '/images/parallel_self_getaway_lookbook.webp',
      'Black Bloom': '/images/unreal_reflection_black_bloom.jpg',
      'Yakuza Heir': '/images/unreal_reflection_yakuza_heir.webp',
      'Blueberry Bliss': '/images/unreal_reflection_blueberry_bliss.jpg',
      'Y2K Paparazzi': '/images/unreal_reflection_Y2K_Paparazzi.webp',
      'Medusa\'s Mirror': '/images/unreal_reflection_medusa_mirror.webp',
      'Chromatic Bloom': '/images/unreal_reflection_chromatic_bloom.webp',
      'Chromatic Smoke': '/images/unreal_reflection_chromatic_smoke.jpg'
    }
    
    return imageMap[preset.title] || '/images/parallel_self_black_aura.webp'
  }

  const currentPreset = presets[currentIndex]

  return (
    <div className="h-full w-full bg-transparent relative">
      {/* Transparent Container with Fixed Dimensions */}
      <div className="absolute inset-0 bg-black/0 overflow-hidden">
        <img
          src={getImagePath(currentPreset)}
          alt={currentPreset.title}
          className="w-full h-full object-contain object-center"
          onError={(e) => {
            console.error('Image failed to load:', getImagePath(currentPreset))
          }}
        />
      </div>
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
      
      {/* Preset Title */}
      <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
        <h2 className="text-white text-2xl font-bold text-center drop-shadow-lg">
          {currentPreset.title}
        </h2>
      </div>
    </div>
  )
}

export default AuthPresetSlider
