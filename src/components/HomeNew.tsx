import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, ArrowUp, Filter } from 'lucide-react'
import { authenticatedFetch } from '../utils/apiClient'
import authService from '../services/authService'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'
import MasonryMediaGrid from './MasonryMediaGrid'
import interactionService from '../services/interactionService'
import type { UserMedia } from '../services/userMediaService'
import NotificationBell from './NotificationBell'
import ProfileIcon from './ProfileIcon'

const HomeNew: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null)
  const [alignOffset, setAlignOffset] = useState(0)
  const [mediaPixelWidth, setMediaPixelWidth] = useState(0)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isVideoPreview, setIsVideoPreview] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [activeTab, setActiveTab] = useState<'prompt' | 'presets'>('prompt')
  const [quota, setQuota] = useState<{ daily_used: number; daily_limit: number; weekly_used: number; weekly_limit: number } | null>(null)
  const [feed, setFeed] = useState<UserMedia[]>([])
  const [isLoadingFeed, setIsLoadingFeed] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentFilter, setCurrentFilter] = useState<'all' | 'images' | 'videos'>('all')
  const [navGenerating, setNavGenerating] = useState(false)
  const [shareToFeed, setShareToFeed] = useState(false)
  const [allowRemix, setAllowRemix] = useState(false)
  const [generateTwo, setGenerateTwo] = useState(false)
  const [userMenu, setUserMenu] = useState(false)

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setIsVideoPreview(file.type.startsWith('video/'))
    setSelectedFile(file)
    setIsComposerOpen(true)
  }

  const measure = () => {
    const c = containerRef.current
    const m = mediaRef.current as any
    if (!c || !m) return
    const ch = c.getBoundingClientRect().height
    const mr = m.getBoundingClientRect()
    const gapTop = Math.max(0, (ch - mr.height) / 2)
    setAlignOffset(gapTop)
    setMediaPixelWidth(mr.width)
  }

  useEffect(() => {
    if (!isComposerOpen) return
    const onR = () => measure()
    window.addEventListener('resize', onR)
    const t = setTimeout(measure, 50)
    return () => {
      window.removeEventListener('resize', onR)
      clearTimeout(t)
    }
  }, [isComposerOpen, previewUrl])

  // Initial auth state and feed load
  useEffect(() => {
    setIsAuthenticated(Boolean(authService.getToken()))
    const loadFeed = async () => {
      try {
        setIsLoadingFeed(true)
        const res = await fetch('/.netlify/functions/getPublicFeed')
        if (res.ok) {
          const { media } = await res.json()
          const mapped: UserMedia[] = (media || []).map((item: any): UserMedia => ({
            id: item.id,
            userId: item.user_id,
            type: item.mode === 'v2v' ? 'video' : 'photo',
            url: item.result_url || item.url,
            thumbnailUrl: undefined,
            prompt: item.prompt || '',
            style: undefined,
            aspectRatio: item.width && item.height ? item.width / Math.max(1, item.height) : 4 / 3,
            width: item.width || 800,
            height: item.height || 600,
            timestamp: item.created_at,
            originalMediaId: item.parent_asset_id || undefined,
            tokensUsed: item.mode === 'v2v' ? 5 : 2,
            likes: item.likes_count || 0,
            remixCount: item.remixes_count || 0,
            isPublic: true,
            allowRemix: Boolean(item.allow_remix),
            tags: [],
            metadata: { quality: 'high', generationTime: 0, modelVersion: '1.0' },
          }))
          setFeed(mapped)
        }
      } catch (e) {
        console.error('Failed to load feed', e)
      } finally {
        setIsLoadingFeed(false)
      }
    }
    loadFeed()
  }, [])

  // Fetch server-side quota when composer opens
  useEffect(() => {
    const loadQuota = async () => {
      try {
        if (!isComposerOpen) return
        const token = authService.getToken()
        if (!token) {
          setQuota(null)
          return
        }
        const res = await authenticatedFetch('/.netlify/functions/getQuota', { method: 'GET' })
        if (res.ok) {
          const q = await res.json()
          setQuota(q)
        } else if (res.status === 401) {
          setQuota(null)
        }
      } catch (e) {
        console.error('Failed to load quota', e)
        setQuota(null)
      }
    }
    loadQuota()
  }, [isComposerOpen])

  const closeComposer = () => {
    setIsComposerOpen(false)
    setPrompt('')
    setPreviewUrl(null)
  }

  const handleGenerate = async () => {
    if (!previewUrl || !prompt.trim()) return
    const token = authService.getToken()
    if (!token) {
      navigate('/auth')
      return
    }
    // Close composer immediately and show progress on avatar
    setIsGenerating(true)
    setIsComposerOpen(false)
    setNavGenerating(true)
    try {
      // Enforce server-side quota and generate via aimlApi
      // Ensure source is uploaded to Cloudinary
      let sourceUrl = previewUrl!
      if (selectedFile) {
        const up = await uploadToCloudinary(selectedFile, `users/${authService.getCurrentUser()?.id || 'me'}`)
        sourceUrl = up.secure_url
      }
      const body = {
        prompt: prompt.trim(),
        source_url: sourceUrl,
        resource_type: isVideoPreview ? 'video' : 'image',
        source: 'custom',
        visibility: shareToFeed ? 'public' : 'private',
        allow_remix: shareToFeed ? allowRemix : false,
        num_variations: generateTwo ? 2 : 1,
      }
      const res = await authenticatedFetch('/.netlify/functions/aimlApi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Generation failed', err)
        setIsGenerating(false)
        setNavGenerating(false)
        return
      }
      // Success: stop progress
      setIsGenerating(false)
      setNavGenerating(false)
      // Optionally refresh quota
      try {
        const qRes = await authenticatedFetch('/.netlify/functions/getQuota')
        if (qRes.ok) setQuota(await qRes.json())
      } catch {}
    } catch (e) {
      console.error('Generate error', e)
      setIsGenerating(false)
      setNavGenerating(false)
    }
  }

  const handlePresetClick = async (presetName: string) => {
    const token = authService.getToken()
    if (!token) { navigate('/auth'); return }
    // Use preset text seed, then immediately generate
    const seed = `${presetName} style`
    setPrompt((prev) => prev || seed)
    await handleGenerate()
  }

  const handleLike = async (media: UserMedia) => {
    if (!authService.getToken()) {
      navigate('/auth')
      return
    }
    const res = await interactionService.toggleLike(media.id)
    if (res.success) {
      setFeed((cur) => cur.map((m) => (m.id === media.id ? { ...m, likes: res.likeCount ?? m.likes } : m)))
    }
  }

  const handleShare = async (media: UserMedia) => {
    if (!authService.getToken()) {
      navigate('/auth')
      return
    }
    const r = await fetch('/.netlify/functions/recordShare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authService.getToken()}` },
      body: JSON.stringify({ mediaId: media.id, shareType: 'public' }),
    })
    if (r.ok) {
      // Optionally refetch feed counts later
    }
  }

  const handleRemix = (media: UserMedia) => {
    if (!media.allowRemix) return
    if (!authService.getToken()) {
      navigate('/auth')
      return
    }
    setPreviewUrl(media.url)
    setIsVideoPreview(media.type === 'video')
    setSelectedFile(null)
    setIsComposerOpen(true)
    setActiveTab('prompt')
    setPrompt(media.prompt || '')
  }

  // Apply filter to feed
  const filteredFeed = feed.filter((item) => {
    if (currentFilter === 'images') return item.type === 'photo'
    if (currentFilter === 'videos') return item.type === 'video'
    return true
  })

  // Local floating notifications in Home
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; message?: string; type: 'processing'|'success'|'warning'|'error'|'complete'; timestamp: string }>>([])
  const addNotification = (title: string, message = '', type: 'processing'|'success'|'warning'|'error'|'complete' = 'success') => {
    const n = { id: Date.now(), title, message, type, timestamp: new Date().toISOString() }
    setNotifications((prev) => [n, ...prev].slice(0, 5))
    if (type !== 'error' && type !== 'processing') setTimeout(() => setNotifications((prev) => prev.filter((x) => x.id !== n.id)), 6000)
  }
  const removeNotification = (id: number) => setNotifications((prev) => prev.filter((x) => x.id !== id))

  return (
    <div className="flex min-h-screen bg-black relative">
      {/* Top nav */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 bg-transparent">
        {/* Left spacer */}
        <div />

        {/* Right: Auth actions */}
        <div className="flex items-center gap-4">
          {/* Filter moved to right with bell and profile */}
          {isAuthenticated && (
            <div className="relative">
              <button onClick={() => setFilterOpen((v) => !v)} className="p-2 text-white/90 hover:text-white rounded-full" title="Filter">
                <Filter size={20} />
              </button>
              {filterOpen && (
                <div className="absolute right-0 mt-2 bg-black border border-white/20 rounded-xl shadow-2xl p-2 w-40">
                  <button onClick={() => { setCurrentFilter('all'); setFilterOpen(false) }} className={`w-full text-left px-3 py-2 rounded ${currentFilter==='all'?'bg-white/10 text-white':'text-white/70 hover:text-white hover:bg-white/5'}`}>All</button>
                  <button onClick={() => { setCurrentFilter('images'); setFilterOpen(false) }} className={`w-full text-left px-3 py-2 rounded ${currentFilter==='images'?'bg-white/10 text-white':'text-white/70 hover:text-white hover:bg-white/5'}`}>Images</button>
                  <button onClick={() => { setCurrentFilter('videos'); setFilterOpen(false) }} className={`w-full text-left px-3 py-2 rounded ${currentFilter==='videos'?'bg-white/10 text-white':'text-white/70 hover:text-white hover:bg-white/5'}`}>Videos</button>
                </div>
              )}
            </div>
          )}
          {isAuthenticated ? (
            <>
              {/* Notification bell */}
              <div className="scale-125">
                <NotificationBell userId={authService.getCurrentUser()?.id || ''} />
              </div>
              {/* Profile with progress ring */}
              <div className="relative">
                <button onClick={() => setUserMenu((v) => !v)} className="relative" aria-haspopup="menu" aria-expanded={userMenu}>
                  {navGenerating && (<span className="absolute -inset-1 rounded-full border-2 border-white/50 animate-spin" style={{ borderTopColor: 'transparent' }} />)}
                  <ProfileIcon size={30} className="text-white" />
                </button>
                {userMenu && (
                  <div className="absolute right-0 mt-2 bg-black border border-white/20 rounded-xl shadow-2xl p-2 w-40">
                    <button onClick={() => { setUserMenu(false); navigate('/profile') }} className="w-full text-left px-3 py-2 text-white/90 hover:bg-white/5 rounded">Profile</button>
                    <button onClick={() => { setUserMenu(false); navigate('/auth') }} className="w-full text-left px-3 py-2 text-white/90 hover:bg-white/5 rounded">Sign out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 rounded-full bg-white text-black text-sm hover:bg-white/90 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Right floating rail (desktop) */}
      <div className="hidden md:flex w-[10%] sticky top-0 h-screen items-center justify-center">
        <button
          onClick={handleUploadClick}
          className="w-16 h-16 rounded-full bg-white text-black hover:bg-white/90 transition-all duration-200 flex items-center justify-center shadow-lg"
          aria-label="Upload"
          title="Upload"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Feed area (90%) */}
      <div className="w-[90%] relative">
        <div className="p-6 pt-20 h-screen overflow-y-auto">
          {isLoadingFeed ? (
            <div className="text-white/40 text-sm">Loading...</div>
          ) : (
            <MasonryMediaGrid
              media={!isAuthenticated ? filteredFeed.slice(0, 18) : filteredFeed}
              columns={3}
              onMediaClick={() => {}}
              onLike={handleLike}
              onShare={handleShare}
              onRemix={handleRemix}
              showActions={true}
              className="pb-24"
            />
          )}
        </div>

        {/* Guest gate overlay centered within 90% area */}
        {!isAuthenticated && filteredFeed.length > 18 && (
          <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
            <div className="bg-black/70 border border-white/20 rounded-2xl p-6 text-center max-w-md mx-auto">
              <div className="text-white text-base font-medium mb-2">Create more with Stefna</div>
              <div className="text-white/70 text-sm mb-4">Sign up to explore the full feed and start generating.</div>
              <button
                onClick={() => navigate('/auth')}
                className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90"
              >
                Sign up to continue
              </button>
            </div>
          </div>
        )}

        {/* Floating notifications for Home */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="max-w-sm bg-gray-900/90 border border-white/10 rounded-2xl shadow-2xl">
                <div className="p-3 flex items-start justify-between">
                  <div className="pr-2">
                    <p className="text-sm text-white font-medium">{n.title}</p>
                    {n.message && <p className="text-xs text-white/60 mt-1">{n.message}</p>}
                  </div>
                  <button onClick={() => removeNotification(n.id)} className="text-white/40 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={handleUploadClick}
        className="md:hidden fixed bottom-4 right-4 w-14 h-14 rounded-full bg-white text-black shadow-lg hover:bg-white/90"
        aria-label="Upload"
      >
        <Plus size={22} />
      </button>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />

      {/* Full-screen composer */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm">
          <button type="button" onClick={closeComposer} className="absolute top-4 right-4 z-50 pointer-events-auto text-white/80 hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10 px-6 md:px-10 py-8">
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-3xl">
                  <div ref={containerRef} className="h-[min(70vh,640px)] w-full flex items-center justify-center">
                    {isVideoPreview ? (
                      <video ref={(el) => (mediaRef.current = el)} src={previewUrl || ''} className="max-w-full max-h-full object-contain" controls onLoadedMetadata={measure} onLoadedData={measure} />
                    ) : (
                      <img ref={(el) => (mediaRef.current = el as HTMLImageElement)} src={previewUrl || ''} alt="Preview" className="max-w-full max-h-full object-contain" onLoad={measure} />
                    )}
                  </div>
                  <div className="flex justify-center mt-3">
                    <button onClick={closeComposer} className="text-white/80 hover:text-white" aria-label="Close"><X size={16} /></button>
                  </div>
                </div>
              </div>
              <div className="h-full flex items-center justify-center">
                <div className="mx-auto w-full max-w-lg" style={{ paddingTop: 0, paddingBottom: 12 }}>
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => setActiveTab('prompt')} aria-pressed={activeTab === 'prompt'} className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'prompt' ? 'bg-white text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>Custom Prompt</button>
                    <button onClick={() => setActiveTab('presets')} aria-pressed={activeTab === 'presets'} className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'presets' ? 'bg-white text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>#AiAsABrush</button>
                  </div>
                  <div className="max-h-[55vh] overflow-y-auto pb-4">
                    {activeTab === 'prompt' && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Transform this media into something amazing..." className="w-full h-28 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 resize-none text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all" />
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setShareToFeed((v) => !v)} className={`w-10 h-6 rounded-full relative transition-colors ${shareToFeed ? 'bg-white' : 'bg-white/20'}`} aria-pressed={shareToFeed} aria-label="Share to feed"><span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${shareToFeed ? 'translate-x-4' : ''}`} /></button>
                            <span className="text-white/80">Share to feed</span>
                          </div>
                          <div className={`flex items-center gap-2 ${!shareToFeed ? 'opacity-40' : ''}`}>
                            <button type="button" onClick={() => shareToFeed && setAllowRemix((v) => !v)} disabled={!shareToFeed} className={`w-10 h-6 rounded-full relative transition-colors ${allowRemix && shareToFeed ? 'bg-white' : 'bg-white/20'}`} aria-pressed={allowRemix && shareToFeed} aria-label="Allow remix"><span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${allowRemix && shareToFeed ? 'translate-x-4' : ''}`} /></button>
                            <span className="text-white/80">Allow remix</span>
                          </div>
                        </div>
                        {quota && (<div className="flex items-center justify-between text-xs text-white/60"><div>Daily: {quota.daily_used} / {quota.daily_limit}</div><div>Weekly: {quota.weekly_used} / {quota.weekly_limit}</div></div>)}
                        {/* Variations toggle */}
                        <div className="flex items-center justify-between text-xs text-white/70">
                          <span>Generate 2 variations</span>
                          <button
                            type="button"
                            onClick={() => setGenerateTwo((v) => !v)}
                            className={`w-10 h-6 rounded-full relative transition-colors ${generateTwo ? 'bg-white' : 'bg-white/20'}`}
                            aria-pressed={generateTwo}
                          >
                            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${generateTwo ? 'translate-x-4' : ''}`} />
                          </button>
                        </div>
                        <div className="flex justify-end">
                          <button onClick={handleGenerate} disabled={!previewUrl || !prompt.trim() || isGenerating} className="w-12 h-12 bg-white text-black rounded-full hover:bg-white/90 disabled:opacity-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl" aria-label="Generate">{isGenerating ? (<div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />) : (<ArrowUp size={20} />)}</button>
                        </div>
                      </div>
                    )}
                    {activeTab === 'presets' && (
                      <div className="grid grid-cols-2 gap-3">
                        {["Oil Painting","Cyberpunk","Studio Ghibli","Photorealistic","Watercolor","Anime"].map((p) => (
                          <button key={p} onClick={() => handlePresetClick(p)} className="group relative p-3 rounded-xl border border-white/10 hover:border-white/30 transition-all text-left bg-white/5 hover:bg-white/10"><div className="text-white font-semibold text-sm">{p}</div><div className="text-white/50 text-[11px] mt-1">One-click style</div></button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomeNew


