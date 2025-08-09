import React, { useState, useRef } from 'react'
import { Share2, Download, Heart, FileText, Trash2, Pencil } from 'lucide-react'
import { UserMedia } from '../services/userMediaService'
import RemixIcon from './RemixIcon'

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
  showActions?: boolean
  className?: string
  isLikedMedia?: boolean // New prop to indicate if this is the liked media tab
}

const MasonryMediaGrid: React.FC<MasonryMediaGridProps> = ({
  media,
  columns = 3,
  onMediaClick,
  onDownload,
  onShare,
  onLike,
  onRemix,
  onDelete,
  onEdit,
  showActions = true,
  className = '',
  isLikedMedia = false // Default to false
}) => {
  const [hoveredMedia, setHoveredMedia] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)





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
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/40">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        </div>
        <p className="text-white/60 text-center">No media found</p>
      </div>
    )
  }

  return (
    <div className={`${className}`} ref={gridRef}>
      <div 
        className="grid gap-4 auto-rows-[10px]" 
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {media.map((item, index) => {
          // Calculate grid row span based on aspect ratio
          // Taller images (lower aspect ratio) need more rows
          const baseHeight = 200; // Base height in pixels
          const itemHeight = Math.ceil(baseHeight / (item.aspectRatio || 1));
          const rowSpan = Math.ceil(itemHeight / 10); // 10px per row
          
          return (
            <div
              key={item.id}
              className="relative group cursor-pointer bg-white/5 rounded-lg overflow-hidden transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]"
              style={{ 
                gridRowEnd: `span ${rowSpan}`,
              }}
              onMouseEnter={() => setHoveredMedia(item.id)}
              onMouseLeave={() => setHoveredMedia(null)}
              onClick={() => onMediaClick?.(item)}
            >
              {/* Media Container */}
              <div 
                className="relative w-full h-full overflow-hidden rounded-lg"
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

                  {/* Hover overlay */}
                  <div 
                    className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
                      hoveredMedia === item.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Action buttons - show on hover */}
                  {showActions && hoveredMedia === item.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex space-x-2">
                        {onDownload && (
                          <button
                            onClick={(e) => handleAction(() => onDownload(item), e)}
                            className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                          >
                            <Download size={16} />
                          </button>
                        )}

                        {onLike && (
                          <button
                            onClick={(e) => handleAction(() => onLike(item), e)}
                            className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                          >
                            <Heart 
                              size={16} 
                              className={isLikedMedia ? 'text-red-500 fill-red-500' : 'text-white'} 
                            />
                          </button>
                        )}

                        {onRemix && (
                          <button
                            onClick={(e) => handleAction(() => onRemix(item), e)}
                            className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                          >
                            <RemixIcon size={16} />
                          </button>
                        )}

                        {onShare && (
                          <button
                            onClick={(e) => handleAction(() => onShare(item), e)}
                            className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                          >
                            <Share2 size={16} />
                          </button>
                        )}

                        {onEdit && (
                          <button
                            onClick={(e) => handleAction(() => onEdit(item), e)}
                            className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            onClick={(e) => handleAction(() => onDelete(item), e)}
                            className="w-10 h-10 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
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
