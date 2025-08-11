import React, { useRef } from 'react'
import { Share2, Heart, FileText } from 'lucide-react'
import { UserMedia } from '../services/userMediaService'
import RemixIcon from './RemixIcon'
import ProfileIcon from './ProfileIcon'

interface MasonryMediaGridProps {
  media: UserMedia[]
  columns?: number
  onMediaClick?: (media: UserMedia) => void
  onDownload?: (media: UserMedia) => void
  onShare?: (media: UserMedia) => void
  onLike?: (media: UserMedia) => void
  onRemix?: (media: UserMedia) => void
  onDelete?: (media: UserMedia) => void
  onEdit?: (media: UserMedia) => void
  onFilterCreator?: (userId: string) => void
  onGenerateCaption?: (media: UserMedia) => void
  showActions?: boolean
  className?: string
  isLikedMedia?: boolean // New prop to indicate if this is the liked media tab
}

const MasonryMediaGrid: React.FC<MasonryMediaGridProps> = ({
  media,
  // columns = 3,
  onMediaClick,
  onDownload,
  onShare,
  onLike,
  onRemix,
  onDelete,
  // onEdit,
  onFilterCreator,
  onGenerateCaption,
  showActions = true,
  className = '',
  isLikedMedia = false // Default to false
}) => {
  const gridRef = useRef<HTMLDivElement>(null)





  const handleAction = (action: () => void, event: React.MouseEvent) => {
    event.stopPropagation()
    action()
  }
  // local profile not used here




  const getTypeIcon = (type: 'photo' | 'video' | 'remix') => {
    switch (type) {
      case 'video':
        return (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        )
      case 'remix':
        return (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
            <RemixIcon size={12} className="text-white" />
          </div>
        )
      default:
        return null
    }
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/40">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        </div>
        <p className="text-white/60 text-lg text-center">No media found</p>
        <p className="text-white/40 text-sm text-center mt-2">Media will appear here</p>
      </div>
    )
  }

  return (
    <div className={`${className}`} ref={gridRef}>
      <div 
        className="columns-3 gap-2 mx-auto" 
        style={{ maxWidth: '1200px' }}
      >
        {media.map((item) => {
          return (
            <div
              key={item.id}
              className="break-inside-avoid mb-1 relative group cursor-pointer bg-white/5 rounded-lg overflow-hidden transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]"
              onClick={() => onMediaClick?.(item)}
            >
              {/* Media Container */}
              <div 
                className="relative w-full overflow-hidden rounded-lg"
                style={{ aspectRatio: item.aspectRatio || 1 }}
              >
                  {/* Media */}
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => e.currentTarget.pause()}
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Type indicator */}
                  {getTypeIcon(item.type)}

                  {/* Quality indicator */}
                  {item.metadata.quality === 'high' && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                      <span className="text-white text-xs font-medium">HD</span>
                    </div>
                  )}

                  {/* Bottom overlays */}
                  {showActions && (
                    <>
                      {/* Left: user avatar with optional verification */}
                      <div className="absolute bottom-2 left-2 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onFilterCreator?.(item.userId) }}
                          className="relative w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                          title="View this creator"
                        >
                          {item.userAvatar ? (
                            <img src={item.userAvatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <ProfileIcon size={18} className="text-white" />
                          )}
                          {String(item.userTier || '').toLowerCase() === 'contributor' || String(item.userTier || '').toLowerCase() === 'creator' ? (
                            <span className="absolute -right-1 -bottom-1 w-3 h-3 rounded-full bg-white text-black text-[9px] flex items-center justify-center">✓</span>
                          ) : null}
                        </button>
                      </div>

                      {/* Right: actions */}
                      <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                        {onDownload && (
                          <button
                            onClick={(e) => handleAction(() => onDownload(item), e)}
                            className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                            title="Download"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7,10 12,15 17,10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          </button>
                        )}
                        {onShare && (
                          <button
                            onClick={(e) => handleAction(() => onShare(item), e)}
                            className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                            title="Share"
                          >
                            <Share2 size={14} />
                          </button>
                        )}
                        {onRemix && (
                          <button
                            onClick={(e) => handleAction(() => onRemix(item), e)}
                            className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                            title="Remix"
                          >
                            <RemixIcon size={14} />
                          </button>
                        )}
                        {onLike && (
                          <button
                            onClick={(e) => handleAction(() => onLike(item), e)}
                            className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                            title="Like"
                          >
                            <Heart size={14} className={isLikedMedia ? 'text-red-500 fill-red-500' : 'text-white'} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={(e) => handleAction(() => onDelete(item), e)}
                            className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                            title="Delete"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                            </svg>
                          </button>
                        )}
                        {onGenerateCaption && (
                          <button
                            onClick={(e) => handleAction(() => onGenerateCaption(item), e)}
                            className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                            title="Generate Caption"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                        <div className="text-white/80 text-[11px] ml-1">{item.likes || 0}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
        })}
      </div>
    </div>
  )
}

export default MasonryMediaGrid
