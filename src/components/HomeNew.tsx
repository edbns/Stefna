import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, X, ArrowUp, Filter, FileText, ChevronDown } from 'lucide-react'
import { authenticatedFetch } from '../utils/apiClient'
import authService from '../services/authService'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'
import MasonryMediaGrid from './MasonryMediaGrid'
import interactionService from '../services/interactionService'
import type { UserMedia } from '../services/userMediaService'
import NotificationBell from './NotificationBell'
import { useToasts } from './ui/Toasts'
import ProfileIcon from './ProfileIcon'
import { useProfile } from '../contexts/ProfileContext'
import { usePresetRunner } from '../hooks/usePresetRunner'
import { useSelectedPreset } from '../stores/selectedPreset'
import { HiddenUploader } from './HiddenUploader'
import { useIntentQueue } from '../state/intentQueue'
import { getHttpsSource, storeSelectedFile } from '../services/mediaSource'
import { postAuthed } from '../utils/fetchAuthed'
import { runsStore } from '../stores/runs'
import { uploadSourceToCloudinary } from '../services/uploadSource'
import { useGenerationMode } from '../stores/generationMode'
import { runMoodMorph } from '../services/moodMorph'

import { getSourceFileOrThrow } from '../services/source'



// Safe wrapper for MasonryMediaGrid with fallback
interface SafeMasonryGridProps {
  feed: UserMedia[]
  handleMediaClick: (media: UserMedia) => void
  handleRemix: (media: UserMedia) => void
}

const SafeMasonryGrid: React.FC<SafeMasonryGridProps> = ({
  feed,
  handleMediaClick,
  handleRemix
}) => {
  try {
    return (
      <MasonryMediaGrid
        media={feed}
        columns={3}
        onMediaClick={handleMediaClick}
        onRemix={(media) => handleRemix(media)}
        showActions={true}
        className="pb-24"
      />
    )
  } catch (error) {
    console.error('🚨 MasonryMediaGrid failed, using fallback:', error)
    // Safe fallback - simple grid without fancy components
    return (
      <div className="grid grid-cols-3 gap-2 pb-24">
        {feed.slice(0, 12).map((item, index) => (
          <div key={item.id} className="aspect-square bg-gray-200 rounded overflow-hidden">
            <img 
              src={item.url} 
              alt={item.prompt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    )
  }
}


  


import { PRESETS, resolvePreset } from '../utils/presets/types'
import presetRotationService from '../services/presetRotationService'
import captionService from '../services/captionService'
import { presetsStore } from '../stores/presetsStore'
import { onPresetClick } from '../handlers/presetHandlers'
import { onTimeMachineClick } from '../handlers/timeMachineHandlers'

import { validateModeMappings } from '../utils/validateMappings'
import FullScreenMediaViewer from './FullScreenMediaViewer'
import ShareModal from './ShareModal'


import { requireUserIntent } from '../utils/generationGuards'
import userMediaService from '../services/userMediaService'
import { pickResultUrl, ensureRemoteUrl } from '../utils/aimlUtils'
import { cloudinaryUrlFromEnv } from '../utils/cloudinaryUtils'
import { createAsset } from '../lib/api'
import { saveMediaNoDB, togglePublish } from '../lib/api'
import { Mode, MODE_LABELS, StoryTheme, TimeEra, RestoreOp } from '../config/modes'
import { resolvePresetForMode } from '../utils/resolvePresetForMode'
import { getPresetDef, getPresetLabel, MASTER_PRESET_CATALOG } from '../services/presets'
import { buildEffectivePrompt, type DetailLevel } from '../services/prompt'
import { paramsForI2ISharp } from '../services/infer-params'
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
  const { notifyQueue, notifyReady, notifyError } = useToasts()
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
  
  // Mode state
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)
  
  // Mode dropdown states
  const [selectedTheme, setSelectedTheme] = useState<StoryTheme | null>(null)
  const [selectedEra, setSelectedEra] = useState<TimeEra | null>(null)
  const [selectedOp, setSelectedOp] = useState<RestoreOp | null>(null)
  
  // Dropdown open states
  const [storyOpen, setStoryOpen] = useState(false)
  const [timeMachineOpen, setTimeMachineOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)

  
  // New preset runner system - MUST be declared before use
  const { queuePreset, queueOption, queueStory, onSourceReady, clearQueue, busy: presetRunnerBusy } = usePresetRunner()
  const { selectedPreset: stickySelectedPreset, setSelectedPreset: setStickySelectedPreset, ensureDefault } = useSelectedPreset()
  
  // Selected preset using sticky store instead of local state
  const selectedPreset = stickySelectedPreset
  const setSelectedPreset = setStickySelectedPreset

  // Stable ref for selectedPreset to prevent re-render issues during generation
  const selectedPresetRef = useRef<keyof typeof PRESETS | null>(null)
  const genIdRef = useRef(0) // increments per job to prevent race conditions
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)
  
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
  
  // Preset clearing functions updated for sticky presets
  function requestClearPreset(reason: string) {
    console.log(`🔒 Keeping sticky preset (${reason}):`, selectedPreset)
    // No longer clearing presets - they stay sticky for better UX
  }

  // Keep preset after successful generation (sticky behavior)
  const clearPresetAfterGeneration = () => {
    console.log('🔒 Keeping sticky preset after generation:', selectedPreset)
    // No longer clearing presets - they stay sticky for better UX
  }

  // Clear mode state after successful generation
  const clearModeAfterGeneration = () => {
    console.log('🎭 Clearing mode after generation')
    setSelectedMode(null)
    setSelectedTheme(null)
    setSelectedEra(null)
    setSelectedOp(null)
  }

  // Clear preset when user exits composer (debounced to avoid race)
  const clearPresetOnExit = () => {
    // Give time for success path to win first
    setTimeout(() => requestClearPreset('composer exit'), 300)
  }
  
  // Initialize presets store and validate mappings
  useEffect(() => {
    (async () => {
      await presetsStore.getState().load()
      validateModeMappings()
    })()
  }, [])

  // Initialize sticky preset system when PRESETS are loaded
  useEffect(() => {
    if (Object.keys(PRESETS).length > 0) {
      const activePresets = Object.keys(PRESETS) as (keyof typeof PRESETS)[]
      ensureDefault(activePresets)
    }
  }, [PRESETS, ensureDefault])

  // Debug preset changes
  useEffect(() => {
    console.log('🔍 selectedPreset changed to:', selectedPreset)
    if (selectedPreset) {
      console.log('🎨 Preset details:', PRESETS[selectedPreset])
      // Update the ref for compatibility
      selectedPresetRef.current = selectedPreset
    } else {
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
        label: getPresetLabel(key, PRESETS),
        prompt: PRESETS[key as keyof typeof PRESETS]?.prompt?.substring(0, 50) + '...'
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


  // Get active presets from the rotation service
  const weeklyPresetNames = useMemo(() => {
    try {
      // Use direct preset keys instead of complex rotation service
      const presetKeys = Object.keys(PRESETS) as (keyof typeof PRESETS)[]
      if (import.meta.env.DEV) {
        console.log('🎨 Active presets for UI:', presetKeys)
      }
      
      // If no presets available, return empty array
      if (presetKeys.length === 0) {
        if (import.meta.env.DEV) {
          console.debug('⚠️ No active presets from API, using rotation fallback')
        }
        // Fallback to hardcoded presets if the rotation service fails
        const fallbackPresets: (keyof typeof PRESETS)[] = [
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
      const fallbackPresets: (keyof typeof PRESETS)[] = [
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
  const [expandedStorySection, setExpandedStorySection] = useState<string | null>(null)
  
  // Profile state from context
  const { profileData } = useProfile()
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
  
  // Hooks moved up to avoid "used before declaration" errors
  
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
      
      // Close mode dropdowns

    }

    // Close dropdowns when global nav close event is dispatched
    const handleGlobalNavClose = () => {
      setFilterOpen(false)
      setUserMenu(false)
      setPresetsOpen(false)
      setStoryOpen(false)
      setTimeMachineOpen(false)
      setRestoreOpen(false)
    }

    // Close dropdowns when Escape key is pressed
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFilterOpen(false)
        setUserMenu(false)
        setPresetsOpen(false)
        setStoryOpen(false)
        setTimeMachineOpen(false)
        setRestoreOpen(false)
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
    setStoryOpen(false)
    setTimeMachineOpen(false)
    setRestoreOpen(false)
  }

  const handleUploadClick = () => {
    closeAllDropdowns() // Close all dropdowns when opening composer
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('📁 File selected:', { name: file.name, size: file.size, type: file.type })

    // Create preview URL for display only
    const preview = URL.createObjectURL(file)
    console.log('🖼️ Preview URL created:', preview)

    // Store both: File for upload, preview URL for display
    setSelectedFile(file)                    // File used for upload
    setPreviewUrl(preview)                   // blob: used only for <img> preview
    storeSelectedFile(file)                  // Store globally for blob: fallback
    
    // Also store in generation store for centralized access
    const { useGenerationStore } = await import('../stores/generationStore')
    useGenerationStore.getState().setSelectedFile(file)                    // keep the File object
    useGenerationStore.getState().setSelectedFileName(file.name)           // separate field for UI
    useGenerationStore.getState().setPreviewUrl(preview)
    useGenerationStore.getState().setPreviewDataUrl(undefined)
    useGenerationStore.getState().setPreviewBlob(undefined)
    
    console.log('✅ File state updated, opening composer')
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
      // Don't clear selectedPreset - it should persist for remix generation
    }
  }, [location])

  // Debug composer state
  useEffect(() => {
    if (isComposerOpen) {
      import('../stores/generationStore').then(({ useGenerationStore }) => {
        const genState = useGenerationStore.getState()
        console.log('🎭 Composer opened with state:', { 
          previewUrl, 
          selectedFile: selectedFile?.name, 
          genStoreFile: genState.selectedFile instanceof File ? genState.selectedFile.name : 'not a File',
          genStoreFileName: genState.selectedFileName,
          isVideoPreview,
          hasPreviewUrl: !!previewUrl,
          previewUrlType: previewUrl?.startsWith('blob:') ? 'blob' : previewUrl?.startsWith('data:') ? 'data' : 'other',
          actualPreviewUrl: previewUrl
        })
      })
    }
  }, [isComposerOpen, previewUrl, selectedFile, isVideoPreview])

  // Handle generation completion events from the pipeline
  useEffect(() => {
    const handleGenerationComplete = (event: CustomEvent) => {
      const { record, resultUrl } = event.detail
      console.log('🎉 Generation completed, updating UI state:', record)
      
      // Create UserMedia object for the new result
      const newMedia: UserMedia = {
        id: record.public_id || `generated-${Date.now()}`,
        userId: record.user_id || 'current-user',
        type: 'photo', // TODO: detect video vs image
        url: resultUrl,
        prompt: record.prompt || 'AI Generated Content',
        aspectRatio: 4/3,
        width: 800,
        height: 600,
        timestamp: new Date().toISOString(),
        tokensUsed: 2,
        likes: 0,
        remixCount: 0,
        isPublic: false,
        allowRemix: false,
        tags: record.tags || [],
        metadata: {
          quality: 'high',
          generationTime: 0,
          modelVersion: '1.0'
        }
      }
      
      // Update feed if it should be public
      if (record.visibility === 'public') {
        setFeed(prev => [newMedia, ...prev])
      }
      
      // Dispatch event to update user media
      window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
        detail: { optimistic: newMedia } 
      }))
      
      // Show the result in viewer
      setViewerMedia([newMedia])
      setViewerStartIndex(0)
      setViewerOpen(true)
    }

    const handleGenerationSuccess = (event: CustomEvent) => {
      const { message } = event.detail
      console.log('✅ Generation success:', message)
      // The toast is already handled by the generation pipeline
    }

    const handleGenerationError = (event: CustomEvent) => {
      const { message } = event.detail
      console.log('❌ Generation error:', message)
      notifyError({ title: 'Generation failed', message })
    }

    const handleCloseComposer = () => {
      setIsComposerOpen(false)
    }

    window.addEventListener('generation-complete', handleGenerationComplete as EventListener)
    window.addEventListener('generation-success', handleGenerationSuccess as EventListener)
    window.addEventListener('generation-error', handleGenerationError as EventListener)
    window.addEventListener('close-composer', handleCloseComposer as EventListener)

    return () => {
      window.removeEventListener('generation-complete', handleGenerationComplete as EventListener)
      window.removeEventListener('generation-success', handleGenerationSuccess as EventListener)
      window.removeEventListener('generation-error', handleGenerationError as EventListener)
      window.removeEventListener('close-composer', handleCloseComposer as EventListener)
    }
  }, [])

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
            userId: item.user_id || '', // Use actual user ID or empty string to hide tooltip
            userAvatar: item.user_avatar || undefined, // Use actual user avatar if available
            userTier: item.user_tier || undefined, // Use actual user tier if available
            type: item.media_type === 'video' ? 'video' : 'photo',
            url: mediaUrl,
            thumbnailUrl: mediaUrl, // Use same URL for thumbnail
            prompt: item.prompt || 'AI Generated Content', // Use actual prompt or fallback
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

  // Listen for auth state changes (like logout)
  useEffect(() => {
    const handleAuthChange = () => {
      const authState = authService.getAuthState()
      setIsAuthenticated(authState.isAuthenticated)
      console.log('🔐 Auth state changed:', authState)
      
      // If user logged out, clear any user-specific state
      if (!authState.isAuthenticated) {
        console.log('🚪 User logged out, clearing state')
        // Clear any user-specific state here if needed
        setQuota(null)
      }
    }

    // Listen for custom auth events
    window.addEventListener('auth-state-changed', handleAuthChange)
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange)
    }
  }, [])

  // Restore preset selection from localStorage on mount
  useEffect(() => {
    const savedPreset = localStorage.getItem('selectedPreset') as keyof typeof PRESETS | null
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

  // Ensure UI never stays globally locked on unmount
  useEffect(() => {
    return () => {
      setIsGenerating(false)
      setNavGenerating(false)
    }
  }, [])

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
  async function dispatchGenerate(
    kind: 'preset' | 'custom' | 'remix' | 'mode',
    options?: {
      presetId?: string;
      presetData?: any;
      mode?: string;
      modeOption?: string;
      promptOverride?: string;
    }
  ) {
    const t0 = performance.now();
    
    // Generate run ID to avoid cross-talk
    const runId = crypto.randomUUID();
    setCurrentRunId(runId);
    console.info('▶ dispatchGenerate', { kind, options, runId });
    
    // Assertions before calling aimlApi
    if (options?.presetId) {
      console.assert(PRESETS[options.presetId], `Preset ${options.presetId} must be valid before generate`);
      if (!PRESETS[options.presetId]) {
        console.error('❌ Invalid preset assertion failed:', options.presetId);
        notifyError({ title: 'Invalid preset', message: 'Please select a valid style preset' });
        return;
      }
    }
    
    // Start generation with ID guard
    const genId = startGeneration();
    setNavGenerating(true);

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
      endGeneration(genId);
      setNavGenerating(false);
      return;
    }

    // Use preset prompt if no user prompt provided
    let effectivePrompt = '';
    let modeMeta: any = null;
    
    // Use passed preset data or fallback to global state
    const currentPresetId = options?.presetId || selectedPreset;
    const currentPrompt = options?.promptOverride || prompt;
    
    // Handle mode-based generation with new system
    const currentMode = options?.mode || selectedMode;
    const currentModeOption = options?.modeOption || (selectedTheme || selectedEra || selectedOp);
    
    if (kind === 'mode' && currentMode && currentModeOption) {
      const resolvedPreset = resolvePresetForMode({
        mode: currentMode,
        option: currentModeOption as string,
        activePresets: PRESETS
      });
      
      // Create mode metadata for tracking
      modeMeta = {
        mode: currentMode,
        option: currentModeOption as string,
        mapping_version: 'v2',
      };
      
      // Get preset definition from active presets or master catalog
      const presetDef = getPresetDef(resolvedPreset, PRESETS);
      if (presetDef) {
        // Determine detail level based on mode
        const detailLevel: DetailLevel = selectedMode === 'story' ? 'medium' : 'hard';
        
        // Use the new prompt building system with subject locking
        const { positives, negatives } = buildEffectivePrompt({
          base: presetDef.prompt,
          user: prompt.trim() || undefined,
          detail: detailLevel,
          lockSurfer: true, // Enable surfer subject lock for all modes
          mode: selectedMode,
          extraNeg: presetDef.negative_prompt
        });
        
        effectivePrompt = positives;
        console.log(`🎭 Using mode "${selectedMode}" → preset "${resolvedPreset}" (${detailLevel} detail):`, effectivePrompt);
        if (negatives) {
          console.log(`🚫 Negative prompt:`, negatives);
        }
      } else {
        console.warn(`⚠️ Preset ${resolvedPreset} not found, using fallback`);
        effectivePrompt = 'stylize, preserve subject and composition';
      }
    }

    // Check if we have either a preset, mode, or user prompt
    const hasPreset = Boolean(currentPresetId);
    const hasPrompt = Boolean(prompt.trim());
    const hasMode = Boolean(currentMode);
    
    if (!hasPreset && !hasPrompt && !hasMode) {
      console.warn('No preset, mode, or user prompt selected; aborting.');
      // Pick a preset or add a prompt - no notification needed
      endGeneration(genId);
      setNavGenerating(false);
      return;
    }
    
    console.log('🔍 Preset selection debug:', {
      selectedPreset,
      currentPresetId,
      hasPreset: !!currentPresetId,
      presetExists: currentPresetId ? !!PRESETS[currentPresetId] : false,
      presetPrompt: currentPresetId ? PRESETS[currentPresetId]?.prompt : 'N/A'
    });
    
    // Skip this logic if we already set effectivePrompt from mode
    if (!effectivePrompt) {
      if (currentPresetId && PRESETS[currentPresetId]) {
        // If preset is selected, use ONLY the preset prompt (ignore user prompt field)
        effectivePrompt = PRESETS[currentPresetId].prompt;
        console.log(`🎨 Using preset "${currentPresetId}":`, effectivePrompt);
      } else if (prompt.trim()) {
        // If no preset but user typed a prompt, use that
        effectivePrompt = prompt.trim();
        console.log('✍️ Using user prompt:', effectivePrompt);
      } else {
        // Only use fallback if no preset and no user prompt
        effectivePrompt = 'stylize, preserve subject and composition';
        console.log('🔄 Using fallback prompt:', effectivePrompt);
      }
    }
    
    // Add "Make it obvious" test option for debugging
    const makeItObvious = prompt.toLowerCase().includes('make it obvious') || prompt.toLowerCase().includes('test');
    if (makeItObvious) {
      effectivePrompt = 'black-and-white line art, no color, heavy outlines, flat shading, cartoon style';
      console.log('🔎 Using "Make it obvious" test prompt:', effectivePrompt);
    }
    
    // Use the new preset system for better prompt mapping
    if (currentPresetId) {
      const preset = PRESETS[currentPresetId as keyof typeof PRESETS];
      if (preset?.prompt) {
        effectivePrompt = preset.prompt;
        console.log(`🎨 Using new preset system "${currentPresetId}" (${isVideoPreview ? 'V2V' : 'I2I'}):`, effectivePrompt);
      }
    }
    
    console.log('🎯 Final effective prompt:', effectivePrompt);
    
    // Log preset usage for debugging
    if (currentPresetId && PRESETS[currentPresetId]) {
      console.log('🎨 Preset used in generation:', {
        presetName: currentPresetId,
        presetLabel: getPresetLabel(currentPresetId, PRESETS),
        presetPrompt: PRESETS[currentPresetId].prompt,
        finalPrompt: effectivePrompt
      });
      
      // Track preset usage for rotation analytics
      presetRotationService.trackPresetUsage(currentPresetId);
    } else if (currentPresetId && !PRESETS[currentPresetId]) {
      console.warn('⚠️ Invalid preset selected:', currentPresetId);
    }
    
    if (!effectivePrompt) {
      console.warn('No prompt available; aborting.');
      endGeneration(genId);
      setNavGenerating(false);
      return;
    }

    if (!isAuthenticated) {
      console.warn('User not authenticated; redirecting to auth.');
      navigate('/auth');
      endGeneration(genId);
      setNavGenerating(false);
      return;
    }

    // Apply user intent guard
    if (requireUserIntent({ userInitiated: true, source: kind })) {
      console.warn('⛔ Generation blocked by guard');
      endGeneration(genId);
      setNavGenerating(false);
      return;
    }

    try {
      // Log the final generation parameters
      console.log('🚀 Starting generation with:', {
        kind,
        effectivePrompt,
        selectedPreset: currentPresetId,
        isVideo: isVideoPreview
      });
      
      // Start generation with ID guard (already set at function start)
      // Just close the composer; keep using outer genId
      setIsComposerOpen(false);
      
      // Keep preset selected for user convenience (stateless generation doesn't need clearing)

      // Enforce server-side quota and generate via aimlApi
      // Use new uploadSource service - pass File object, not blob URL
      const uploadResult = await uploadSourceToCloudinary({
        file: selectedFile,    // Pass the File object directly
        url: undefined         // Don't pass preview URL
      })
      const sourceUrl = uploadResult.secureUrl
      
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

      // Detect if source is a video based on multiple criteria
      const isVideo = isVideoPreview || 
                     /\/video\/upload\//.test(sourceUrl || '') ||
                     /\.(mp4|mov|webm|m4v)(\?|$)/i.test(sourceUrl || '');

      // Build payload with correct URL key based on media type
      const payload: Record<string, any> = {
        prompt: effectivePrompt,
        ...(isVideo ? { video_url: sourceUrl } : { image_url: sourceUrl }), // ✅ Use correct key
        isVideo, // Explicit flag for server-side model selection
        // Clean payload - only essential fields for vendor
        fps: 24,
        duration: isVideo ? 5 : undefined,
        stabilization: false,
        // Internal fields for our system (not sent to vendor)
        source: kind,
        visibility: shareToFeed ? 'public' : 'private',
        allow_remix: shareToFeed ? allowRemix : false,
        // Mode metadata for tracking and display
        ...(modeMeta && { modeMeta }),
        num_variations: generateTwo ? 2 : 1,
        strength: 0.85,  // For I2I processing
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
          const startRes = await fetch('/.netlify/functions/start-gen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
            body: JSON.stringify({
              video_url: sourceUrl,  // Will be converted to frame on server
              prompt: effectivePrompt,
              duration: 3,  // I2V default duration
              fps: 24,
              stabilization: false,
              frameSecond: 0,  // Extract frame at start (TODO: add UI slider)
              tier: 'standard'  // TODO: add pro tier selection
            })
          });
          const startJson = await startRes.json().catch(() => ({}));
          if (!startRes.ok || !startJson?.job_id) {
            throw new Error(startJson?.error || 'start-v2v failed');
          }
          notifyQueue({ title: 'Added to queue', message: 'We\'ll start processing shortly.' })
          setCurrentVideoJob({ id: startJson.job_id, status: 'queued' });
          startVideoJobPolling(startJson.job_id, startJson.model, effectivePrompt);
          // Optimistic placeholder in Profile: show processing tile
          try {
            const user = authService.getCurrentUser()
            if (user?.id) {
              const placeholder: UserMedia = {
                id: `job-${startJson.job_id}`,
                userId: user.id,
                type: 'video',
                url: sourceUrl!,
                thumbnailUrl: sourceUrl!,
                status: 'processing',
                prompt: effectivePrompt,
                aspectRatio: 4/3,
                width: 800,
                height: 600,
                timestamp: new Date().toISOString(),
                tokensUsed: 0,
                likes: 0,
                remixCount: 0,
                isPublic: shareToFeed,
                allowRemix: allowRemix,
                tags: [],
                metadata: { quality: 'high', generationTime: 0, modelVersion: 'pending' }
              }
              // Broadcast to profile to render immediately
              window.dispatchEvent(new CustomEvent('userMediaUpdated', { detail: { optimistic: placeholder } }))
            }
          } catch {}
        } catch (err:any) {
          console.error('start-v2v error', err);
          notifyError({ title: 'Failed', message: err?.message || 'Video job failed to start' });
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

      // Handle video job creation (status 202) - includes Story Mode
      if (res.status === 202 && body.job_id && (isVideoPreview || body.kind === 'story')) {
        if (body.kind === 'story') {
          notifyQueue({ title: 'Your Story is ready', message: 'Creating your 4-shot story video...' })
        } else {
          notifyQueue({ title: 'Add to queue', message: 'Processing will begin shortly.' })
        }
        setCurrentVideoJob({ id: body.job_id, status: 'queued' })
        startVideoJobPolling(body.job_id, body.model, effectivePrompt)
        endGeneration(genId)
        setNavGenerating(false)
        return
      }

      if (!res.ok) {
        // Handle different error types
        if (res.status === 501 && isVideoPreview) {
          notifyQueue({ title: 'Added to queue', message: 'We will start processing shortly.' });
          // Don't return - let the processing continue
        } else if (res.status === 429) {
          notifyError({ title: 'Something went wrong', message: 'Rate limited' });
          endGeneration(genId);
          setNavGenerating(false);
          return;
        } else {
          throw new Error(body?.error || `aimlApi ${res.status}`);
        }
      }

      // Process the generated result(s) using robust parsing
      const resultUrl = pickResultUrl(body);
      const allResultUrls = body.result_urls || [resultUrl];
      const variationsGenerated = body.variations_generated || 1;
      
      if (!resultUrl) {
        console.error('No result URL in response:', body);
        throw new Error('No result URL in API response');
      }

      console.info(`Generated ${variationsGenerated} variation(s):`, allResultUrls);

      // Show the first generated result immediately with cache busting
      const cacheBustedResultUrl = `${resultUrl}${resultUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setPreviewUrl(cacheBustedResultUrl);
      
      // Add success notification
      notifyReady({ 
        title: 'Your media is ready', 
        message: 'Tap to open', 
        thumbUrl: resultUrl, 
        onClickThumb: () => {
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
        } 
      });

      // Save the generated media to the database
          try {
            const jwt = authService.getToken();
            const userId = authService.getCurrentUser()?.id;
            
            if (!jwt || !userId) {
              console.error('No JWT or user ID for saveMedia');
           notifyError({ title: 'Something went wrong', message: 'Generated, but not saved (auth error)' });
              return;
            }

        if (NO_DB_MODE) {
          // Optimistic placeholder for images too
          try {
            if (userId) {
              const placeholder: UserMedia = {
                id: `img-${Date.now()}`,
                userId,
                type: 'photo',
                url: cacheBustedResultUrl,
                thumbnailUrl: cacheBustedResultUrl,
                status: 'processing',
                prompt: effectivePrompt,
                aspectRatio: 4/3,
                width: 800,
                height: 600,
                timestamp: new Date().toISOString(),
                tokensUsed: 0,
                likes: 0,
                remixCount: 0,
                isPublic: shareToFeed,
                allowRemix: allowRemix,
                tags: [],
                metadata: { quality: 'high', generationTime: 0, modelVersion: 'pending' }
              }
              window.dispatchEvent(new CustomEvent('userMediaUpdated', { detail: { optimistic: placeholder } }))
            }
          } catch {}
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
            notifyError({ title: 'Something went wrong', message: e?.message || 'Failed to save media' })
            try {
              if (userId) {
                const removeId = undefined // not tracked precisely for images; grid will refresh shortly
              }
            } catch {}
          }
          endGeneration(genId);
          setNavGenerating(false);
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
          notifyError({ title: 'Something went wrong', message: 'Failed to create asset record' });
          endGeneration(genId);
          setNavGenerating(false);
          return;
        }

        const assetId = assetResult.data.id;
        console.log('✅ Asset created:', assetId);

        // Save all variations to the database
        console.log(`💾 Saving ${allResultUrls.length} variation(s) to database...`);
        let savedCount = 0;
        let saveErrors: any[] = [];

        for (let i = 0; i < allResultUrls.length; i++) {
          const variationUrl = allResultUrls[i];
          console.log(`💾 Saving variation ${i + 1}/${allResultUrls.length}:`, variationUrl);

          try {
            const saveRes = await fetch('/.netlify/functions/save-media', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${jwt}` 
              },
              body: JSON.stringify({
                assetId: assetId,
                resultUrl: variationUrl,
                mediaTypeHint: 'image',
                userId,
                shareNow: !!shareToFeed,
                prompt: effectivePrompt,
                // Include mode metadata from aimlApi response
                ...(body.modeMeta && { modeMeta: body.modeMeta }),
                // Add variation metadata
                variationIndex: i,
                totalVariations: allResultUrls.length,
              })
            });
            
            const saveText = await saveRes.text();
            let saveBody: any = {};
            try { saveBody = JSON.parse(saveText); } catch {}
            
            if (saveRes.ok && saveBody?.ok) {
              savedCount++;
              console.log(`✅ Variation ${i + 1} saved successfully:`, saveBody);
            } else {
              console.error(`❌ Variation ${i + 1} save failed:`, saveRes.status, saveBody || saveText);
              saveErrors.push({ variation: i + 1, error: saveBody?.error || 'Save failed' });
            }
          } catch (error) {
            console.error(`❌ Variation ${i + 1} save error:`, error);
            saveErrors.push({ variation: i + 1, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }

        console.log(`💾 Saved ${savedCount}/${allResultUrls.length} variations successfully`);

        if (savedCount > 0) {
          // Refresh the feed to show the new content if shared
          if (shareToFeed) {
            setTimeout(() => {
              console.log('🔄 Dispatching refreshFeed event...')
              window.dispatchEvent(new CustomEvent('refreshFeed'))
            }, 800)
          }
          
          // Show success notification with variation count
          if (variationsGenerated > 1) {
            notifyReady({ 
              title: 'Your media is ready', 
              message: `${savedCount} variation${savedCount > 1 ? 's' : ''} generated`,
              thumbUrl: resultUrl 
            });
          }
        } else {
          console.error('❌ All variations failed to save:', saveErrors);
          notifyError({ title: 'Something went wrong', message: 'Failed to save generated media' });
        }
        endGeneration(genId);
        setNavGenerating(false);
        return
      } catch (error) {
        console.error('❌ Error in save flow:', error);
        notifyError({ title: 'Something went wrong', message: 'Failed to save generated media' });
      }

      // Success: stop progress
      endGeneration(genId);
      setNavGenerating(false);
      
      // Keep preset selected for user convenience (stateless generation doesn't need clearing)
      
      // Clear mode state on success
      if (selectedMode) {
        // Track mode success analytics before clearing
        try {
          const resolvedPreset = resolvePresetForMode({
            mode: selectedMode,
            option: (selectedTheme || selectedEra || selectedOp) as string,
          });
          
          console.log('📊 Mode analytics - success:', {
            mode: selectedMode,
            theme: selectedTheme,
            era: selectedEra,
            op: selectedOp,
            preset: resolvedPreset,
            timestamp: new Date().toISOString()
          });
          
          // TODO: Send to analytics service when available
          // analytics.track('mode_generation_completed', { mode: selectedMode, theme: selectedTheme, era: selectedEra, op: selectedOp, preset: resolvedPreset });
        } catch (error) {
          console.warn('⚠️ Analytics tracking failed:', error);
        }
        
        clearModeAfterGeneration();
      }
      
      // Handle V2V processing status
      if (isVideoPreview) {
        if (body.status === 'processing' || body.status === 'queued') {
          notifyQueue({ title: 'Added to queue', message: 'We will start processing shortly.' });
          // TODO: Implement polling for V2V status updates
          console.log('🎬 V2V job started:', body.job_id || 'unknown');
        } else if (body.status === 'completed') {
          notifyReady({ title: 'Your media is ready', message: 'Tap to open' });
              // Refresh user media to show the new video
              // TODO: Implement user media refresh
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
      // Check if this is still the current run (ignore late completions)
      if (currentRunId === runId) {
        setCurrentRunId(null);
        console.info('⏹ dispatchGenerate done', (performance.now() - t0).toFixed(1), 'ms');
      } else {
        console.warn('⚠️ Ignoring late completion for run:', runId, 'current:', currentRunId);
      }
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
      // Use new uploadSource service - never fetch blob URLs
      const uploadResult = await uploadSourceToCloudinary({
        file: selectedFile,
        url: previewUrl
      })
      const sourceUrl = uploadResult.secureUrl
      
      // Determine if this should be a video job (Story Mode creates MP4s)
      const isStoryMode = selectedMode === 'story';
      const shouldBeVideo = isVideoPreview || isStoryMode;
      
      const body: Record<string, any> = {
        prompt: (promptOverride ?? prompt).trim(),
        image_url: sourceUrl,
        resource_type: shouldBeVideo ? 'video' : 'image',
        source: 'custom',
        visibility: shareToFeed ? 'public' : 'private',
        allow_remix: shareToFeed ? allowRemix : false,
        num_variations: isStoryMode ? 4 : (generateTwo ? 2 : 1), // Story Mode needs 4 frames
      }
      
      // Add Story Mode specific parameters
      if (isStoryMode) {
        body.fps = 30;
        body.width = 1080;
        body.height = 1920;
        body.duration_ms = 7000;
        body.model = 'kling-1.6-standard-image-to-video'; // or preferred i2v model
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
      
      // Keep preset selected for user convenience (stateless generation doesn't need clearing)
      
      // Clear mode state after successful generation
      if (selectedMode) {
        // Track mode success analytics before clearing
        try {
          const resolvedPreset = resolvePresetForMode({
            mode: selectedMode,
            option: (selectedTheme || selectedEra || selectedOp) as string,
          });
          
          console.log('📊 Mode analytics - success (alt path):', {
            mode: selectedMode,
            theme: selectedTheme,
            era: selectedEra,
            op: selectedOp,
            preset: resolvedPreset,
            timestamp: new Date().toISOString()
          });
          
          // TODO: Send to analytics service when available
          // analytics.track('mode_generation_completed', { mode: selectedMode, theme: selectedTheme, era: selectedEra, op: selectedOp, preset: resolvedPreset });
        } catch (error) {
          console.warn('⚠️ Analytics tracking failed:', error);
        }
        
        clearModeAfterGeneration();
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

  // Helper to resolve source from various UI states
  function resolveSource(): {id: string, url: string} | null {
    // For now, just use previewUrl if available
    // TODO: Implement proper fullscreen viewer, selected media, and upload tracking
    if (previewUrl) return { id: 'preview', url: previewUrl };
    return null;
  }

  const handlePresetClick = async (presetName: keyof typeof PRESETS) => {
    console.log('🎯 handlePresetClick called with:', presetName)
    
    // Check authentication first
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to auth')
      navigate('/auth')
      return
    }
    
    // Set UI state (selectedPreset is now UI-only)
    setSelectedPreset(presetName)
    console.log('✅ selectedPreset set to:', presetName)
    
    // Close composer immediately and show progress on avatar
    setIsComposerOpen(false)
    setNavGenerating(true)
    
    // Check if we have a valid source using the resolver
    const source = resolveSource()
    if (!source) {
      console.log('⚠️ No valid source found for preset generation')
      notifyError({ title: 'Pick a photo/video first', message: 'Select media, then apply a preset.' })
      setNavGenerating(false)
      return
    }
    
    console.log('🚀 Starting generation with preset:', presetName, 'source:', source.id)
    try {
      await onPresetClick(presetName, undefined, source.url)
    } catch (error) {
      console.error('❌ Preset generation failed:', error)
      notifyError({ title: 'Generation failed', message: 'Please try another preset.' })
    } finally {
      setNavGenerating(false)
    }
  }

  // Auto-generate with preset - simplified to use existing dispatchGenerate
  const handlePresetAutoGeneration = async (presetName: keyof typeof PRESETS) => {
    console.log('🚀 handlePresetAutoGeneration called with:', presetName)
    
    if (!previewUrl) {
      console.log('❌ No previewUrl available, cannot generate')
      return;
    }

    console.log('🚀 Auto-generating with preset:', presetName);
    
    // Use the existing dispatchGenerate function with 'preset' kind
    // This ensures all the proper validation, error handling, and database saving happens
    await dispatchGenerate('preset');
  }

  // Mode handlers for one-click generation
  const handleModeClick = async (mode: 'time_machine'|'story'|'restore', option: string) => {
    console.log('🎯 handleModeClick called with:', { mode, option })
    
    // Check authentication first
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to auth')
      navigate('/auth')
      return
    }
    
    if (!previewUrl) {
      console.log('❌ No previewUrl available, cannot generate')
      notifyError({ title: 'Upload a photo first', message: 'Please upload a photo to use this mode' })
      return
    }
    
    // Close composer immediately and show immediate feedback that button was clicked
    setIsComposerOpen(false)
    setNavGenerating(true)
    
    try {
      // Import the new utility
      const { prepareSourceAsset } = await import('../utils/prepareSourceAsset')
      
      // Always upload the asset (prefer File; fall back to blob URL)
      const source = selectedFile || previewUrl;
      const { url: remoteUrl, resource_type } = await prepareSourceAsset(source)
      if (resource_type !== 'image') { 
        notifyError({ title: 'Photo required', message: 'Story / Time Machine / Restore need a photo' })
        setNavGenerating(false)
        return
      }

      // Set UI state
      setSelectedMode(mode)
      
      // Use bulletproof handlers
      if (mode === 'story') {
        await runStory(remoteUrl, prompt)
      } else if (mode === 'time_machine') {
        await onTimeMachineClick(option, remoteUrl)
      } else if (mode === 'restore') {
        // For restore, we can use time machine handler with restore mapping
        await onTimeMachineClick(option, remoteUrl)
      }
      
    } catch (error) {
      console.error('❌ Mode generation failed:', error)
      notifyError({ title: 'Generation failed', message: 'Please try another photo or style.' })
    } finally {
      setNavGenerating(false)
    }
  }







  const handleShare = async (media: UserMedia) => {
    // UI guards: prevent sharing until asset is ready
    if (!media.cloudinaryPublicId || !media.mediaType) {
      console.error('Cannot share: missing cloudinary_public_id or media_type');
      notifyError({ title: 'Something went wrong', message: 'Cannot share incomplete media' });
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
      notifyError({ title: 'Failed', message: error.error || 'Failed to remove media from feed' })
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
        notifyError({ title: 'Something went wrong', message: 'Failed to start remix' });
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
        notifyError({ title: 'Something went wrong', message: 'Failed to create remix' });
        return;
      }
      
      console.log('✅ Remix asset created:', data);
      
      // Set up the composer with the source media
      setPreviewUrl(media.url);
      setIsVideoPreview(false); // Always treat as image for now
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
      
      notifyQueue({ title: 'Added to queue', message: 'Remix started' });
    } catch (error) {
      console.error('Error creating remix:', error);
      notifyError({ title: 'Something went wrong', message: 'Failed to start remix' });
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

  // Debug: Log filter results
  console.log(`🔍 Filter Debug:`, {
    currentFilter,
    totalFeed: feed.length,
    filteredFeed: filteredFeed.length,
    videoCount: feed.filter(item => item.type === 'video').length,
    imageCount: feed.filter(item => item.type === 'photo').length,
    sampleTypes: feed.slice(0, 5).map(item => ({ id: item.id, type: item.type }))
  })

  // Local floating notifications in Home - New beautiful design
  // Legacy notifications removed in favor of unified toasts

  // Video job polling functions
  const startVideoJobPolling = (jobId: string, model?: string, prompt?: string) => {
    // Clear any existing polling
    if (videoJobPolling) {
      clearInterval(videoJobPolling)
    }

    const interval = setInterval(async () => {
      try {
        const token = authService.getToken()
        const modelParam = model ? `&model=${encodeURIComponent(model)}` : ''
        const promptParam = prompt ? `&prompt=${encodeURIComponent(prompt)}` : ''
        const response = await fetch(`/.netlify/functions/poll-gen?id=${encodeURIComponent(jobId)}&model=${encodeURIComponent(model || 'kling-video/v1.6/standard/image-to-video')}&persist=true${promptParam}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (response.ok) {
          const jobStatus = await response.json()
          const normalized = { id: jobStatus?.job_id || jobId, status: jobStatus?.status, error: jobStatus?.error }
          setCurrentVideoJob(normalized as any)
          if (jobStatus && (jobStatus.status === 'done' || jobStatus.status === 'completed')) {
            clearInterval(interval)
            setVideoJobPolling(null)
            setCurrentVideoJob(null)
            // Defensive parse of V2V payload
            const resultUrl = jobStatus?.record?.resultUrl || jobStatus?.data?.resultUrl || jobStatus?.result_url
            const publicId = jobStatus?.record?.publicId || jobStatus?.data?.publicId || jobStatus?.cloudinary_public_id
            console.log('poll-v2v payload:', jobStatus)
            if (!resultUrl && !publicId) {
              console.warn('V2V done but missing resultUrl/publicId')
            }
            notifyReady({ title: 'Your media is ready', message: 'Tap to open' })
            window.dispatchEvent(new CustomEvent('refreshFeed'))
            window.dispatchEvent(new Event('userMediaUpdated'))
          } else if (jobStatus && (jobStatus.status === 'failed' || jobStatus.status === 'timeout')) {
            clearInterval(interval)
            setVideoJobPolling(null)
            setCurrentVideoJob(null)
            notifyError({ title: 'Failed', message: jobStatus.error || (jobStatus.status === 'timeout' ? 'Timed out' : 'Video processing failed') })
            try {
              // mark any optimistic placeholder as failed so the tile shows red briefly
              const user = authService.getCurrentUser()
              if (user?.id) {
                const placeholderId = `job-${jobId}`
                window.dispatchEvent(new CustomEvent('userMediaUpdated', { detail: { markFailedId: placeholderId } }))
                // remove after 10s
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('userMediaUpdated', { detail: { removeId: placeholderId } }))
                }, 10000)
              }
            } catch {}
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
       notifyError({ title: 'Something went wrong', message: 'Upload media and enter a prompt first' })
      return
    }
    
    try {
      const user = authService.getCurrentUser()
      if (!user?.id) {
        notifyError({ title: 'Something went wrong', message: 'Please sign up to save drafts' })
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
      notifyReady({ title: 'Your media is ready', message: 'Draft saved' })
      
      // Dispatch event to notify ProfileScreen to refresh drafts
      window.dispatchEvent(new Event('userMediaUpdated'))
      
    } catch (error) {
      console.error('Failed to save draft:', error)
      notifyError({ title: 'Something went wrong', message: 'Could not save draft' })
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
        
        // Store full user profile for onboarding check
        // Profile data is now managed by ProfileContext
        
        // Profile setup is now handled through the edit profile modal in ProfileScreen
        
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
          
          // Show surprise notification (unified toasts)
          notifyReady({ title: result.message, message: `Upgraded to ${result.newTier}` })
          
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

  // Clean up when composer closes
  useEffect(() => {
    if (!isComposerOpen) {
      // User cancelled / modal closed → make uploader reusable
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      // Revoke blob URL to prevent memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      
      // Reset file state
      setSelectedFile(null)
      window.__lastSelectedFile = undefined
    }
  }, [isComposerOpen])

  const { mode, setMode } = useGenerationMode()
  
  return (
    <div className="flex min-h-screen bg-black relative overflow-hidden">
      {/* Hidden file uploader for intent-based uploads */}
      <HiddenUploader />

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
                <button onClick={() => { setCurrentFilter('all'); setFilterOpen(false) }} className={(() => {
                  const baseClass = 'w-full text-left px-3 py-2 rounded-lg transition-colors';
                  const activeClass = 'bg-white/10 text-white';
                  const inactiveClass = 'text-white/70 hover:text-white hover:bg-white/5';
                  return `${baseClass} ${currentFilter === 'all' ? activeClass : inactiveClass}`;
                })()}>All</button>
                <button onClick={() => { setCurrentFilter('images'); setFilterOpen(false) }} className={(() => {
                  const baseClass = 'w-full text-left px-3 py-2 rounded-lg transition-colors';
                  const activeClass = 'bg-white/10 text-white';
                  const inactiveClass = 'text-white/70 hover:text-white hover:bg-white/5';
                  return `${baseClass} ${currentFilter === 'images' ? activeClass : inactiveClass}`;
                })()}>Images</button>
                <button onClick={() => { setCurrentFilter('videos'); setFilterOpen(false) }} className={(() => {
                  const baseClass = 'w-full text-left px-3 py-2 rounded-lg transition-colors';
                  const activeClass = 'bg-white/10 text-white';
                  const inactiveClass = 'text-white/70 hover:text-white hover:bg-white/5';
                  return `${baseClass} ${currentFilter === 'videos' ? activeClass : inactiveClass}`;
                })()}>Videos</button>
              </div>
            )}
          </div>

          {/* Notification bell */}
          <div className="relative">
            <div className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors border border-white/20">
              <NotificationBell userId={authService.getCurrentUser()?.id || ''} />
            </div>
          </div>

          {/* Profile with progress ring */}
          <div className="relative" data-user-menu>
            <button onClick={() => { 
              setUserMenu((v) => !v) 
            }} className="relative w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors border border-white/20" aria-haspopup="menu" aria-expanded={userMenu} data-nav-button data-nav-type="user">
              {navGenerating && (<span className="absolute -inset-1 rounded-full border-2 border-white/50 animate-spin" style={{ borderTopColor: 'transparent' }} />)}
              {(() => {
                const user = authService.getCurrentUser()
                if (profileData.avatar && typeof profileData.avatar === 'string') {
                  return <img src={profileData.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                } else if (profileData.name || user?.name || user?.email) {
                  const initial = (profileData.name || user?.name || user?.email || 'U').charAt(0).toUpperCase()
                  return <div className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium flex items-center justify-center">{initial}</div>
                } else {
                  return <ProfileIcon size={16} className="text-white" />
                }
              })()}
            </button>
            {userMenu && (
              <div className="absolute right-0 mt-2 bg-[#333333] border border-white/20 rounded-2xl shadow-2xl p-2 w-40 z-50">
                <button onClick={() => { setUserMenu(false); navigate('/profile') }} className="w-full text-left px-3 py-2 text-white/90 hover:bg-white/5 rounded-lg transition-colors">Profile</button>
                <button onClick={() => { setUserMenu(false); authService.logout(); navigate('/') }} className="w-full text-left px-3 py-2 text-white/90 hover:bg-white/5 rounded-lg transition-colors">Sign out</button>
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
            <SafeMasonryGrid 
              feed={feed}
              handleMediaClick={handleMediaClick}
              handleRemix={handleRemix}
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

      {/* Unified toasts handle notifications globally */}

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
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {/* Full Screen Media Viewer */}
      <FullScreenMediaViewer
        isOpen={viewerOpen}
        media={viewerMedia}
        startIndex={viewerStartIndex}
        onClose={() => setViewerOpen(false)}

        onRemix={handleRemix}
        onShowAuth={() => navigate('/auth')}
      />

      {/* Bottom-centered composer */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm navbar-stable">
          {/* Close button */}
          <button type="button" onClick={closeComposer} className="absolute top-4 right-4 z-50 pointer-events-auto text-white/80 hover:text-white transition-colors bg-black/60 hover:bg-black/80 rounded-full p-2 backdrop-blur-sm" aria-label="Close">
            <X size={20} />
          </button>
          
          {/* Media preview area - centered above prompt */}
          <div className="absolute inset-0 flex items-center justify-center pb-32">
            <div className="relative w-full max-w-2xl px-6">
              <div ref={containerRef} className="w-full flex items-center justify-center">
                {isVideoPreview ? (
                  <video ref={(el) => (mediaRef.current = el)} src={previewUrl || ''} className="max-w-full max-h-[60vh] object-contain" controls onLoadedMetadata={measure} onLoadedData={measure} />
                ) : (
                  <img 
                    ref={(el) => (mediaRef.current = el as HTMLImageElement)} 
                    src={previewUrl || ''} 
                    alt="Preview" 
                    className="max-w-full max-h-[60vh] object-contain" 
                    onLoad={(e) => {
                      console.log('🖼️ Image loaded successfully:', previewUrl)
                      measure()
                    }}
                    onError={(e) => {
                      console.error('❌ Image failed to load:', previewUrl, e)
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bottom composer bar - compact, horizontally 70% */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-300 w-[70%] min-w-[500px] max-w-[800px]">
            <div className="bg-black border border-[#333333] rounded-2xl px-4 py-3 shadow-2xl transition-all duration-300">
              

              {/* Prompt Input - show for presets mode */}
              {mode === 'presets' && (
                <div className="mb-2">
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your vision or leave blank to use preset style..."
                      className="w-full px-3 py-2 bg-white/5 border border-[#333333] rounded-xl text-white placeholder-white/40 resize-none focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors h-20 text-sm"
                      disabled={isGenerating}
                    />
                    <div className="absolute bottom-2 right-2 text-white/30 text-xs">
                      {prompt.length}/500
                    </div>
                  </div>
                </div>
              )}

              {/* Single row with all controls */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Left: Variations toggle + Presets + MoodMorph */}
                <div className="flex items-center gap-2">
                  {/* Variations selector */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setGenerateTwo(false)}
                        className={(() => {
                          const baseClass = 'w-6 h-6 rounded text-xs font-medium transition-colors relative group';
                          const activeClass = 'bg-white text-black';
                          const inactiveClass = 'bg-white/10 text-white hover:bg-white/20';
                          return `${baseClass} ${!generateTwo ? activeClass : inactiveClass}`;
                        })()}
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
                        className={(() => {
                          const baseClass = 'w-6 h-6 rounded text-xs font-medium transition-colors relative group';
                          const activeClass = 'bg-white text-black';
                          const inactiveClass = 'bg-white/10 text-white hover:bg-white/20';
                          return `${baseClass} ${generateTwo ? activeClass : inactiveClass}`;
                        })()}
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
                      className={(() => {
                        const baseClass = 'px-3 py-1.5 rounded-2xl text-xs border transition-colors';
                        const activeClass = 'bg-white/10 text-white border-white/20 hover:bg-white/15';
                        const disabledClass = 'bg-white/5 text-white/50 border-white/10 cursor-not-allowed';
                        return `${baseClass} ${isAuthenticated ? activeClass : disabledClass}`;
                      })()}
                      data-nav-button
                      data-nav-type="presets"
                      title={isAuthenticated ? 'Choose AI style presets' : 'Sign up to use AI presets'}
                      disabled={!isAuthenticated}
                    >
                      {selectedPreset ? getPresetLabel(selectedPreset, PRESETS) : 'Presets'}
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
                            className={(() => {
                              const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm';
                              const activeClass = 'bg-white/20 text-white';
                              const inactiveClass = 'text-white/80 hover:text-white hover:bg-white/10';
                              return `${baseClass} ${!selectedPreset ? activeClass : inactiveClass}`;
                            })()}
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
                              className={(() => {
                                const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm';
                                const activeClass = 'bg-white/20 text-white';
                                const inactiveClass = 'text-white/80 hover:text-white hover:bg-white/10';
                                return `${baseClass} ${selectedPreset === name ? activeClass : inactiveClass}`;
                              })()}
                            >
                              <span>{getPresetLabel(name, PRESETS)}</span>
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

                  {/* MoodMorph™ button */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/auth')
                        return
                      }
                      setMode(mode === 'moodmorph' ? 'presets' : 'moodmorph')
                    }}
                    className={
                      !isAuthenticated
                        ? 'px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-white/5 text-white/50 border-white/10 cursor-not-allowed'
                        : mode === 'moodmorph'
                        ? 'px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-white text-black'
                        : 'px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-white/10 text-white border-white/20 hover:bg-white/15'
                    }
                    title={isAuthenticated ? 'Switch to MoodMorph™ mode' : 'Sign up to use MoodMorph™'}
                    disabled={!isAuthenticated}
                  >
                    MoodMorph™
                  </button>
                </div>

                {/* Right: Action buttons - Save to draft and Generate */}
                <div className="flex items-center gap-2">
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
                    className={(() => {
                      const baseClass = 'w-8 h-8 rounded-full flex items-center justify-center border transition-colors';
                      const activeClass = 'bg-white/10 text-white border-white/20 hover:bg-white/15';
                      const disabledClass = 'bg-white/5 text-white/50 border-white/10 cursor-not-allowed';
                      return `${baseClass} ${isAuthenticated ? activeClass : disabledClass}`;
                    })()}
                    aria-label="Save to draft"
                    disabled={!isAuthenticated}
                  >
                    <FileText size={14} />
                  </button>
                  <button 
                    onClick={() => {
                      // Show immediate feedback that button was clicked
                      setNavGenerating(true)
                      // Close composer with 100ms delay
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('close-composer'));
                      }, 100)
                      // Small delay to show the loading state before starting generation
                      setTimeout(() => {
                        if (mode === 'moodmorph') {
                          // Run MoodMorph™
                          runMoodMorph(selectedFile || undefined)
                        } else if (selectedPreset) {
                          // Run preset generation
                          dispatchGenerate('preset', {
                            presetId: selectedPreset,
                            presetData: PRESETS[selectedPreset],
                            promptOverride: prompt
                          })
                        } else {
                          // Run custom generation
                          dispatchGenerate('custom', {
                            promptOverride: prompt
                          })
                        }
                      }, 100)
                    }} 
                    disabled={!selectedFile || (mode === 'presets' && !prompt.trim() && !selectedPreset)} 
                    className={
                      (!selectedFile || (mode === 'presets' && !prompt.trim() && !selectedPreset))
                        ? 'w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-white text-black hover:bg-white/90'
                    }
                    aria-label={mode === 'moodmorph' ? 'Generate moods' : 'Generate'}
                    title={(() => {
                      if (!isAuthenticated) return 'Sign up to generate AI content';
                      if (!previewUrl) return 'Upload media first';
                      if (mode === 'moodmorph') return 'Generate 3 mood variations';
                      if (mode === 'presets' && !prompt.trim() && !selectedPreset) return 'Enter a prompt or select a preset first';
                      if (selectedPreset) return `Generate with ${getPresetLabel(selectedPreset, PRESETS)} preset`;
                      return 'Generate AI content';
                    })()}
                  >
                    {navGenerating ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <ArrowUp size={16} />
                    )}
                  </button>
                </div>
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

      {/* Video Job Status Display removed in favor of unified toasts */}

    </div>
  )
}

export default HomeNew


