import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, X, ArrowUp, Filter, FileText } from 'lucide-react'
import { authenticatedFetch } from '../utils/apiClient'
import authService from '../services/authService'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'
import MasonryMediaGrid from './MasonryMediaGrid'
import interactionService from '../services/interactionService'
import type { UserMedia } from '../services/userMediaService'
import NotificationBell from './NotificationBell'
import ProfileIcon from './ProfileIcon'
import { PRESETS } from '../config/freeMode'
import captionService from '../services/captionService'
import FullScreenMediaViewer from './FullScreenMediaViewer'
import { requireUserIntent } from '../utils/generationGuards'

const toAbsoluteCloudinaryUrl = (maybeUrl: string | undefined): string | undefined => {
  if (!maybeUrl) return maybeUrl
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  if (!cloud) return maybeUrl
  // Default to image upload path
  return `https://res.cloudinary.com/${cloud}/image/upload/${maybeUrl.replace(/^\/+/, '')}`
}

const HomeNew: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation() as any
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
  // Selected preset to optionally include negative prompt / strength on generate
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  // Caption generator state
  const [isCaptionOpen, setIsCaptionOpen] = useState(false)
  const [captionPlatform, setCaptionPlatform] = useState<'instagram' | 'x' | 'tiktok' | 'whatsapp' | 'telegram'>('instagram')
  const [captionStyle, setCaptionStyle] = useState<'casual' | 'professional' | 'trendy' | 'artistic'>('trendy')
  const [captionOutput, setCaptionOutput] = useState<string>('')
  const [isCaptionLoading, setIsCaptionLoading] = useState(false)

  // Deterministic weekly rotation of presets
  const weeklyPresetNames = useMemo(() => {
    const names = Object.keys(PRESETS)
    const DISPLAY_COUNT = 6
    if (names.length <= DISPLAY_COUNT) return names
    const epochWeek = Math.floor(Date.now() / 604800000) // 7 days in ms
    const start = epochWeek % names.length
    const rotated: string[] = []
    for (let i = 0; i < DISPLAY_COUNT; i++) {
      rotated.push(names[(start + i) % names.length])
    }
    return rotated
  }, [])
  const [quota, setQuota] = useState<{ daily_used: number; daily_limit: number; weekly_used: number; weekly_limit: number } | null>(null)
  const [feed, setFeed] = useState<UserMedia[]>([])
  const [isLoadingFeed, setIsLoadingFeed] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [creatorFilter, setCreatorFilter] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentFilter, setCurrentFilter] = useState<'all' | 'images' | 'videos'>('all')
  const [navGenerating, setNavGenerating] = useState(false)
  const [shareToFeed, setShareToFeed] = useState(false)
  const [allowRemix, setAllowRemix] = useState(false)
  const [generateTwo, setGenerateTwo] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  
  // Media viewer state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerMedia, setViewerMedia] = useState<UserMedia[]>([])
  const [viewerStartIndex, setViewerStartIndex] = useState(0)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Close filter dropdown
      if (filterOpen && !target.closest('[data-filter-dropdown]')) {
        setFilterOpen(false)
      }
      
      // Close user menu dropdown
      if (userMenu && !target.closest('[data-user-menu]')) {
        setUserMenu(false)
      }
    }

    // Close dropdowns when global nav close event is dispatched
    const handleGlobalNavClose = () => {
      setFilterOpen(false)
      setUserMenu(false)
    }

    document.addEventListener('click', handleClickOutside)
    window.addEventListener('global-nav-close', handleGlobalNavClose)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      window.removeEventListener('global-nav-close', handleGlobalNavClose)
    }
  }, [filterOpen, userMenu])

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

  // Handle remix navigation payload from profile
  useEffect(() => {
    const state = location?.state
    if (state && (state.remixUrl || state.remixPrompt)) {
      const url = state.remixUrl as string
      setPreviewUrl(url)
      setIsVideoPreview(/\.(mp4|webm|mov|mkv)(\?|$)/i.test(url))
      setSelectedFile(null)
      setIsComposerOpen(true)
      if (state.remixPrompt) setPrompt(state.remixPrompt)
    }
  }, [location])

  // Initial auth state and feed load
  useEffect(() => {
    setIsAuthenticated(Boolean(authService.getToken()))
    const loadFeed = async () => {
      try {
        setIsLoadingFeed(true)
        const res = await fetch('/.netlify/functions/getPublicFeed')
        if (res.ok) {
          const { media } = await res.json()
            const mapped: UserMedia[] = (media || []).map((item: any): UserMedia => {
              const resultUrl = toAbsoluteCloudinaryUrl(item.result_url) || toAbsoluteCloudinaryUrl(item.url) || item.result_url || item.url
              return ({
                id: item.id,
                userId: item.user_id,
                userAvatar: item.user_avatar || undefined,
                userTier: item.user_tier || undefined,
                type: item.mode === 'v2v' ? 'video' : 'photo',
                url: resultUrl,
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
              })
            })
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

  // Centralized generation dispatcher with comprehensive logging
  async function dispatchGenerate(kind: 'preset' | 'custom' | 'remix') {
    const t0 = performance.now();
    console.info('▶ dispatchGenerate', { kind });

    // Sanity check - log current state
    console.table({
      hasActiveAssetUrl: !!previewUrl,
      promptLen: prompt?.length ?? 0,
      isGenerating,
      isAuthenticated,
    });

    if (!previewUrl) {
      console.warn('No source media URL; aborting.');
      return;
    }

    if (!prompt.trim()) {
      console.warn('No prompt; aborting.');
      return;
    }

    if (!isAuthenticated) {
      console.warn('User not authenticated; redirecting to auth.');
      navigate('/auth');
      return;
    }

    // Apply user intent guard
    if (requireUserIntent({ userInitiated: true, source: kind })) {
      console.warn('⛔ Generation blocked by guard');
      return;
    }

        try {
      // Close composer and show progress
      setIsGenerating(true);
      setIsComposerOpen(false);
      setNavGenerating(true);

      // Upload to Cloudinary if needed
      let sourceUrl = previewUrl;
      if (selectedFile) {
        const up = await uploadToCloudinary(selectedFile, `users/${authService.getCurrentUser()?.id || 'me'}`);
        sourceUrl = up.secure_url;
      }
      
      // Final sanity check before API call
      console.table({
        hasActiveAssetUrl: !!previewUrl,
        promptLen: prompt?.length ?? 0,
        isGenerating,
        isAuthenticated,
        sourceUrl,
        selectedPreset,
      });

      // Build payload
      const payload: Record<string, any> = {
        prompt: prompt.trim(),
        source_url: sourceUrl,
        resource_type: isVideoPreview ? 'video' : 'image',
        source: kind,
        visibility: shareToFeed ? 'public' : 'private',
        allow_remix: shareToFeed ? allowRemix : false,
        num_variations: generateTwo ? 2 : 1,
      };

      // Include preset data if applicable
      if (selectedPreset && PRESETS[selectedPreset]) {
        const preset = PRESETS[selectedPreset];
        if (preset.negative) payload.negative_prompt = preset.negative;
        if (typeof preset.strength === 'number') payload.strength = preset.strength;
        payload.presetName = selectedPreset;
      }

      console.info('aimlApi payload', payload);

      const res = await authenticatedFetch('/.netlify/functions/aimlApi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.info('aimlApi status', res.status);
      const body = await res.json().catch(() => ({}));
      console.info('aimlApi body', body);

      if (!res.ok) {
        throw new Error(body?.error || `aimlApi ${res.status}`);
      }

      // Success: stop progress
      setIsGenerating(false);
      setNavGenerating(false);

      // Refresh quota
      try {
        const qRes = await authenticatedFetch('/.netlify/functions/getQuota');
        if (qRes.ok) setQuota(await qRes.json());
      } catch {}

    } catch (e) {
      console.error('dispatchGenerate error', e);
      setIsGenerating(false);
      setNavGenerating(false);
    } finally {
      console.info('⏹ dispatchGenerate done', (performance.now() - t0).toFixed(1), 'ms');
    }
  }

  const handleGenerate = async (promptOverride?: string) => {
    if (!previewUrl || !(promptOverride ?? prompt).trim()) {
      return
    }
    
    const token = authService.getToken()
    if (!token) {
      navigate('/auth')
      return
    }
    
    // Apply user intent guard
    if (requireUserIntent({ userInitiated: true, source: 'custom' })) {
      console.warn('⛔ Generation blocked by guard');
      return;
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
      const body: Record<string, any> = {
        prompt: (promptOverride ?? prompt).trim(),
        source_url: sourceUrl,
        resource_type: isVideoPreview ? 'video' : 'image',
        source: 'custom',
        visibility: shareToFeed ? 'public' : 'private',
        allow_remix: shareToFeed ? allowRemix : false,
        num_variations: generateTwo ? 2 : 1,
      }
      // If a preset is selected, include its negative prompt and strength
      if (selectedPreset && PRESETS[selectedPreset]) {
        const preset = PRESETS[selectedPreset]
        if (preset.negative) body.negative_prompt = preset.negative
        if (typeof preset.strength === 'number') body.strength = preset.strength
        body.presetName = selectedPreset
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

  const handlePresetClick = (presetName: string) => {
    // Selecting a preset should populate the prompt with full preset text, not auto-generate
    const preset = PRESETS[presetName]
    if (!preset) return
    setSelectedPreset(presetName)
    setPrompt(preset.prompt)
    
    // Auto-generate if we have media
    if (previewUrl) {
      dispatchGenerate('preset')
    }
  }

  const handleGenerateCaption = () => {
    if (!prompt.trim()) {
      setCaptionOutput('')
      return
    }
    setIsCaptionLoading(true)
    try {
      const result = captionService.generateCaption({
        prompt: prompt.trim(),
        platform: captionPlatform,
        style: captionStyle
      })
      setCaptionOutput(result.caption)
    } catch (e) {
      setCaptionOutput('')
    } finally {
      setIsCaptionLoading(false)
    }
  }

  const handleCopyCaption = async () => {
    if (!captionOutput) return
    try {
      await navigator.clipboard.writeText(captionOutput)
      addNotification('Copied', 'Caption copied to clipboard', 'success')
    } catch (e) {
      addNotification('Copy failed', 'Unable to copy caption', 'error')
    }
  }

  const handleLike = async (media: UserMedia) => {
    if (!authService.getToken()) {
      addNotification('Sign up required', 'Please sign up to like content', 'warning')
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
      addNotification('Sign up required', 'Please sign up to share content', 'warning')
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
      addNotification('Sign up required', 'Please sign up to remix content', 'warning')
      navigate('/auth')
      return
    }
    setPreviewUrl(media.url)
    setIsVideoPreview(media.type === 'video')
    setSelectedFile(null)
    setIsComposerOpen(true)
    setPrompt(media.prompt || '')
    
    // Auto-generate remix if we have the prompt
    if (media.prompt) {
      // Small delay to ensure state is set
      setTimeout(() => dispatchGenerate('remix'), 100)
    }
  }

  const handleMediaClick = (media: UserMedia) => {
    setViewerMedia([media])
    setViewerStartIndex(0)
    setViewerOpen(true)
  }

  // Apply filter to feed
  const filteredFeed = feed.filter((item) => {
    if (creatorFilter && item.userId !== creatorFilter) return false
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

  // Save current composer state as a draft (local only)
  const handleSaveDraft = async () => {
    if (!previewUrl || !prompt.trim()) {
      addNotification('Draft not saved', 'Upload media and enter a prompt first', 'warning')
      return
    }
    try {
      const user = authService.getCurrentUser()
      const userId = user?.id || 'guest'
      const key = `user_drafts_${userId}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const draft = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        userId,
        type: isVideoPreview ? 'video' : 'photo',
        url: previewUrl,
        prompt: prompt.trim(),
        aspectRatio: 4/3,
        width: 800,
        height: 600,
        timestamp: new Date().toISOString(),
        tokensUsed: 0,
        likes: 0,
        remixCount: 0,
        isPublic: false,
        allowRemix: false,
        tags: [],
        metadata: { quality: 'high', generationTime: 0, modelVersion: 'draft' }
      }
      localStorage.setItem(key, JSON.stringify([draft, ...existing].slice(0, 200)))
      addNotification('Saved to Drafts', 'Find it under Profile → Draft', 'success')
    } catch (e) {
      addNotification('Save failed', 'Could not save draft', 'error')
    }
  }

  return (
    <div className="flex min-h-screen bg-black relative overflow-hidden">

      
      {/* Top nav */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 bg-transparent">
        {/* Left spacer */}
        <div />

        {/* Right: Auth actions */}
        <div className="flex items-center gap-4">
          {/* Filter moved to right with bell and profile */}
          {isAuthenticated && (
            <div className="relative" data-filter-dropdown>
              <button
                onClick={() => {
                  window.dispatchEvent(new Event('global-nav-close'))
                  setFilterOpen((v) => !v)
                }}
                className="p-2 text-white/90 hover:text-white rounded-full"
                title="Filter"
                aria-expanded={filterOpen}
                aria-haspopup="menu"
              >
                <Filter size={24} />
              </button>
              {filterOpen && (
                <div className="absolute right-0 mt-2 bg-[#222222] border border-white/20 rounded-2xl shadow-2xl p-2 w-40 z-50">
                  <button onClick={() => { setCurrentFilter('all'); setFilterOpen(false) }} className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${currentFilter==='all'?'bg-white/10 text-white':'text-white/70 hover:text-white hover:bg-white/5'}`}>All</button>
                  <button onClick={() => { setCurrentFilter('images'); setFilterOpen(false) }} className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${currentFilter==='images'?'bg-white/10 text-white':'text-white/70 hover:text-white hover:bg-white/5'}`}>Images</button>
                  <button onClick={() => { setCurrentFilter('videos'); setFilterOpen(false) }} className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${currentFilter==='videos'?'bg-white/10 text-white':'text-white/70 hover:text-white hover:bg-white/5'}`}>Videos</button>
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
              <div className="relative" data-user-menu>
                <button onClick={() => { window.dispatchEvent(new Event('global-nav-close')); setUserMenu((v) => !v) }} className="relative rounded-full" aria-haspopup="menu" aria-expanded={userMenu}>
                  {navGenerating && (<span className="absolute -inset-1 rounded-full border-2 border-white/50 animate-spin" style={{ borderTopColor: 'transparent' }} />)}
                  <ProfileIcon size={28} className="text-white" />
                </button>
                {userMenu && (
                  <div className="absolute right-0 mt-2 bg-[#222222] border border-white/20 rounded-2xl shadow-2xl p-2 w-40 z-50">
                    <button onClick={() => { setUserMenu(false); navigate('/profile') }} className="w-full text-left px-3 py-2 text-white/90 hover:bg-white/5 rounded-lg transition-colors">Profile</button>
                    <button onClick={() => { setUserMenu(false); authService.logout(); navigate('/') }} className="w-full text-left px-3 py-2 text-white/90 hover:bg-white/5 rounded-lg transition-colors">Sign out</button>
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
        <div className="relative">
          {/* Animated white dot orbiting around the button border */}
          <div className="absolute inset-0 w-20 h-20">
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full animate-spin" style={{ 
              animationDuration: '3s',
              transformOrigin: '10px 10px',
              left: '50%',
              top: '0',
              marginLeft: '-3px',
              marginTop: '-3px'
            }}></div>
          </div>
          
          <button
            onClick={handleUploadClick}
            className="w-16 h-16 rounded-full bg-black border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 flex items-center justify-center shadow-2xl hover:shadow-white/20 relative z-10"
            aria-label="Upload"
            title="Upload"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Feed area (90%) */}
      <div className="w-[90%] relative">
        <div className="p-6 pt-20 h-screen overflow-y-auto">
          {isLoadingFeed ? (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl overflow-hidden">
                  <div className="w-full aspect-[4/3] bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <MasonryMediaGrid
              media={!isAuthenticated ? filteredFeed.slice(0, 18) : filteredFeed}
              columns={3}
              onMediaClick={handleMediaClick}
              onLike={handleLike}
              onShare={handleShare}
              onRemix={handleRemix}
              onFilterCreator={(userId) => setCreatorFilter(userId)}
              showActions={true}
              className="pb-24"
            />
          )}
        </div>

          {/* Creator filter banner */}
          {creatorFilter && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white/10 text-white text-xs px-3 py-1 rounded-full border border-white/20">
              Filtering by creator • <button className="underline" onClick={() => setCreatorFilter(null)}>clear</button>
            </div>
          )}

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
          <div className="fixed top-20 right-4 z-50 space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="max-w-sm bg-[#222222] border border-white/20 rounded-2xl shadow-2xl">
                <div className="p-3 flex items-center justify-between">
                  <div className="pr-2">
                    <p className="text-sm text-white font-medium">{n.title}</p>
                  </div>
                  <button onClick={() => removeNotification(n.id)} className="text-white/60 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-4 right-4 relative">
        {/* Animated white dot orbiting around the button border */}
        <div className="absolute inset-0 w-18 h-18">
          <div className="absolute w-1 h-1 bg-white rounded-full animate-spin" style={{ 
            animationDuration: '3s',
            transformOrigin: '9px 9px',
            left: '50%',
            top: '0',
            marginLeft: '-2px',
            marginTop: '-2px'
          }}></div>
        </div>
        
        <button
          onClick={handleUploadClick}
          className="w-14 h-14 rounded-full bg-black border-2 border-white/30 text-white shadow-2xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 relative z-10"
          aria-label="Upload"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />

      {/* Full Screen Media Viewer */}
      <FullScreenMediaViewer
        isOpen={viewerOpen}
        media={viewerMedia}
        startIndex={viewerStartIndex}
        onClose={() => setViewerOpen(false)}
        onLike={handleLike}
        onRemix={handleRemix}
        onShowAuth={() => navigate('/auth')}
      />

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
                  <div className="max-h-[55vh] overflow-y-auto pb-4 space-y-4">
                    {/* Prompt input */}
                    <div className="space-y-2">
                      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Transform this media into something amazing..." className="w-full h-24 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 resize-none text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all" />
                    </div>
                    {/* Presets under prompt */}
                    <div>
                      <div className="grid grid-cols-2 gap-2">
                        {weeklyPresetNames.map((name) => (
                          <button
                            key={name}
                            onClick={() => handlePresetClick(name)}
                            className={`group relative p-2 rounded-lg border transition-all text-left ${selectedPreset === name ? 'border-white/60 bg-white/10' : 'border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10'}`}
                          >
                            <div className="text-white font-semibold text-sm">{name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Caption info */}
                    <div className="flex justify-end">
                      <p className="text-xs text-white/60">
                        Your media social media captions will be ready on your user profile
                      </p>
                    </div>

                    {quota && (<div className="flex items-center justify-between text-xs text-white/60"><div>Daily: {quota.daily_used} / {quota.daily_limit}</div><div>Weekly: {quota.weekly_used} / {quota.weekly_limit}</div></div>)}
                    

                    {/* Variations toggle */}
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span>Generate {generateTwo ? '2' : '1'} variation{generateTwo ? 's' : ''}</span>
                      <button
                        type="button"
                        onClick={() => setGenerateTwo((v) => !v)}
                        className={`w-10 h-6 rounded-full relative transition-colors ${generateTwo ? 'bg-white' : 'bg-white/20'}`}
                        aria-pressed={generateTwo}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${generateTwo ? 'translate-x-4' : ''}`} />
                      </button>
                    </div>
                        <div className="flex justify-end items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSaveDraft}
                            title="Save to draft"
                            className="w-10 h-10 bg-white/10 text-white rounded-full hover:bg-white/15 transition-all duration-200 flex items-center justify-center border border-white/15"
                            aria-label="Save to draft"
                          >
                            <FileText size={16} />
                          </button>
                          <button 
                            onClick={() => dispatchGenerate('custom')} 
                            disabled={!previewUrl || !prompt.trim() || isGenerating} 
                            className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl ${
                              !previewUrl || !prompt.trim() || isGenerating 
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                : 'bg-white text-black hover:bg-white/90'
                            }`}
                            aria-label="Generate"
                            title={`${!isAuthenticated ? 'Sign up to generate AI content' : !previewUrl ? 'Upload media first' : !prompt.trim() ? 'Enter a prompt first' : isGenerating ? 'Generation in progress...' : 'Generate AI content'}`}
                          >
                            {isGenerating ? (
                              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                              <ArrowUp size={20} />
                            )}
                          </button>
                        </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
        {/* Caption Modal */}
        {isCaptionOpen && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#222222] border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-white font-medium text-lg">Generate Caption</div>
                <button onClick={() => setIsCaptionOpen(false)} className="text-white/60 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-white/70 text-sm mb-2">Platform</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['instagram','x','tiktok'] as const).map(p => (
                      <button key={p} onClick={() => setCaptionPlatform(p)} className={`px-3 py-2 rounded-lg text-sm border transition-colors ${captionPlatform===p? 'border-white/40 text-white bg-white/10':'border-white/20 text-white/80 hover:text-white hover:bg-white/5'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-white/70 text-sm mb-2">Style</div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['trendy','casual','professional','artistic'] as const).map(s => (
                      <button key={s} onClick={() => setCaptionStyle(s)} className={`px-2 py-2 rounded-lg text-xs border transition-colors ${captionStyle===s? 'border-white/40 text-white bg-white/10':'border-white/20 text-white/80 hover:text-white hover:bg-white/5'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={handleGenerateCaption} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium disabled:opacity-50 transition-colors" disabled={!prompt.trim() || isCaptionLoading}>
                    {isCaptionLoading? 'Generating…' : 'Generate'}
                  </button>
                  <button onClick={handleCopyCaption} className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm disabled:opacity-50 hover:bg-white/5 transition-colors" disabled={!captionOutput}>
                    Copy
                  </button>
                </div>
                <div>
                  <textarea value={captionOutput} onChange={(e)=>setCaptionOutput(e.target.value)} placeholder="Your caption will appear here" className="w-full h-28 p-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 resize-none text-sm focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors" />
                  <div className="text-white/50 text-xs mt-2">Includes #AiAsABrush automatically</div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export default HomeNew


