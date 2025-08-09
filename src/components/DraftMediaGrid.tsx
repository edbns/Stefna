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
}

const DraftMediaGrid: React.FC<DraftMediaGridProps> = ({
  media,
  columns = 3,
  onMediaClick,
  onEdit,
  onDelete,
  showActions = true,
  className = ''
}) => {
  const [hoveredMedia, setHoveredMedia] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Generate masonry layout
  const generateMasonryLayout = (items: UserMedia[]): UserMedia[][] => {
    const columnHeights = new Array(columns).fill(0)
    const columnArrays: UserMedia[][] = Array.from({ length: columns }, () => [])
    
    items.forEach(item => {
      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      
      // Add item to shortest column
      columnArrays[shortestColumnIndex].push(item)
      
      // Update column height (aspect ratio affects visual height)
      // Lower aspect ratio (taller images) contribute more to column height
      columnHeights[shortestColumnIndex] += 1 / item.aspectRatio
    })
    
    return columnArrays
  }

  const masonryColumns = generateMasonryLayout(media)

  const handleAction = (action: () => void, event: React.MouseEvent) => {
    event.stopPropagation()
    action()
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
          <Pencil className="w-8 h-8 text-white/40" />
        </div>
        <p className="text-white/60 text-center">No drafts found</p>
      </div>
    )
  }

  return (
    <div className={`p-6 ${className}`} ref={gridRef}>
      <div className="flex gap-4 items-start justify-center">
        {masonryColumns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-4" style={{ flex: 1 }}>
            {column.map((item) => (
              <div
                key={item.id}
                className="relative group cursor-pointer bg-white/5 overflow-hidden transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]"
                onMouseEnter={() => setHoveredMedia(item.id)}
                onMouseLeave={() => setHoveredMedia(null)}
                onClick={() => onMediaClick?.(item)}
              >
                {/* Media Container */}
                <div 
                  className="relative overflow-hidden"
                  style={{ aspectRatio: item.aspectRatio }}
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
                          className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={(e) => handleAction(() => onDelete?.(item), e)}
                          className="w-10 h-10 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
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

export default DraftMediaGrid
