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
  onEdit?: (id: string) => void
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
  onEdit,
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

  const handleEdit = () => {
    if (!isLoggedIn) {
      onShowAuth()
      return
    }
    
    if (onEdit) {
      onEdit(id)
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

  // Get single smart tag for display
  const { modeChip, detailChip } = media ? getCardChips(media) : { modeChip: 'Preset', detailChip: title }
  const remixText = formatRemixCount(remixCount)
  
  // Create single smart tag that combines mode and detail intelligently
  const getSmartTag = () => {
    if (!media) return title; // Fallback to title if no media metadata
    
    // Handle both MediaRecord and UserMedia types
    const meta = 'meta' in media ? media.meta : media.metadata || {};
    
    // For MoodMorph, show "MoodMorph" as the tag
    // Check if tag property exists (added by MoodMorph)
    if ('tag' in meta && meta.tag && typeof meta.tag === 'string' && meta.tag.startsWith('mood:')) {
      return 'MoodMorph';
    }
    
    // For presets, show the preset name
    if (meta.presetId) {
      return detailChip;
    }
    
    // For story mode, show the story theme
    if (meta.group === 'story') {
      return detailChip;
    }
    
    // For time machine/restore, show the mode name
    if (meta.group === 'time_machine' || meta.group === 'restore') {
      return modeChip;
    }
    
    // Default fallback
    return detailChip || modeChip;
  }

  const smartTag = getSmartTag();

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
        {/* Single Smart Tag - Top Left */}
        <div className="absolute top-3 left-3 opacity-100 transition-opacity duration-300">
          <span 
            className="text-white/90 text-xs bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm border border-white/20"
            aria-label={`Style: ${smartTag}`}
            title={smartTag} // Show full text on hover if truncated
          >
            {smartTag.length > 25 ? `${smartTag.substring(0, 25)}...` : smartTag}
          </span>
        </div>

        {/* Action Buttons - Bottom Right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-100 transition-opacity duration-300">
          {/* Edit Button */}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); handleEdit() }}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all duration-300 hover:scale-105"
              title="Edit this creation"
              aria-label="Edit this media"
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}

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