import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, FileText, Cookie, Instagram as InstagramIcon, Facebook as FacebookIcon, Youtube as YouTubeIcon } from 'lucide-react'
import { optimizeFeedImage } from '../utils/cloudinaryOptimization'

// Custom TikTok icon since lucide-react doesn't have one
const TikTokIcon = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.36 6.36 0 00-1-.05A6.35 6.35 0 005 15.77a6.34 6.34 0 0011.14 4.16v-6.61a8.16 8.16 0 004.65 1.46v-3.44a4.85 4.85 0 01-1.2-.65z"/>
  </svg>
)

// Custom Threads icon since lucide-react doesn't have one
const ThreadsIcon = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z"/>
  </svg>
)

// Custom X (formerly Twitter) icon since lucide-react still has the old Twitter logo
const XIconCustom = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

export default function BestPracticesScreen() {
  const navigate = useNavigate()
  const [rotatingPresets, setRotatingPresets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const presets = [
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

  // Static user-friendly descriptions for rotating presets
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

        // Using static images instead of API calls
        
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
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get static image path for preset
  const findMediaForPreset = (presetTitle: string) => {
    const imageMap: Record<string, string> = {
      'Black Aura': '/images/parallel_self_black_aura.jpg?v=' + Date.now(),
      'The Untouchable': '/images/parallel_self_untouchable.jpg?v=' + Date.now(),
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
    
    const imagePath = imageMap[presetTitle]
    return imagePath ? { url: imagePath } : null
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
                <div className="relative w-full mb-4 overflow-hidden">
                  {(() => {
                    const media = findMediaForPreset(preset.title)
                    const imageUrl = media?.url
                    if (imageUrl) {
                      const optimizedUrl = optimizeFeedImage(imageUrl)
                      return (
                        <img
                          src={optimizedUrl} 
                          alt={`Generated ${preset.title}`}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      )
                    }
                    return (
                      <div className="w-full h-32 bg-[#333333] flex items-center justify-center">
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
                <div className="relative w-full mb-4 overflow-hidden">
                  {(() => {
                    const media = findMediaForPreset(preset.title)
                    const imageUrl = media?.url
                    if (imageUrl) {
                      const optimizedUrl = optimizeFeedImage(imageUrl)
                      return (
                        <img
                          src={optimizedUrl} 
                          alt={`Generated ${preset.title}`}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      )
                    }
                    return (
                      <div className="w-full h-32 bg-[#333333] flex items-center justify-center">
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
            {/* Studio: Edit My Photo */}
            <div className="bg-[#333333] rounded-xl p-6 shadow-lg text-center">
              <div className="mb-3">
                <span className="text-xs uppercase text-white tracking-wider font-medium">
                  Studio: Edit My Photo
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

            {/* Cyber Siren */}
            <div className="bg-[#333333] rounded-xl p-6 shadow-lg text-center">
              <div className="mb-3">
                <span className="text-xs uppercase text-white tracking-wider font-medium">
                  Cyber Siren
                </span>
              </div>
              <h3 className="text-lg font-semibold leading-snug mb-3 text-white">
                Part-time model. Full-time glitch in the system.
              </h3>
              <p className="text-sm text-white leading-relaxed mb-4">
                Step into a neon fever dream: techwear silhouettes, broken signal patterns, chrome heat.
              </p>
              <p className="text-sm text-white leading-relaxed mb-4">
                You won't just be seen. You'll interrupt the timeline.
              </p>
              <p className="text-sm text-white leading-relaxed mb-4">
                Upload a bold selfie — chin high, eyes sharp.
              </p>
              <p className="text-sm text-white leading-relaxed mb-4">
                You're not the passenger. You are the siren.
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

        {/* Legal Pages and Social Media Links */}
        <div className="flex flex-col items-center space-y-4 mt-24">
          {/* Legal Pages */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/privacy')}
              className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              title="Privacy Policy"
            >
              <Shield size={16} className="text-white" />
            </button>
            <button
              onClick={() => navigate('/terms')}
              className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              title="Terms of Service"
            >
              <FileText size={16} className="text-white" />
            </button>
            <button
              onClick={() => navigate('/cookies')}
              className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              title="Cookies Policy"
            >
              <Cookie size={16} className="text-white" />
            </button>
          </div>

          {/* Social Media Links */}
          <div className="flex items-center space-x-2">
            <a href="https://www.instagram.com/stefnaxyz/" target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90" title="Instagram">
              <InstagramIcon size={18} className="text-white" />
            </a>
            <a
              href="https://x.com/StefnaXYZ"
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
              title="X"
            >
              <XIconCustom size={18} className="text-white" />
            </a>
            <a
              href="https://www.facebook.com/Stefnaxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
              title="Facebook"
            >
              <FacebookIcon size={18} className="text-white" />
            </a>
            <a
              href="https://www.tiktok.com/@stefnaxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
              title="TikTok"
            >
              <TikTokIcon size={18} className="text-white" />
            </a>
            <a
              href="https://www.threads.net/@stefnaxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
              title="Threads"
            >
              <ThreadsIcon size={18} className="text-white" />
            </a>
            <a href="https://www.youtube.com/channel/UCNBAWuWc8luYN8F0dIXX0RA" target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90" title="YouTube">
              <YouTubeIcon size={18} className="text-white" />
            </a>
          </div>
        </div>

        {/* Copyright Text */}
        <p className="text-sm text-white/60 text-center mt-8">
          © 2025 Stefna. All rights reserved. Unauthorized vibes will be stylishly ignored.
        </p>
      </div>
    </div>
  )
}