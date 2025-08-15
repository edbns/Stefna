import React from 'react'
import RemixIcon from './RemixIcon'
import { getCardChips, formatRemixCount } from '../utils/mediaCardHelpers'
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

  // Get chips for display
  const { modeChip, detailChip } = media ? getCardChips(media) : { modeChip: 'Preset', detailChip: title }
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
        {/* Mode and Detail Chips - Top */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 opacity-100 transition-opacity duration-300">
          {/* Mode Chip */}
          <span 
            className="text-white/90 text-xs bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm border border-white/20"
            aria-label={`Generation mode: ${modeChip}`}
          >
            {modeChip}
          </span>
          
          {/* Detail Chip */}
          <span 
            className="text-white/80 text-xs bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm border border-white/10"
            aria-label={`Style: ${detailChip}`}
            title={detailChip} // Show full text on hover if truncated
          >
            {detailChip.length > 20 ? `${detailChip.substring(0, 20)}...` : detailChip}
          </span>
        </div>

        {/* Remix Button - Bottom Right (Single CTA) */}
        {onRemix && (
          <div className="absolute bottom-3 right-3 opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => { e.stopPropagation(); handleRemix() }}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all duration-300 hover:scale-105"
              title="Remix this creation"
              aria-label="Remix this media"
            >
              <RemixIcon size={16} className="text-white" />
            </button>
          </div>
        )}

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