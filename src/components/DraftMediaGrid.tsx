import React, { useState, useRef } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { UserMedia } from '../services/userMediaService'

interface DraftMediaGridProps {
  media: UserMedia[]
  columns?: number
  onMediaClick?: (media: UserMedia) => void
  onEdit?: (media: UserMedia) => void
  onDelete?: (media: UserMedia) => void
  showActions?: boolean
  className?: string
  // Loading states for actions
  deletingMediaIds?: Set<string>
}

const DraftMediaGrid: React.FC<DraftMediaGridProps> = ({
  media,
  columns = 3,
  onMediaClick,
  onEdit,
  onDelete,
  showActions = true,
  className = '',
  deletingMediaIds = new Set()
}) => {
  const [hoveredMedia, setHoveredMedia] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // CSS columns will handle the masonry layout automatically

  const handleAction = (action: () => void, event: React.MouseEvent) => {
    event.stopPropagation()
    action()
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <Pencil size={48} className="text-white/40" />
        </div>
        <p className="text-white/60 text-lg text-center">No drafts found</p>
        <p className="text-white/40 text-sm text-center mt-2">Your draft media will appear here</p>
      </div>
    )
  }

  return (
    <div className={`${className}`} ref={gridRef}>
      <div 
        className="columns-3 gap-1 mx-auto" 
        style={{ maxWidth: '1200px' }}
      >
        {media.map((item) => (
          <div
            key={item.id}
            className="break-inside-avoid mb-1 relative group cursor-pointer bg-white/5 rounded-lg overflow-hidden"
            onMouseEnter={() => setHoveredMedia(item.id)}
            onMouseLeave={() => setHoveredMedia(null)}
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

                  {/* Draft Badge */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                    <span className="text-white text-xs font-medium">Draft</span>
                  </div>

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
                        <button
                          onClick={(e) => handleAction(() => onEdit?.(item), e)}
                          className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 btn-optimized"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={(e) => handleAction(() => onDelete?.(item), e)}
                          className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 btn-optimized"
                          title="Delete"
                          disabled={deletingMediaIds.has(item.id)}
                        >
                          {deletingMediaIds.has(item.id) ? (
                            <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
        ))}
      </div>
    </div>
  )
}

export default DraftMediaGrid
