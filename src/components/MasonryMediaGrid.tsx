import React, { useRef, useMemo } from 'react'
import { UserMedia } from '../services/userMediaService'
import RemixIcon from './RemixIcon'
import { MediaCard as SpinnerCard } from './ui/Toasts'
import LazyImage from './LazyImage'
import { getCardChips, formatRemixCount } from '../utils/mediaCardHelpers'

interface MasonryMediaGridProps {
  media: UserMedia[]
  columns?: number
  onMediaClick?: (media: UserMedia) => void
  onDownload?: (media: UserMedia) => void
  onRemix?: (media: UserMedia) => void
  onEdit?: (media: UserMedia) => void
  onDelete?: (media: UserMedia) => void
  onGenerateCaption?: (media: UserMedia) => void
  showActions?: boolean
  className?: string
  // Selection props
  isSelectionMode?: boolean
  selectedMediaIds?: Set<string>
  onToggleSelection?: (mediaId: string) => void
  // Show auth modal for logged out users
  onShowAuth?: () => void
  isLoggedIn?: boolean
}

const MasonryMediaGrid: React.FC<MasonryMediaGridProps> = ({
  media,
  onMediaClick,
  onDownload,
  onRemix,
  onEdit,
  onDelete,
  showActions = true,
  className = '',
  // Selection props
  isSelectionMode = false,
  selectedMediaIds = new Set(),
  onToggleSelection,
  // Auth props
  onShowAuth,
  isLoggedIn = true
}) => {
  const gridRef = useRef<HTMLDivElement>(null)

  // Generate true masonry layout based on aspect ratios
  const masonryColumns = useMemo(() => {
    if (media.length === 0) return []
    
    // Always use exactly 3 columns for consistent layout
    const numColumns = 3
    const columnArrays: UserMedia[][] = Array.from({ length: numColumns }, () => [])
    
    // Simple distribution: put each item in the shortest column
    media.forEach((item) => {
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
                        <LazyImage 
                          src={item.url} 
                          alt={item.prompt} 
                          className="w-full h-auto opacity-50"
                          quality={60} // Lower quality for generating state
                          format="auto"
                        />
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
                      <LazyImage
                        src={item.url}
                        alt={item.prompt}
                        priority={media.findIndex(m => m.id === item.id) < 6} // First 6 images load immediately
                        quality={85} // High quality for main images
                        format="auto"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="w-full h-auto object-cover"
                      />
                  )}

                  {/* Type indicator */}
                  {getTypeIcon(item.type)}

                  {/* New chip-based overlay system */}
                  {(() => {
                    const { modeChip, detailChip } = getCardChips(item)
                    const remixText = formatRemixCount(item.remixCount)
                    
                    return (
                      <>
                        {/* Mode and Detail Chips - Top */}
                        <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 opacity-100 transition-opacity duration-300">
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
                            title={detailChip}
                          >
                            {detailChip.length > 15 ? `${detailChip.substring(0, 15)}...` : detailChip}
                          </span>
                        </div>

                        {/* Actions - Bottom */}
                        {showActions && (
                          <>
                            {/* Edit Button - Bottom Right (Primary CTA) */}
                            {onEdit && (
                              <div className="absolute bottom-2 right-2 opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isLoggedIn) {
                                      onShowAuth?.()
                                      return
                                    }
                                    onEdit(item)
                                  }}
                                  className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all duration-300 hover:scale-105"
                                  title="Edit this creation"
                                  aria-label="Edit this media"
                                >
                                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                              </div>
                            )}

                            {/* Remix Button - Bottom Right (Secondary CTA) */}
                            {onRemix && (
                              <div className="absolute bottom-2 right-12 opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isLoggedIn) {
                                      onShowAuth?.()
                                      return
                                    }
                                    onRemix(item)
                                  }}
                                  className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all duration-300 hover:scale-105"
                                  title="Remix this creation"
                                  aria-label="Remix this media"
                                >
                                  <RemixIcon size={15} className="text-white" />
                                </button>
                              </div>
                            )}

                            {/* Remix Count - Bottom Left (Passive metric) */}
                            {remixText && (
                              <div className="absolute bottom-2 left-2 opacity-100 transition-opacity duration-300">
                                <span 
                                  className="text-white/70 text-xs bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm"
                                  aria-label={remixText}
                                >
                                  {remixText}
                                </span>
                              </div>
                            )}

                            {/* Additional actions (download, delete) - Top Right */}
                            {(onDownload || onDelete) && (
                              <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {onDownload && (
                                  <button
                                    onClick={(e) => handleAction(() => onDownload(item), e)}
                                    className="w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                                    title="Download"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                      <polyline points="7,10 12,15 17,10"/>
                                      <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={(e) => handleAction(() => onDelete(item), e)}
                                    className="w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-500/80 transition-all duration-200"
                                    title="Delete"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
                                      <polyline points="3,6 5,6 21,6"/>
                                      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )
                  })()}
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
