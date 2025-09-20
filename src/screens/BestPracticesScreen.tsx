import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function BestPracticesScreen() {
  const navigate = useNavigate()
  const [rotatingPresets, setRotatingPresets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const presets = [
    {
      mode: "Parallel Self™",
      title: "Rain Dancer",
      description: "Cinematic storm, soaked elegance, emotional power."
    },
    {
      mode: "Parallel Self™",
      title: "The Untouchable",
      description: "Grayscale icon, sharp style, cold gaze."
    },
    {
      mode: "Parallel Self™",
      title: "Holiday Mirage",
      description: "Golden hour glow, vacation fantasy, effortless chic."
    },
    {
      mode: "Parallel Self™",
      title: "Who Got Away",
      description: "Leaving the gala, cinematic heartbreak, paparazzi lights."
    },
    {
      mode: "Parallel Self™",
      title: "Nightshade",
      description: "Black-on-black power in a glowing white space, minimal and futuristic."
    },
    {
      mode: "Parallel Self™",
      title: "Afterglow",
      description: "Disco shimmer, gold and silver highlights, soft cinematic focus."
    },
    {
      mode: "Unreal Reflection™",
      title: "The Syndicate",
      description: "Power suits, cinematic underworld, authority and mystery."
    },
    {
      mode: "Unreal Reflection™",
      title: "Yakuza Heir",
      description: "Raw power, irezumi tattoos, Osaka street scenes."
    },
    {
      mode: "Unreal Reflection™",
      title: "The Gothic Pact",
      description: "Gothic royalty, timeless black fashion, candlelit scenes."
    },
    {
      mode: "Unreal Reflection™",
      title: "Oracle of Seoul",
      description: "Modern shamanic presence, hanbok-inspired couture."
    },
    {
      mode: "Unreal Reflection™",
      title: "Medusa's Mirror",
      description: "Greek muse glam, flowing fabrics, marble ruins."
    },
    {
      mode: "Unreal Reflection™",
      title: "Chromatic Bloom",
      description: "Dark magazine cover style with animal symbols."
    }
  ]

  // Map preset titles to image file names
  const getImagePath = (title: string) => {
    const imageMap: Record<string, string> = {
      'Rain Dancer': '/images/parallel_self_rain_dancer.jpg',
      'The Untouchable': '/images/parallel_self_untouchable.jpg',
      'Holiday Mirage': '/images/parallel_self_holiday_mirage.jpg',
      'Who Got Away': '/images/parallel_self_one_that_got_away.jpg',
      'Nightshade': '/images/parallel_self_nightshade.jpg',
      'Afterglow': '/images/parallel_self_afterglow.jpg',
      'The Syndicate': '/images/unreal_reflection_the_syndicate.jpg',
      'Yakuza Heir': '/images/unreal_reflection_yakuza_heir.jpg',
      'The Gothic Pact': '/images/unreal_reflection_gothic_pact.jpg',
      'Oracle of Seoul': '/images/unreal_reflection_oracle_seoul.jpg',
      'Medusa\'s Mirror': '/images/unreal_reflection_medusa_mirror.jpg',
      'Chromatic Bloom': '/images/unreal_reflection_chromatic_bloom.jpg'
    }
    return imageMap[title] || ''
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Set rotating presets for development
        setRotatingPresets([
          { id: 'cinematic_glow', label: 'Cinematic Glow', userDescription: 'Golden lens flare, film warmth, quiet spotlight.' },
          { id: 'bright_airy', label: 'Bright & Airy', userDescription: 'Soft white light, calm expression, dream filter vibes.' },
          { id: 'neo_tokyo_glitch', label: 'Neo Tokyo Glitch', userDescription: 'Cyberpunk neon, digital distortion, futuristic edge.' },
          { id: 'ethereal_whisper', label: 'Ethereal Whisper', userDescription: 'Soft focus, dreamy atmosphere, gentle lighting.' },
          { id: 'midnight_serenade', label: 'Midnight Serenade', userDescription: 'Dark elegance, moody lighting, sophisticated style.' },
          { id: 'golden_hour_dream', label: 'Golden Hour Dream', userDescription: 'Warm sunset glow, romantic lighting, natural beauty.' }
        ])
        
      } catch (error) {
        console.error('Failed to fetch data:', error)
        // Set some mock rotating presets for development
        setRotatingPresets([
          { id: 'cinematic_glow', label: 'Cinematic Glow', userDescription: 'Golden lens flare, film warmth, quiet spotlight.' },
          { id: 'bright_airy', label: 'Bright & Airy', userDescription: 'Soft white light, calm expression, dream filter vibes.' },
          { id: 'neo_tokyo_glitch', label: 'Neo Tokyo Glitch', userDescription: 'Cyberpunk neon, digital distortion, futuristic edge.' },
          { id: 'ethereal_whisper', label: 'Ethereal Whisper', userDescription: 'Soft focus, dreamy atmosphere, gentle lighting.' },
          { id: 'midnight_serenade', label: 'Midnight Serenade', userDescription: 'Dark elegance, moody lighting, sophisticated style.' },
          { id: 'golden_hour_dream', label: 'Golden Hour Dream', userDescription: 'Warm sunset glow, romantic lighting, natural beauty.' }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const groupedPresets = presets.reduce((acc, preset) => {
    if (!acc[preset.mode]) {
      acc[preset.mode] = []
    }
    acc[preset.mode].push(preset)
    return acc
  }, {} as Record<string, typeof presets>)

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-semibold">Best Practices</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Rotating Presets Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Rotating Presets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rotatingPresets.map((preset, index) => (
              <div key={preset.id} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-2">{preset.label}</h3>
                <p className="text-gray-300 text-sm">{preset.userDescription}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mode-specific Presets */}
        {Object.entries(groupedPresets).map(([mode, modePresets]) => (
          <div key={mode} className="mb-16">
            <h2 className="text-2xl font-bold mb-8">{mode}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modePresets.map((preset, index) => {
                const imagePath = getImagePath(preset.title)
                return (
                  <div key={index} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                    {imagePath && (
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={imagePath}
                          alt={`Generated ${preset.title}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-2">{preset.title}</h3>
                      <p className="text-gray-300 text-sm">{preset.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}