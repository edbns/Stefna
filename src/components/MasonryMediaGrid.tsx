import React, { useRef, useMemo } from 'react'
import { UserMedia } from '../services/userMediaService'
import PresetTag from './PresetTag'
// RemixIcon removed - no more remix functionality
import { MediaCard as SpinnerCard } from './ui/Toasts'
// LazyImage removed - using simple img tags for better performance
// formatRemixCount removed - no more remix functionality

interface MasonryMediaGridProps {
  media: UserMedia[]
  columns?: number
  onMediaClick?: (media: UserMedia) => void
  onDownload?: (media: UserMedia) => void
  onShare?: (media: UserMedia) => void
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
  onPresetTagClick?: (presetType: string) => void
}

const MasonryMediaGrid: React.FC<MasonryMediaGridProps> = ({
  media,
  onMediaClick,
  onDownload,
  onShare,
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
  // Filter functionality
  onPresetTagClick
}) => {
  const gridRef = useRef<HTMLDivElement>(null)
  
  // 🔍 DEBUG: Log preset data for first few items
  React.useEffect(() => {
    if (media.length > 0) {
      console.log('🔍 [MasonryMediaGrid] Media items preset data:', JSON.stringify(media.slice(0, 3).map(item => ({
        id: item.id,
        presetKey: item.metadata?.presetKey || item.presetKey,
        type: item.metadata?.presetType || item.type,
        metadata: item.metadata
      })), null, 2));
    }
  }, [media]);

  // Generate true masonry layout based on aspect ratios
  const masonryColumns = useMemo(() => {
    if (media.length === 0) return []
    
    // Use the columns prop or default to 3
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
                                              <img 
                        src={item.url} 
                        alt={`Generated ${item.type} - ${item.prompt?.substring(0, 50) || 'AI Content'}...`}
                        className="w-full h-auto opacity-50 object-cover"
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
                      <img
                        src={item.url}
                        alt=""
                        className="w-full h-auto object-cover"
                      />
                  )}



                  {/* Simplified overlay system - remix removed for cleaner focus */}
                  {(() => {
                    return (
                      <>

                        {/* Preset Tag - Bottom Left */}
                        {(item.metadata?.presetKey || item.presetKey) && (
                          <div className="absolute bottom-2 left-2">
                            <PresetTag 
                              presetKey={item.metadata?.presetKey || item.presetKey} 
                              type={item.metadata?.presetType}
                              size="sm"
                              clickable={!!onPresetTagClick}
                              onClick={(e) => {
                                e.stopPropagation() // Prevent click from bubbling to media card
                                if (onPresetTagClick) {
                                  // Use the metadata.presetType field from new dedicated tables
                                  let presetType = item.metadata?.presetType;
                                  
                                  // Fallback logic for items that might not have the presetType field
                                  if (!presetType) {
                                    if (item.presetKey?.includes('ghibli') || item.presetKey?.includes('ghibli_reaction')) {
                                      presetType = 'ghibli-reaction';
                                    } else if (item.presetKey?.includes('emotion') || item.presetKey?.includes('emotion_mask')) {
                                      presetType = 'emotion-mask';
                                    } else if (item.presetKey?.includes('neo') || item.presetKey?.includes('neo_glitch')) {
                                      presetType = 'neo-glitch';
                                    } else if (item.presetKey?.includes('preset') || item.presetKey?.includes('professional')) {
                                      presetType = 'presets';
                                    } else if (item.presetKey?.includes('custom') || item.prompt) {
                                      presetType = 'custom-prompt';
                                    } else if (item.presetKey?.includes('story') || item.presetKey === 'auto' || item.presetKey === 'adventure' || item.presetKey === 'romance' || item.presetKey === 'mystery' || item.presetKey === 'comedy' || item.presetKey === 'fantasy' || item.presetKey === 'travel') {
                                      presetType = 'story-time';
                                    } else {
                                      presetType = 'presets'; // Default fallback
                                    }
                                  }
                                  
                                  onPresetTagClick(presetType)
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* Actions - Bottom */}
                        {showActions && (
                          <>
                            {/* Edit Button - Bottom Right (Primary CTA) */}
                            {/* Removed onEdit prop, so this block is removed */}

                            {/* Remix functionality removed - focus on personal creativity */}



                            {/* Additional actions (share, download, delete) - Top Right */}
                            {(onShare || onDownload || onDelete) && (
                              <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {onShare && (
                                  <button
                                    onClick={(e) => handleAction(() => onShare(item), e)}
                                    className="w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                                    title="Share to social media"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
                                      <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                                    </svg>
                                  </button>
                                )}
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
