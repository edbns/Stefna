import React from 'react'
import { MediaRecord } from '../lib/types'
import { UserMedia } from '../services/userMediaService'

interface MediaCardProps {
  id: string
  type: 'photo' | 'video'
  title: string
  gradient: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  isLoggedIn: boolean
  onShowAuth: () => void
  onShowMedia?: (id: string, title: string) => void
  aspectRatio?: number
  // New props for metadata-driven chips
  media?: MediaRecord | UserMedia  // Full media object for metadata
}

const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  gradient,
  icon: IconComponent,
  isLoggedIn,
  onShowAuth,
  onShowMedia,
  aspectRatio = 1,
  media
}) => {

  // Determine aspect ratio class
  const getAspectClass = () => {
    if (aspectRatio <= 0.6) {
      return 'aspect-[9/16]'
    } else {
      return 'aspect-square'
    }
  }
  
  return (
    <div 
      className={`${getAspectClass()} relative bg-white/5 overflow-hidden cursor-pointer group`}
      onClick={(e) => {
        e.stopPropagation()
        onShowMedia?.(id, title)
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
        {/* Action Buttons - Bottom Right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-100 transition-opacity duration-300">
          {/* Remix functionality removed - simpler system */}
        </div>
      </div>
    </div>
  )
}

export default MediaCard