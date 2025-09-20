import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { optimizeFeedImage } from '../utils/cloudinaryOptimization'

export default function BestPracticesScreen() {
  const navigate = useNavigate()
  const [rotatingPresets, setRotatingPresets] = useState<any[]>([])
  const [stefnaMedia, setStefnaMedia] = useState<any[]>([])
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
      title: "Chromatic Bloom",
      description: "A burst of cinematic color, blooming light, layered like film."
    },
    {
      mode: "Unreal Reflection™",
      title: "The Syndicate",
      description: "Modern mafia myth, leather, shadow, grayscale drama."
    },
    {
      mode: "Unreal Reflection™",
      title: "Yakuza Heir",
      description: "Tattooed heritage, sharp fashion, stillness with power."
    },
    {
      mode: "Unreal Reflection™",
      title: "The Gothic Pact",
      description: "Dark pact aesthetic, veils, stares, ornate shadows."
    },
    {
      mode: "Unreal Reflection™",
      title: "Oracle of Seoul",
      description: "Modern prophecy, neon grayscale, futurist yet ancient."
    },
    {
      mode: "Unreal Reflection™",
      title: "Medusa's Mirror",
      description: "Goth beauty, mythic energy, stone stare, soft lighting."
    }
  ]

  // Static user-friendly descriptions for presets (not revealing the actual prompts)
  const presetDescriptions: Record<string, string> = {
    'cinematic_glow': 'Golden lens flare, film warmth, quiet spotlight.',
    'bright_airy': 'Soft white light, calm expression, dream filter vibes.',
    'vivid_pop': 'High contrast color punch, expressive and alive.',
    'vintage_film_35mm': 'Grain, mood, retro tones like a found photo.',
    'tropical_boost': 'Bright hues, tan skin, breezy vacation mood.',
    'urban_grit': 'Street texture, muted tones, raw attitude.',
    'mono_drama': 'Black and white contrast, silent intensity.',
    'dreamy_pastels': 'Muted candy tones, soft edges, floaty feel.',
    'golden_hour_magic': 'Sunset tones, warm shadows, glowing skin.',
    'high_fashion_editorial': 'Studio lighting, sharp angles, cover shoot.',
    'moody_forest': 'Earth tones, green haze, cinematic mystery.',
    'desert_glow': 'Cracked sunburnt earth, warm sand haze, stillness.',
    'retro_polaroid': 'Instant print look, faded color, nostalgic frame.',
    'crystal_clear': 'Bright light, icy tone, hyper-clean aesthetic.',
    'ocean_breeze': 'Sea spray, fresh tones, carefree calm.',
    'festival_vibes': 'Glitter, blur, lens flare, crowd energy.',
    'noir_classic': 'Film noir drama, shadow play, timeless cool.',
    'sun_kissed': 'Warm skin, soft light, cheekbone shimmer.',
    'frost_light': 'Pale tones, icy softness, snowglobe glow.',
    'neon_nights': 'Purple-blue neon, urban shine, nightlife glow.',
    'cultural_glow': 'Celebratory richness, bold patterns, ambient light.',
    'soft_skin_portrait': 'Light retouch feel, natural beauty, gentle gaze.',
    'rainy_day_mood': 'Overcast vibes, cinematic drizzle, emotional still.',
    'wildlife_focus': 'Nature tones, jungle blur, raw intensity.',
    'street_story': 'City backdrop, casual pose, hidden narrative.'
  }

  // Fetch rotating presets from database (media will be added later)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rotating presets using the same system as composer
        const presetsResponse = await fetch('/.netlify/functions/get-presets')
        if (presetsResponse.ok) {
          const presetsData = await presetsResponse.json()
          if (presetsData.success && presetsData.data?.presets) {
            // Take only the first 5 presets and add user-friendly descriptions
            const presetsWithDescriptions = presetsData.data.presets.slice(0, 5).map((preset: any) => ({
              ...preset,
              userDescription: presetDescriptions[preset.id] || 'Fresh preset, rotating weekly.'
            }))
            setRotatingPresets(presetsWithDescriptions)
          }
        }

        // Fetch media from creator@stefna.xyz (ID: 49b15f0e-6a2d-445d-9d32-d0a9bd859bfb)
        const mediaResponse = await fetch(`/.netlify/functions/getPublicFeed?userId=49b15f0e-6a2d-445d-9d32-d0a9bd859bfb&limit=50`)
        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json()
          console.log('🔍 [BestPractices] API Response:', mediaData)
          console.log('🔍 [BestPractices] Items found:', mediaData.items?.length || 0)
          if (mediaData.items?.length > 0) {
            console.log('🔍 [BestPractices] Sample item:', mediaData.items[0])
          }
          if (mediaData.items) {
            setStefnaMedia(mediaData.items)
          }
        }
        
      } catch (error) {
        console.error('Failed to fetch data:', error)
        // Set some mock rotating presets for development
        setRotatingPresets([
          { id: 'cinematic_glow', label: 'Cinematic Glow', userDescription: 'Golden lens flare, film warmth, quiet spotlight.' },
          { id: 'bright_airy', label: 'Bright & Airy', userDescription: 'Soft white light, calm expression, dream filter vibes.' },
          { id: 'vivid_pop', label: 'Vivid Pop', userDescription: 'High contrast color punch, expressive and alive.' },
          { id: 'vintage_film_35mm', label: 'Vintage Film 35mm', userDescription: 'Grain, mood, retro tones like a found photo.' },
          { id: 'tropical_boost', label: 'Tropical Boost', userDescription: 'Bright hues, tan skin, breezy vacation mood.' }
        ])
        
        // Set mock media for local development
        setStefnaMedia([
          { 
            url: 'https://res.cloudinary.com/stefna/image/upload/v1/stefna/generated/parallel_self_sample_1.jpg',
            mediaType: 'presets',
            type: 'image'
          },
          { 
            url: 'https://res.cloudinary.com/stefna/image/upload/v1/stefna/generated/unreal_reflection_sample_1.jpg',
            mediaType: 'unreal_reflection',
            type: 'image'
          },
          { 
            url: 'https://res.cloudinary.com/stefna/image/upload/v1/stefna/generated/parallel_self_sample_2.jpg',
            mediaType: 'presets',
            type: 'image'
          },
          { 
            url: 'https://res.cloudinary.com/stefna/image/upload/v1/stefna/generated/unreal_reflection_sample_2.jpg',
            mediaType: 'unreal_reflection',
            type: 'image'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Find media by preset type - using correct API field names
  const findMediaForPreset = (presetTitle: string) => {
    console.log('🔍 [BestPractices] Finding media for preset:', presetTitle)
    console.log('🔍 [BestPractices] Available media count:', stefnaMedia.length)
    
    if (!stefnaMedia.length) {
      console.log('🔍 [BestPractices] No media available')
      return null
    }
    
    // Map preset titles to both mediaType and specific presetKey
    const presetMap: Record<string, { mediaType: string; presetKey: string }> = {
      'Rain Dancer': { mediaType: 'parallel_self', presetKey: 'parallel_self_rain_dancer' },
      'The Untouchable': { mediaType: 'parallel_self', presetKey: 'parallel_self_untouchable' }, 
      'Holiday Mirage': { mediaType: 'parallel_self', presetKey: 'parallel_self_holiday_mirage' },
      'Who Got Away': { mediaType: 'parallel_self', presetKey: 'parallel_self_one_that_got_away' },
      'Nightshade': { mediaType: 'parallel_self', presetKey: 'parallel_self_nightshade' },
      'Afterglow': { mediaType: 'parallel_self', presetKey: 'parallel_self_afterglow' },
      'Chromatic Bloom': { mediaType: 'unreal_reflection', presetKey: 'unreal_reflection_chromatic_bloom' },
      'The Syndicate': { mediaType: 'unreal_reflection', presetKey: 'unreal_reflection_syndicate' },
      'Yakuza Heir': { mediaType: 'unreal_reflection', presetKey: 'unreal_reflection_yakuza_heir' },
      'The Gothic Pact': { mediaType: 'unreal_reflection', presetKey: 'unreal_reflection_gothic_pact' },
      'Oracle of Seoul': { mediaType: 'unreal_reflection', presetKey: 'unreal_reflection_oracle_seoul' },
      'Medusa\'s Mirror': { mediaType: 'unreal_reflection', presetKey: 'unreal_reflection_medusa_mirror' }
    }
    
    const presetInfo = presetMap[presetTitle]
    if (!presetInfo) {
      console.log('🔍 [BestPractices] No preset mapping found for:', presetTitle)
      return stefnaMedia[0] // fallback to first media
    }
    
    console.log('🔍 [BestPractices] Looking for:', presetInfo)
    console.log('🔍 [BestPractices] Available media types:', [...new Set(stefnaMedia.map(m => m.mediaType))])
    console.log('🔍 [BestPractices] Available preset keys:', [...new Set(stefnaMedia.map(m => m.presetKey))])
    
    // Only show media for exact preset matches
    const exactMatch = stefnaMedia.find(media => 
      media.mediaType === presetInfo.mediaType && 
      media.presetKey === presetInfo.presetKey
    )
    
    console.log('🔍 [BestPractices] Exact match found:', !!exactMatch)
    
    return exactMatch || null // Return null if no exact match - will show "Media not available"
  }


  return (
    <div className="min-h-screen bg-black">
      {/* Simple Back Navigation */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-10 h-10 text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md /10"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">How to Get the Look</h1>
          <p className="text-white mt-4 max-w-xl mx-auto text-lg">
            Quick tips and style previews to help you recreate Stefna's most iconic looks.
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-[#333333] text-white text-sm">
            Free, Signup to unlock the full experience
          </div>
        </div>


        {/* Parallel Self Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Parallel Self™</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presets.filter(preset => preset.mode === "Parallel Self™").map((preset, idx) => (
              <div key={idx} className="bg-black rounded-xl p-6 shadow-lg text-center">
                <h3 className="text-lg font-semibold leading-snug mb-3 text-white">
                  {preset.title}
                </h3>

                {/* Real Media Display - EXACT same as MasonryMediaGrid */}
                <div className="relative w-full mb-4 overflow-hidden" style={{ aspectRatio: findMediaForPreset(preset.title)?.url ? '6/19' : '3/2' }}>
                  {(() => {
                    const media = findMediaForPreset(preset.title)
                    console.log('🔍 [BestPractices] Rendering media for', preset.title, ':', media)
                    if (media?.finalUrl || media?.imageUrl) {
                      const originalUrl = media.finalUrl || media.imageUrl
                      const optimizedUrl = optimizeFeedImage(originalUrl)
                      console.log('🔍 [BestPractices] Original URL:', originalUrl)
                      console.log('🔍 [BestPractices] Optimized URL:', optimizedUrl)
                      return (
                        <img
                          src={optimizedUrl} 
                          alt={`Generated ${media.type} - ${preset.title}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onLoad={() => console.log('🔍 [BestPractices] Image loaded successfully for', preset.title)}
                          onError={(e) => console.error('🔍 [BestPractices] Image failed to load for', preset.title, ':', e)}
                        />
                      )
                    }
                    console.log('🔍 [BestPractices] No media URL for', preset.title)
                    return (
                      <div className="w-full h-full bg-[#333333] flex items-center justify-center">
                        <p className="text-xs text-white/60">Media not available</p>
                      </div>
                    )
                  })()}
                </div>

                <p className="text-sm text-white leading-relaxed">
                  {preset.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Unreal Reflection Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Unreal Reflection™</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presets.filter(preset => preset.mode === "Unreal Reflection™").map((preset, idx) => (
              <div key={idx} className="bg-black rounded-xl p-6 shadow-lg text-center">
                <h3 className="text-lg font-semibold leading-snug mb-3 text-white">
                  {preset.title}
                </h3>

                {/* Real Media Display - EXACT same as MasonryMediaGrid */}
                <div className="relative w-full mb-4 overflow-hidden" style={{ aspectRatio: findMediaForPreset(preset.title)?.url ? '6/19' : '3/2' }}>
                  {(() => {
                    const media = findMediaForPreset(preset.title)
                    console.log('🔍 [BestPractices] Rendering media for', preset.title, ':', media)
                    if (media?.finalUrl || media?.imageUrl) {
                      const originalUrl = media.finalUrl || media.imageUrl
                      const optimizedUrl = optimizeFeedImage(originalUrl)
                      console.log('🔍 [BestPractices] Original URL:', originalUrl)
                      console.log('🔍 [BestPractices] Optimized URL:', optimizedUrl)
                      return (
                        <img
                          src={optimizedUrl} 
                          alt={`Generated ${media.type} - ${preset.title}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onLoad={() => console.log('🔍 [BestPractices] Image loaded successfully for', preset.title)}
                          onError={(e) => console.error('🔍 [BestPractices] Image failed to load for', preset.title, ':', e)}
                        />
                      )
                    }
                    console.log('🔍 [BestPractices] No media URL for', preset.title)
                    return (
                      <div className="w-full h-full bg-[#333333] flex items-center justify-center">
                        <p className="text-xs text-white/60">Media not available</p>
                      </div>
                    )
                  })()}
                </div>

                <p className="text-sm text-white leading-relaxed">
                  {preset.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Modes Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">More Modes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {/* Custom Prompt Mode */}
            <div className="bg-[#333333] rounded-xl p-6 shadow-lg text-center">
              <div className="mb-3">
                <span className="text-xs uppercase text-white tracking-wider font-medium">
                  Custom Prompt Mode
                </span>
              </div>
              <h3 className="text-lg font-semibold leading-snug mb-3 text-white">
                Your idea, your style, our magic.
              </h3>
              <p className="text-sm text-white leading-relaxed mb-4">
                Write anything — describe a mood, scene, or vibe.
              </p>
              <p className="text-xs text-white/70 mb-4">
                Example: "futuristic king under glowing neon throne, cinematic lighting"
              </p>
              <p className="text-xs text-white/70">
                Tip: Keep it simple but specific. Style + setting + emotion = strong results.
              </p>
            </div>

            {/* Edit My Photo */}
            <div className="bg-[#333333] rounded-xl p-6 shadow-lg text-center">
              <div className="mb-3">
                <span className="text-xs uppercase text-white tracking-wider font-medium">
                  Edit My Photo
                </span>
              </div>
              <h3 className="text-lg font-semibold leading-snug mb-3 text-white">
                Small changes, big drama.
              </h3>
              <p className="text-sm text-white leading-relaxed mb-4">
                Add, remove, or change details in your uploaded photo.
              </p>
              <p className="text-xs text-white/70 mb-4">
                Example: "make the man ride a motorcycle through desert lightning storm"
              </p>
              <p className="text-xs text-white/70">
                Tip: Use short sentences that describe what you want to see, not what to do.
              </p>
            </div>

            {/* Neo Tokyo Glitch */}
            <div className="bg-[#333333] rounded-xl p-6 shadow-lg text-center">
              <div className="mb-3">
                <span className="text-xs uppercase text-white tracking-wider font-medium">
                  Neo Tokyo Glitch
                </span>
              </div>
              <h3 className="text-lg font-semibold leading-snug mb-3 text-white">
                The glitch chooses you. Not the other way around.
              </h3>
              <p className="text-sm text-white leading-relaxed mb-4">
                You'll be reborn inside a neon-drenched chaos: tech tattoos, broken pixels, liquid color.
              </p>
              <p className="text-xs text-white/70 mb-4">
                Results are unpredictable — and that's the fun.
              </p>
              <p className="text-xs text-white/70">
                Tip: Upload a bold selfie, strong expression. Think "main character of the glitch."
              </p>
            </div>

            {/* Studio Ghibli Reaction */}
            <div className="bg-[#333333] rounded-xl p-6 shadow-lg text-center">
              <div className="mb-3">
                <span className="text-xs uppercase text-white tracking-wider font-medium">
                  Studio Ghibli Reaction
                </span>
              </div>
              <h3 className="text-lg font-semibold leading-snug mb-3 text-white">
                Too cute to handle. Too real to ignore.
              </h3>
              <p className="text-sm text-white leading-relaxed mb-4">
                Huge eyes. Sparkling tears. Blush and emotion turned to max.
              </p>
              <p className="text-xs text-white/70 mb-4">
                Ghibli-style exaggeration over your real face.
              </p>
              <p className="text-xs text-white/70">
                Tip: Upload selfies with visible eyes & natural lighting. Solo works best.
              </p>
            </div>

          </div>
        </div>

        {/* This Week Presets Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">This Week Presets</h2>
          {loading ? (
            <div className="text-center text-white">Loading this week's presets...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rotatingPresets.map((preset, idx) => (
                <div key={idx} className="bg-[#333333] rounded-xl p-6 shadow-lg text-center">
                  <h3 className="text-lg font-semibold leading-snug mb-4 text-white">
                    {preset.label}
                  </h3>
                  <p className="text-sm text-white leading-relaxed">
                    {preset.userDescription}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-16">
          <div className="bg-[#333333] rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-3 text-white">Want to see more looks?</h3>
            <p className="text-sm text-white mb-6">
              All presets work with solo, couples, or groups. Just upload and explore.
            </p>
            <p className="text-white">
              Ready to create your own?<br />
              Click <span className="inline-flex items-center justify-center w-8 h-8 bg-white rounded-full text-black font-bold mx-1">+</span> button on the home page to start.
            </p>
          </div>
        </div>

        {/* Copyright Text */}
        <p className="text-sm text-white/60 text-center mt-28">
          © 2025 Stefna. All rights reserved. Unauthorized vibes will be stylishly ignored.
        </p>
      </div>
    </div>
  )
}
