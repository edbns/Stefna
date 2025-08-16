import React, { useEffect, useMemo, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { UserMedia } from '../services/userMediaService'
import RemixIcon from './RemixIcon'
import authService from '../services/authService'
import { useProfile } from '../contexts/ProfileContext'
import { getMediaLabel, formatRemixCount } from '../utils/mediaCardHelpers'

interface FullScreenMediaViewerProps {
  isOpen: boolean
  media: UserMedia[]
  startIndex?: number
  onClose: () => void
  onRemix?: (media: UserMedia) => void
  onShowAuth?: () => void
}

const FullScreenMediaViewer: React.FC<FullScreenMediaViewerProps> = ({
  isOpen,
  media,
  startIndex = 0,
  onClose,
  onRemix,
  onShowAuth
}) => {
  const { profileData } = useProfile()
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const current = useMemo(() => media[currentIndex], [media, currentIndex])
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle')

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



  const handleRemix = () => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      if (onShowAuth) {
        onShowAuth()
      } else {
        // Fallback: redirect to auth page
        window.location.href = '/auth'
      }
      return
    }
    
    if (!onRemix) return
    
    onRemix(current)
  }

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

  const formattedTime = new Date(current.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

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
        {/* Top Bar */}
        <div className="bg-black/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2 pt-2">
              {(() => {
                // Use profile context data if this is the current user's media
                const isCurrentUser = current.userId === profileData.id
                const displayName = isCurrentUser && profileData.name 
                  ? profileData.name 
                  : (current.userUsername || current.userId || 'Anonymous User')
                const avatarUrl = isCurrentUser && typeof profileData.avatar === 'string'
                  ? profileData.avatar
                  : current.userAvatar
                
                return (
                  <>
                    {avatarUrl && (
                      <img src={avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                    )}
                    <span className="text-white text-sm">{displayName}</span>
                  </>
                )
              })()}
              <span className="text-white text-sm">•</span>
              <span className="text-white text-sm">{formattedTime}</span>
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

          {/* Prompt and Actions - Same line layout */}
          <div className="mt-6 text-center max-w-4xl px-4">
            {/* Prompt with copy functionality - always show */}
            <div className="flex items-center justify-center space-x-3 group relative mb-4">
              <span className="text-white/60 text-sm font-medium">Prompt:</span>
              <div className="relative">
                <span className="text-white text-sm max-w-md truncate block" title={current.prompt || 'No prompt available'}>
                  {current.prompt ? (
                    current.prompt.length > 60 ? `${current.prompt.substring(0, 60)}...` : current.prompt
                  ) : (
                    <span className="text-white/40 italic">No prompt available</span>
                  )}
                </span>
                {/* Full prompt on hover */}
                {current.prompt && current.prompt.length > 60 && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-normal max-w-md z-50 border border-white/20">
                    {current.prompt}
                  </div>
                )}
              </div>
              {/* Copy button - only show if prompt exists */}
              {current.prompt && (
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(current.prompt);
                      setCopyStatus('success');
                      setTimeout(() => setCopyStatus('idle'), 1000);
                    } catch (err) {
                      console.error('Failed to copy prompt:', err);
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = current.prompt;
                      document.body.appendChild(textArea);
                      textArea.select();
                      try {
                        document.execCommand('copy');
                        setCopyStatus('success');
                        setTimeout(() => setCopyStatus('idle'), 1000);
                      } catch (fallbackErr) {
                        console.error('Fallback copy failed:', fallbackErr);
                        setCopyStatus('error');
                        setTimeout(() => setCopyStatus('idle'), 1000);
                      }
                      document.body.removeChild(textArea);
                    }
                  }}
                  className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                  title="Copy prompt to clipboard"
                >
                  {copyStatus === 'success' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-green-400">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  ) : copyStatus === 'error' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                    </svg>
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              )}
            </div>

            {/* Generation Info Chips */}
            {(() => {
              const mediaLabel = getMediaLabel(current)
              const remixText = formatRemixCount(current.remixCount)
              
              return (
                <div className="flex items-center justify-center space-x-3 mb-4">
                  {/* Media Label Chip */}
                  <span 
                    className="text-white/90 text-xs bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20"
                    aria-label={`Style: ${mediaLabel}`}
                    title={mediaLabel}
                  >
                    {mediaLabel}
                  </span>
                  
                  {/* Remix Count */}
                  {remixText && (
                    <span 
                      className="text-white/70 text-xs bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm"
                      aria-label={remixText}
                    >
                      {remixText}
                    </span>
                  )}

                  {/* Remix Button - Icon only, same row */}
                  <button
                    onClick={handleRemix}
                    className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all duration-300 hover:scale-105"
                    title="Remix this creation"
                    aria-label="Remix this media"
                  >
                    <RemixIcon size={14} className="text-white" />
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullScreenMediaViewer


