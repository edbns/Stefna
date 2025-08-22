import React, { useEffect, useMemo, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { UserMedia } from '../services/userMediaService'
// RemixIcon import removed - no more remix functionality
import authService from '../services/authService'
import { useProfile } from '../contexts/ProfileContext'

interface FullScreenMediaViewerProps {
  isOpen: boolean
  media: UserMedia[]
  startIndex?: number
  onClose: () => void
  // onRemix prop removed - no more remix functionality
  onShowAuth?: () => void
}

const FullScreenMediaViewer: React.FC<FullScreenMediaViewerProps> = ({
  isOpen,
  media,
  startIndex = 0,
  onClose,
  // onRemix parameter removed
  onShowAuth
}) => {
  const { profileData } = useProfile()
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const current = useMemo(() => media[currentIndex], [media, currentIndex])

  // Debug: Log current media data
  useEffect(() => {
    if (current) {
      console.log('🔍 FullScreenMediaViewer current media:', {
        id: current.id,
        prompt: current.prompt,
        userId: current.userId,
        type: current.type,
        hasPrompt: !!current.prompt,
        promptLength: current.prompt?.length || 0
      })
    }
  }, [current])

  useEffect(() => {
    setCurrentIndex(startIndex)
  }, [startIndex])

  // handleRemix function removed - no more remix functionality

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrentIndex((i) => (i + 1) % media.length)
      if (e.key === 'ArrowLeft') setCurrentIndex((i) => (i - 1 + media.length) % media.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, media.length, onClose])

  if (!isOpen || !current) return null

  const handlePrev = () => setCurrentIndex((i) => (i - 1 + media.length) % media.length)
  const handleNext = () => setCurrentIndex((i) => (i + 1) % media.length)

  // Function to determine how the media was created with clear titles
  const getCreationMethod = (media: UserMedia): string => {
    // Check for specific preset types first
    if (media.metadata?.presetId) {
      // Map preset IDs to clear, user-friendly names
      const presetNames: Record<string, string> = {
        // Emotion Mask presets
        'emotion_mask_sad': 'Emotion Mask™',
        'emotion_mask_angry': 'Emotion Mask™',
        'emotion_mask_love': 'Emotion Mask™',
        'emotion_mask_surprised': 'Emotion Mask™',
        'emotion_mask_conf_loneliness': 'Emotion Mask™',
        
        // Ghibli Reaction presets
        'ghibli_tears': 'Studio Ghibli Reaction™',
        'ghibli_shock': 'Studio Ghibli Reaction™',
        'ghibli_sparkle': 'Studio Ghibli Reaction™',
        'ghibli_love': 'Studio Ghibli Reaction™',
        'ghibli_sad': 'Studio Ghibli Reaction™',
        
        // Neo Tokyo Glitch presets
        'neotokyo_glitch': 'Neo Tokyo Glitch™',
        'neotokyo_neon': 'Neo Tokyo Glitch™',
        'neotokyo_cyberpunk': 'Neo Tokyo Glitch™',
        'neotokyo_retro': 'Neo Tokyo Glitch™',
        
        // Professional presets
        'cinematic_glow': 'Cinematic Glow',
        'bright_airy': 'Bright & Airy',
        'vivid_pop': 'Vivid Pop',
        'vintage_film_35mm': 'Vintage Film',
        'tropical_boost': 'Tropical Boost',
        'urban_grit': 'Urban Grit',
        'mono_drama': 'B&W Drama',
        'dreamy_pastels': 'Soft Pastel Glow',
        'golden_hour_magic': 'Golden Hour Magic',
        'high_fashion_editorial': 'Fashion Editorial',
        'moody_forest': 'Forest Mood',
        'desert_glow': 'Golden Dunes',
        'retro_polaroid': 'Instant Retro',
        'crystal_clear': 'Sharp Clarity',
        'ocean_breeze': 'Coastal Air',
        'festival_vibes': 'Vibrant Festival',
        'noir_classic': 'Noir Cinema',
        'sun_kissed': 'Warm Glow',
        'frost_light': 'Winter Chill',
        'neon_nights': 'Neon Nights',
        'cultural_glow': 'Cultural Heritage',
        'soft_skin_portrait': 'Natural Portrait',
        'rainy_day_mood': 'Rain Mood',
        'wildlife_focus': 'Wildlife Detail',
        'street_story': 'Urban Portrait',
        'express_enhance': 'Express Enhance'
      }
      return presetNames[media.metadata.presetId] || 'AI Style'
    }
    
    // Check for mode in metadata
    if (media.metadata?.mode) {
      const modeNames: Record<string, string> = {
        'i2i': 'Image to Image',
        'txt2img': 'Text to Image',
        'restore': 'Restore',
        'story': 'Story Mode'
      }
      return modeNames[media.metadata.mode] || 'AI Generated'
    }
    
    // Check for group in metadata
    if (media.metadata?.group) {
      const groupNames: Record<string, string> = {
        'story': 'Story Mode',
        'time_machine': 'Time Machine',
        'restore': 'Restore'
      }
      return groupNames[media.metadata.group] || 'AI Generated'
    }
    
    // Check for option key in metadata
    if (media.metadata?.optionKey) {
      return media.metadata.optionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    
    // Fallback based on media type
    if (media.type === 'video') {
      return 'AI Video'
    }
    
    // Default fallback
    return 'AI Generated'
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white hover:text-white/80 bg-black/50 rounded-full backdrop-blur-sm z-50"
        aria-label="Close viewer"
        title="Close"
      >
        <X size={24} />
      </button>

      {/* Layout */}
      <div className="h-full w-full flex flex-col">
        {/* Top Bar - Simplified with creation method tag and timestamp */}
        <div className="bg-black/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-4 pt-2">
              {/* Preset/creation method tag */}
              <span className="text-white/80 text-sm bg-white/10 px-3 py-1 rounded-full border border-white/20">
                {getCreationMethod(current)}
              </span>
              
              {/* Timestamp display */}
              <span className="text-white/60 text-xs">
                {new Date(current.timestamp).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Media Area */}
        <div className="flex-1 relative flex flex-col items-center justify-start pt-4">
          {/* Prev */}
          {media.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white hover:text-white/80 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-sm transition-all duration-200 z-40"
              aria-label="Previous"
              title="Previous"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Media */}
          <div className="max-w-full max-h-full object-contain">
            {current.type === 'video' ? (
              <video src={current.url} className="max-w-full max-h-[calc(100vh-200px)] object-contain" controls autoPlay muted />
            ) : (
              <img src={current.url} alt={current.prompt} className="max-w-full max-h-[calc(100vh-200px)] object-contain" />
            )}
          </div>

          {/* Next */}
          {media.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white hover:text-white/80 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-sm transition-all duration-200 z-40"
              aria-label="Next"
              title="Next"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* 🔍 COMPREHENSIVE PROMPT ANALYSIS SECTION */}
        <div className="bg-black/80 backdrop-blur-sm p-6 border-t border-white/20">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Section Title */}
            <div className="text-center">
              <h3 className="text-white text-lg font-semibold mb-2">🔍 Generation Analysis</h3>
              <p className="text-white/60 text-sm">Complete prompt and generation details for debugging</p>
            </div>

            {/* Prompt Display */}
            {current.prompt && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-medium mb-2">📝 User Prompt:</h4>
                <p className="text-white/90 text-sm leading-relaxed break-words">{current.prompt}</p>
              </div>
            )}

            {/* Generation Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column - Basic Info */}
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 className="text-white font-medium mb-2">🎯 Generation Mode:</h4>
                  <p className="text-white/80 text-sm">{getCreationMethod(current)}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 className="text-white font-medium mb-2">🆔 Media ID:</h4>
                  <p className="text-white/80 text-sm font-mono text-xs">{current.id}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 className="text-white font-medium mb-2">👤 User ID:</h4>
                  <p className="text-white/80 text-sm font-mono text-xs">{current.userId || 'Unknown'}</p>
                </div>
              </div>

              {/* Right Column - Technical Details */}
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 className="text-white font-medium mb-2">📅 Created:</h4>
                  <p className="text-white/80 text-sm">{new Date(current.timestamp).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 className="text-white font-medium mb-2">📊 Media Type:</h4>
                  <p className="text-white/80 text-sm">{current.type || 'image'} {current.aspectRatio ? `(${current.aspectRatio})` : ''}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 className="text-white font-medium mb-2">🔗 URL:</h4>
                  <p className="text-white/80 text-sm font-mono text-xs break-all">{current.url.substring(0, 100)}...</p>
                </div>
              </div>
            </div>

            {/* Full Metadata Dump */}
            {current.metadata && Object.keys(current.metadata).length > 0 && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-medium mb-2">🔧 Complete Metadata:</h4>
                <pre className="text-white/80 text-xs overflow-x-auto bg-black/20 p-3 rounded border border-white/10">
                  {JSON.stringify(current.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Debug Info */}
            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
              <h4 className="text-blue-300 font-medium mb-2">🐛 Debug Information:</h4>
              <div className="text-blue-200/80 text-xs space-y-1">
                <p>• Prompt Length: {current.prompt?.length || 0} characters</p>
                <p>• Has Metadata: {current.metadata ? 'Yes' : 'No'}</p>
                <p>• Metadata Keys: {current.metadata ? Object.keys(current.metadata).join(', ') : 'None'}</p>
                <p>• Media Object Keys: {Object.keys(current).join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullScreenMediaViewer


