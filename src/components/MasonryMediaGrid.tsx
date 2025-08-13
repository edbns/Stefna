import React, { useRef, useMemo } from 'react'
import { Share2, Heart, FileText } from 'lucide-react'
import { UserMedia } from '../services/userMediaService'
import RemixIcon from './RemixIcon'
import ProfileIcon from './ProfileIcon'
import { MediaCard as SpinnerCard } from './ui/Toasts'

interface MasonryMediaGridProps {
  media: UserMedia[]
  columns?: number
  onMediaClick?: (media: UserMedia) => void
  onDownload?: (media: UserMedia) => void
  onShare?: (media: UserMedia) => void
  onUnshare?: (media: UserMedia) => void
  onLike?: (media: UserMedia) => void
  onRemix?: (media: UserMedia) => void
  onDelete?: (media: UserMedia) => void
  onEdit?: (media: UserMedia) => void
  onFilterCreator?: (userId: string) => void
  onGenerateCaption?: (media: UserMedia) => void
  showActions?: boolean
  className?: string
  isLikedMedia?: boolean
  // Selection props
  isSelectionMode?: boolean
  selectedMediaIds?: Set<string>
  onToggleSelection?: (mediaId: string) => void
  hideRemixCount?: boolean
  // Profile mode - hide user avatars
  hideUserAvatars?: boolean
  // Home page mode - hide share button
  hideShareButton?: boolean
  // Home page mode - hide like button
  hideLikeButton?: boolean
}

const MasonryMediaGrid: React.FC<MasonryMediaGridProps> = ({
  media,
  columns = 3,
  onMediaClick,
  onDownload,
  onShare,
  onUnshare,
  onLike,
  onRemix,
  onDelete,
  onFilterCreator,
  onGenerateCaption,
  showActions = true,
  className = '',
  isLikedMedia = false,
  // Selection props
  isSelectionMode = false,
  selectedMediaIds = new Set(),
  onToggleSelection,
  hideRemixCount = false,
  // Profile mode - hide user avatars
  hideUserAvatars = false,
  // Home page mode - hide share button
  hideShareButton = false,
  // Home page mode - hide like button
  hideLikeButton = false
}) => {
  const gridRef = useRef<HTMLDivElement>(null)

  // Generate true masonry layout based on aspect ratios
  const masonryColumns = useMemo(() => {
    if (media.length === 0) return []
    
    // Always use exactly 3 columns for consistent layout
    const numColumns = 3
    const columnArrays: UserMedia[][] = Array.from({ length: numColumns }, () => [])
    
    // Simple distribution: put each item in the shortest column
    media.forEach((item, index) => {
      // Find the shortest column
      const columnHeights = columnArrays.map(column => 
        column.reduce((height, mediaItem) => height + (1 / mediaItem.aspectRatio), 0)
      )
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      
      // Add item to shortest column
      columnArrays[shortestColumnIndex].push(item)
    })
    
    return columnArrays
  }, [media])

  const handleAction = (action: () => void, event: React.MouseEvent) => {
    event.stopPropagation()
    action()
  }

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
        className="flex gap-2 mx-auto" 
        style={{ maxWidth: '1200px' }}
      >
        {masonryColumns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex-1 flex flex-col gap-2 min-w-0">
            {column.map((item) => (
              <div
                key={item.id}
                className="relative group cursor-pointer bg-white/5 overflow-hidden"
                onClick={() => onMediaClick?.(item)}
              >
                {/* Media Container - No fixed aspect ratio, let content determine height */}
                <div className="relative w-full overflow-hidden">
                  {/* Selection Checkbox */}
                  {isSelectionMode && onToggleSelection && (
                    <div className="absolute top-2 left-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleSelection(item.id)
                        }}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedMediaIds.has(item.id)
                            ? 'bg-white border-white'
                            : 'bg-black/60 border-white/60 hover:border-white'
                        }`}
                        title={selectedMediaIds.has(item.id) ? 'Deselect' : 'Select'}
                      >
                        {selectedMediaIds.has(item.id) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-black">
                            <polyline points="20,6 9,17 4,12"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Media */}
                  {/* If item is processing, show spinner card overlay */}
                  {item.status === 'processing' ? (
                    <SpinnerCard
                      kind={item.type === 'video' ? 'video' : 'image'}
                      status="processing"
                      src={item.thumbnailUrl || item.url}
                      onClick={() => onMediaClick?.(item)}
                    />
                  ) : item.status === 'failed' ? (
                    <div className="relative">
                      {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-auto object-cover opacity-50" muted />
                      ) : (
                        <img src={item.url} alt={item.prompt} className="w-full h-auto object-cover opacity-50" />
                      )}
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="px-3 py-1 rounded-full bg-red-600/80 text-white text-xs font-semibold">Failed</div>
                      </div>
                    </div>
                  ) : item.type === 'video' ? (
                      <video
                        src={item.url}
                        className="w-full h-auto object-cover"
                        muted
                        loop
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                      />
                  ) : (
                      <img
                        src={item.url}
                        alt={item.prompt}
                        className="w-full h-auto object-cover"
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
                        {hideUserAvatars ? (
                          <ProfileIcon size={18} className="text-white" />
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onFilterCreator?.(item.userId) }}
                            className="relative w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors group"
                            title={`View ${item.userId}'s content`}
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
                        )}
                        {/* Username tooltip on hover - only show when not hiding avatars and userId exists */}
                        {!hideUserAvatars && item.userId && (
                          <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {item.userId}
                          </div>
                        )}
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

                        {onRemix && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => handleAction(() => onRemix(item), e)}
                              className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                              title="Remix"
                            >
                              <RemixIcon size={14} />
                            </button>
                            {!hideRemixCount && (
                              <span className="text-white/80 text-xs font-medium">{item.remixCount || 0}</span>
                            )}
                          </div>
                        )}
                        {onShare && !hideShareButton && (
                          <button
                            onClick={(e) => handleAction(() => onShare(item), e)}
                            className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 btn-optimized"
                            title="Share"
                          >
                            <Share2 size={14} className="text-white" />
                          </button>
                        )}
                        {onLike && !hideLikeButton && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => handleAction(() => onLike(item), e)}
                              className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 btn-optimized"
                              title="Like"
                            >
                              <Heart size={14} className={isLikedMedia ? 'text-red-500 fill-red-500' : 'text-white'} />
                            </button>
                            <span className="text-white/80 text-xs font-medium">{item.likes || 0}</span>
                          </div>
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
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MasonryMediaGrid
