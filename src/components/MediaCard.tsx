import React, { useState } from 'react'
import { Heart } from 'lucide-react'
import RemixIcon from './RemixIcon'

interface MediaCardProps {
  id: string
  type: 'photo' | 'video'
  title: string
  prompt: string
  gradient: string
  icon: React.ComponentType<any>
  creatorName: string
  isLoggedIn: boolean
  onLike: (id: string) => void
  onRemix: (id: string) => void
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
  type,
  title,
  prompt,
  gradient,
  icon: IconComponent,
  creatorName,
  isLoggedIn,
  onLike,
  onRemix,
  onDownload,
  onDelete,
  onShowAuth,
  onFilterAiAsBrush,
  onFilterCreator,
  onShowMedia,
  isLiked = false,
  likesCount = 0,
  remixesCount = 0,
  isAiAsBrush = false,
  aspectRatio = 1
}) => {
  const [isLikedState, setIsLikedState] = useState(isLiked)
  const [localLikesCount, setLocalLikesCount] = useState(likesCount)
  

  const handleLike = () => {
    if (!isLoggedIn) {
      onShowAuth()
      return
    }
    
    setIsLikedState(!isLikedState)
    setLocalLikesCount(isLikedState ? localLikesCount - 1 : localLikesCount + 1)
    onLike(id)
  }

  const handleRemix = () => {
    if (!isLoggedIn) {
      onShowAuth()
      return
    }
    
    onRemix(id)
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload(id)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id)
    }
  }

  // Determine aspect ratio class for trending ratios
  const getAspectClass = () => {
    if (aspectRatio <= 0.6) {
      return 'aspect-[9/16]' // True 9:16 portrait content (TikTok, YouTube Shorts, Instagram Stories/Reels)
    } else {
      return 'aspect-square' // Square content (1:1 - Instagram posts, TikTok square)
    }
  }

  return (
    <div 
      className={`${getAspectClass()} bg-white/5 overflow-hidden relative cursor-pointer`}
      onClick={(e) => {
        e.stopPropagation()
        console.log('MediaCard clicked:', id, title)
        onShowMedia?.(id, title, prompt)
      }}
    >
      {/* #AiAsABrush Text - Top Left */}
      {isAiAsBrush && onFilterAiAsBrush && (
        <button
          onClick={(e) => { e.stopPropagation(); onFilterAiAsBrush(); }}
          className="absolute top-3 left-3 text-xs font-medium z-10 animate-gradient"
          title="Filter #AiAsABrush"
        >
          #AiAsABrush
        </button>
      )}

      {/* Top Right Actions removed per spec (no report/more menu) */}
      <style>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-gradient {
          background: linear-gradient(90deg, #a855f7, #ec4899, #ef4444, #a855f7);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient 3s ease infinite;
        }
      `}</style>
      
      {/* Media Content */}
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <IconComponent size={28} className="text-white" />
          </div>
          <p className="text-white/60 text-sm text-center">{title}</p>
        </div>
      </div>

      {/* Creator Avatar - Bottom Left */}
      <div className="absolute bottom-3 left-3">
        <button
          onClick={(e) => { e.stopPropagation(); onFilterCreator?.(creatorName) }}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all duration-300"
          title={`Filter by ${creatorName}`}
        >
          <span className="text-white/80 text-xs font-medium">
            {creatorName.charAt(0).toUpperCase()}
          </span>
        </button>
      </div>

              {/* CTA Buttons - Bottom Right */}
        <div className="absolute bottom-3 right-3 flex items-center space-x-4">
          {/* Like Button */}
          <div className="flex items-center space-x-0.5">
            {localLikesCount > 0 && (
              <span className="text-white/60 text-sm">{localLikesCount}</span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleLike() }}
              className="w-8 h-8 flex items-center justify-center focus:outline-none active:transform-none"
              title="Like"
            >
              <Heart 
                size={16} 
                className={`${
                  isLikedState ? 'text-red-500 fill-red-500' : 'text-white'
                }`} 
              />
            </button>
          </div>

          {/* Remix Button */}
          <div className="flex items-center space-x-0.5 group">
            {remixesCount > 0 && (
              <span className="text-white/60 text-sm">{remixesCount}</span>
            )}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); handleRemix() }}
                className="w-8 h-8 flex items-center justify-center focus:outline-none active:transform-none"
                title="REMIX"
              >
                <RemixIcon size={14} className="text-white" />
              </button>
              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                Remix
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-black/90"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Report flow removed per spec */}
    </div>
  )
}

export default MediaCard 