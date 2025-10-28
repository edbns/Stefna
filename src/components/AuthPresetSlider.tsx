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
      title: "Untamed Silence",
      description: "Seductive fashion icon seated in still tension, back turned, captured in sharp black and white with dangerous animal companion."
    },
    {
      mode: "Unreal Reflection™",
      title: "Ceramic Bodice",
      description: "Cinematic fashion icon walking through aftermath runway with cracked white ceramic bodice and structured architectural skirt."
    },
    {
      mode: "Unreal Reflection™",
      title: "Red Seat",
      description: "Cinematic icons caught mid-performance on stormy rooftop stage among velvet red theater chairs with rain and lightning."
    },
    {
      mode: "Unreal Reflection™",
      title: "Desert Vixens",
      description: "High-fashion cowgirls in sultry western-inspired fashion caught in cinematic desert moment with cowboy hats and bold attitude."
    },
    {
      mode: "Unreal Reflection™",
      title: "Disco Prisoner",
      description: "Scandalous fashion icon in mugshot format after wild party arrest with glitter, sequins, and nightclub glamour."
    },
    {
      mode: "Unreal Reflection™",
      title: "Falcon Ceremony",
      description: "Cinematic high-fashion vision sculpted from layered falcon feathers with storm-filled skies, falcons circling, and predator couture aesthetics."
    },
    {
      mode: "Unreal Reflection™",
      title: "Shattered Stone",
      description: "Sculptural high-fashion vision emerging from cracked marble, granite, and obsidian plates forming brutalist couture."
    },
    {
      mode: "Unreal Reflection™",
      title: "Threadbare Halo",
      description: "Poetic high-fashion figure wrapped in flowing fraying threads and silk strands, caught between creation and collapse."
    },
    {
      mode: "Unreal Reflection™",
      title: "Frozen Bloom",
      description: "Sculptural high-fashion portrait wearing semi-transparent ice petals blooming upward like frozen armor with cold elegance."
    },
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
      'Untamed Silence': '/images/unreal_reflection_untamed_silence.jpg',
      'Ceramic Bodice': '/images/unreal_reflection_ceramic_bodice.jpg',
      'Red Seat': '/images/unreal_reflection_red_seat.jpg',
      'Desert Vixens': '/images/unreal_reflection_desert_vixens.jpg?v=' + Date.now(),
      'Disco Prisoner': '/images/unreal_reflection_disco_prisoner.jpg',
      'Falcon Ceremony': '/images/unreal_reflection_falcon_ceremony.jpg',
      'Shattered Stone': '/images/unreal_reflection_shattered_stone.jpg',
      'Threadbare Halo': '/images/unreal_reflection_threadbare_halo.jpg',
      'Frozen Bloom': '/images/unreal_reflection_frozen_bloom.jpg',
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
