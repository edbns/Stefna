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
      mode: "Unreal Reflection™",
      title: "Feather Feral",
      description: "Seductive high-fashion portrait sculpted from black feathers with crows in dramatic storm atmosphere and ritual fashion energy."
    },
    {
      mode: "Unreal Reflection™",
      title: "Paper Pop",
      description: "Fearless beauty portrait breaking through bright colorful paper with playful expressions, rotating colors, and vibrant pop-art energy."
    },
    {
      mode: "Unreal Reflection™",
      title: "Red Lipstick",
      description: "Powerful fashion muses captured in dramatic black-and-white where the only color is bold red lipstick with cinematic tension."
    },
    {
      mode: "Unreal Reflection™",
      title: "Wax Bloom",
      description: "Radiant fashion muses dressed in molten candle couture with glossy wax, glowing amber tones, and cinematic candlelit atmosphere."
    },
    {
      mode: "Unreal Reflection™",
      title: "Wind Layer",
      description: "High-fashion muses wrapped in invisible wind with sheer, flowing fabrics frozen in mid-motion."
    },
    {
      mode: "Unreal Reflection™",
      title: "Mirror Shatter",
      description: "Sharp-edged futuristic fashion wearing sculpted dresses made from broken mirror shards with fierce elegance."
    },
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
    },
    {
      mode: "Unreal Reflection™",
      title: "Crystal Fall",
      description: "High-fashion goddess emerging from glowing crystal shards with rotating color palettes."
    },
    {
      mode: "Unreal Reflection™",
      title: "Butterfly Monarch",
      description: "Seductive high-fashion portrait sculpted from hundreds of fluttering butterflies with rotating color palettes."
    },
    {
      mode: "Unreal Reflection™",
      title: "Molten Gloss",
      description: "Cinematic fashion sculpture made from obsidian and molten gold with rotating animal companions."
    },
    {
      mode: "Unreal Reflection™",
      title: "Floral Noir",
      description: "High drama black & white fashion portrait with soft floral artistry and high contrast lighting."
    },
    {
      mode: "Unreal Reflection™",
      title: "Chemistry Check",
      description: "Unforgettable fashion duo captured in a dramatic, cinematic moment with magnetic chemistry and high-fashion styling."
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
      'Feather Feral': '/images/unreal_reflection_feather_feral.jpg',
      'Paper Pop': '/images/unreal_reflection_paper_pop.jpg',
      'Red Lipstick': '/images/unreal_reflection_red_lipstick.jpg',
      'Wax Bloom': '/images/unreal_reflection_wax_bloom.jpg',
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
      'Chromatic Smoke': '/images/unreal_reflection_chromatic_smoke.jpg',
      'Crystal Fall': '/images/unreal_reflection_Crystal_Fal_.jpg',
      'Butterfly Monarch': '/images/unreal_reflection_Butterfly_Monarch.jpg',
      'Molten Gloss': '/images/unreal_reflection_Molten_Gloss.jpg',
      'Floral Noir': '/images/unreal_reflection_floral_noir.jpg',
      'Chemistry Check': '/images/unreal_reflection_Chemistry_Check.jpg',
      'Wind Layer': '/images/unreal_reflection_wind_layer.jpg?v=' + Date.now(),
      'Mirror Shatter': '/images/unreal_reflection_mirror_shatter.jpg'
    }
    
    return imageMap[preset.title] || '/images/parallel_self_black_aura.webp'
  }

  const currentPreset = presets[currentIndex]

  return (
    <div className="h-screen w-full bg-transparent relative overflow-hidden">
      {/* Transparent Container with Fixed Dimensions */}
      <div className="absolute inset-0 bg-black/0">
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
