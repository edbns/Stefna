import React, { useEffect, useMemo, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { UserMedia } from '../services/userMediaService'
import PresetTag from './PresetTag'

interface FullScreenMediaViewerProps {
  isOpen: boolean
  media: UserMedia[]
  startIndex?: number
  onClose: () => void
  onShowAuth?: () => void
}

const FullScreenMediaViewer: React.FC<FullScreenMediaViewerProps> = ({
  isOpen,
  media,
  startIndex = 0,
  onClose,
  onShowAuth
}) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const current = useMemo(() => media[currentIndex], [media, currentIndex])

  useEffect(() => {
    setCurrentIndex(startIndex)
  }, [startIndex])

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

  // Get the creation date from the media item
  const getCreationDate = (media: UserMedia) => {
    if (media.timestamp) {
      return new Date(media.timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
    return 'Unknown date'
  }

  // Get the preset type for the tag
  const getPresetType = (media: UserMedia) => {
    // Use metadata.presetType if available (from new dedicated tables)
    if (media.metadata?.presetType) {
      return media.metadata.presetType
    }
    
    // Fallback logic for items that might not have the presetType field
    if (media.presetKey) {
      if (media.presetKey.includes('ghibli') || media.presetKey.includes('ghibli_reaction')) {
        return 'ghibli-reaction'
      }
      if (media.presetKey.includes('emotion') || media.presetKey.includes('emotion_mask')) {
        return 'emotion-mask'
      }
      if (media.presetKey.includes('neo') || media.presetKey.includes('neo_glitch')) {
        return 'neo-glitch'
      }
      if (media.presetKey.includes('preset') || media.presetKey.includes('professional')) {
        return 'presets'
      }
      if (media.presetKey === 'custom' || media.presetKey === 'custom_prompt') {
        return 'custom-prompt'
      }
    }
    
    // Default fallback
    return 'presets'
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

      {/* Navigation Buttons - Show when there are multiple media items */}
      {media.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white hover:text-white/80 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-sm transition-all duration-200 z-40"
            aria-label="Previous"
            title="Previous"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white hover:text-white/80 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-sm transition-all duration-200 z-40"
            aria-label="Next"
            title="Next"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Centered Media Display */}
      <div className="h-full w-full flex flex-col items-center justify-center p-8">
        {/* Media Container - Made smaller */}
        <div className="flex-1 flex items-center justify-center max-w-4xl max-h-[70vh]">
          {current.type === 'video' ? (
            <video 
              src={current.url} 
              className="max-w-full max-h-full object-contain" 
              controls 
              autoPlay 
              muted 
            />
          ) : (
            <img 
              src={current.url} 
              alt={current.prompt || 'AI Generated Image'} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
            />
          )}
        </div>

        {/* Info Display - Same row: Preset Tag + Date/Time */}
        <div className="mt-6 flex items-center justify-center space-x-4">
          {/* Preset Tag */}
          {(current.metadata?.presetKey || current.presetKey) && (
            <PresetTag
              presetKey={current.metadata?.presetKey || current.presetKey}
              type={getPresetType(current)}
              size="md"
              clickable={false}
            />
          )}
          
          {/* Date/Time */}
          <span className="text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
            {getCreationDate(current)}
          </span>
        </div>

        {/* Image Counter - Bottom Center */}
        {media.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} of {media.length}
          </div>
        )}
      </div>
    </div>
  )
}

export default FullScreenMediaViewer


