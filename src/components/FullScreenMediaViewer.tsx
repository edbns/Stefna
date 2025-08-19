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

  // Function to determine how the media was created
  const getCreationMethod = (media: UserMedia): string => {
    if (media.metadata?.presetId) {
      // Map preset IDs to readable names
      const presetNames: Record<string, string> = {
        'ghibli_tears': 'Ghibli Tears',
        'ghibli_shock': 'Ghibli Shock', 
        'ghibli_sparkle': 'Ghibli Sparkle',
        'neotokyo_glitch': 'Neo Tokyo Glitch',
        'neotokyo_neon': 'Neo Tokyo Neon',
        'neotokyo_cyberpunk': 'Neo Tokyo Cyberpunk'
      }
      return presetNames[media.metadata.presetId] || 'Preset'
    }
    
    if (media.metadata?.mode === 'i2i') return 'Image to Image'
    if (media.metadata?.mode === 'txt2img') return 'Text to Image'
    if (media.metadata?.mode === 'restore') return 'Restore'
    if (media.metadata?.mode === 'story') return 'Story Mode'
    
    // Fallback based on prompt
    if (media.prompt && media.prompt.length > 0) return 'Custom Prompt'
    
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
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white hover:text-white/80"
              aria-label="Previous"
              title="Previous"
            >
              <ChevronLeft size={20} />
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
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white hover:text-white/80"
              aria-label="Next"
              title="Next"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* Actions - Removed remix button, simplified layout */}
          <div className="mt-6 text-center max-w-4xl px-4">
            {/* Simple prompt display if available */}
            {current.prompt && (
              <div className="text-white/60 text-sm max-w-2xl mx-auto">
                "{current.prompt}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullScreenMediaViewer


