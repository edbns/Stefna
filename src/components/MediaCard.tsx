import React from 'react'
import RemixIcon from './RemixIcon'
import { getCardChips, formatRemixCount, getMediaLabel } from '../utils/mediaCardHelpers'
import { MediaRecord } from '../lib/types'
import { UserMedia } from '../services/userMediaService'

interface MediaCardProps {
  id: string
  type: 'photo' | 'video'
  title: string
  prompt: string
  gradient: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  isLoggedIn: boolean
  onRemix?: (id: string) => void
  onShowAuth: () => void
  onShowMedia?: (id: string, title: string, prompt: string) => void
  remixCount?: number
  aspectRatio?: number
  // New props for metadata-driven chips
  media?: MediaRecord | UserMedia  // Full media object for metadata
}

const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  prompt,
  gradient,
  icon: IconComponent,
  isLoggedIn,
  onRemix,
  onShowAuth,
  onShowMedia,
  remixCount = 0,
  aspectRatio = 1,
  media
}) => {
  const handleRemix = () => {
    if (!isLoggedIn) {
      onShowAuth()
      return
    }
    
    if (onRemix) {
      onRemix(id)
    }
  }

  // Determine aspect ratio class
  const getAspectClass = () => {
    if (aspectRatio <= 0.6) {
      return 'aspect-[9/16]'
    } else {
      return 'aspect-square'
    }
  }

  // Get clean media label for display
  const mediaLabel = media ? getMediaLabel(media) : title
  const remixText = formatRemixCount(remixCount)
  
  return (
    <div 
      className={`${getAspectClass()} relative bg-white/5 overflow-hidden cursor-pointer group`}
      onClick={(e) => {
        e.stopPropagation()
        onShowMedia?.(id, title, prompt)
      }}
    >
      {/* Media Content */}
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <IconComponent size={28} className="text-white" />
          </div>
          <p className="text-white/60 text-sm text-center">{title}</p>
        </div>
      </div>

      {/* Overlay for actions - always visible */}
      <div className="absolute inset-0 bg-black/20 transition-all duration-300">
        {/* Single Clean Label - Top Left */}
        <div className="absolute top-3 left-3 opacity-100 transition-opacity duration-300">
          <span 
            className="text-white/90 text-xs bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm border border-white/20"
            aria-label={`Style: ${mediaLabel}`}
            title={mediaLabel} // Show full text on hover if truncated
          >
            {mediaLabel.length > 25 ? `${mediaLabel.substring(0, 25)}...` : mediaLabel}
          </span>
        </div>

        {/* Action Buttons - Bottom Right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-100 transition-opacity duration-300">
          {/* Remix Button */}
          {onRemix && (
            <button
              onClick={(e) => { e.stopPropagation(); handleRemix() }}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all duration-300 hover:scale-105"
              title="Remix this creation"
              aria-label="Remix this media"
            >
              <RemixIcon size={16} className="text-white" />
            </button>
          )}
        </div>

        {/* Remix Count - Bottom Left (Optional passive metric) */}
        {remixText && (
          <div className="absolute bottom-3 left-3 opacity-100 transition-opacity duration-300">
            <span 
              className="text-white/70 text-xs bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm"
              aria-label={remixText}
            >
              {remixText}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default MediaCard