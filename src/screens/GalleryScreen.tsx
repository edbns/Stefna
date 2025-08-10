import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ArrowLeft, Heart, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import userMediaService, { UserMedia } from '../services/userMediaService'
import RemixIcon from '../components/RemixIcon'
import FullScreenMediaViewer from '../components/FullScreenMediaViewer'
import SlideSignupGate from '../components/SlideSignupGate'
import authService from '../services/authService'

interface GalleryScreenProps {
  media?: UserMedia[]
  title?: string
}

const GalleryScreen: React.FC<GalleryScreenProps> = ({ 
  media: propMedia = [], // Media passed as props
  title = "Gallery"
}) => {
  const navigate = useNavigate()
  const [hoveredMedia, setHoveredMedia] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [remixCounts, setRemixCounts] = useState<Record<string, number>>({})
  const gridRef = useRef<HTMLDivElement>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [gateOpen, setGateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [media, setMedia] = useState<UserMedia[]>(propMedia)
  const [creatorFilter, setCreatorFilter] = useState<string | null>(null)

  const mediaList: UserMedia[] = useMemo(() => {
    if (creatorFilter) {
      return media.filter(item => item.userId === creatorFilter)
    }
    return media
  }, [media, creatorFilter])

  // Load public media feed (always refresh)
  useEffect(() => {
    const loadPublicMedia = async () => {
      setIsLoading(true)
      try {
        // Load public media from database using new Netlify Function
        const response = await fetch('/.netlify/functions/getPublicFeed', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const result = await response.json()
          const dbMedia = result.media || []
          
          // Transform database media to UserMedia format for compatibility
          const transformedMedia = dbMedia.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            type: 'photo', // Default to photo for now
            url: item.result_url,
            prompt: item.prompt || 'AI Generated Content',
            aspectRatio: 4/3, // Default aspect ratio
            width: item.width || 800,
            height: item.height || 600,
            timestamp: item.created_at,
            tokensUsed: 2, // Default token usage
            likes: 0, // Will be updated when we implement likes
            remixCount: 0, // Will be updated when we implement remix counts
            isPublic: true, // All media from public feed is public
            allowRemix: item.allow_remix || false,
            tags: [],
            metadata: {
              quality: 'high',
              generationTime: 0,
              modelVersion: '1.0'
            }
          }))
          
          setMedia(transformedMedia)
        } else {
          console.error('Failed to load public media from database:', response.statusText)
          // Fallback to local service if database fails
          const allUsers = await userMediaService.getAllUsers()
          const publicMediaItems = []
          
          for (const userId of allUsers) {
            const userMedia = await userMediaService.getUserMedia(userId)
            const publicUserMedia = userMedia.filter(media => media.isPublic)
            publicMediaItems.push(...publicUserMedia)
          }
          
          const sortedMedia = publicMediaItems
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          
          setMedia(sortedMedia)
        }
      } catch (error) {
        console.error('Failed to load public media:', error)
        setMedia([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPublicMedia()
  }, [])

  // Initialize counts from incoming media
  useEffect(() => {
    const initialLikes: Record<string, number> = {}
    const initialRemixes: Record<string, number> = {}
    media.forEach(m => {
      initialLikes[m.id] = (m as any).likes_count ?? 0
      initialRemixes[m.id] = (m as any).remixes_count ?? 0
    })
    setLikeCounts(initialLikes)
    setRemixCounts(initialRemixes)
  }, [media])

  // Generate masonry layout
  const generateMasonryLayout = (items: UserMedia[]): UserMedia[][] => {
    const columns = 3
    const columnHeights = new Array(columns).fill(0)
    const columnArrays: UserMedia[][] = Array.from({ length: columns }, () => [])

    items.forEach(item => {
      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))

      // Add item to shortest column
      columnArrays[shortestColumnIndex].push(item)

      // Update column height (aspect ratio affects visual height)
      columnHeights[shortestColumnIndex] += 1 / (item.aspectRatio || 1)
    })

    return columnArrays
  }

  const masonryColumns = useMemo(() => generateMasonryLayout(mediaList), [mediaList])

  // Infinite scroll
  useEffect(() => {
    const gridElement = gridRef.current
    if (!gridElement) return

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = gridElement
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        // Load more content when near bottom
        console.log('Loading more content...')
      }
    }

    gridElement.addEventListener('scroll', onScroll)
    return () => gridElement.removeEventListener('scroll', onScroll)
  }, [])

  const handleBack = () => {
    navigate(-1)
  }

  const handleAction = (action: () => void, event: React.MouseEvent) => {
    event.stopPropagation()
    action()
  }

  const handleLike = async (media: UserMedia) => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      alert('Login Required: Please sign in to like media')
      navigate('/auth')
      return
    }
    
    const currentUserId = localStorage.getItem('stefna_guest_id') || 'guest-anon'
    const { liked, likes } = await userMediaService.toggleLike(media.id, currentUserId)
    setLikedIds(prev => {
      const updated = new Set(prev)
      if (liked) updated.add(media.id); else updated.delete(media.id)
      return updated
    })
    setLikeCounts(prev => ({ ...prev, [media.id]: likes }))
  }

  const handleRemix = async (media: UserMedia) => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      alert('Login Required: Please sign in to remix media')
      navigate('/auth')
      return
    }
    
    // Persist increment in a single place
    await userMediaService.incrementRemixCount(media.id)
    setRemixCounts(prev => ({ ...prev, [media.id]: (prev[media.id] ?? 0) + 1 }))
    // Redirect to home with remix payload
    navigate('/', { state: { remixUrl: media.url, remixPrompt: media.prompt || '', source: 'gallery' } })
  }

  const handleShare = async (media: UserMedia) => {
    if (!authService.isAuthenticated()) {
      alert('Login Required: Please sign in to share media')
      navigate('/auth')
      return
    }
    // In a real app, you would use a share API here
    alert(`Sharing media with ID: ${media.id}`)
    console.log('Sharing media with ID:', media.id)
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  if (media.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 z-50 flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/40">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </div>
          <p className="text-white/60 text-center">No media found in gallery</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <button
        onClick={handleBack}
        className="fixed top-6 left-6 z-50 flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Gallery Content */}
      <div className="p-6 pt-24">
        <div className="flex gap-1 justify-center" ref={gridRef}>
          {masonryColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-1" style={{ flex: 1 }}>
              {column.map((item) => (
                <div
                  key={item.id}
                  className="relative cursor-pointer bg-white/5 overflow-hidden"
                  onMouseEnter={() => setHoveredMedia(item.id)}
                  onMouseLeave={() => setHoveredMedia(null)}
                  onClick={() => {
                    const indexInList = mediaList.findIndex(m => m.id === item.id)
                    setViewerIndex(Math.max(0, indexInList))
                    setViewerOpen(true)
                  }}
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

                    {/* Type indicator */}
                    {getTypeIcon(item.type)}

                    {/* Bottom overlays matching home MediaCard */}
                    {/* Creator Avatar - Bottom Left */}
                    <div className="absolute bottom-3 left-3">
                      <button
                        onClick={(e) => handleAction(() => console.log('Filter by creator'), e)}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all duration-300"
                        title={`Creator`}
                      >
                        <span className="text-white/80 text-xs font-medium">U</span>
                      </button>
                    </div>

                    {/* CTA Buttons - Bottom Right */}
                    <div className="absolute bottom-3 right-3 flex items-center space-x-4">
                      {/* Share Button */}
                      <button
                        onClick={(e) => handleAction(() => handleShare(item), e)}
                        className="w-8 h-8 flex items-center justify-center focus:outline-none active:transform-none"
                        title="Share"
                      >
                        <Share2 size={16} className="text-white" />
                      </button>

                      {/* Like Button */}
                      <div className="flex items-center space-x-0.5">
                        {likeCounts[item.id] > 0 && (
                          <span className="text-white/60 text-sm">{likeCounts[item.id]}</span>
                        )}
                          <button
                            onClick={(e) => handleAction(() => handleLike(item), e)}
                          className="w-8 h-8 flex items-center justify-center focus:outline-none active:transform-none"
                          title="Like"
                        >
                          <Heart 
                            size={16} 
                            className={`${likedIds.has(item.id) ? 'text-red-500 fill-red-500' : 'text-white'}`} 
                          />
                        </button>
                      </div>

                      {/* Remix Button */}
                      <div className="flex items-center space-x-0.5">
                        <div className="relative">
                          {remixCounts[item.id] > 0 && (
                            <span className="text-white/60 text-sm mr-0.5">{remixCounts[item.id]}</span>
                          )}
                          <button
                            onClick={(e) => handleAction(() => handleRemix(item), e)}
                            className="w-8 h-8 flex items-center justify-center focus:outline-none active:transform-none"
                            title="REMIX"
                          >
                            <RemixIcon size={14} className="text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <SlideSignupGate isOpen={gateOpen} onClose={() => setGateOpen(false)} onSignup={() => navigate('/auth')} />
      {/* Full-screen Viewer */}
      <FullScreenMediaViewer
        isOpen={viewerOpen}
        media={mediaList}
        startIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
        onLike={(m) => handleLike(m)}
        onRemix={(m) => { setViewerOpen(false); navigate('/', { state: { remixUrl: m.url, remixPrompt: m.prompt || '', source: 'gallery' } }) }}
        onShowAuth={() => navigate('/auth')}
      />
    </div>
  )
}

export default GalleryScreen
