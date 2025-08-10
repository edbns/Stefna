import React, { useState } from 'react'
import { Heart, Share2 } from 'lucide-react'
import RemixIcon from './RemixIcon'

interface MediaCardProps {
  id: string
  type: 'photo' | 'video'
  title: string
  prompt: string
  gradient: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  creatorName: string
  isLoggedIn: boolean
  onLike: (id: string) => void
  onRemix?: (id: string) => void
  onShare?: (id: string) => void
  onDownload?: (id: string) => void
  onDelete?: (id: string) => void
  onShowAuth: () => void
  onFilterAiAsBrush?: () => void
  onFilterCreator?: (creatorName: string) => void
  onShowMedia?: (id: string, title: string, prompt: string) => void
  isLiked?: boolean
  likesCount?: number
  remixesCount?: number
  isAiAsBrush?: boolean
  aspectRatio?: number
}

const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  prompt,
  gradient,
  icon: IconComponent,
  creatorName,
  isLoggedIn,
  onLike,
  onRemix,
  onShare,
  onShowAuth,
  onFilterCreator,
  onShowMedia,
  isLiked = false,
  likesCount = 0,
  remixesCount = 0,
  aspectRatio = 1
}) => {
  const [isLikedState, setIsLikedState] = useState(isLiked)
  const [localLikesCount, setLocalLikesCount] = useState(likesCount)

  const handleLike = async () => {
    if (!isLoggedIn) {
      onShowAuth()
      return
    }
    
    // Optimistically update UI
    const newLikedState = !isLikedState
    setIsLikedState(newLikedState)
    setLocalLikesCount(newLikedState ? localLikesCount + 1 : localLikesCount - 1)
    
    // Call the parent handler
    onLike(id)
  }

  const handleRemix = () => {
    if (!isLoggedIn) {
      onShowAuth()
      return
    }
    
    if (onRemix) {
      onRemix(id)
    }
  }

  const handleShare = () => {
    if (!isLoggedIn) {
      onShowAuth()
      return
    }
    
    if (onShare) {
      onShare(id)
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

  return (
    <div 
      className={`${getAspectClass()} relative bg-white/5 rounded-lg overflow-hidden cursor-pointer group transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]`}
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

      {/* Overlay for actions - only visible on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
        {/* Profile Avatar - Top Left */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => { e.stopPropagation(); onFilterCreator?.(creatorName) }}
            className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
            title={`View ${creatorName}'s content`}
          >
            <span className="text-white text-xs font-medium">
              {creatorName.charAt(0).toUpperCase()}
            </span>
          </button>
        </div>

        {/* Action Buttons - Bottom Right */}
        <div className="absolute bottom-3 right-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Share Button */}
          {onShare && (
            <button
              onClick={(e) => { e.stopPropagation(); handleShare() }}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              title="Share"
            >
              <Share2 size={14} className="text-white" />
            </button>
          )}

          {/* Like Button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleLike() }}
            className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
            title="Like"
          >
            <Heart 
              size={14} 
              className={`${
                isLikedState ? 'text-red-500 fill-red-500' : 'text-white'
              }`} 
            />
          </button>

          {/* Remix Button - Only show if onRemix is provided */}
          {onRemix && (
            <button
              onClick={(e) => { e.stopPropagation(); handleRemix() }}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              title="Remix"
            >
              <RemixIcon size={14} className="text-white" />
            </button>
          )}
        </div>

        {/* Interaction counts - Bottom Left */}
        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col space-y-1">
          {localLikesCount > 0 && (
            <span className="text-white/80 text-xs bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
              {localLikesCount} {localLikesCount === 1 ? 'like' : 'likes'}
            </span>
          )}
          {remixesCount > 0 && (
            <span className="text-white/80 text-xs bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
              {remixesCount} {remixesCount === 1 ? 'remix' : 'remixes'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MediaCard