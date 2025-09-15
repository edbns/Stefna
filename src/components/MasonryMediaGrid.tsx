import React, { useRef, useMemo } from 'react'
import { UserMedia } from '../services/userMediaService'
import { optimizeFeedImage } from '../utils/cloudinaryOptimization'
import PresetTag from './PresetTag'
// RemixIcon removed - no more remix functionality
import { MediaCard as SpinnerCard } from './ui/Toasts'
// LazyImage removed - using simple img tags for better performance
// formatRemixCount removed - no more remix functionality
import { getPresetTypeForFilter } from '../utils/presetMapping'

interface MasonryMediaGridProps {
  media: UserMedia[]
  columns?: number
  onMediaClick?: (media: UserMedia) => void
  onDownload?: (media: UserMedia) => void
  // onRemix removed - no more remix functionality
  onDelete?: (media: UserMedia) => void
  onGenerateCaption?: (media: UserMedia) => void
  showActions?: boolean
  className?: string
  // Infinite scroll support
  onLastItemRef?: (ref: HTMLDivElement | null) => void
  // Selection props
  isSelectionMode?: boolean
  selectedMediaIds?: Set<string>
  onToggleSelection?: (mediaId: string) => void
  // Show auth modal for logged out users
  onShowAuth?: () => void
  isLoggedIn?: boolean
  // Loading states for actions
  deletingMediaIds?: Set<string>
  // Filter functionality
  // onPresetTagClick removed - tags are no longer clickable
  // Likes functionality
  onToggleLike?: (media: UserMedia) => void
  userLikes?: Record<string, boolean>
}

const MasonryMediaGrid: React.FC<MasonryMediaGridProps> = ({
  media,
  columns,
  onMediaClick,
  onDownload,
  // onRemix removed
  onDelete,
  showActions = true,
  className = '',
  // Infinite scroll support
  onLastItemRef,
  // Selection props
  isSelectionMode = false,
  selectedMediaIds = new Set(),
  onToggleSelection,
  // Auth props
  onShowAuth,
  isLoggedIn = true,
  // Loading states for actions
  deletingMediaIds = new Set(),
  // Likes functionality
  onToggleLike,
  userLikes = {}
}) => {
  const gridRef = useRef<HTMLDivElement>(null)
  
  // Generate true masonry layout based on aspect ratios
  const masonryColumns = useMemo(() => {
    if (media.length === 0) return []
    
    // Use the columns prop or default to 3
    const numColumns = columns || 3
    const columnArrays: UserMedia[][] = Array.from({ length: numColumns }, () => [])
    
    // Simple distribution: put each item in the shortest column
    media.forEach((item) => {
      // Find the shortest column
      const columnHeights = columnArrays.map(column => 
        column.reduce((height, mediaItem) => {
          return height + 1 // Simple height calculation
        }, 0)
      )
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      
      // Add item to shortest column
      columnArrays[shortestColumnIndex].push(item)
    })
    
    return columnArrays
  }, [media, columns])

  const handleAction = (action: () => void, event: React.MouseEvent) => {
    event.stopPropagation()
    action()
  }



  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
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
        className="flex gap-1 w-full" 
        style={{ maxWidth: '100%' }}
      >
        {masonryColumns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex-1 flex flex-col gap-1 min-w-0">
            {column.map((item, itemIndex) => {
              // Find if this is the last item across all columns
              const isLastItem = columnIndex === masonryColumns.length - 1 && 
                                itemIndex === column.length - 1
              
              return (
                <div
                  key={item.id}
                  className="relative group cursor-pointer bg-white/5 overflow-hidden"
                  onClick={() => onMediaClick?.(item)}
                  ref={isLastItem ? onLastItemRef : undefined}
                  data-last-item={isLastItem ? "true" : undefined}
                >
                {/* Media Container - Let images display naturally */}
                <div 
                  className="relative w-full overflow-hidden"
                >
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
                      src={optimizeFeedImage(item.thumbnailUrl || item.url)}
                      onClick={() => onMediaClick?.(item)}
                    />
                  ) : item.status === 'failed' ? (
                    <div className="relative">
                      {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-auto object-cover opacity-50" muted />
                                            ) : (
                        <img
                          src={optimizeFeedImage(item.url)} 
                          alt={`Generated ${item.type} - ${item.prompt?.substring(0, 50) || 'AI Content'}...`}
                          className="w-full h-auto object-cover"
                          loading="lazy"
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
                  ) : (item.type as any) === 'story-time' && item.metadata?.videoResults && item.metadata.videoResults.length > 0 ? (
                      // Story Time with videos - show first video as main content
                      <div className="relative">
                        <video
                          src={item.metadata.videoResults[0]?.videoUrl || item.finalUrl}
                          className="w-full h-auto object-cover"
                          muted
                          loop
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => e.currentTarget.pause()}
                        />
                        {/* Video count indicator */}
                        {item.metadata.videoResults.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-white text-xs font-semibold">
                            {item.metadata.videoResults.length} videos
                          </div>
                        )}
                      </div>
                  ) : (item.type as any) === 'story-time' && (item.status as any) === 'processing' ? (
                      // Story Time processing - show progress with photo
                      <div className="relative">
                        <img
                          src={optimizeFeedImage(item.url)}
                          alt="Story Time processing"
                          className="w-full h-auto object-cover opacity-75"
                          loading="lazy"
                        />
                        {/* Processing overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
                            <div className="text-sm font-semibold">Generating Videos...</div>
                            <div className="text-xs opacity-75">Story Time in progress</div>
                          </div>
                        </div>
                      </div>
                  ) : (
                    <img
                      src={optimizeFeedImage(item.url)} 
                      alt={`Generated ${item.type} - ${item.prompt?.substring(0, 50) || 'AI Content'}...`}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  )}



                  {/* Simplified overlay system - remix removed for cleaner focus */}
                  {(() => {
                    return (
                      <>

                        {/* Preset Tag */}
                        <div className="absolute bottom-2 left-2 flex gap-1">
                          <PresetTag 
                            presetKey={item.metadata?.presetKey || item.presetKey} 
                            type={item.metadata?.presetType || item.type}
                            item={item}
                            size="sm"
                            clickable={false}
                            showPresetKey={true}
                            onClick={() => {
                              // Tags are disabled - no filtering functionality
                            }}
                          />
                          
                          {/* 3D Tag - Show if media has 3D model */}
                          {(item.obj_url || item.gltf_url) && (
                            <div className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-white text-xs font-medium">
                              3D
                            </div>
                          )}
                        </div>

                        {/* Actions - Bottom */}
                        {showActions && (
                          <>
                            {/* Edit Button - Bottom Right (Primary CTA) */}
                            {/* Removed onEdit prop, so this block is removed */}

                            {/* Remix functionality removed - focus on personal creativity */}



                            {/* Like Button - Bottom Right */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isLoggedIn) {
                                onShowAuth?.();
                                return;
                              }
                              onToggleLike?.(item);
                            }}
                            className={`flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all duration-200 ${
                              userLikes[`${(item.metadata?.presetType || item.type || 'presets').replace(/-/g, '_')}:${item.id}`] ? 'text-red-500' : ''
                            }`}
                            title={userLikes[`${(item.metadata?.presetType || item.type || 'presets').replace(/-/g, '_')}:${item.id}`] ? 'Unlike' : 'Like'}
                          >
                            <svg 
                              width="14" 
                              height="14" 
                              viewBox="0 0 24 24" 
                              fill={userLikes[`${(item.metadata?.presetType || item.type || 'presets').replace(/-/g, '_')}:${item.id}`] ? 'currentColor' : 'none'} 
                              stroke="currentColor" 
                              strokeWidth="2"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <span className="text-xs font-medium">{item.likes_count || 0}</span>
                          </button>
                        </div>

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
                                    disabled={deletingMediaIds.has(item.id)}
                                  >
                                    {deletingMediaIds.has(item.id) ? (
                                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
                                        <path d="M3 6h18"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                      </svg>
                                    )}
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
            )})}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MasonryMediaGrid
