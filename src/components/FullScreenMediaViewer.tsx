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
        
        // Standard presets
        'cinematic_glow': 'Cinematic Glow',
        'bright_airy': 'Bright & Airy',
        'vivid_pop': 'Vivid Pop',
        'vintage_film_35mm': 'Vintage Film',
        'tropical_boost': 'Tropical Boost',
        'urban_grit': 'Urban Grit'
      }
      return presetNames[media.metadata.presetId] || 'AI Style'
    }
    
    // Check for generation modes
    if (media.metadata?.mode === 'i2i') return 'Image to Image'
    if (media.metadata?.mode === 'txt2img') return 'Text to Image'
    if (media.metadata?.mode === 'restore') return 'Restore'
    if (media.metadata?.mode === 'story') return 'Story Mode'
    

    
    // Fallback based on prompt
    if (media.prompt && media.prompt.length > 0) return 'Custom Creation'
    
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
        {/* Top Bar - Simplified with creation method tag */}
        <div className="bg-black/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2 pt-2">
              <span className="text-white/80 text-sm bg-white/10 px-3 py-1 rounded-full border border-white/20">
                {getCreationMethod(current)}
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

          {/* Actions - Simplified layout with copy functionality */}
          <div className="mt-6 text-center max-w-4xl px-4">
            {/* Prompt display with text and copy icon */}
            {current.prompt && (
              <div className="flex flex-col items-center max-w-2xl mx-auto space-y-3">
                {/* Prompt text */}
                <div className="bg-white/10 border border-white/20 rounded-lg p-4 w-full">
                  <p className="text-white/80 text-sm leading-relaxed break-words">
                    {current.prompt}
                  </p>
                </div>
                
                {/* Copy button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(current.prompt)
                      .then(() => {
                        // Show a brief success indicator
                        const button = document.activeElement as HTMLButtonElement
                        if (button) {
                          const originalHTML = button.innerHTML
                          button.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>'
                          setTimeout(() => {
                            button.innerHTML = originalHTML
                          }, 1000)
                        }
                      })
                      .catch(err => console.error('Failed to copy prompt:', err))
                  }}
                  className="text-white/60 p-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200"
                  title="Copy prompt to clipboard"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullScreenMediaViewer


