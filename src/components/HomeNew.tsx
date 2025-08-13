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
import { PRESETS, type PresetKey, promptForPreset } from '../config/presets'
import presetRotationService from '../services/presetRotationService'
import captionService from '../services/captionService'
import FullScreenMediaViewer from './FullScreenMediaViewer'
import ShareModal from './ShareModal'
import { requireUserIntent } from '../utils/generationGuards'
import userMediaService from '../services/userMediaService'
import { pickResultUrl, ensureRemoteUrl } from '../utils/aimlUtils'
import { cloudinaryUrlFromEnv } from '../utils/cloudinaryUtils'
import { createAsset } from '../lib/api'
import { saveMediaNoDB, togglePublish } from '../lib/api'
const NO_DB_MODE = import.meta.env.VITE_NO_DB_MODE === 'true'

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
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(null)
  
  // Stable ref for selectedPreset to prevent re-render issues during generation
  const selectedPresetRef = useRef<PresetKey | null>(null)
  const genIdRef = useRef(0) // increments per job to prevent race conditions
  
  useEffect(() => { 
    selectedPresetRef.current = selectedPreset 
  }, [selectedPreset])
  
  // Generation lifecycle functions
  function startGeneration() {
    genIdRef.current += 1
    setIsGenerating(true)
    return genIdRef.current
  }

  function endGeneration(id: number) {
    // only end if this is the latest job
    if (id === genIdRef.current) {
      setIsGenerating(false)
    }
  }
  
  // Centralized setter with guards
  function requestClearPreset(reason: string) {
    // never clear while generating
    if (isGenerating) {
      console.debug('🛑 Blocked preset clear while generating:', reason)
      return
    }
    setSelectedPreset(null)
    selectedPresetRef.current = null
    localStorage.removeItem('selectedPreset')
  }

  // Clear preset after successful generation
  const clearPresetAfterGeneration = () => {
    console.log('🎯 Clearing preset after generation')
    setSelectedPreset(null)
    selectedPresetRef.current = null
    localStorage.removeItem('selectedPreset')
  }

  // Clear preset when user exits composer (debounced to avoid race)
  const clearPresetOnExit = () => {
    // Give time for success path to win first
    setTimeout(() => requestClearPreset('composer exit'), 300)
  }
  
  // Restore preset from localStorage on mount
  useEffect(() => {
    const savedPreset = localStorage.getItem('selectedPreset')
    if (savedPreset && PRESETS[savedPreset as PresetKey]) {
      console.log('🔄 Restoring preset from localStorage:', savedPreset)
      setSelectedPreset(savedPreset as PresetKey)
      selectedPresetRef.current = savedPreset as PresetKey
    }
  }, [PRESETS]) // Add PRESETS as dependency

  // Debug preset changes
  useEffect(() => {
    console.log('🔍 selectedPreset changed to:', selectedPreset)
    if (selectedPreset) {
      console.log('🎨 Preset details:', PRESETS[selectedPreset])
      // Persist preset selection to localStorage
      localStorage.setItem('selectedPreset', selectedPreset)
      // Also update the ref
      selectedPresetRef.current = selectedPreset
    } else {
      // Clear from localStorage when preset is cleared
      localStorage.removeItem('selectedPreset')
      selectedPresetRef.current = null
    }
  }, [selectedPreset, PRESETS])

  // Debug PRESETS object
  useEffect(() => {
    console.log('🎨 PRESETS object updated:', {
      count: Object.keys(PRESETS).length,
      keys: Object.keys(PRESETS),
      sample: Object.keys(PRESETS).slice(0, 3).map(key => ({
        key,
        label: PRESETS[key as PresetKey]?.label,
        prompt: PRESETS[key as PresetKey]?.prompt?.substring(0, 50) + '...'
      }))
    })
  }, [PRESETS])
  
  // Debug when preset gets cleared (only in development)
  useEffect(() => {
    if (selectedPreset === null && import.meta.env.DEV) {
      console.log('⚠️ selectedPreset was cleared to null')
      console.trace('Preset clear stack trace')
    }
  }, [selectedPreset])
  // Caption generator state
  const [isCaptionOpen, setIsCaptionOpen] = useState(false)
  const [captionPlatform, setCaptionPlatform] = useState<'instagram' | 'x' | 'tiktok' | 'whatsapp' | 'telegram'>('instagram')
  const [captionStyle, setCaptionStyle] = useState<'casual' | 'professional' | 'trendy' | 'artistic'>('trendy')
  const [captionOutput, setCaptionOutput] = useState<string>('')
  const [isCaptionLoading, setIsCaptionLoading] = useState(false)

  // Get active presets from the rotation service
  const weeklyPresetNames = useMemo(() => {
    try {
      // Use direct preset keys instead of complex rotation service
      const presetKeys = Object.keys(PRESETS) as PresetKey[]
      if (import.meta.env.DEV) {
        console.log('🎨 Active presets for UI:', presetKeys)
      }
      
      // If no presets available, return empty array
      if (presetKeys.length === 0) {
        if (import.meta.env.DEV) {
          console.debug('⚠️ No active presets from API, using rotation fallback')
        }
        // Fallback to hardcoded presets if the rotation service fails
        const fallbackPresets: PresetKey[] = [
          'cinematic_glow',
          'bright_airy', 
          'vivid_pop',
          'vintage_film_35mm',
          'tropical_boost',
          'urban_grit'
        ]
        if (import.meta.env.DEV) {
          console.debug('🔄 Using fallback presets:', fallbackPresets)
        }
        return fallbackPresets
      }
      
      // Return first 6 presets for UI display
      return presetKeys.slice(0, 6)
    } catch (error) {
      console.error('❌ Error getting active presets:', error)
      // Fallback to hardcoded presets
      const fallbackPresets: PresetKey[] = [
        'cinematic_glow',
        'bright_airy', 
        'vivid_pop',
        'vintage_film_35mm',
        'tropical_boost',
        'urban_grit'
      ]
      if (import.meta.env.DEV) {
        console.debug('🔄 Using fallback presets due to error:', fallbackPresets)
      }
      return fallbackPresets
    }
  }, [PRESETS]) // Add PRESETS as dependency so it updates when presets change
  const [quota, setQuota] = useState<{ daily_used: number; daily_limit: number; weekly_used: number; weekly_limit: number } | null>(null)
  const [feed, setFeed] = useState<UserMedia[]>([])
  const [isLoadingFeed, setIsLoadingFeed] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [creatorFilter, setCreatorFilter] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [currentFilter, setCurrentFilter] = useState<'all' | 'images' | 'videos'>('all')
  const [navGenerating, setNavGenerating] = useState(false)
  const [generateTwo, setGenerateTwo] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  
  // Media viewer state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerMedia, setViewerMedia] = useState<UserMedia[]>([])
  const [viewerStartIndex, setViewerStartIndex] = useState(0)
  
  // Video job state
  const [currentVideoJob, setCurrentVideoJob] = useState<{ id: string; status: string } | null>(null)
  const [videoJobPolling, setVideoJobPolling] = useState<NodeJS.Timeout | null>(null)
  
  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareModalMedia, setShareModalMedia] = useState<UserMedia | null>(null)

  // Enhanced dropdown management - close dropdowns automatically
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
      
      // Close presets dropdown
      if (presetsOpen && !target.closest('[data-presets-dropdown]')) {
        setPresetsOpen(false)
      }
    }

    // Close dropdowns when global nav close event is dispatched
    const handleGlobalNavClose = () => {
      setFilterOpen(false)
      setUserMenu(false)
      setPresetsOpen(false)
    }

    // Close dropdowns when Escape key is pressed
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFilterOpen(false)
        setUserMenu(false)
        setPresetsOpen(false)
      }
    }

    // Close dropdowns when clicking on navigation elements
    const handleNavClick = (event: MouseEvent) => {
      const target = event.target as Element
      
      // If clicking on any navigation button, close other dropdowns
      if (target.closest('[data-nav-button]')) {
        const clickedButton = target.closest('[data-nav-button]')
        const buttonType = clickedButton?.getAttribute('data-nav-type')
        
        // Close all other dropdowns except the one being clicked
        // This allows the clicked button to toggle its own dropdown
        if (buttonType !== 'filter') setFilterOpen(false)
        if (buttonType !== 'user') setUserMenu(false)
        if (buttonType !== 'presets') setPresetsOpen(false)
        
        // Don't prevent the toggle - let the onClick handler work
        // The toggle logic is already in the onClick handlers
      }
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('click', handleNavClick)
    window.addEventListener('global-nav-close', handleGlobalNavClose)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('click', handleNavClick)
      window.removeEventListener('global-nav-close', handleGlobalNavClose)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [filterOpen, userMenu, presetsOpen])

  // Function to close all dropdowns
  const closeAllDropdowns = () => {
    setFilterOpen(false)
    setUserMenu(false)
    setPresetsOpen(false)
  }

  const handleUploadClick = () => {
    closeAllDropdowns() // Close all dropdowns when opening composer
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setIsVideoPreview(file.type.startsWith('video/'))
    setSelectedFile(file)
    setIsComposerOpen(true)
    // Clear selectedPreset when new media is uploaded
            requestClearPreset('new media uploaded')
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
      // Don't clear selectedPreset - it should persist for remix generation
    }
  }, [location])

  // Load public feed on mount
  const loadFeed = async () => {
    try {
      setIsLoadingFeed(true)
      console.log('🔄 Loading public feed...')
      const res = await fetch('/.netlify/functions/getPublicFeed?limit=50')
      console.log('📡 Feed response status:', res.status)
      
      if (res.ok) {
        const resp = await res.json()
        console.log('📊 Raw feed response:', resp)
        console.log('📥 Feed items received:', resp.ok ? 'success' : 'failed')
        
        if (!resp.ok) {
          console.error('❌ Feed API error:', resp.error)
          return
        }
        
        const { data: media } = resp
        console.log('📊 Raw feed data:', media)
        console.log('📊 Feed length:', media?.length || 0)
        
        const mapped: UserMedia[] = (media || []).map((item: any): UserMedia => {
          // Construct Cloudinary URL including videos for feed
          const mediaUrl = cloudinaryUrlFromEnv(item.cloudinary_public_id, item.media_type)
          console.log(`🔗 URL mapping for item ${item.id}:`, {
            cloudinary_public_id: item.cloudinary_public_id,
            media_type: item.media_type,
            final: mediaUrl
          })
          
          return ({
            id: item.id,
            userId: 'public', // Placeholder since user info not exposed in public_feed_v2
            userAvatar: undefined, // Not exposed in public_feed_v2
            userTier: undefined, // Not exposed in public_feed_v2
            type: item.media_type === 'video' ? 'video' : 'photo',
            url: mediaUrl,
            thumbnailUrl: mediaUrl, // Use same URL for thumbnail
            prompt: 'AI Generated Content', // Not exposed in public_feed_v2
            style: undefined,
            aspectRatio: 4/3, // Default aspect ratio
            width: 800, // Default width
            height: 600, // Default height
            timestamp: item.published_at,
            originalMediaId: item.source_asset_id || undefined,
            tokensUsed: item.media_type === 'video' ? 5 : 2,
            likes: 0, // Not exposed in public_feed_v2
            remixCount: 0, // Not exposed in public_feed_v2
            isPublic: true,
            allowRemix: true,
            tags: [],
            metadata: { quality: 'high', generationTime: 0, modelVersion: '1.0' },
            // Store additional fields needed for remix functionality
            cloudinaryPublicId: item.cloudinary_public_id,
            mediaType: item.media_type,
          })
        })
        
        console.log('🎯 Mapped feed items:', mapped.length)
        console.log('🎯 Setting feed with items:', mapped.length, 'first item ID:', mapped[0]?.id)
        setFeed(mapped)
      } else {
        console.error('❌ Feed response not ok:', res.status, await res.text())
      }
    } catch (e) {
      console.error('❌ Failed to load feed', e)
    } finally {
      setIsLoadingFeed(false)
    }
  }

  // Initialize authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      const authState = authService.getAuthState()
      setIsAuthenticated(authState.isAuthenticated)
      console.log('🔐 Auth state initialized:', authState)
      
      // If user is authenticated, sync their settings and profile from database
      if (authState.isAuthenticated) {
        try {
          await getUserProfileSettings()
          console.log('✅ User settings synced from database')
          
          // Also load user profile data from database
          await loadUserProfileFromDatabase()
          console.log('✅ User profile synced from database')
          
          // Check for tier promotions (surprise notifications!)
          await checkTierPromotion()
        } catch (error) {
          console.warn('⚠️ Failed to sync user data from database:', error)
        }
      }
    }
    
    checkAuth()
  }, [])

  // Restore preset selection from localStorage on mount
  useEffect(() => {
    const savedPreset = localStorage.getItem('selectedPreset') as PresetKey | null
    if (savedPreset && PRESETS[savedPreset]) {
      console.log('🔄 Restoring preset from localStorage:', savedPreset)
      setSelectedPreset(savedPreset)
    } else if (savedPreset && !PRESETS[savedPreset]) {
      console.warn('⚠️ Invalid preset in localStorage, clearing:', savedPreset)
      localStorage.removeItem('selectedPreset')
    }
  }, [PRESETS]) // Add PRESETS as dependency so it runs when presets are loaded

  useEffect(() => {
    loadFeed()
    
    // Listen for feed refresh events
    const handleRefreshFeed = () => {
      loadFeed()
    }
    
    window.addEventListener('refreshFeed', handleRefreshFeed)
    
    return () => {
      window.removeEventListener('refreshFeed', handleRefreshFeed)
    }
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

  // Cleanup video job polling on unmount
  useEffect(() => {
    return () => {
      if (videoJobPolling) {
        clearInterval(videoJobPolling)
      }
    }
  }, [videoJobPolling])

  // Get user profile settings for sharing
  const getUserProfileSettings = async () => {
    // Try to get from database first (for authenticated users)
    if (isAuthenticated && authService.getToken()) {
      try {
        const response = await fetch('/.netlify/functions/user-settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const settings = await response.json()
          console.log('✅ Retrieved settings from database:', settings)
          
          // Also update localStorage for offline access
          const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
          const updatedProfile = { ...currentProfile, ...settings }
          localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
          
          return settings
        }
      } catch (error) {
        console.warn('⚠️ Failed to get settings from database, falling back to localStorage:', error)
      }
    }

    // Fallback to localStorage
    try {
      const savedProfile = localStorage.getItem('userProfile')
      if (savedProfile) {
        const profile = JSON.parse(savedProfile)
        return {
          shareToFeed: profile.shareToFeed || false,
          allowRemix: profile.allowRemix || false
        }
      }
    } catch (error) {
      console.error('Error reading user profile from localStorage:', error)
    }
    
    // Default settings
    return { shareToFeed: true, allowRemix: true }
  }

  const closeComposer = () => {
    setIsComposerOpen(false)
    setPrompt('')
    setPreviewUrl(null)
    // Don't clear selectedPreset - it should persist for generation
    // Only clear if user explicitly wants to reset
    closeAllDropdowns() // Close all dropdowns when composer closes
  }

  // Centralized generation dispatcher with comprehensive logging
  async function dispatchGenerate(kind: 'preset' | 'custom' | 'remix') {
    const t0 = performance.now();
    console.info('▶ dispatchGenerate', { kind });
    
    // Start generation with ID guard
    const genId = startGeneration();

    // Get current profile settings
    const { shareToFeed, allowRemix } = await getUserProfileSettings()
    console.log('🔧 Using profile settings:', { shareToFeed, allowRemix })

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

    // Use preset prompt if no user prompt provided
    let effectivePrompt = '';
    
    // Get stable snapshot of selectedPreset at click time
    const chosen = selectedPresetRef.current;

    // Check if we have either a preset or a user prompt
    if (!chosen && !prompt.trim()) {
      console.warn('No preset selected and no user prompt; aborting.');
              // Pick a preset or add a prompt - no notification needed
      return;
    }
    
    console.log('🔍 Preset selection debug:', {
      selectedPreset,
      selectedPresetRef: chosen,
      hasPreset: !!chosen,
      presetExists: chosen ? !!PRESETS[chosen] : false,
      presetPrompt: chosen ? PRESETS[chosen]?.prompt : 'N/A'
    });
    
    if (chosen && PRESETS[chosen]) {
      // If preset is selected, use ONLY the preset prompt (ignore user prompt field)
      effectivePrompt = PRESETS[chosen].prompt;
      console.log(`🎨 Using preset "${chosen}":`, effectivePrompt);
    } else if (prompt.trim()) {
      // If no preset but user typed a prompt, use that
      effectivePrompt = prompt.trim();
      console.log('✍️ Using user prompt:', effectivePrompt);
    } else {
      // Only use fallback if no preset and no user prompt
      effectivePrompt = 'stylize, preserve subject and composition';
      console.log('🔄 Using fallback prompt:', effectivePrompt);
    }
    
    // Add "Make it obvious" test option for debugging
    const makeItObvious = prompt.toLowerCase().includes('make it obvious') || prompt.toLowerCase().includes('test');
    if (makeItObvious) {
      effectivePrompt = 'black-and-white line art, no color, heavy outlines, flat shading, cartoon style';
      console.log('🔎 Using "Make it obvious" test prompt:', effectivePrompt);
    }
    
    // Use the new preset system for better prompt mapping
    if (chosen) {
      const presetPrompt = promptForPreset(chosen, isVideoPreview);
      if (presetPrompt !== 'stylize, preserve subject and composition') {
        effectivePrompt = presetPrompt;
        console.log(`🎨 Using new preset system "${chosen}" (${isVideoPreview ? 'V2V' : 'I2I'}):`, effectivePrompt);
      }
    }
    
    console.log('🎯 Final effective prompt:', effectivePrompt);
    
    // Log preset usage for debugging
    if (chosen && PRESETS[chosen]) {
      console.log('🎨 Preset used in generation:', {
        presetName: chosen,
        presetLabel: PRESETS[chosen].label,
        presetPrompt: PRESETS[chosen].prompt,
        finalPrompt: effectivePrompt
      });
      
      // Track preset usage for rotation analytics
      presetRotationService.trackPresetUsage(chosen);
    } else if (chosen && !PRESETS[chosen]) {
      console.warn('⚠️ Invalid preset selected:', chosen);
    }
    
    if (!effectivePrompt) {
      console.warn('No prompt available; aborting.');
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
      // Log the final generation parameters
      console.log('🚀 Starting generation with:', {
        kind,
        effectivePrompt,
        selectedPreset: chosen,
        isVideo: isVideoPreview
      });
      
      // Start generation with ID guard
      const genId = startGeneration();
      setIsComposerOpen(false);
      setNavGenerating(true);
      
      // Don't clear preset when composer closes during generation
      // clearPresetOnExit();

      // Ensure we have a remote URL (not blob:)
      let sourceUrl = previewUrl;
      if (previewUrl?.startsWith('blob:') || selectedFile) {
        try {
          sourceUrl = await ensureRemoteUrl(previewUrl, selectedFile || undefined);
          console.log('🌐 Using remote source URL:', sourceUrl);
        } catch (uploadError: any) {
          console.error('❌ Upload failed:', uploadError);
          addNotification('Upload failed', uploadError.message || 'Failed to upload file to Cloudinary', 'error');
          // Don't clear preset on upload failure - let user retry
          endGeneration(genId);
          setNavGenerating(false);
          return;
        }
      }
      
      // Final sanity check before API call
      console.table({
        hasActiveAssetUrl: !!previewUrl,
        promptLen: prompt?.length ?? 0,
        isGenerating,
        isAuthenticated,
        sourceUrl,
        selectedPreset,
        effectivePrompt,
        promptFieldValue: prompt
      });

      // Build payload
      const payload: Record<string, any> = {
        prompt: effectivePrompt,
        image_url: sourceUrl,
        resource_type: isVideoPreview ? 'video' : 'image',
        source: kind,
        visibility: shareToFeed ? 'public' : 'private',
        allow_remix: shareToFeed ? allowRemix : false,
        num_variations: generateTwo ? 2 : 1,
        strength: 0.85,  // Increased from default for more visible changes
        seed: Date.now(), // Prevent provider-side caching
        request_id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, // Idempotency key for credit charging
      };

      // Video-specific parameters for V2V
      if (isVideoPreview) {
        payload.video_settings = {
          fps: 24,
          duration: 3, // 3 seconds
          quality: 'high',
          stabilization: true
        };
        console.log('🎬 V2V payload with video settings:', payload.video_settings);
      }

      // Add test parameters for "Make it obvious" mode
      if (makeItObvious) {
        payload.strength = 0.9;              // make it obvious
        payload.num_inference_steps = 36;
        payload.guidance_scale = 7.5;
        payload.seed = Date.now();           // bust provider-side dedupe caches
        console.log('🔎 Using test parameters:', { strength: payload.strength, steps: payload.num_inference_steps, seed: payload.seed });
      }

      // Include preset data if applicable
      if (selectedPreset && PRESETS[selectedPreset]) {
        const preset = PRESETS[selectedPreset];
        if (preset.negative_prompt) payload.negative_prompt = preset.negative_prompt;
        if (typeof preset.strength === 'number') payload.strength = preset.strength;
        payload.presetName = selectedPreset;
      }

      console.info('aimlApi payload', payload);

      // Video pathway → use start-v2v + poll-v2v
      if (isVideoPreview) {
        const jwt = authService.getToken();
        if (!jwt) {
          console.error('Missing auth for start-v2v');
          endGeneration(genId);
          setNavGenerating(false);
          navigate('/auth');
          return;
        }
        try {
          const startRes = await fetch('/.netlify/functions/start-v2v', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
            body: JSON.stringify({
              source_url: sourceUrl,
              prompt: effectivePrompt,
              strength: payload.strength ?? 0.7,
              visibility: shareToFeed ? 'public' : 'private',
              allowRemix: shareToFeed ? allowRemix : false,
              model: 'eagle-v2v'
            })
          });
          const startJson = await startRes.json().catch(() => ({}));
          if (!startRes.ok || !startJson?.job_id) {
            throw new Error(startJson?.error || 'start-v2v failed');
          }
          addNotification('Add to queue', 'Video job created successfully. Processing will begin shortly.', 'queue');
          setCurrentVideoJob({ id: startJson.job_id, status: 'queued' });
          startVideoJobPolling(startJson.job_id);
        } catch (err:any) {
          console.error('start-v2v error', err);
          addNotification('Error please try again', err?.message || 'Video job failed to start', 'error');
        }
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }

      const res = await authenticatedFetch('/.netlify/functions/aimlApi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.info('aimlApi status', res.status);
      const body = await res.json().catch(() => ({}));
      console.info('aimlApi body', body);

      // Handle video job creation (status 202)
      if (res.status === 202 && body.job_id && isVideoPreview) {
        addNotification('Add to queue', 'Video job created successfully. Processing will begin shortly.', 'queue')
        setCurrentVideoJob({ id: body.job_id, status: 'queued' })
        startVideoJobPolling(body.job_id)
        endGeneration(genId)
        setNavGenerating(false)
        return
      }

      if (!res.ok) {
        // Handle different error types
        if (res.status === 501 && isVideoPreview) {
          addNotification('Add to queue', 'ready');
          // Don't return - let the processing continue
        } else if (res.status === 429) {
          addNotification('Error please try again', 'Rate limited', 'error');
          endGeneration(genId);
          setNavGenerating(false);
          return;
        } else {
          throw new Error(body?.error || `aimlApi ${res.status}`);
        }
      }

      // Process the generated result using robust parsing
      const resultUrl = pickResultUrl(body);
      if (!resultUrl) {
        console.error('No result URL in response:', body);
        throw new Error('No result URL in API response');
      }

      console.info('Generated result URL:', resultUrl);

      // Show the generated result immediately with cache busting
      const cacheBustedResultUrl = `${resultUrl}${resultUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setPreviewUrl(cacheBustedResultUrl);
      
      // Add success notification
              addNotification('Your media is ready', 'Your image has been generated successfully.', 'ready', resultUrl, 'image', () => {
              // Open the media viewer to show the generated image
              setViewerMedia([{
                id: 'generated-' + Date.now(),
                userId: 'current-user',
                type: 'photo',
                url: resultUrl,
                prompt: prompt,
                aspectRatio: 4/3,
                width: 800,
                height: 600,
                timestamp: new Date().toISOString(),
                tokensUsed: 2,
                likes: 0,
                remixCount: 0,
                isPublic: false,
                allowRemix: false,
                tags: [],
                metadata: { quality: 'high', generationTime: 0, modelVersion: '1.0' }
              }]);
              setViewerStartIndex(0);
              setViewerOpen(true);
            });

      // Save the generated media to the database
          try {
            const jwt = authService.getToken();
            const userId = authService.getCurrentUser()?.id;
            
            if (!jwt || !userId) {
              console.error('No JWT or user ID for saveMedia');
              addNotification('Your media is ready', 'Image generated but not saved (auth error)', 'warning');
              return;
            }

        if (NO_DB_MODE) {
          try {
            const saved = await saveMediaNoDB({
              resultUrl,
              userId,
              presetKey: selectedPreset ?? null,
              sourcePublicId: sourceUrl ? sourceUrl.split('/').pop()?.split('.')[0] || '' : null,
              allowRemix: allowRemix,
              shareNow: !!shareToFeed,
              mediaTypeHint: 'image',
            })
            console.log('✅ saveMediaNoDB ok:', saved)
            // Refresh feed
            setTimeout(() => window.dispatchEvent(new CustomEvent('refreshFeed')), 800)
          } catch (e:any) {
            console.error('❌ saveMediaNoDB failed:', e)
            addNotification('Error please try again', e?.message || 'Failed to save media', 'error')
          }
          return
        }

        // First, create an asset record
        const assetResult = await createAsset({
          sourcePublicId: sourceUrl ? sourceUrl.split('/').pop()?.split('.')[0] || '' : '',
          mediaType: 'image', // Default to image for now
          presetKey: selectedPreset,
              prompt: effectivePrompt,
        });

        if (!assetResult.ok) {
          console.error('Failed to create asset:', assetResult.error);
          addNotification('Error please try again', 'Failed to create asset record', 'error');
          return;
        }

        const assetId = assetResult.data.id;
        console.log('✅ Asset created:', assetId);

        // Now call save-media with the assetId and resultUrl; include userId and publish flag so server adds tags
        const saveRes = await fetch('/.netlify/functions/save-media', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json', 
                  'Authorization': `Bearer ${jwt}` 
                },
                body: JSON.stringify({
            assetId: assetId,
            resultUrl: resultUrl,
            mediaTypeHint: 'image',
            userId,
            shareNow: !!shareToFeed,
                })
              });
              
        const saveText = await saveRes.text();
        let saveBody: any = {};
        try { saveBody = JSON.parse(saveText); } catch {}
        console.log('💾 Save-media response:', saveRes.status, saveBody || saveText)

        if (saveRes.ok && saveBody?.ok) {
          console.info('Media saved successfully:', saveBody);
          // Refresh the feed to show the new content if shared
          if (shareToFeed) {
                setTimeout(() => {
                  console.log('🔄 Dispatching refreshFeed event...')
              window.dispatchEvent(new CustomEvent('refreshFeed'))
            }, 800)
            }
          } else {
          console.error('❌ Save-media failed:', saveRes.status, saveBody || saveText);
          addNotification('Error please try again', saveBody?.error || 'Failed to save media', 'error');
        }
        return
      } catch (error) {
        console.error('❌ Error in save flow:', error);
        addNotification('Error please try again', 'Failed to save generated media', 'error');
      }

      // Success: stop progress
      endGeneration(genId);
      setNavGenerating(false);
      
      // Clear preset only on success
      if (chosen && PRESETS[chosen]) {
        clearPresetAfterGeneration();
      }
      
      // Handle V2V processing status
      if (isVideoPreview) {
        if (body.status === 'processing' || body.status === 'queued') {
          addNotification('Add to queue', 'Your video is being processed. This may take 2-5 minutes.', 'processing');
          // TODO: Implement polling for V2V status updates
          console.log('🎬 V2V job started:', body.job_id || 'unknown');
        } else if (body.status === 'completed') {
                      addNotification('V2V Complete!', 'Your video has been generated successfully!', 'ready', undefined, 'video', () => {
              // Refresh user media to show the new video
              // TODO: Implement user media refresh
            });
        }
      }

      // Refresh quota
      try {
        const qRes = await authenticatedFetch('/.netlify/functions/getQuota');
        if (qRes.ok) setQuota(await qRes.json());
      } catch {}

    } catch (e) {
      console.error('dispatchGenerate error', e);
      endGeneration(genId);
      setNavGenerating(false);
    } finally {
      // Only clear preset on success, not on failure
      // We'll handle preset clearing in the success path instead
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
    const genId = startGeneration()
    setIsComposerOpen(false)
    setNavGenerating(true)
    try {
      // Get current profile settings
      const { shareToFeed, allowRemix } = await getUserProfileSettings()
      
      // Enforce server-side quota and generate via aimlApi
      // Ensure source is uploaded to Cloudinary
      let sourceUrl = previewUrl!
      if (selectedFile) {
        const up = await uploadToCloudinary(selectedFile, `users/${authService.getCurrentUser()?.id || 'me'}`)
        sourceUrl = up.secure_url
      }
      const body: Record<string, any> = {
        prompt: (promptOverride ?? prompt).trim(),
        image_url: sourceUrl,
        resource_type: isVideoPreview ? 'video' : 'image',
        source: 'custom',
        visibility: shareToFeed ? 'public' : 'private',
        allow_remix: shareToFeed ? allowRemix : false,
        num_variations: generateTwo ? 2 : 1,
      }
      // If a preset is selected, include its negative prompt and strength
      if (selectedPreset && PRESETS[selectedPreset]) {
        const preset = PRESETS[selectedPreset]
        if (preset.negative_prompt) body.negative_prompt = preset.negative_prompt
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
        endGeneration(genId)
        setNavGenerating(false)
        return
      }
      // Success: stop progress
      endGeneration(genId)
      setNavGenerating(false)
      
      // Clear preset after successful generation
      if (selectedPreset && PRESETS[selectedPreset]) {
        clearPresetAfterGeneration();
      }
      
      // Optionally refresh quota
      try {
        const qRes = await authenticatedFetch('/.netlify/functions/getQuota')
        if (qRes.ok) setQuota(await qRes.json())
      } catch {}
    } catch (e) {
      console.error('Generate error', e)
      endGeneration(genId)
      setNavGenerating(false)
    }
  }

  const handlePresetClick = (presetName: PresetKey) => {
    console.log('🎯 handlePresetClick called with:', presetName)
    
    // Check authentication first
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to auth')
              // Sign up required - no notification needed
      navigate('/auth')
      return
    }
    
    // Check if preset exists
    if (!PRESETS[presetName]) {
      console.error('❌ Preset not found in PRESETS:', presetName)
      console.log('🔍 Available presets:', Object.keys(PRESETS))
      return
    }
    
    // Selecting a preset should use the preset prompt, not populate user input
    const preset = PRESETS[presetName]
    console.log('🎯 Preset clicked:', presetName, preset)
    
    setSelectedPreset(presetName)
    console.log('✅ selectedPreset set to:', presetName)
    
    // Show success message
            // Preset applied - no notification needed
    
    // Check if we have media to work with
    if (!previewUrl) {
      console.log('⚠️ No previewUrl available, cannot auto-generate')
      return
    }
    
    console.log('🚀 Starting auto-generation with preset:', presetName)
    // Auto-start generation with preset immediately (no delay)
    handlePresetAutoGeneration(presetName);
  }

  // Auto-generate with preset - simplified to use existing dispatchGenerate
  const handlePresetAutoGeneration = async (presetName: PresetKey) => {
    console.log('🚀 handlePresetAutoGeneration called with:', presetName)
    
    if (!previewUrl) {
      console.log('❌ No previewUrl available, cannot generate')
      return;
    }
    
    // Prevent multiple simultaneous generations
    if (isGenerating) {
      console.log('⚠️ Generation already in progress, ignoring request');
      return;
    }

    console.log('🚀 Auto-generating with preset:', presetName);
    
    // Use the existing dispatchGenerate function with 'preset' kind
    // This ensures all the proper validation, error handling, and database saving happens
    await dispatchGenerate('preset');
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
              // Copied - no notification needed
    } catch (e) {
              // Copy failed - no notification needed
    }
  }

  const handleLike = async (media: UserMedia) => {
    if (!authService.getToken()) {
              // Sign up required - no notification needed
      navigate('/auth')
      return
    }
    const res = await interactionService.toggleLike(media.id)
    if (res.success) {
      setFeed((cur) => cur.map((m) => (m.id === media.id ? { ...m, likes: res.likeCount ?? m.likes } : m)))
    }
  }

  const handleShare = async (media: UserMedia) => {
    // UI guards: prevent sharing until asset is ready
    if (!media.cloudinaryPublicId || !media.mediaType) {
      console.error('Cannot share: missing cloudinary_public_id or media_type');
      addNotification('Cannot share incomplete media', undefined, 'error');
      return;
    }
    
    // Open social media share modal instead of feed sharing
    setShareModalOpen(true)
    setShareModalMedia(media)
  }

  const handleUnshare = async (media: UserMedia) => {
    if (!authService.getToken()) {
              // Sign up required - no notification needed
      navigate('/auth')
      return
    }
    
    if (NO_DB_MODE) {
      try {
        // derive publicId from known fields or URL
        const publicId = (media as any).cloudinaryPublicId || media.id || (media.url?.split('/').pop()?.split('.')[0])
        if (!publicId) {
          console.error('togglePublish: missing publicId')
          return
        }
        await togglePublish(publicId, false)
        // Trigger feed refresh
        setTimeout(() => window.dispatchEvent(new CustomEvent('refreshFeed')), 800)
      } catch (e) {
        console.error('togglePublish failed', e)
      }
      return
    }
    
    console.log('📤 Unsharing media:', media.id)
    
    const r = await fetch('/.netlify/functions/recordShare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authService.getToken()}` },
      body: JSON.stringify({ 
        asset_id: media.id, 
        shareToFeed: false, 
        allowRemix: false 
      }),
    })
    
    if (r.ok) {
      const result = await r.json()
      console.log('✅ Unshare successful:', result)
              // Removed from feed - no notification needed
      // Refresh the feed to hide the content
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshFeed'));
      }, 1000);
    } else {
      // Handle non-JSON errors gracefully
      let error;
      try {
        error = await r.json();
      } catch (parseError) {
        const errorText = await r.text();
        error = { error: errorText };
      }
      console.error('❌ Unshare failed:', error)
      addNotification('Error please try again', error.error || 'Failed to remove media from feed', 'error')
    }
  }

  const handleRemix = async (media: UserMedia) => {
    if (media.allowRemix === false) return // allow when undefined
    if (!authService.getToken()) {
              // Sign up required - no notification needed
      navigate('/auth')
      return
    }
    
    try {
      // Use the stored cloudinary_public_id and media_type from the feed data
      if (!media.cloudinaryPublicId || !media.mediaType) {
        console.error('Missing cloudinary_public_id or media_type for remix');
        addNotification('Failed to start remix', undefined, 'error');
        return;
      }
      
      // Create new asset using the OUTPUT as next INPUT
      const { ok, data, error } = await createAsset({
        sourcePublicId: media.cloudinaryPublicId,
        mediaType: media.mediaType,
        presetKey: selectedPreset,
        sourceAssetId: media.id, // Keep lineage
      });
      
      if (!ok) {
        console.error('Failed to create remix asset:', error);
        addNotification('Failed to create remix', undefined, 'error');
        return;
      }
      
      console.log('✅ Remix asset created:', data);
      
      // Set up the composer with the source media
      setPreviewUrl(media.url);
      setIsVideoPreview(media.type === 'video');
      setSelectedFile(null);
      setIsComposerOpen(true);
      setPrompt(media.prompt || '');
    
    // Clear selectedPreset when remixing
      requestClearPreset('remix started');
    
    // Auto-generate remix if we have the prompt
    if (media.prompt) {
      // Small delay to ensure state is set
        setTimeout(() => dispatchGenerate('remix'), 100);
      }
      
      addNotification('Remix started', undefined, 'queue');
    } catch (error) {
      console.error('Error creating remix:', error);
      addNotification('Failed to start remix', undefined, 'error');
    }
  }

  const handleMediaClick = (media: UserMedia) => {
    console.log('🔍 HomeNew handleMediaClick:', {
      id: media.id,
      prompt: media.prompt,
      userId: media.userId,
      type: media.type,
      hasPrompt: !!media.prompt,
      promptLength: media.prompt?.length || 0
    })
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

  // Local floating notifications in Home - New beautiful design
  const [notifications, setNotifications] = useState<Array<{ 
    id: number; 
    title: string; 
    type: 'queue'|'ready'|'error';
    mediaUrl?: string;
    mediaType?: 'image'|'video';
    onClick?: () => void;
  }>>([])
  
  const addNotification = (title: string, message?: string, type?: 'queue'|'ready'|'error'|'processing'|'success'|'warning'|'complete', mediaUrl?: string, mediaType?: 'image'|'video', onClick?: () => void) => {
    // Map notification types to our new simplified system
    let mappedType: 'queue'|'ready'|'error' = 'ready';
    let simplifiedTitle = title;
    
    if (type === 'queue' || type === 'processing') {
      mappedType = 'queue';
      simplifiedTitle = 'Add to queue';
    } else if (type === 'ready' || type === 'success' || type === 'complete') {
      mappedType = 'ready';
      simplifiedTitle = 'Media is ready';
    } else if (type === 'error' || type === 'warning') {
      mappedType = 'error';
      simplifiedTitle = 'Error please try again';
    }
    
    const n = { 
      id: Date.now(), 
      title: simplifiedTitle, 
      type: mappedType, 
      timestamp: new Date().toISOString(),
      mediaUrl,
      mediaType,
      onClick: mappedType === 'ready' ? onClick : undefined // Only ready notifications are clickable
    }
    
    setNotifications((prev) => [n, ...prev].slice(0, 3)) // Show exactly 3 notifications
    
    // Auto-remove notifications after appropriate time
    if (mappedType === 'error') {
      setTimeout(() => setNotifications((prev) => prev.filter((x) => x.id !== n.id)), 6000)
    } else if (mappedType === 'queue') {
      setTimeout(() => setNotifications((prev) => prev.filter((x) => x.id !== n.id)), 4000)
    } else {
      // Ready notifications stay until clicked or manually closed
      setTimeout(() => setNotifications((prev) => prev.filter((x) => x.id !== n.id)), 8000)
    }
  }
  
  const removeNotification = (id: number) => setNotifications((prev) => prev.filter((x) => x.id !== id))

  // Video job polling functions
  const startVideoJobPolling = (jobId: string) => {
    // Clear any existing polling
    if (videoJobPolling) {
      clearInterval(videoJobPolling)
    }

    const interval = setInterval(async () => {
      try {
        const token = authService.getToken()
        const response = await fetch(`/.netlify/functions/poll-v2v?id=${jobId}&persist=true`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (response.ok) {
          const jobStatus = await response.json()
          setCurrentVideoJob(jobStatus)
          if (jobStatus && jobStatus.status === 'done') {
            clearInterval(interval)
            setVideoJobPolling(null)
            setCurrentVideoJob(null)
            addNotification('Your media is ready', 'Video processing completed successfully!', 'ready', undefined, 'video', () => {})
            window.dispatchEvent(new CustomEvent('refreshFeed'))
            window.dispatchEvent(new Event('userMediaUpdated'))
          } else if (jobStatus && jobStatus.status === 'failed') {
            clearInterval(interval)
            setVideoJobPolling(null)
            setCurrentVideoJob(null)
            addNotification('Failed', jobStatus.error || 'Video processing failed', 'error')
          }
        }
      } catch (error) {
        console.error('Video job polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    setVideoJobPolling(interval)
  }

  const stopVideoJobPolling = () => {
    if (videoJobPolling) {
      clearInterval(videoJobPolling)
      setVideoJobPolling(null)
    }
    setCurrentVideoJob(null)
  }

  // Save current composer state as a draft (local only)
  const handleSaveDraft = async () => {
    if (!previewUrl || !prompt.trim()) {
      addNotification('Draft not saved', 'Upload media and enter a prompt first', 'warning')
      return
    }
    
    try {
      const user = authService.getCurrentUser()
      if (!user?.id) {
        addNotification('Sign up required', 'Please sign up to save drafts', 'warning')
        navigate('/auth')
        return
      }
      
      const userId = user.id
      const key = `user_drafts_${userId}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      
      const draft = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        userId,
        type: isVideoPreview ? 'video' as const : 'photo' as const,
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
        metadata: { quality: 'high' as const, generationTime: 0, modelVersion: 'draft' }
      }
      
      // Save draft to localStorage
      const updatedDrafts = [draft, ...existing].slice(0, 200) // Keep max 200 drafts
      localStorage.setItem(key, JSON.stringify(updatedDrafts))
      
      // Also save to userMediaService for consistency
      try {
        await userMediaService.saveMedia(draft)
      } catch (error) {
        console.warn('Failed to save draft to userMediaService:', error)
      }
      
      // Show success notification
      addNotification('Draft saved!', 'Find it under Profile → Draft tab', 'success')
      
      // Dispatch event to notify ProfileScreen to refresh drafts
      window.dispatchEvent(new Event('userMediaUpdated'))
      
    } catch (error) {
      console.error('Failed to save draft:', error)
      addNotification('Save failed', 'Could not save draft', 'error')
    }
  }

  // Load user profile from database
  const loadUserProfileFromDatabase = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      console.log('🔄 Loading user profile from database...')
      const response = await fetch('/.netlify/functions/get-user-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        console.log('✅ User profile loaded from database:', userData)
        
        // Update localStorage with profile data
        const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
        const updatedProfile = { 
          ...currentProfile, 
          name: userData.name || '',
          avatar: userData.avatar || ''
        }
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
      } else {
        console.warn('⚠️ Failed to load user profile from database')
      }
    } catch (error) {
      console.error('❌ Failed to load user profile from database:', error)
    }
  }

  // Check for tier promotions (surprise notifications!)
  const checkTierPromotion = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      console.log('🎉 Checking for tier promotions...')
      const response = await fetch('/.netlify/functions/check-tier-promotion', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.promoted) {
          console.log('🎉 User was promoted!', result)
          
          // Show surprise notification
          addNotification(
            result.message,
            `You've been promoted from ${result.oldTier} to ${result.newTier}!`,
            'ready'
          )
          
          // Refresh user data to show new tier
          await getUserProfileSettings()
        }
      }
    } catch (error) {
      console.error('❌ Failed to check tier promotion:', error)
    }
  }

  // Update user settings and persist to database
  const updateUserSettings = async (newSettings: { shareToFeed?: boolean; allowRemix?: boolean }) => {
    if (!isAuthenticated || !authService.getToken()) {
      console.warn('⚠️ Cannot update settings: user not authenticated')
      return false
    }

    try {
      // Get current settings
      const currentSettings = await getUserProfileSettings()
      const updatedSettings = { ...currentSettings, ...newSettings }

      // Update in database
      const response = await fetch('/.netlify/functions/user-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSettings)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Settings updated in database:', result)
        
        // Update localStorage
        const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
        const updatedProfile = { ...currentProfile, ...result }
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
        
        return true
      } else {
        console.error('❌ Failed to update settings in database:', response.status)
        return false
      }
    } catch (error) {
      console.error('❌ Error updating settings:', error)
      return false
    }
  }

  return (
    <div className="flex min-h-screen bg-black relative overflow-hidden">

      
      {/* Floating top nav - only for logged in users */}
      {isAuthenticated && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
          {/* Filter */}
          <div className="relative" data-filter-dropdown>
            <button
              onClick={() => {
                setFilterOpen((v) => !v)
              }}
              className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors border border-white/20"
              title="Filter"
              aria-expanded={filterOpen}
              aria-haspopup="menu"
              data-nav-button
              data-nav-type="filter"
            >
              <Filter size={18} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-2 bg-[#333333] border border-white/20 rounded-2xl shadow-2xl p-2 w-40 z-50">
                <button onClick={() => { setCurrentFilter('all'); setFilterOpen(false) }} className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${currentFilter==='all'?'bg-white/10 text-white':'text-white/70 hover:text-white hover:bg-white/5'}`}>All</button>
                <button onClick={() => { setCurrentFilter('images'); setFilterOpen(false) }} className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${currentFilter==='images'?'bg-white/10 text-white':'text-white/70 hover:text-white hover:bg-white/5'}`}>Images</button>
                <button onClick={() => { setCurrentFilter('videos'); setFilterOpen(false) }} className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${currentFilter==='videos'?'bg-white/10 text-white':'text-white/70 hover:text-white hover:bg-white/5'}`}>Videos</button>
              </div>
            )}
          </div>

          {/* Notification bell */}
          <div className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors border border-white/20">
            <NotificationBell userId={authService.getCurrentUser()?.id || ''} />
          </div>

          {/* Profile with progress ring */}
          <div className="relative" data-user-menu>
            <button onClick={() => { 
              setUserMenu((v) => !v) 
            }} className="relative w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors border border-white/20" aria-haspopup="menu" aria-expanded={userMenu} data-nav-button data-nav-type="user">
              {navGenerating && (<span className="absolute -inset-1 rounded-full border-2 border-white/50 animate-spin" style={{ borderTopColor: 'transparent' }} />)}
              {(() => {
                const user = authService.getCurrentUser()
                const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
                if (userProfile.avatar) {
                  return <img src={userProfile.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                } else if (user?.name || user?.email) {
                  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase()
                  return <div className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium flex items-center justify-center">{initial}</div>
                } else {
                  return <ProfileIcon size={16} className="text-white" />
                }
              })()}
            </button>
            {userMenu && (
              <div className="absolute right-0 mt-2 bg-[#333333] border border-white/20 rounded-2xl shadow-2xl p-2 w-40 z-50">
                <button onClick={() => { setUserMenu(false); navigate('/profile') }} className="w-full text-left px-3 py-2 text-white/90 hover:bg-white/5 rounded-lg transition-colors">Profile</button>
                <button onClick={() => { setUserMenu(false); navigate('/auth') }} className="w-full text-left px-3 py-2 text-white/90 hover:bg-white/5 rounded-lg transition-colors">Sign out</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login button for non-authenticated users */}
      {!isAuthenticated && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors shadow-lg"
          >
            Login
          </button>
        </div>
      )}

      {/* Left sidebar with upload button - 15% width */}
      <div className="hidden md:flex w-[15%] sticky top-0 h-screen items-center justify-center">
        <div className="relative">
          {/* Animated white dot orbiting around the button border */}
          <div className="absolute inset-0 w-16 h-16">
            <div className="absolute w-1 h-1 bg-white rounded-full animate-spin" style={{ 
              animationDuration: '3s',
              transformOrigin: '8px 8px',
              left: '50%',
              top: '0',
              marginLeft: '-2px',
              marginTop: '-2px'
            }}></div>
          </div>
          
          <button
            onClick={handleUploadClick}
            className="w-16 h-16 rounded-full bg-black border-2 border-white/30 text-white shadow-2xl hover:bg-white/10 hover:border-white/50 btn-optimized relative z-10 flex items-center justify-center"
            aria-label="Upload"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Main content area - 85% width, full screen height */}
      <div className="w-[85%] min-h-screen">
        {/* Feed content - positioned under floating nav with proper padding */}
        <div className="px-6 pt-24 pb-8">
          {isLoadingFeed ? (
            <div className="space-y-6">
              {/* Subtle loading skeleton */}
              <div className="grid grid-cols-3 gap-6">
                {[...Array(12)].map((_, index) => (
                  <div key={index} className="space-y-3">
                    {/* Image placeholder */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-white/5 to-white/10 rounded-xl animate-pulse"></div>
                    {/* Text placeholders */}
                    <div className="space-y-2">
                      <div className="h-3 bg-white/5 rounded-full w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-white/5 rounded-full w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : feed.length > 0 ? (
            <MasonryMediaGrid
              media={feed}
              columns={3}
              onMediaClick={handleMediaClick}
              onLike={handleLike}
              onShare={handleShare}
              onRemix={handleRemix}
              onFilterCreator={(userId) => setCreatorFilter(userId)}
              showActions={true}
              className="pb-24"
              hideUserAvatars={false}
              hideShareButton={true}
              hideLikeButton={false}
            />
          ) : (
            <div className="text-center py-12">
              
            </div>
          )}
        </div>
      </div>

      {/* Creator filter banner */}
      {creatorFilter && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-white/10 text-white text-xs px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
          Filtering by creator • <button className="underline" onClick={() => setCreatorFilter(null)}>clear</button>
        </div>
      )}

      {/* Guest gate overlay removed - existing system in place */}

      {/* Compact floating notifications - positioned under the profile section */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2" style={{ position: 'fixed', top: '5rem', right: '1rem', zIndex: 9999 }}>
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={`w-64 bg-[#333333] border border-white/20 rounded-lg shadow-2xl btn-fast ${
                n.onClick ? 'cursor-pointer hover:bg-[#3a3a3a]' : ''
              }`}
              onClick={n.onClick}
            >
              <div className="px-3 py-2 relative">
                {/* Close button - top right */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(n.id);
                  }} 
                  className="absolute top-1 right-1 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 btn-fast"
                >
                  <X size={10} className="text-white" />
                </button>
                
                {/* Title only - compact */}
                <div className="pr-6">
                  <h3 className="text-white text-sm font-medium truncate">
                    {n.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-6 right-6 relative navbar-stable">
        {/* Animated white dot orbiting around the button border */}
        <div className="absolute inset-0 w-16 h-16">
          <div className="absolute w-1 h-1 bg-white rounded-full animate-spin" style={{ 
            animationDuration: '3s',
            transformOrigin: '8px 8px',
            left: '50%',
            top: '0',
            marginLeft: '-2px',
            marginTop: '-2px'
          }}></div>
        </div>
        
        <button
          onClick={handleUploadClick}
          className="w-16 h-16 rounded-full bg-black border-2 border-white/30 text-white shadow-2xl hover:bg-white/10 hover:border-white/50 btn-optimized relative z-10 flex items-center justify-center"
          aria-label="Upload"
        >
          <Plus size={24} />
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

      {/* Bottom-centered composer */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm navbar-stable">
          {/* Close button */}
          <button type="button" onClick={closeComposer} className="absolute top-4 right-4 z-50 pointer-events-auto text-white/80 hover:text-white transition-colors" aria-label="Close">
            <X size={20} />
          </button>
          
          {/* Media preview area - centered above prompt */}
          <div className="absolute inset-0 flex items-center justify-center pb-32">
            <div className="relative w-full max-w-2xl px-6">
              <div ref={containerRef} className="w-full flex items-center justify-center">
                {isVideoPreview ? (
                  <video ref={(el) => (mediaRef.current = el)} src={previewUrl || ''} className="max-w-full max-h-[60vh] object-contain" controls onLoadedMetadata={measure} onLoadedData={measure} />
                ) : (
                  <img ref={(el) => (mediaRef.current = el as HTMLImageElement)} src={previewUrl || ''} alt="Preview" className="max-w-full max-h-[60vh] object-contain" onLoad={measure} />
                )}
              </div>
            </div>
          </div>

          {/* Bottom composer bar - 70% width, centered */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[70%] min-w-[500px] max-w-[800px]">
            <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl px-4 pt-2 pb-2 shadow-2xl">
                            {/* Prompt input - horizontal bar like screenshot */}
              <div className="mb-8">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the style you want..."
                  className="w-full bg-transparent text-white placeholder-white/40 text-xs focus:outline-none"
                />
              </div>

              {/* Bottom controls row - variations/presets left, actions right */}
              <div className="flex items-center justify-between">
                {/* Left: Variations toggle + Presets */}
                <div className="flex items-center gap-3">
                  {/* Variations selector */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                    <button
                      type="button"
                        onClick={() => setGenerateTwo(false)}
                        className={`w-6 h-6 rounded text-xs font-medium transition-colors relative group ${
                          !generateTwo ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title="1 variation"
                      >
                        1
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black/80 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          1 variation
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenerateTwo(true)}
                        className={`w-6 h-6 rounded text-xs font-medium transition-colors relative group ${
                          generateTwo ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title="2 variations"
                      >
                        2
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black/80 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          2 variations
                        </span>
                    </button>
                    </div>
                  </div>

                  {/* Presets dropdown button */}
                  <div className="relative" data-presets-dropdown>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          // Sign up required - no notification needed
                          navigate('/auth')
                          return
                        }
                        setPresetsOpen((v) => !v)
                      }}
                      className={`px-3 py-1.5 rounded-2xl text-xs border transition-colors ${
                        isAuthenticated 
                          ? 'bg-white/10 text-white border-white/20 hover:bg-white/15' 
                          : 'bg-white/5 text-white/50 border-white/10 cursor-not-allowed'
                      }`}
                      data-nav-button
                      data-nav-type="presets"
                      title={isAuthenticated ? 'Choose AI style presets' : 'Sign up to use AI presets'}
                      disabled={!isAuthenticated}
                    >
                      {selectedPreset ? PRESETS[selectedPreset].label : 'Presets'}
                    </button>
                    
                    {/* Presets dropdown - clean and simple */}
                    {presetsOpen && (
                      <div className="absolute bottom-full left-0 mb-2 bg-[#333333] border border-white/20 rounded-xl shadow-2xl p-3 w-80 z-50">
                        {/* Preset options - all visible, no scrolling */}
                        <div className="space-y-1">
                          {/* None option */}
                          <button
                            onClick={() => {
                              requestClearPreset('user clicked clear')
                              setPresetsOpen(false)
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                              !selectedPreset 
                                ? 'bg-white/20 text-white' 
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <span>None</span>
                            {!selectedPreset && (
                              <div className="w-4 h-4 rounded-full bg-white border-2 border-white/30"></div>
                            )}
                          </button>
                          
                          {/* Preset options */}
                          {weeklyPresetNames.map((name) => (
                            <button
                              key={name}
                              onClick={() => {
                                handlePresetClick(name)
                                setPresetsOpen(false)
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                                selectedPreset === name 
                                  ? 'bg-white/20 text-white' 
                                  : 'text-white/80 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <span>{PRESETS[name].label}</span>
                              {selectedPreset === name ? (
                                <div className="w-4 h-4 rounded-full bg-white border-2 border-white/30"></div>
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-white/30"></div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        // Sign up required - no notification needed
                        navigate('/auth')
                        return
                      }
                      handleSaveDraft()
                    }}
                    title={isAuthenticated ? 'Save to draft' : 'Sign up to save drafts'}
                    className={`w-9 h-9 rounded-full btn-optimized flex items-center justify-center border relative group ${
                      isAuthenticated 
                        ? 'bg-white/10 text-white border-white/20 hover:bg-white/15' 
                        : 'bg-white/5 text-white/50 border-white/10 cursor-not-allowed'
                    }`}
                    aria-label="Save to draft"
                    disabled={!isAuthenticated}
                  >
                    <FileText size={14} />
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black/80 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      Save to draft
                    </span>
                  </button>
                  <button 
                    onClick={() => {
                      // Show immediate feedback that button was clicked
                      if (!isGenerating) {
                        setNavGenerating(true)
                        // Small delay to show the loading state before starting generation
                        setTimeout(() => {
                          dispatchGenerate(selectedPreset ? 'preset' : 'custom')
                        }, 100)
                      }
                    }} 
                    disabled={!previewUrl || (!prompt.trim() && !selectedPreset) || isGenerating} 
                    className={`w-10 h-10 rounded-full btn-optimized flex items-center justify-center shadow-lg hover:shadow-xl ${
                      !previewUrl || (!prompt.trim() && !selectedPreset) || isGenerating 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : 'bg-white text-black hover:bg-white/90'
                    }`}
                    aria-label="Generate"
                    title={`${!isAuthenticated ? 'Sign up to generate AI content' : !previewUrl ? 'Upload media first' : (!prompt.trim() && !selectedPreset) ? 'Enter a prompt or select a preset first' : isGenerating ? 'Generation in progress...' : selectedPreset ? `Generate with ${PRESETS[selectedPreset].label} preset` : 'Generate AI content'}`}
                  >
                    {isGenerating || navGenerating ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <ArrowUp size={18} />
                    )}
                  </button>
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

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        mediaUrl={shareModalMedia?.url}
        caption={shareModalMedia?.prompt}
        title="Share Your Creation"
      />

      {/* Video Job Status Display */}
      {currentVideoJob && (
        <div className="fixed bottom-4 right-4 bg-[#333333] border border-white/20 rounded-xl p-4 shadow-2xl z-50">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="text-white text-sm">
              <div className="font-medium">Video Processing</div>
              <div className="text-white/60 text-xs">Job #{currentVideoJob.id.slice(0, 8)}</div>
            </div>
            <button 
              onClick={stopVideoJobPolling}
              className="text-white/60 hover:text-white transition-colors"
              title="Stop monitoring"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}


    </div>
  )
}

export default HomeNew


