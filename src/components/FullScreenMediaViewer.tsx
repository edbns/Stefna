import React, { useEffect, useMemo, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { UserMedia } from '../services/userMediaService'
import PresetTag from './PresetTag'
import { getPresetTypeForFilter } from '../utils/presetMapping'

interface FullScreenMediaViewerProps {
  isOpen: boolean
  media: UserMedia[]
  startIndex?: number
  onClose: () => void
  onShowAuth?: () => void
  // Likes functionality
  onToggleLike?: (media: UserMedia) => void
  userLikes?: Record<string, boolean>
  isLoggedIn?: boolean
}

const FullScreenMediaViewer: React.FC<FullScreenMediaViewerProps> = ({
  isOpen,
  media,
  startIndex = 0,
  onClose,
  onShowAuth,
  // Likes functionality
  onToggleLike,
  userLikes = {},
  isLoggedIn = true
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
        {/* Media Container - Smaller display with proper aspect ratio */}
        <div className="flex-1 flex items-center justify-center w-full h-full p-8">
          {current.type === 'video' ? (
            <video 
              src={current.url} 
              className="max-w-[80%] max-h-[80%] object-contain" 
              controls 
              autoPlay 
              muted 
            />
          ) : (
            <img 
              src={current.url} 
              alt={current.prompt || 'AI Generated Image'} 
              className="max-w-[80%] max-h-[80%] object-contain" 
              style={{ 
                maxWidth: '80%', 
                maxHeight: '80%',
                width: 'auto',
                height: 'auto'
              }}
            />
          )}
        </div>

        {/* Info Display - Directly under the image: Date/Time + Like Button */}
        <div className="mt-4 flex items-center justify-center space-x-4">
          {/* Date/Time */}
          <span className="text-white text-sm bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm font-medium">
            {getCreationDate(current)}
          </span>
          
          {/* Like Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isLoggedIn) {
                onShowAuth?.();
                return;
              }
              onToggleLike?.(current);
            }}
            className={`flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all duration-200 ${
              userLikes[`${(current.metadata?.presetType || current.type || 'presets').replace(/-/g, '_')}:${current.id}`] ? 'text-red-500' : ''
            }`}
            title={userLikes[`${(current.metadata?.presetType || current.type || 'presets').replace(/-/g, '_')}:${current.id}`] ? 'Unlike' : 'Like'}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill={userLikes[`${(current.metadata?.presetType || current.type || 'presets').replace(/-/g, '_')}:${current.id}`] ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="text-sm font-medium">{current.likes_count || 0}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default FullScreenMediaViewer


