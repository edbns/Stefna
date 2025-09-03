import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, X, FileText, ArrowUp } from 'lucide-react'
// Generate simple unique ID for runId
const generateRunId = () => `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
import { authenticatedFetch, signedFetch } from '../utils/apiClient'
import authService from '../services/authService'
import MasonryMediaGrid from './MasonryMediaGrid'
import SkeletonGrid from './SkeletonGrid'
import LoadingSpinner from './LoadingSpinner'
import LQIPImage from './LQIPImage'

import type { UserMedia } from '../services/userMediaService'
import { useToasts } from './ui/Toasts'
import ProfileIcon from './ProfileIcon'
import { useProfile } from '../contexts/ProfileContext'
import { usePresetRunner } from '../hooks/usePresetRunner'
import { IdentityPreservationService } from '../services/identityPreservationService'
import { toggleLike, getUserLikes, mapMediaTypeForAPI } from '../services/likesService'
import SimpleGenerationService, { GenerationMode, SimpleGenerationRequest } from '../services/simpleGenerationService'
import { prepareSourceAsset } from '../utils/prepareSourceAsset'
import { useSelectedPreset } from '../stores/selectedPreset'
import { HiddenUploader } from './HiddenUploader'

import { uploadSourceToCloudinary } from '../services/uploadSource'
import { storeSelectedFile } from '../services/mediaSource'
import { useGenerationMode } from '../stores/generationMode'
// MoodMorph removed - replaced with Anime Filters
import { EmotionMaskPicker } from './EmotionMaskPicker'
import { GhibliReactionPicker } from './GhibliReactionPicker'
import { NeoTokyoGlitchPicker } from './NeoTokyoGlitchPicker'
import { MediaUploadAgreement } from './MediaUploadAgreement'
import { paramsForI2ISharp } from '../services/infer-params'


// Identity-safe generation fallback system (integrated with IPA)
// Uses Replicate's face-preserving models when primary generation fails

// Safe wrapper for MasonryMediaGrid with fallback
interface SafeMasonryGridProps {
  feed: UserMedia[]
  handleMediaClick: (media: UserMedia) => void
  // handleRemix removed - no more remix functionality
  onLastItemRef?: (ref: HTMLDivElement | null) => void
  onPresetTagClick?: (presetType: string) => void
  onToggleLike?: (media: UserMedia) => void
  userLikes?: Record<string, boolean>
  isLoggedIn?: boolean
  onShowAuth?: () => void
}

const SafeMasonryGrid: React.FC<SafeMasonryGridProps> = ({
  feed,
  handleMediaClick,
  onLastItemRef,
  // handleRemix removed
  onPresetTagClick,
  onToggleLike,
  userLikes = {},
  isLoggedIn = false,
  onShowAuth
}) => {
  try {
    return (
      <MasonryMediaGrid
        media={feed}
        columns={3}
        onMediaClick={handleMediaClick}
        // onRemix removed - no more remix functionality
        showActions={true}
        className="pb-24 w-full"
        onLastItemRef={onLastItemRef}
        onPresetTagClick={onPresetTagClick}
        onToggleLike={onToggleLike}
        userLikes={userLikes}
        isLoggedIn={isLoggedIn}
        onShowAuth={onShowAuth}
      />
    )
  } catch (error) {
    console.error('🚨 MasonryMediaGrid failed, using fallback:', error)
    // Safe fallback - simple grid without fancy components
    return (
      <div className="grid grid-cols-3 gap-1 pb-24 w-full">
        {feed.slice(0, 16).map((item, index) => (
          <div 
            key={item.id} 
                            className="aspect-square bg-gray-800 rounded overflow-hidden"
            ref={index === feed.length - 1 ? onLastItemRef : undefined}
          >
            <img 
              src={item.url} 
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    )
  }
}


import { DatabasePreset } from '../services/presetsService'
// Preset collections now handled by database and simplified service
// Individual preset services removed - using direct function calls
import { EMOTION_MASK_PRESETS } from '../presets/emotionmask'
import { GHIBLI_REACTION_PRESETS } from '../presets/ghibliReact'
import { NEO_TOKYO_GLITCH_PRESETS } from '../presets/neoTokyoGlitch'
import { resolvePresetForMode } from '../utils/resolvePresetForMode'

// Database presets are now loaded dynamically - no need for static PRESETS object

// Database-driven preset functions (replaces hardcoded PROFESSIONAL_PRESETS)
const getPresetById = (presetId: string, availablePresets: DatabasePreset[]): DatabasePreset | undefined => {
  return availablePresets.find(preset => preset.id === presetId || preset.key === presetId)
}

const getPresetLabel = (presetId: string, availablePresets: DatabasePreset[]): string => {
  const preset = getPresetById(presetId, availablePresets)
  return preset?.label || 'Unknown Preset'
}

const getPresetPrompt = (presetId: string, availablePresets: DatabasePreset[]): string => {
  const preset = getPresetById(presetId, availablePresets)
  return preset?.prompt || 'Transform this image'
}

import FullScreenMediaViewer from './FullScreenMediaViewer'




import userMediaService from '../services/userMediaService'

import { cloudinaryUrlFromEnv } from '../utils/cloudinaryUtils'
import { createAsset } from '../lib/api'
import { saveMedia } from '../lib/api'
import { getPresetTypeForFilter, getFilterDisplayName } from '../utils/presetMapping'
import { Mode, MODE_LABELS } from '../config/modes'
// Removed old preset services - using new professional presets system

const toAbsoluteCloudinaryUrl = (maybeUrl: string | undefined): string | undefined => {
  if (!maybeUrl) return maybeUrl
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
  if (!cloud) return maybeUrl
  // Default to image upload path
  return `https://res.cloudinary.com/${cloud}/image/upload/${maybeUrl.replace(/^\/+/, '')}`
}

// Global utility function to reset composer state from anywhere
export const resetComposerState = () => {
  console.log('🧹 Global composer state reset called')
  window.dispatchEvent(new CustomEvent('clear-composer-state'))
}

// Global utility function to reset HiddenUploader specifically
export const resetHiddenUploader = () => {
  console.log('🔄 Global HiddenUploader reset called')
  window.dispatchEvent(new CustomEvent('reset-hidden-uploader'))
}

// Debounce flag for error toasts
declare global {
  interface Window { __lastGenErrorShownAt?: number }
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
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [prompt, setPrompt] = useState('')

  // Database-driven presets for main presets mode (moved to very beginning)
  const [availablePresets, setAvailablePresets] = useState<DatabasePreset[]>([])
  const [presetsLoading, setPresetsLoading] = useState(true)
  const [presetsError, setPresetsError] = useState<string | null>(null)
  
  // Mode state
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)
  
  // Identity lock state
  // Identity Lock removed - IPA now runs automatically based on preset type
  
  // Composer state with explicit mode - CLEAN SEPARATION
  const [composerState, setComposerState] = useState({
    mode: 'custom' as 'preset' | 'custom' | 'emotionmask' | 'ghiblireact' | 'neotokyoglitch' | 'storytime', // remix mode removed
    file: null as File | null,
    sourceUrl: null as string | null,
    selectedPresetId: null as string | null,
    // MoodMorph removed - replaced with Anime Filters
    selectedEmotionMaskPresetId: null as string | null, // Separate from other presets
    selectedGhibliReactionPresetId: null as string | null, // Ghibli Reaction presets
    selectedNeoTokyoGlitchPresetId: null as string | null, // Neo Tokyo Glitch presets
    customPrompt: '', // Custom mode gets its own prompt
    status: 'idle' as 'idle' | 'precheck' | 'reserving' | 'uploading' | 'processing' | 'error' | 'success',
    error: null as string | null,
    runOnOpen: false
  })
  


  
  // New preset runner system - MUST be declared before use
  const presetRunner = usePresetRunner()
  const { selectedPreset: stickySelectedPreset, setSelectedPreset: setStickySelectedPreset, ensureDefault } = useSelectedPreset()
  
  // Selected preset using sticky store instead of local state
  const selectedPreset = stickySelectedPreset
  const setSelectedPreset = setStickySelectedPreset

  // Stable ref for selectedPreset to prevent re-render issues during generation
  const selectedPresetRef = useRef<string | null>(null)
  const genIdRef = useRef<string>('') // tracks current generation job id
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  
  // Feed filtering state
  const [activeFeedFilter, setActiveFeedFilter] = useState<string | null>(null)
  
  // Media upload agreement state
  const [showUploadAgreement, setShowUploadAgreement] = useState(false)
  const [userHasAgreed, setUserHasAgreed] = useState<boolean | null>(null) // null = loading, true/false = loaded
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  
  // Likes state
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({})
  const [likesLoading, setLikesLoading] = useState(false)
  
  // Composer clearing function - defined early to avoid reference errors
  
  
  useEffect(() => { 
    selectedPresetRef.current = selectedPreset as string | null
  }, [selectedPreset])
  
  // Generation lifecycle functions
  function startGeneration() {
    // Generate a unique string ID using timestamp + random suffix
    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    genIdRef.current = uniqueId
    console.log('🆔 [Generation] Generated unique ID:', uniqueId)
    setIsGenerating(true)
    return uniqueId
  }

  function endGeneration(id: string | number) {
    // only end if this is the latest job
    if (String(id) === genIdRef.current) {
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
  }



  // Composer clearing function - defined early to avoid reference errors
  const handleClearComposerState = () => {
    console.log('🧹 Clearing composer state...')
    
    // Clear all local state variables
    setSelectedFile(null)
    setPreviewUrl(null)
    setPrompt('')
    setSelectedPreset(null)
    setSelectedEmotionMaskPreset(null)
    setSelectedGhibliReactionPreset(null)
    setSelectedNeoTokyoGlitchPreset(null)
    setSelectedMode(null)
    setIsVideoPreview(false)
    setIsGenerating(false)
    setIsEnhancing(false)
    
    // Clear composer state completely
    setComposerState({
      mode: 'custom',
      file: null,
      sourceUrl: null,
      selectedPresetId: null,
      selectedEmotionMaskPresetId: null,
      selectedGhibliReactionPresetId: null,
      selectedNeoTokyoGlitchPresetId: null,
      customPrompt: '',
      status: 'idle',
      error: null,
      runOnOpen: false
    })
    
    // Clear generation store state
    import('../stores/generationStore').then(({ useGenerationStore }) => {
      useGenerationStore.getState().clearAll()
    })
    
    // Clear intent queue state
    import('../state/intentQueue').then(({ useIntentQueue }) => {
      useIntentQueue.getState().clearIntent()
      useIntentQueue.getState().setSourceUrl(null)
      useIntentQueue.getState().setIsUploading(false)
      useIntentQueue.getState().setIsGenerating(false)
    })
    
    // Reset HiddenUploader by dispatching reset event
    window.dispatchEvent(new CustomEvent('reset-hidden-uploader'))
    
    // Clear any global file references
    if (window.__lastSelectedFile) {
      delete window.__lastSelectedFile
    }
    
    // Revoke any blob URLs to prevent memory leaks
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    
    // Force file input reset by incrementing key
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Keep composer open for continued use
    console.log('🧹 Composer state completely cleared - ready for new uploads')
  }

  // Clear all options after generation (success or failure)
  const clearAllOptionsAfterGeneration = () => {
    console.log('🎭 Clearing all options after generation')
    
    // Clear everything EXCEPT the file - keep it for continued preset usage
    setPrompt('')
    setSelectedPreset(null)
    setSelectedEmotionMaskPreset(null)
    setSelectedGhibliReactionPreset(null)
    setSelectedNeoTokyoGlitchPreset(null)
    setSelectedMode(null)
    setIsGenerating(false)
    setIsEnhancing(false)
    
    // Clear composer state but keep the file
    setComposerState(s => ({
      ...s,
      mode: 'custom',
      selectedPresetId: null,
      selectedEmotionMaskPresetId: null,
      selectedGhibliReactionPresetId: null,
      selectedNeoTokyoGlitchPresetId: null,
      customPrompt: '',
      status: 'idle',
      error: null,
      runOnOpen: false
    }))
    
    console.log('🎭 Options cleared but file preserved for continued preset usage')
  }

  // Clear preset when user exits composer (immediate to avoid race)
  const clearPresetOnExit = () => {
    // Immediate clear for faster response
    requestClearPreset('composer exit')
  }
  
  // Initialize presets and validate mappings
  useEffect(() => {
    (async () => {
      // PRESETS are already loaded from import
      // validateModeMappings() // REMOVED - complex drama validation
    })()
  }, [])

  // Handle file data when navigating from profile screen
  useEffect(() => {
    if (location.state?.selectedFile && location.state?.previewUrl && location.state?.openComposer) {
      console.log('📁 [Profile] File data received from profile screen:', {
        fileName: location.state.selectedFile.name,
        previewUrl: location.state.previewUrl
      })
      
      // Set the file and preview URL
      setSelectedFile(location.state.selectedFile)
      setPreviewUrl(location.state.previewUrl)
      
      // Update composer state
      setComposerState(s => ({
        ...s,
        mode: 'custom',
        file: location.state.selectedFile,
        sourceUrl: location.state.previewUrl,
        status: 'idle',
        error: null,
        runOnOpen: false
      }))
      
      // Open the composer
      setIsComposerOpen(true)
      
      // Clear the location state to prevent re-triggering
      navigate('/', { replace: true, state: {} })
    }
  }, [location.state, navigate])

  // Initialize sticky preset system when database presets are loaded
  useEffect(() => {
    if (availablePresets.length > 0) {
      const activePresetKeys = availablePresets.map(p => p.key)
      ensureDefault(activePresetKeys as any)
    }
  }, [availablePresets, ensureDefault])

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Check if click is outside all dropdown areas
      if (!target.closest('[data-presets-dropdown]') &&
          !target.closest('[data-emotionmask-dropdown]') &&
          !target.closest('[data-ghiblireact-dropdown]') &&
          !target.closest('[data-neotokyoglitch-dropdown]') &&
          !target.closest('[data-profile-dropdown]')) {
        closeAllDropdowns()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debug preset changes
  useEffect(() => {
    console.log('🔍 selectedPreset changed to:', selectedPreset)
    if (selectedPreset) {
      console.log('🎨 Preset details:', getPresetById(selectedPreset as string, availablePresets))
      // Update the ref for compatibility
      selectedPresetRef.current = selectedPreset as string | null
    } else {
      selectedPresetRef.current = null
    }
  }, [selectedPreset, availablePresets])

  // Debug composer state changes
  useEffect(() => {
    console.log('🎭 Composer state changed:', {
      mode: composerState.mode,
      status: composerState.status,
      selectedPresetId: composerState.selectedPresetId,
      hasFile: !!composerState.file,
      hasSourceUrl: !!composerState.sourceUrl,
      error: composerState.error
    })
  }, [composerState])

  // Debug database presets
  useEffect(() => {
    if (availablePresets.length > 0) {
      console.log('🎨 Database presets loaded:', {
        count: availablePresets.length,
        keys: availablePresets.map(p => p.key),
        sample: availablePresets.slice(0, 3).map(preset => ({
          key: preset.key,
          label: preset.label,
          prompt: preset.prompt?.substring(0, 50) + '...'
      }))
    })
    }
  }, [availablePresets])

  // Close emotion mask dropdown when clicking outside or when other modes are selected
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      const emotionMaskDropdown = document.querySelector('[data-emotionmask-dropdown]')
      
      if (emotionMaskDropdown && !emotionMaskDropdown.contains(target)) {
        setEmotionMaskDropdownOpen(false)
      }
    }

    const handleModeChange = () => {
      if (composerState.mode !== 'emotionmask') {
        setEmotionMaskDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    
    // Close dropdown when mode changes
    handleModeChange()

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [composerState.mode])
  
  // Debug when preset gets cleared (only in development)
  useEffect(() => {
    if (selectedPreset === null && import.meta.env.DEV) {
      console.log('⚠️ selectedPreset was cleared to null')
      console.trace('Preset clear stack trace')
    }
  }, [selectedPreset])

  // Listen for clear-generating-state events from global error handler
  useEffect(() => {
    const handleClearState = () => {
      setNavGenerating(false);
    };

    window.addEventListener('clear-generating-state', handleClearState);
    return () => window.removeEventListener('clear-generating-state', handleClearState);
  }, []);


  // Get active presets from database
  const weeklyPresetNames = useMemo(() => {
    try {
      // Use database presets instead of hardcoded ones
      const presetKeys = availablePresets.map(preset => preset.key)
      if (import.meta.env.DEV) {
        console.log('🎨 Active database presets for UI:', presetKeys)
      }
      
      // If no presets available, return empty array
      if (presetKeys.length === 0) {
        if (import.meta.env.DEV) {
          console.debug('⚠️ No database presets loaded yet')
        }
        return []
      }

      // Return all available presets (database already handles rotation)
      return presetKeys
    } catch (error) {
      console.error('❌ Error getting database presets:', error)
      return []
    }
  }, [availablePresets])
  const [quota, setQuota] = useState<{ daily_used: number; daily_limit: number; weekly_used: number; weekly_limit: number } | null>(null)
  const [feed, setFeed] = useState<UserMedia[]>([])
  const [isLoadingFeed, setIsLoadingFeed] = useState(true)
  const [hasMoreFeed, setHasMoreFeed] = useState(true)
  

  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [creatorFilter, setCreatorFilter] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [presetsOpen, setPresetsOpen] = useState(false)
  
  // Load user likes
  const loadUserLikes = async () => {
    if (!authService.isAuthenticated()) return
    
    try {
      setLikesLoading(true)
      const response = await getUserLikes()
      setUserLikes(response.likes || {})
    } catch (error) {
      console.error('Failed to load user likes:', error)
    } finally {
      setLikesLoading(false)
    }
  }
  
  // Handle toggle like
  const handleToggleLike = async (media: UserMedia) => {
    if (!authService.isAuthenticated()) {
      navigate('/auth')
      return
    }
    
    try {
      // Map the type for likes key - use the database type from feed
      const dbType = (media.metadata?.presetType || media.type || 'presets').replace(/-/g, '_')
      const likeKey = `${dbType}:${media.id}`
      const wasLiked = userLikes[likeKey]
      
      setUserLikes(prev => ({
        ...prev,
        [likeKey]: !wasLiked
      }))
      
      // Update the feed item's like count optimistically
      setFeed(prev => prev.map(item => 
        item.id === media.id 
          ? { ...item, likes_count: (item.likes_count || 0) + (wasLiked ? -1 : 1) }
          : item
      ))
      
      // Also update viewer media if it's open
      setViewerMedia(prev => prev.map(item => 
        item.id === media.id 
          ? { ...item, likes_count: (item.likes_count || 0) + (wasLiked ? -1 : 1) }
          : item
      ))
      
      // Map the type to the API format
      const apiMediaType = mapMediaTypeForAPI(dbType)
      
      // Make API call
      const response = await toggleLike(media.id, apiMediaType)
      
      // Update with server response
      if (response.success) {
        setFeed(prev => prev.map(item => 
          item.id === media.id 
            ? { ...item, likes_count: response.likesCount }
            : item
        ))
        
        // Also update viewer media with server response
        setViewerMedia(prev => prev.map(item => 
          item.id === media.id 
            ? { ...item, likes_count: response.likesCount }
            : item
        ))
      } else {
        // Revert on error
        setUserLikes(prev => ({
          ...prev,
          [likeKey]: wasLiked
        }))
        setFeed(prev => prev.map(item => 
          item.id === media.id 
            ? { ...item, likes_count: (item.likes_count || 0) + (wasLiked ? 1 : -1) }
            : item
        ))
        
        // Also revert viewer media on error
        setViewerMedia(prev => prev.map(item => 
          item.id === media.id 
            ? { ...item, likes_count: (item.likes_count || 0) + (wasLiked ? 1 : -1) }
            : item
        ))
        notifyError({ message: 'Failed to update like' })
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      notifyError({ message: 'Failed to update like' })
    }
  }


  
  // Profile state from context
  const { profileData } = useProfile()
  const [currentFilter, setCurrentFilter] = useState<'all' | 'images' | 'videos'>('all')
  const [navGenerating, setNavGenerating] = useState(false)
  // generateTwo removed - single generation only
  const [userMenu, setUserMenu] = useState(false)
  const [fabMenuOpen, setFabMenuOpen] = useState(false)
  
  // Media viewer state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerMedia, setViewerMedia] = useState<UserMedia[]>([])
  const [viewerStartIndex, setViewerStartIndex] = useState(0)
  
  // Video job state
  const [currentVideoJob, setCurrentVideoJob] = useState<{ id: string; status: string } | null>(null)
  const [videoJobPolling, setVideoJobPolling] = useState<NodeJS.Timeout | null>(null)
  
  // Hooks moved up to avoid "used before declaration" errors
  
  // Share modal state
  
  // Safe fallbacks for theme-related state variables
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedEra, setSelectedEra] = useState<string | null>(null)
  const [selectedOp, setSelectedOp] = useState<string | null>(null)
  // MoodMorph removed - replaced with Anime Filters
  const [selectedEmotionMaskPreset, setSelectedEmotionMaskPreset] = useState<string | null>(null)
  const [emotionMaskDropdownOpen, setEmotionMaskDropdownOpen] = useState(false)
  const [selectedGhibliReactionPreset, setSelectedGhibliReactionPreset] = useState<string | null>(null)
  const [ghibliReactionDropdownOpen, setGhibliReactionDropdownOpen] = useState(false)
  const [selectedNeoTokyoGlitchPreset, setSelectedNeoTokyoGlitchPreset] = useState<string | null>(null)
  const [neoTokyoGlitchDropdownOpen, setNeoTokyoGlitchDropdownOpen] = useState(false)
  const [selectedStoryTimePreset, setSelectedStoryTimePreset] = useState<string | null>(null)

  const [additionalStoryImages, setAdditionalStoryImages] = useState<File[]>([])

  // Fetch available presets from database on mount
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        setPresetsLoading(true)
        setPresetsError(null)

        const presetsService = (await import('../services/presetsService')).default.getInstance()
        const response = await presetsService.getAvailablePresets()

        if (response.success && response.data) {
          setAvailablePresets(response.data.presets)
          console.log('🎨 [HomeNew] Loaded', response.data.presets.length, 'presets for week', response.data.currentWeek)
        } else {
          setPresetsError(response.error || 'Failed to load presets')
          console.error('❌ [HomeNew] Failed to load presets:', response.error)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setPresetsError(errorMessage)
        console.error('❌ [HomeNew] Error fetching presets:', error)
      } finally {
        setPresetsLoading(false)
      }
    }

    fetchPresets()
  }, [])

  




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
      
      // Close FAB menu dropdown
      if (fabMenuOpen && !target.closest('[data-fab-menu]')) {
        setFabMenuOpen(false)
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

  // Function to close all dropdowns (updated to use the main function)
  const closeAllDropdowns = () => {
    setFilterOpen(false)
    setUserMenu(false)
    setPresetsOpen(false)
    setEmotionMaskDropdownOpen(false)
    setGhibliReactionDropdownOpen(false)
    setNeoTokyoGlitchDropdownOpen(false)
    setProfileDropdownOpen(false)
  }

  // Story Time additional image handling
  const handleAdditionalStoryImageUpload = async (file: File, slotIndex: number) => {
    console.log('📸 [Story Time] Adding additional image to slot:', slotIndex + 2)
    
    // Create preview URL for display
    const preview = URL.createObjectURL(file)
    
    // Add to additional images array
    setAdditionalStoryImages(prev => {
      const newImages = [...prev]
      newImages[slotIndex] = file
      return newImages
    })
  }

  const handleAdditionalStoryImageRemove = (slotIndex: number) => {
    console.log('🗑️ [Story Time] Removing image from slot:', slotIndex + 2)
    
    setAdditionalStoryImages(prev => {
      const newImages = [...prev]
      delete newImages[slotIndex]
      return newImages.filter(Boolean) as File[]
    })
  }

  // Check if we can generate story (minimum 3 images total)
  const canGenerateStory = selectedFile && additionalStoryImages.filter(Boolean).length >= 2

  // Story Time stacked cards styles
  const storyCardStyles = `
    .story-stacked-cards {
      position: absolute;
      right: -120px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
    }

    .stacked-images {
      position: relative;
      width: 120px;
      height: 120px;
    }

    .story-image-card {
      position: absolute;
      width: 100px;
      height: 100px;
      border-radius: 12px;
      border: 2px solid #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      cursor: pointer;
      overflow: hidden;
      background: #1a1a1a;
    }

    .story-image-card.empty {
      border: 2px dashed #333;
      background: #1a1a1a;
    }

    .story-image-card.has-image {
      border: 2px solid #fff;
    }

    .story-image-card:hover {
      transform: translateY(-8px) scale(1.05);
      z-index: 10;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    }

    .story-image-card[data-stack="0"] {
      top: 0;
      left: 0;
      z-index: 2;
    }

    .story-image-card[data-stack="1"] {
      top: 20px;
      left: 20px;
      z-index: 1;
    }

    .story-image-card[data-stack="2"] {
      top: 40px;
      left: 40px;
      z-index: 0;
    }

    .story-image-card[data-stack="3"] {
      top: 60px;
      left: 60px;
      z-index: -1;
    }

    .card-number {
      position: absolute;
      top: -8px;
      left: -8px;
      width: 24px;
      height: 24px;
      background: #fff;
      color: #000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      z-index: 5;
    }

    .card-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 10px;
    }

    .upload-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #666;
    }

    .plus-icon {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .upload-text {
      font-size: 10px;
      text-align: center;
    }

    .remove-btn {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 20px;
      height: 20px;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
      z-index: 5;
    }

    .remove-btn:hover {
      background: #ff6666;
    }
  `

  // Inject Story Time styles
  useEffect(() => {
    if (composerState.mode === 'storytime') {
      const styleId = 'story-time-styles'
      let styleElement = document.getElementById(styleId) as HTMLStyleElement
      
      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = styleId
        document.head.appendChild(styleElement)
      }
      
      styleElement.textContent = storyCardStyles
    }
  }, [composerState.mode, storyCardStyles])

  // Story Image Card Component
  // Story Time Composer Component
  const StoryTimeComposer = ({
    selectedFile,
    additionalImages,
    onFileUpload,
    onAdditionalUpload,
    onAdditionalRemove,
    onFileRemove
  }: {
    selectedFile: File | null
    additionalImages: File[]
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
    onAdditionalUpload: (file: File, slotIndex: number) => void
    onAdditionalRemove: (slotIndex: number) => void
    onFileRemove: () => void
  }) => {
    const bulkInputRef = useRef<HTMLInputElement>(null)
    const mainInputRef = useRef<HTMLInputElement>(null)
    const additionalInputRefs = Array.from({ length: 4 }, () => useRef<HTMLInputElement>(null))

    const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      files.forEach((file, index) => {
        if (!selectedFile && index === 0) {
          // First file goes to main slot
          const fakeEvent = {
            target: { files: [file] }
          } as unknown as React.ChangeEvent<HTMLInputElement>
          onFileUpload(fakeEvent)
        } else {
          // Subsequent files go to additional slots
          const slotIndex = selectedFile ? index - 1 : index
          if (slotIndex < 4) { // Max 4 additional images
            onAdditionalUpload(file, slotIndex)
          }
        }
      })
    }

    const handleAdditionalUpload = (event: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
      const file = event.target.files?.[0]
      if (file) {
        onAdditionalUpload(file, slotIndex)
      }
    }

    const totalImages = (selectedFile ? 1 : 0) + additionalImages.filter(Boolean).length
    const hasMinimumImages = totalImages >= 3

    return (
      <div className="story-time-composer">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-white/90 text-lg">
            Add multiple photos to create an animated story
          </p>
        </div>



        {/* Photos Layout - Main and Additional in Same Row */}
        <div className="mb-6">

          <div className="flex justify-center items-start gap-4 flex-wrap">
            {/* Main Photo */}
            <div className="flex flex-col items-center">
              <span className="text-white/80 text-sm mb-2">Main</span>
              {selectedFile ? (
                <div className="relative group">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Main story photo"
                    className="w-28 h-28 object-cover rounded-lg border-2 border-white/30"
                  />
                  <button
                    onClick={onFileRemove}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => mainInputRef.current?.click()}
                  className="w-28 h-28 border-2 border-dashed border-white/50 rounded-lg flex flex-col items-center justify-center text-white/60 hover:border-white/80 hover:text-white/80 transition-colors"
                >
                  <Plus size={20} className="mb-1" />
                  <span className="text-xs">Add</span>
                </button>
              )}
            </div>

            {/* Additional Photos */}
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-white/80 text-sm mb-2">{i + 2}</span>
                {additionalImages[i] ? (
                  <div className="relative group">
                    <img
                      src={URL.createObjectURL(additionalImages[i])}
                      alt={`Story photo ${i + 2}`}
                      className="w-24 h-24 object-cover rounded-lg border-2 border-white/30"
                    />
                    <button
                      onClick={() => onAdditionalRemove(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => additionalInputRefs[i].current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center text-white/50 hover:border-white/60 hover:text-white/70 transition-colors"
                  >
                    <Plus size={16} className="mb-1" />
                    <span className="text-xs">Add</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bulk Upload Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => bulkInputRef.current?.click()}
            className="inline-flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors border border-white/30 hover:border-white/50"
          >
            <Plus size={20} className="mr-2" />
            Add Multiple Photos
          </button>
          <p className="text-white/60 text-sm mt-2">
            Select multiple photos at once for faster setup
          </p>
        </div>

        {/* Story Time Presets */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <span className="text-white/90 font-medium">Choose Story Style</span>
          </div>



          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { id: 'auto', label: 'Auto Mode' },
              { id: 'adventure', label: 'Adventure' },
              { id: 'romance', label: 'Romance' },
              { id: 'mystery', label: 'Mystery' },
              { id: 'comedy', label: 'Comedy' },
              { id: 'fantasy', label: 'Fantasy' },
              { id: 'travel', label: 'Travel' }
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={async () => {
                  setSelectedStoryTimePreset(preset.id)

                  // Auto-generate immediately when style is selected (like other modes)
                  if (preset.id && canGenerateStory && isAuthenticated) {
                    console.log('🎬 Auto-generating Story Time with preset:', preset.id)

                    try {
                      // Use the unified dispatchGenerate system like other modes
                      await dispatchGenerate('storytime', {
                        storyTimeImages: [selectedFile!, ...additionalStoryImages.filter(Boolean)],
                        storyTimePresetId: preset.id
                      })
                    } catch (error) {
                      console.error('❌ Story Time auto-generation failed:', error)
                      // Error handling is done in dispatchGenerate, no need to duplicate
                    }
                  } else if (!canGenerateStory) {
                    console.log('⚠️ Need more images for Story Time generation')
                    notifyError({
                      title: 'Need more photos',
                      message: 'Add at least 3 photos for Story Time'
                    })
                  } else if (!isAuthenticated) {
                    console.log('🔐 Authentication required for Story Time')
                    navigate('/auth')
                  }
                }}
                                    disabled={!canGenerateStory}
                                    className={(() => {
                                      const baseClass = 'px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap';
                                      const activeClass = 'bg-white/90 backdrop-blur-md text-black';
                                      const inactiveClass = canGenerateStory
                                        ? 'text-white hover:text-white hover:bg-white/20'
                                        : 'text-white/50 cursor-not-allowed';
                                      return `${baseClass} ${selectedStoryTimePreset === preset.id ? activeClass : inactiveClass}`;
                                    })()}
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                              </div>
                            </div>

        {/* Hidden file inputs */}
        <input
          ref={bulkInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleBulkUpload}
          className="hidden"
        />
        <input
          ref={mainInputRef}
          type="file"
          accept="image/*"
          onChange={onFileUpload}
          className="hidden"
        />
        {/* Individual additional photo inputs */}
        {additionalInputRefs.map((ref, index) => (
          <input
            key={index}
            ref={ref}
            type="file"
            accept="image/*"
            onChange={(event) => handleAdditionalUpload(event, index)}
            className="hidden"
          />
        ))}
      </div>
    )
  }

  const StoryImageCard = ({ 
    index, 
    image, 
    isRequired, 
    onUpload, 
    onRemove 
  }: { 
    index: number
    image: File | undefined
    isRequired: boolean
    onUpload: (file: File, slotIndex: number) => void
    onRemove: (slotIndex: number) => void
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        onUpload(file, index)
      }
    }

    const handleClick = () => {
      if (image) {
        // Show image preview or actions
        return
      }
      // Trigger file upload
      fileInputRef.current?.click()
    }

    return (
      <div 
        className={`story-image-card ${image ? 'has-image' : 'empty'}`}
        data-stack={index}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {image ? (
          <>
            <div className="card-number">{index + 2}</div>
            <img 
              src={URL.createObjectURL(image)} 
              alt={`Story image ${index + 2}`}
              className="card-preview"
            />
            <button
              className="remove-btn"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(index)
              }}
              title="Remove image"
            >
              ×
            </button>
          </>
        ) : (
          <>
            <div className="card-number">{index + 2}</div>
            <div className="upload-placeholder">
              <div className="plus-icon">+</div>
              <span className="upload-text">
                {isRequired ? 'Required' : 'Optional'}
              </span>
            </div>
          </>
        )}
      </div>
    )
  }

  const handleUploadClick = () => {
    console.log('🎯 Upload button clicked')
    closeAllDropdowns() // Close all dropdowns when opening composer
    console.log('📁 File input ref:', fileInputRef.current)
    if (fileInputRef.current) {
      console.log('🖱️ Triggering file input click')
      fileInputRef.current.click()
    } else {
      console.error('❌ File input ref is null')
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📂 handleFileChange triggered')
    const file = e.target.files?.[0]
    console.log('📁 Files array:', e.target.files)
    if (!file) {
      console.log('❌ No file selected')
      return
    }

    console.log('📁 File selected:', { name: file.name, size: file.size, type: file.type })
    console.log('🔍 User agreement status:', { userHasAgreed })

    // Check if user has already agreed to the upload agreement
    // If still loading user agreement status, show agreement to be safe
    if (userHasAgreed === null) {
      console.log('⏳ User agreement status still loading, showing agreement popup')
      setPendingFile(file)
      setShowUploadAgreement(true)
      return
    }
    
    if (userHasAgreed) {
      // User has agreed, proceed directly to upload
      console.log('✅ User has agreed, proceeding with direct upload')
      await handleDirectUpload(file)
    } else {
      // Show upload agreement first
      console.log('⚠️ User has not agreed, showing agreement popup')
      setPendingFile(file)
      setShowUploadAgreement(true)
    }
  }

  const handleDirectUpload = async (file: File) => {
    console.log('📁 Direct upload (user already agreed):', { name: file.name, size: file.size, type: file.type })

    // Create preview URL for display only
    const preview = URL.createObjectURL(file)
    console.log('🖼️ Preview URL created:', preview)

    // Store both: File for upload, preview URL for display
    setSelectedFile(file)                    // File used for upload
    setPreviewUrl(preview)                   // blob: used only for <img> preview
    storeSelectedFile(file)                  // Store globally for blob: fallback
    
    // Update composer state
    setComposerState(s => ({
      ...s,
      mode: 'custom',
      file,
      sourceUrl: preview,
      status: 'idle',
      error: null,
      runOnOpen: false
    }))
    
    // Also store in generation store for centralized access
    const { useGenerationStore } = await import('../stores/generationStore')
    useGenerationStore.getState().setSelectedFile(file)                    // keep the File object
    useGenerationStore.getState().setSelectedFileName(file.name)           // separate field for UI
    useGenerationStore.getState().setPreviewUrl(preview)
    useGenerationStore.getState().setPreviewDataUrl(null)
    useGenerationStore.getState().setPreviewBlob(null)
    
    console.log('✅ File state updated, opening composer')
    setIsComposerOpen(true)
  }

  const handleUploadAgreementAccept = async () => {
    const file = pendingFile
    if (!file) return

    console.log('📁 File accepted after agreement:', { name: file.name, size: file.size, type: file.type })

    // Update user agreement status in local state immediately
    setUserHasAgreed(true)
    console.log('✅ User agreement status updated to true')
    
    // Don't close modal yet - keep it visible during transition
    // The modal will close automatically when composer is ready via useEffect

    // Use the same direct upload logic for consistency
    await handleDirectUpload(file)
    
    // Don't close modal here - let useEffect handle it when composer is fully ready
  }

  const handleUploadAgreementCancel = () => {
    // Clear pending file and reset file input when agreement is cancelled
    setPendingFile(null)
    setShowUploadAgreement(false)
    
    // Reset the file input so user can select the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
          actualPreviewUrl: previewUrl,
          composerMode: composerState.mode,
          composerStatus: composerState.status
        })
      })
    }
  }, [isComposerOpen, previewUrl, selectedFile, isVideoPreview, composerState.mode, composerState.status])

  // Auto-close agreement modal when composer is fully ready
  useEffect(() => {
    if (isComposerOpen && showUploadAgreement && pendingFile) {
      // Wait a bit for the composer to fully render and be visible
      const timer = setTimeout(() => {
        console.log('🎭 Composer is ready, closing agreement modal')
        setShowUploadAgreement(false)
        setPendingFile(null)
      }, 300) // Small delay to ensure smooth transition
      
      return () => clearTimeout(timer)
    }
  }, [isComposerOpen, showUploadAgreement, pendingFile])



  // Handle generation completion events from the pipeline
  useEffect(() => {
    const handleGenerationComplete = (event: CustomEvent) => {
      const { record, resultUrl } = event.detail
      console.log('🎉 Generation completed, updating UI state:', record)
      
      // Stop all spinners
      setNavGenerating(false)
      
      // Check if we have a valid record
      if (!record) {
        console.warn('⚠️ No record in generation-complete event, cannot update UI')
        return
      }
      
      // Create UserMedia object for the new result
      const newMedia: UserMedia = {
        id: record.cloudinary_public_id || record.public_id || `generated-${Date.now()}`,
        userId: record.owner_id || record.user_id || 'current-user',
        type: 'photo', // TODO: detect video vs image
        url: resultUrl || record.secure_url || record.url,
                        prompt: record.meta?.prompt || record.prompt || (record.presetKey ? `Generated with ${record.presetKey}` : 'AI Generated Content'),
        aspectRatio: 4/3,
        width: record.width || 800,
        height: record.height || 600,
        timestamp: new Date().toISOString(),
        tokensUsed: 2,
        likes: 0,
        isPublic: false,
        tags: record.meta?.tags || record.tags || [],
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
      
      console.log('✅ UI updated successfully with new media:', newMedia)
      
      // Show the result in viewer
      setViewerMedia([newMedia])
      setViewerStartIndex(0)
      setViewerOpen(true)
      
      console.log('✅ UI updated successfully with new media:', newMedia)
      
      // Refresh the feed and user media after generation completes
      setTimeout(() => {
        console.log('🔄 Refreshing feed and user media after generation completion...')
        // Refresh the public feed
        loadFeed()
        // Dispatch event to refresh user media
        window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
          detail: { count: 1, runId: record.meta?.runId || 'unknown' } 
        }))
      }, 500) // Reduced from 1000ms to 500ms for faster feedback
      
      // 🧹 Clear composer state for ALL generation types (new system only)
      console.log('🧹 Clearing composer state after generation completion')
      handleClearComposerState()
    }

    const handleGenerationSuccess = (event: CustomEvent) => {
      const { message, mode, thumbUrl } = event.detail
      console.log('✅ Generation success:', message, 'Mode:', mode)
      
      // Show success toast with thumbnail if available
      notifyReady({ 
        title: 'Your media is ready', 
        message: 'Tap to open',
        thumbUrl: thumbUrl
      })
      
      // Stop all spinners (we don't have genId in the event)
      setNavGenerating(false)
      
      // Refresh feed to show new content
      loadFeed()
      
      // 🧹 Clear composer state for ALL generation types (new system only)
      console.log('🧹 Clearing composer state after generation success')
      handleClearComposerState()
    }

    const handleGenerationError = (event: CustomEvent) => {
      const { message, mode } = event.detail
      console.log('❌ Generation error:', message, 'Mode:', mode)
      
      // Show error toast
      notifyError({ 
        title: 'Failed', 
        message: message || 'Try again' 
      })
      
      // Stop all spinners
      setNavGenerating(false)
      
      // 🧹 Clear composer state for ALL generation types (new system only)
      console.log('🧹 Clearing composer state after generation error')
      handleClearComposerState()
    }

    const handleUserMediaUpdated = () => {
      console.log('🔄 User media updated event received, refreshing feed and user media...')
      // Refresh the public feed
      loadFeed()
      // Dispatch event to refresh user profile if it's mounted
      window.dispatchEvent(new CustomEvent('refreshUserProfile'))
      
      // Clear composer state after user media update (for MoodMorph and other modes)
      console.log('🧹 Clearing composer state after user media update')
      handleClearComposerState()
    }

    const handleRefreshUserMedia = () => {
      console.log('🔄 Refresh user media event received, refreshing user profile...')
      // Load user profile from database to refresh user media
      loadUserProfileFromDatabase()
    }

    const handleCloseComposer = () => {
      setIsComposerOpen(false)
    }

    // handleClearComposerState is now defined at the top level to avoid reference errors

    window.addEventListener('generation-complete', handleGenerationComplete as EventListener)
    window.addEventListener('generation-success', handleGenerationSuccess as EventListener)
    window.addEventListener('generation-error', handleGenerationError as EventListener)
    window.addEventListener('close-composer', handleCloseComposer as EventListener)
    window.addEventListener('clear-composer-state', handleClearComposerState as EventListener)
    window.addEventListener('userMediaUpdated', handleUserMediaUpdated as EventListener)
    window.addEventListener('refreshUserMedia', handleRefreshUserMedia as EventListener)
    


    return () => {
      window.removeEventListener('generation-complete', handleGenerationComplete as EventListener)
      window.removeEventListener('generation-success', handleGenerationSuccess as EventListener)
      window.removeEventListener('generation-error', handleGenerationError as EventListener)
      window.removeEventListener('close-composer', handleCloseComposer as EventListener)
      window.removeEventListener('clear-composer-state', handleClearComposerState as EventListener)
      window.removeEventListener('userMediaUpdated', handleUserMediaUpdated as EventListener)
      window.removeEventListener('refreshUserMedia', handleRefreshUserMedia as EventListener)
      

    }
  }, [])

  // 🚀 UNIFIED INFINITE SCROLL: Single loading system for consistent behavior
  const [lastItemRef, setLastItemRef] = useState<HTMLDivElement | null>(null)
  
  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!lastItemRef) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && hasMoreFeed && !isLoadingMore) {
          console.log('👁️ [UnifiedScroll] Last item visible, triggering load', {
            hasMoreFeed,
            isLoadingMore,
            feedLength: feed.length
          })
          loadFeed(false) // Load more items using the main loadFeed function
        }
      },
      {
        rootMargin: '200px', // Start loading when 200px away from last item
        threshold: 0.1
      }
    )
    
    observer.observe(lastItemRef)
    
    return () => {
      if (lastItemRef) observer.unobserve(lastItemRef)
    }
  }, [lastItemRef, hasMoreFeed, isLoadingMore])

  // Load public feed on mount
  const loadFeed = async (isInitial = true) => {
    // Add minimum loading time to ensure skeleton is visible
    const startTime = Date.now()
    const minLoadingTime = 800 // 800ms minimum loading time
    
    try {
      if (isInitial) {
        setIsLoadingFeed(true)
      } else {
        setIsLoadingMore(true)
      }
      
      console.log(`🔄 Loading public feed ${isInitial ? '(initial)' : '(more)'}...`)
      const pageSize = 50 // Smaller batches for smooth infinite scroll
      // Calculate offset based on current feed length for infinite scroll
      const offset = isInitial ? 0 : feed.length
      
              console.log('🔍 [Pagination Debug]', {
          isInitial,
          pageSize,
          calculatedOffset: offset,
          expectedItems: `${offset}-${offset + pageSize - 1}`
        })
      
      const res = await fetch(`/.netlify/functions/getPublicFeed?limit=${pageSize}&offset=${offset}`)
      console.log('📡 Feed response status:', res.status)
      
      if (res.ok) {
        const resp = await res.json()
        console.log('📊 Raw feed response:', resp)
        console.log('📥 Feed items received:', resp.items ? 'success' : 'failed')
        
        if (!resp.items) {
          console.error('❌ Feed API error:', resp.error || 'No items in response')
          return
        }
        
        const { items: media } = resp
        console.log('📊 Raw feed data:', media)
        console.log('📊 Feed length:', media?.length || 0)
        
        // Determine if there are more items based on backend response
        // True infinite scroll: only stop when backend explicitly says no more items
        const hasMore = resp.hasMore !== false
        console.log('📊 Has more:', hasMore, 'Items received:', media.length, 'Page size:', pageSize)
        
        const mapped: UserMedia[] = (media || [])
          .map((item: any): UserMedia | null => {
            // Use the URL from the backend - it should already be properly constructed
            let mediaUrl: string;
            let provider = item.provider || 'unknown';
            
            // Check for finalUrl (main media assets) or imageUrl (Neo Tokyo Glitch)
            if (item.finalUrl && item.finalUrl.startsWith('http')) {
              mediaUrl = item.finalUrl;
              console.log(`🔗 URL mapping for item ${item.id}:`, {
                provider: provider,
                url: item.finalUrl,
                source: 'finalUrl'
              });
            } else if (item.imageUrl && item.imageUrl.startsWith('http')) {
              mediaUrl = item.imageUrl;
              console.log(`🔗 URL mapping for item ${item.id}:`, {
                provider: provider,
                url: item.imageUrl,
                source: 'imageUrl'
              });
            } else {
              // Skip items without valid URLs - the backend should provide them
              console.warn(`⚠️ Skipping item ${item.id}: no valid URL from backend`, {
                finalUrl: item.finalUrl,
                imageUrl: item.imageUrl,
                hasUrl: !!item.url
              });
              return null;
            }
          
          return ({
            id: item.id,
            userId: item.user_id || '', // Backend sends user_id (snake_case)
            userAvatar: item.user?.avatar || undefined, // Use actual user avatar if available
            userTier: item.user?.tier || undefined, // Use actual user tier if available
            type: item.mediaType === 'video' ? 'video' : 'photo',
            url: mediaUrl,
            thumbnailUrl: mediaUrl, // Use same URL for thumbnail
            prompt: item.prompt || (item.presetKey ? `Generated with ${item.presetKey}` : 'AI Generated Content'), // Use actual prompt or fallback
            style: undefined,
            aspectRatio: undefined, // Remove hardcoded default
            width: undefined, // Remove hardcoded default
            height: undefined, // Remove hardcoded default
            timestamp: item.created_at, // Backend sends created_at (snake_case)
            originalMediaId: item.source_url || undefined, // Backend sends source_url
            likes_count: item.likes_count || 0, // Add likes count from backend
            tokensUsed: item.mediaType === 'video' ? 5 : 2,
            likes: 0, // Not exposed in public feed
            isPublic: true,
            tags: [],
            metadata: { 
              quality: 'high', 
              generationTime: 0, 
              modelVersion: '1.0',
              presetKey: item.presetKey, // Backend sends presetKey (camelCase)
              presetType: item.type, // Backend sends type
              // Story Time video metadata
              videoResults: item.metadata?.videoResults,
              totalVideos: item.metadata?.totalVideos,
              successfulVideos: item.metadata?.successfulVideos
            },
            // Store additional fields needed for functionality
            cloudinaryPublicId: item.cloudinaryPublicId,
            mediaType: item.mediaType,
          })
        })
          .filter((item: UserMedia | null): item is UserMedia => item !== null) // Filter out null items
        
        console.log('🎯 Mapped feed items:', mapped.length)
        

        
        if (isInitial) {
          console.log('🎯 Setting initial feed with items:', mapped.length, 'first item ID:', mapped[0]?.id)
          setFeed(mapped)
        } else {
          console.log('🎯 Adding more items to feed:', mapped.length)
          setFeed(prev => [...prev, ...mapped])
        }
        
        setHasMoreFeed(hasMore)
      } else {
        console.error('❌ Feed response not ok:', res.status, await res.text())
      }
      
      // Ensure minimum loading time for skeleton visibility (initial load only)
      if (isInitial) {
        const elapsed = Date.now() - startTime
        if (elapsed < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
        }
      }
    } catch (e) {
      console.error('❌ Failed to load feed', e)
    } finally {
      if (isInitial) {
        setIsLoadingFeed(false)
      } else {
        setIsLoadingMore(false)
      }
    }
  }

  // Initialize authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Refresh auth state first to ensure it's up to date
      authService.refreshAuthState()
      
      const authState = authService.getAuthState()
      setIsAuthenticated(authState.isAuthenticated)
      console.log('🔐 Auth state initialized:', authState)
      
      // If user is authenticated, sync their profile from database
      if (authState.isAuthenticated) {
        try {
          // Profile context will handle loading settings from database
          console.log('✅ Profile context will sync settings from database')
          
          // Only load user profile if we have a valid token
          const token = authService.getToken()
          if (token) {
            await loadUserProfileFromDatabase()
            console.log('✅ User profile synced from database')
            
            // Load user agreement status
            try {
              const response = await authenticatedFetch('/.netlify/functions/user-settings', {
                method: 'GET'
              })
              
              if (response.ok) {
                const data = await response.json()
                const settings = data.settings
                console.log('🔍 [User Settings] Raw response:', data)
                console.log('🔍 [User Settings] Settings object:', settings)
                const hasAgreed = settings?.media_upload_agreed || false
                setUserHasAgreed(hasAgreed)
                console.log('✅ User agreement status loaded from database:', hasAgreed)
              } else {
                console.error('❌ [User Settings] Failed to load:', response.status, response.statusText)
                setUserHasAgreed(false)
              }
            } catch (error) {
              console.error('Failed to load user agreement status:', error)
              setUserHasAgreed(false)
            }
          } else {
            console.warn('⚠️ Skipping profile load: no valid token')
          }
          
          // Tier promotions removed - simplified credit system
        } catch (error) {
          console.warn('⚠️ Failed to sync user data from database:', error)
        }
      } else {
        // For non-authenticated users, check localStorage for upload agreement
        const uploadAgreementAccepted = localStorage.getItem('uploadAgreementAccepted')
        if (uploadAgreementAccepted === 'true') {
          console.log('✅ Non-authenticated user has agreed to upload terms (localStorage)')
          setUserHasAgreed(true)
        } else {
          console.log('❌ Non-authenticated user has not agreed to upload terms')
          setUserHasAgreed(false)
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
    if (availablePresets.length > 0) {
      const savedPreset = localStorage.getItem('selectedPreset')
          if (savedPreset && availablePresets.some(p => p.key === savedPreset)) {
      console.log('🔄 Restoring preset from localStorage:', savedPreset)
      setSelectedPreset(savedPreset as any)
    } else if (savedPreset && !availablePresets.some(p => p.key === savedPreset)) {
      console.warn('⚠️ Invalid preset in localStorage, clearing:', savedPreset)
      localStorage.removeItem('selectedPreset')
    }
    }
  }, [availablePresets]) // Run when database presets are loaded

  useEffect(() => {
    loadFeed()
    
    // Load user likes if authenticated
    if (authService.isAuthenticated()) {
      loadUserLikes()
    }
    
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

  // REMOVED: getUserProfileSettings - We use ProfileContext instead of localStorage
  // Settings are now managed through ProfileContext which syncs with database

  const closeComposer = () => {
    setIsComposerOpen(false)
    setPrompt('')
    setPreviewUrl(null)
    // Don't clear selectedPreset - it should persist for generation
    // Only clear if user explicitly wants to reset
    closeAllDropdowns() // Close all dropdowns when composer closes
  }

  // Load user profile from database
  const loadUserProfileFromDatabase = async () => {
    try {
      const token = authService.getToken()
      if (!token) {
        console.warn('⚠️ Cannot load profile: no authentication token')
        return
      }

      console.log('🔄 Loading user profile from database...', { 
        hasToken: !!token, 
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none' 
      })
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

  // NEW CLEAN GENERATION DISPATCHER - NO MORE MIXED LOGIC
  async function dispatchGenerate(
    kind: 'preset' | 'custom' | 'emotionmask' | 'ghiblireact' | 'neotokyoglitch' | 'storytime', // remix removed
    options?: {
      presetId?: string;
      presetData?: any;
      // MoodMorph removed - replaced with Anime Filters
      emotionMaskPresetId?: string;
      ghibliReactionPresetId?: string;
      neoTokyoGlitchPresetId?: string;
      customPrompt?: string;
      storyTimeImages?: File[];
      storyTimePresetId?: string;
      // sourceUrl and originalPrompt removed - no more remix functionality
    }
  ) {
    const t0 = performance.now();

    // Declare finalizeCredits at function scope so it's accessible throughout
    let finalizeCredits: ((disposition: 'commit' | 'refund') => Promise<void>) | null = async () => {
      console.warn('finalizeCredits called before initialization');
    };
    
    // Generate run ID to avoid cross-talk
    const runId = crypto.randomUUID();
    setCurrentRunId(runId);
    console.info('▶ NEW dispatchGenerate', { kind, options, runId });
    
    // 🛡️ Runtime Guard (For Safety) - Prevent unknown modes from crashing the app
    if (!['preset', 'custom', 'emotionmask', 'ghiblireact', 'neotokyoglitch', 'storytime'].includes(kind)) {
      console.warn("[dispatchGenerate] Unknown mode: ", kind);
              notifyError({ title: 'Failed', message: 'Try again' });
      return;
    }
    
    // 🛡️ Model Validation Guard - Ensure only supported models are used
    const ALLOWED_MODELS = [
              "fast-sdxl",
      "realistic-vision-v5",
      "stable-diffusion-xl",
      "dall-e-2",
      "dall-e-3"
    ];
    
      // Helper function to validate model
  const validateModel = (model: string) => {
    if (!ALLOWED_MODELS.includes(model)) {
      console.error("🚫 Invalid model:", model);
              notifyError({ title: 'Failed', message: 'Try again' });
              return "fal-ai/ghiblify"; // Fallback to known working model
    }
    return model;
  };

  // Source URL validation - prevent using generated images as source
  const assertIsSourceUrl = (url: string) => {
    // Check if URL is from our sources bucket/folder (adjust to your storage layout)
    const isSource = /\/stefna\/sources\//.test(url) || 
                    /\/uploads\/sources\//.test(url) ||
                    /\/image\/upload\/v\d+\/stefna\/sources\//.test(url);
    
    if (!isSource) {
      console.error('❌ Invalid source URL - appears to be a generated image:', url);
      throw new Error("Invalid source: must be an original input photo URL");
    }
    
    console.log('✅ Source URL validation passed:', url);
    return true;
  };
    
    // Close composer immediately when generation starts
    setIsComposerOpen(false);
    
    // Start generation with ID guard
    const genId = startGeneration();
    setNavGenerating(true);
      
      // Show single unified queue toast immediately
      notifyQueue({ title: 'Added to queue', message: 'We will start processing it shortly' });

    // Get current profile settings from context (real-time state)
    // Note: profileData is already available from the top-level useProfile() hook
    const shareToFeed = profileData?.shareToFeed ?? false
    console.log('🔧 Using profile context settings:', { shareToFeed }) // allowRemix removed

    // Sanity check - log current state
    console.table({
      hasActiveAssetUrl: !!previewUrl,
      promptLen: prompt?.length ?? 0,
      isGenerating,
      isAuthenticated,
      composerMode: composerState.mode,
    });

    if (!previewUrl) {
      console.warn('No source media URL; aborting.');
      endGeneration(genId);
      setNavGenerating(false);
      return;
    }

    // NEW CLEAN MODE-BASED LOGIC - NO MORE MIXING
    let effectivePrompt = '';
    let generationMeta: any = null;
    
    // 🧠 Debug logging for generation dispatch
    console.log("🧠 Dispatching generation with mode:", kind);
    console.log("🎯 Options:", options);
    
    if (kind === 'custom') {
      // CUSTOM MODE: Use ONLY the user's typed prompt
      effectivePrompt = options?.customPrompt || prompt?.trim() || 'Transform this image';
      generationMeta = { 
        mode: 'custom', 
        source: 'user_prompt',
        generation_type: "custom_balanced_ipa", // Balanced identity preservation
        ipaThreshold: 0.65, // Balanced similarity required
        ipaRetries: 2, // Moderate fallback
        ipaBlocking: true // Must pass to proceed
      };
      console.log('🎨 CUSTOM MODE: Using user prompt only:', effectivePrompt);
      
    } else if (kind === 'preset') {
      // PRESET MODE: Use ONLY the selected preset
      const presetId = options?.presetId || selectedPreset;
      if (!presetId) {
        console.error('❌ No preset ID provided');
        notifyError({ title: 'Failed', message: 'Try again' });
        endGeneration(genId);
        setNavGenerating(false);
        // Clear composer after error
        setTimeout(() => handleClearComposerState(), 1000);
        return;
      }
      const preset = getPresetById(presetId as string, availablePresets);
      if (!preset) {
        console.error('❌ Invalid preset:', presetId);
        notifyError({ title: 'Failed', message: 'Try again' });
        endGeneration(genId);
        setNavGenerating(false);
        // Clear composer after error
        setTimeout(() => handleClearComposerState(), 1000);
        return;
      }
      effectivePrompt = preset.prompt;
      generationMeta = { 
        mode: 'preset', 
        presetId, 
        presetLabel: preset.label,
        generation_type: "preset_moderate_ipa", // Moderate identity preservation
        ipaThreshold: 0.65, // Balanced similarity required
        ipaRetries: 2, // Moderate fallback
        ipaBlocking: true // Must pass to proceed
      };
      console.log('🎯 PRESET MODE: Using preset only:', effectivePrompt);
      
    // Remix mode removed - focus on personal creativity
      
    } else if (kind === 'emotionmask') {
      // HYBRID EMOTION MASK MODE: Use curated presets or dynamic prompts
      const emotionMaskPresetId = options?.emotionMaskPresetId || selectedEmotionMaskPreset;
      
      if (!emotionMaskPresetId) {
        console.error('❌ Invalid Emotion Mask preset:', emotionMaskPresetId);
        console.error('❌ Invalid Emotion Mask preset: Please select an emotional variant first')
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      
      const emotionMaskPreset = EMOTION_MASK_PRESETS.find(p => p.id === emotionMaskPresetId);
      if (!emotionMaskPreset) {
        console.error('❌ Emotion Mask preset not found:', emotionMaskPresetId);
        console.error('❌ Emotion Mask preset not found: Please select a valid emotional variant')
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      
      // 🎭 EMOTION MASK MODE: ALWAYS use the original, curated prompt
      // NO MORE SYNTHETIC PROMPT GENERATION - preserve emotional intent
      effectivePrompt = emotionMaskPreset.prompt;
      
            // Emotion Mask uses strict IPA (threshold: 0.7) - no manual control needed
      const adjustedStrength = emotionMaskPreset.strength;
      
      generationMeta = { 
        mode: 'emotionmask', 
        emotionMaskPresetId, 
        emotionMaskPresetLabel: emotionMaskPreset.label,
        model: "fal-ai/ghiblify", // Use known working model
        strength: adjustedStrength, // Use preset strength
        guidance_scale: 7.5, // Standard guidance for consistency
        cfg_scale: 7.0, // Balanced creativity vs adherence
        denoising_strength: adjustedStrength, // Match preset strength
        generation_type: "emotion_mask_strict_ipa", // Strict identity preservation
        ipaThreshold: 0.75, // High similarity required for Neo Tokyo Glitch
        ipaRetries: 3, // Aggressive fallback
        ipaBlocking: true // Must pass to proceed
      };
      console.log('🎭 EMOTION MASK MODE: Using ORIGINAL prompt:', emotionMaskPreset.label, effectivePrompt);
    } else if (kind === 'ghiblireact') {
      // GHIBLI REACTION MODE: Use the selected Ghibli reaction preset
      const ghibliReactionPresetId = options?.ghibliReactionPresetId || selectedGhibliReactionPreset;
      if (!ghibliReactionPresetId) {
        console.error('❌ Invalid Ghibli Reaction preset:', ghibliReactionPresetId);
        console.error('❌ Invalid Ghibli Reaction preset: Please select a Ghibli reaction preset first')
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      
      const ghibliReactionPreset = GHIBLI_REACTION_PRESETS.find(p => p.id === ghibliReactionPresetId);
      if (!ghibliReactionPreset) {
        console.error('❌ Ghibli Reaction preset not found:', ghibliReactionPresetId);
        console.error('❌ Ghibli Reaction preset not found: Please select a valid Ghibli reaction preset')
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      
      effectivePrompt = ghibliReactionPreset.prompt;
              generationMeta = { 
          mode: 'ghiblireact', 
          ghibliReactionPresetId, 
          ghibliReactionLabel: ghibliReactionPreset.label, 
          model: "fal-ai/ghiblify", // Use known working model for Ghibli style
          strength: ghibliReactionPreset.strength, // Use actual preset strength
          guidance_scale: 7.5, // Standard guidance for consistency
          cfg_scale: 7.0, // Balanced creativity vs adherence
          denoising_strength: ghibliReactionPreset.strength, // Match preset strength
          generation_type: "ghibli_reaction_moderate_ipa", // Moderate identity preservation
          ipaThreshold: 0.6, // Medium similarity required
          ipaRetries: 2, // Moderate fallback
          ipaBlocking: true // Must pass to proceed
        };
              console.log('🎭 GHIBLI REACTION MODE: Using Ghibli reaction preset:', ghibliReactionPreset.label, effectivePrompt, 'Model: fal-ai/ghiblify');
      
    } else if (kind === 'neotokyoglitch') {
      // NEO TOKYO GLITCH MODE: Use Replicate integration for maximum glitch intensity
      const neoTokyoGlitchPresetId = options?.neoTokyoGlitchPresetId || selectedNeoTokyoGlitchPreset;
      if (!neoTokyoGlitchPresetId) {
        console.error('❌ Invalid Neo Tokyo Glitch preset:', neoTokyoGlitchPresetId);
        console.error('❌ Invalid Neo Tokyo Glitch preset: Please select a Neo Tokyo Glitch preset first')
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      
      const neoTokyoGlitchPreset = NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === neoTokyoGlitchPresetId);
      if (!neoTokyoGlitchPreset) {
        console.error('❌ Neo Tokyo Glitch preset not found:', neoTokyoGlitchPresetId);
        console.error('❌ Neo Tokyo Glitch preset not found: Please select a valid Neo Tokyo Glitch preset')
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      
      // Map preset ID to Stability.ai preset key
      const presetMap: { [key: string]: 'base' | 'visor' | 'tattoos' | 'scanlines' } = {
        'neo_tokyo_base': 'base',
        'neo_tokyo_visor': 'visor',
        'neo_tokyo_tattoos': 'tattoos',
        'neo_tokyo_scanlines': 'scanlines'
      };
      
      const presetKey = presetMap[neoTokyoGlitchPresetId];
      if (!presetKey) {
        console.error('❌ Unknown Neo Tokyo Glitch preset:', neoTokyoGlitchPresetId);
        console.error('❌ Unknown preset: Please select a valid Neo Tokyo Glitch preset')
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      
      effectivePrompt = neoTokyoGlitchPreset.prompt;
              generationMeta = { 
          mode: 'neotokyoglitch', 
          neoTokyoGlitchPresetId, 
          neoTokyoGlitchPresetLabel: neoTokyoGlitchPreset.label, 
        model: "stability-ai/stable-diffusion-img2img", // Use Stability.ai for Neo Tokyo Glitch
        strength: 0.5, // Stability.ai preset strength
        guidance_scale: 6, // Stability.ai preset guidance
          cfg_scale: 7.0, // Balanced creativity vs adherence
        denoising_strength: 0.5, // Match Stability.ai preset strength
          features: neoTokyoGlitchPreset.features,
        generation_type: "neo_tokyo_strict_ipa", // Strict identity preservation
        ipaThreshold: 0.75, // High similarity required for Neo Tokyo Glitch
        ipaRetries: 3, // Aggressive fallback
        ipaBlocking: true, // Must pass to proceed
        presetKey: neoTokyoGlitchPresetId // Store the full preset ID instead of short key
        };
              console.log('🎭 NEO TOKYO GLITCH MODE: Using Stability.ai + Fal.ai fallback:', neoTokyoGlitchPreset.label, 'Preset:', presetKey);
      
    } else if (kind === 'storytime') {
      // STORY TIME MODE: Use multiple images for video generation
      const storyImages = options?.storyTimeImages || [];
      if (storyImages.length < 3) {
        console.error('❌ Story Time requires at least 3 images');
        notifyError({ title: 'Failed', message: 'Story Time requires at least 3 photos' });
        endGeneration(genId);
        setNavGenerating(false);
        // Clear composer after error
        setTimeout(() => handleClearComposerState(), 1000);
        return;
      }

      effectivePrompt = 'Create an animated story from these photos'; // Default prompt for story time
      generationMeta = {
        mode: 'storytime',
        storyTimeImages: storyImages,
        storyTimePresetId: options?.storyTimePresetId
        // Identity preservation removed - not implemented in backend
      };
      console.log('📖 STORY TIME MODE: Using', storyImages.length, 'images for video generation');
      
    } else {
      console.error('❌ Unknown generation kind:', kind);
              console.error('❌ Generation error: Unknown generation type')
      endGeneration(genId);
      setNavGenerating(false);
      return;
    }
    
    console.log('✅ Final effective prompt:', effectivePrompt);
    console.log('✅ Generation metadata:', generationMeta);
    
    // Add "Make it obvious" test option for debugging
    const makeItObvious = prompt?.toLowerCase().includes('make it obvious') || prompt?.toLowerCase().includes('test');
    if (makeItObvious) {
      effectivePrompt = 'black-and-white line art, no color, heavy outlines, flat shading, cartoon style';
      console.log('🔎 Using "Make it obvious" test prompt:', effectivePrompt);
    }
    
    if (!effectivePrompt) {
      console.warn('No prompt available; aborting.');
      endGeneration(genId);
      setNavGenerating(false);
      return;
    }

    if (!authService.isAuthenticated()) {
      console.warn('User not authenticated; redirecting to auth.');
      navigate('/auth');
      endGeneration(genId);
      setNavGenerating(false);
      return;
    }

    // Apply user intent guard
    console.log('🛡️ Checking user intent guard:', { userInitiated: true, source: kind });
    // if (requireUserIntent({ userInitiated: true, source: kind })) { // REMOVED - drama function deleted
    //   console.warn('⛔ Generation blocked by guard');
    //   endGeneration(genId);
    //   setNavGenerating(false);
    //   return;
    // }
    console.log('✅ User intent guard passed');

    try {
      // Log the final generation parameters
      console.log('🚀 Starting generation with:', {
        kind,
        effectivePrompt,
        generationMeta,
        isVideo: isVideoPreview
      });
      
      // Start generation with ID guard (already set at function start)
      // Just close the composer; keep using outer genId
      setIsComposerOpen(false);

      // 🚀 UNIFIED GENERATION: Use SimpleGenerationService for all modes
      console.log('🚀 [Unified] Using SimpleGenerationService for all generation modes');
      
      // Map generation kind to service mode
      const getServiceMode = (kind: string): GenerationMode => {
        switch (kind) {
          case 'preset': return 'presets';
          case 'custom': return 'custom-prompt';
          case 'emotionmask': return 'emotion-mask';
          case 'ghiblireact': return 'ghibli-reaction';
          case 'neotokyoglitch': return 'neo-glitch';
          case 'storytime': return 'story-time';
          default: return 'presets';
        }
      };
      
      const serviceMode = getServiceMode(kind);
      console.log(`🔄 [Unified] Mapped ${kind} → ${serviceMode}`);
      
      // Ensure we pass a public https Cloudinary URL (not a blob: preview)
      let sourceUrl = previewUrl || '';
      let sourceWidth: number | undefined;
      let sourceHeight: number | undefined;
      
      if (sourceUrl.startsWith('blob:')) {
        // Avoid fetch(blob:) due to CSP; prefer the actual File when available
        const prepared = await prepareSourceAsset(selectedFile || sourceUrl, { showPreviewImmediately: false });
        sourceUrl = prepared.url;
        sourceWidth = prepared.width;
        sourceHeight = prepared.height;
      } else if (sourceUrl.includes('cloudinary.com') && !sourceWidth && !sourceHeight) {
        // For existing Cloudinary URLs, try to extract dimensions from URL or get from API
        try {
          // Try to extract dimensions from URL first (some Cloudinary URLs include dimensions)
          const urlMatch = sourceUrl.match(/w_(\d+),h_(\d+)/);
          if (urlMatch) {
            sourceWidth = parseInt(urlMatch[1]);
            sourceHeight = parseInt(urlMatch[2]);
            console.log(`📐 [HomeNew] Extracted dimensions from URL: ${sourceWidth}x${sourceHeight}`);
          } else {
            // If no dimensions in URL, we'll let the AI APIs use their defaults
            console.log(`📐 [HomeNew] No dimensions found in URL, using AI defaults`);
          }
        } catch (error) {
          console.warn(`⚠️ [HomeNew] Failed to extract dimensions from URL:`, error);
        }
      }

      // Use the unified service
      const simpleGenService = SimpleGenerationService.getInstance();
      const result = await simpleGenService.generate({
        mode: serviceMode,
        prompt: effectivePrompt,
        presetKey: generationMeta?.presetId || generationMeta?.presetKey,
        sourceAssetId: sourceUrl,
        sourceWidth: sourceWidth,
        sourceHeight: sourceHeight,
        userId: authService.getCurrentUser()?.id || '',
        runId: runId,
        emotionMaskPresetId: generationMeta?.emotionMaskPresetId,
        ghibliReactionPresetId: generationMeta?.ghibliReactionPresetId,
        neoGlitchPresetId: generationMeta?.neoTokyoGlitchPresetId,
        storyTimePresetId: generationMeta?.storyTimePresetId,
        additionalImages: generationMeta?.storyTimeImages,
        meta: generationMeta,
        // IPA (Identity Preservation Analysis) parameters
        ipaThreshold: generationMeta?.ipaThreshold || 0.7, // 70% similarity required (increased from 65%)
        ipaRetries: generationMeta?.ipaRetries || 3, // 3 retry attempts (increased from 2)
        ipaBlocking: generationMeta?.ipaBlocking || true // Block if IPA fails
      });
          
      console.log('✅ [Unified] Service result:', result);
      
      // Handle the unified response
      if (result.success && (result.status === 'completed' || (result as any).status === 'done') && (result.imageUrl || (result as any).outputUrl)) {
        const finalImageUrl = result.imageUrl || (result as any).outputUrl || ''
        console.log('🎉 [Unified] Generation completed successfully!');
            
            // Show unified toast with thumbnail
            notifyReady({ 
              title: 'Your media is ready', 
              message: 'Tap to open',
              thumbUrl: finalImageUrl,
              onClickThumb: () => {
            // Open the media viewer
                setViewerMedia([{
                  id: 'generated-' + Date.now(),
                  userId: 'current-user',
                  type: 'photo',
                  url: finalImageUrl,
                  prompt: effectivePrompt,
                  aspectRatio: 1,
                  width: 1024,
                  height: 1024,
                  timestamp: new Date().toISOString(),
                  tokensUsed: 1,
                  likes: 0,
                  isPublic: true,
                    tags: [],
              metadata: { 
                quality: 'high', 
                generationTime: Date.now(), 
                modelVersion: result.provider || 'unknown',
                mode: kind,
                ...generationMeta
              }
                  }]);
                  setViewerStartIndex(0);
                  setViewerOpen(true);
                }
              });
              
        // End generation and refresh feed
              endGeneration(genId);
              setNavGenerating(false);
        loadFeed();
              
        // Clear composer after delay
              setTimeout(() => {
          handleClearComposerState();
        }, 3000);
              
              return;
      } else if (!result.success && result.status === 'completed' && (result.imageUrl || (result as any).outputUrl)) {
        // IPA failure - image was generated but didn't pass identity check
        const finalImageUrl = result.imageUrl || (result as any).outputUrl || ''
        console.log('⚠️ [Unified] Generation completed but failed IPA check');
            
        // Show IPA warning toast with thumbnail
        notifyReady({ 
          title: 'Image generated', 
          message: 'Didn\'t pass identity check - tap to view',
          thumbUrl: finalImageUrl,
          onClickThumb: () => {
            // Open the media viewer
            setViewerMedia([{
              id: 'generated-' + Date.now(),
              userId: 'current-user',
              type: 'photo',
              url: finalImageUrl,
              prompt: effectivePrompt,
              aspectRatio: 1,
              width: 1024,
              height: 1024,
              timestamp: new Date().toISOString(),
              tokensUsed: 1,
              likes: 0,
              isPublic: true,
              tags: [],
              metadata: { 
                quality: 'high', 
                generationTime: Date.now(), 
                modelVersion: result.provider || 'unknown',
                mode: kind,
                ...generationMeta
              }
            }]);
            setViewerStartIndex(0);
            setViewerOpen(true);
          }
        });
              
        // End generation and refresh feed
        endGeneration(genId);
        setNavGenerating(false);
        loadFeed();
              
        // Clear composer after delay
        setTimeout(() => {
          handleClearComposerState();
        }, 3000);
              
        return;
      } else if (result.success && result.status === 'processing') {
        console.log('🔄 [Unified] Generation accepted (202) - running in background');
        // DON'T stop spinners yet - keep them running until completion
        // The generation-complete or generation-success event will stop them
        
        // Don't show additional processing notification - already showed "Added to queue"
        
        // Don't clear composer or stop spinners - wait for completion
        return;
          } else {
        // Generation failed
        console.error('❌ [Unified] Generation failed:', result.error);
        
        // Parse error message for user-friendly display
        let errorMessage = 'Try again';
        if (result.error) {
          if (result.error.includes('Insufficient credits')) {
            errorMessage = 'Not enough credits. Please wait for daily reset or upgrade your plan.';
          } else if (result.error.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.';
          } else if (result.error.includes('HTTP 202') || result.error.includes('processing')) {
            // Don't show toast for background processing
            endGeneration(genId);
            setNavGenerating(false);
            resetComposerState();
            return;
          } else {
            // Use the actual error message if it's meaningful
            errorMessage = result.error;
          }
        }
        
        notifyError({ title: 'Failed', message: errorMessage });
        endGeneration(genId);
        setNavGenerating(false);
        resetComposerState();
        return;
      }



    } catch (e) {
      console.error('dispatchGenerate error', e);
      
      // 🛡️ RUN ID PROTECTION: Only handle errors for current run
      if (currentRunId !== runId) {
        console.warn('⚠️ Ignoring error for stale run:', runId, 'current:', currentRunId);
        return;
      }
      
      // Show user-friendly error message
      let errorMessage = 'Please try again';
      
      // Map technical errors to user-friendly messages
      if (e instanceof Error) {
        if (e.message.includes('Insufficient credits') || e.message.includes('credits but only have')) {
          errorMessage = 'Not enough credits. Please wait for daily reset or upgrade your plan.';
        } else if (e.message.includes('timeout') || e.message.includes('ERR_TIMED_OUT')) {
          errorMessage = 'Request timed out. Please try again with a smaller image or different prompt.';
        } else {
          errorMessage = e.message;
        }
      }
      
      // Show error notification
      notifyError({ title: 'Failed', message: errorMessage });
      
      // Clear generation state on error
      endGeneration(genId);
      setNavGenerating(false);
      
      // Clear composer after error
      setTimeout(() => {
        handleClearComposerState();
      }, 1000);
      
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




  // Helper to resolve source from various UI states
  function resolveSource(): {id: string, url: string} | null {
    // For now, just use previewUrl if available
    // TODO: Implement proper fullscreen viewer, selected media, and upload tracking
    if (previewUrl) return { id: 'preview', url: previewUrl };
    return null;
  }



  // Get Cloudinary signature with JWT auth
  const getCloudinarySignature = async (jwt: string) => {
          const res = await signedFetch('/.netlify/functions/cloudinary-sign', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify({ folder: 'stefna/sources' })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'cloudinary-sign failed');
    if (!data.cloudName) throw new Error('cloud_name missing from signer');
    return data; // { cloudName, apiKey, timestamp, signature }
  }



  // Centralized auth check function
  const checkAuthAndRedirect = () => {
    if (!authService.isAuthenticated()) {
      console.log('❌ User not authenticated, redirecting to auth')
      navigate('/auth')
      return false
    }
    return true
  }

  // Debug function to clear auth state for testing
  const clearAuthForTesting = () => {
    console.log('🧹 Clearing auth state for testing...')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    authService.clearAuthState()
    console.log('✅ Auth state cleared')
  }

  // Expose debug function globally
  useEffect(() => {
    ;(window as any).clearAuthForTesting = clearAuthForTesting
    ;(window as any).debugAuth = () => {
      console.log('🔍 Auth Debug:', {
        isAuthenticated: authService.isAuthenticated(),
        hasToken: !!authService.getToken(),
        authState: authService.getAuthState(),
        localStorage: {
          token: !!localStorage.getItem('auth_token'),
          user: !!localStorage.getItem('user_data')
        }
      })
    }
  }, [])

  // Handle preset click - immediately generates with preset style (one-click)
  const handlePresetClick = async (presetName: string) => {
    console.log('🎨 Preset clicked:', presetName)
    console.log('🔍 Current state:', { selectedFile: !!selectedFile, isAuthenticated, selectedPreset: selectedPreset })
    
    // Update composer state for preset mode
    setComposerState(s => ({
      ...s,
      mode: 'preset',
      selectedPresetId: String(presetName),
      status: 'idle',
      error: null,
      runOnOpen: false
    }))
    
    // Set the selected preset in the store
    setSelectedPreset(presetName as any)
    console.log('✅ Preset set in store:', presetName)
    
    // Check if we can auto-generate
    if (!selectedFile) {
      console.log('❌ No file selected, cannot generate with preset')
              console.error(`❌ Add an image first: Select an image to use ${presetName}`)
      return
    }
    
    // Check authentication directly from auth service
    console.log('🔍 Pre-auth check debug:', {
      authServiceIsAuthenticated: authService.isAuthenticated(),
      hasToken: !!authService.getToken(),
      localStorageToken: !!localStorage.getItem('auth_token'),
      localStorageUser: !!localStorage.getItem('user_data'),
      authState: authService.getAuthState(),
      tokenPreview: authService.getToken() ? authService.getToken()?.substring(0, 20) + '...' : 'none'
    })
    
    if (!authService.isAuthenticated()) {
      console.log('❌ User not authenticated, redirecting to auth')
      console.log('🔍 Debug auth state:', { 
        isAuthenticated, 
        authServiceState: authService.getAuthState(),
        hasToken: !!authService.getToken(),
        authServiceIsAuthenticated: authService.isAuthenticated(),
        localStorageToken: !!localStorage.getItem('auth_token'),
        localStorageUser: !!localStorage.getItem('user_data')
      })
      navigate('/auth')
      return
    }
    
    // 🚀 IMMEDIATE GENERATION - No unnecessary delays
    console.log('🚀 Auto-generating with preset:', presetName)
    
            // Preset applied silently - no toast notification
    
    try {
      await dispatchGenerate('preset', {
        presetId: String(presetName),
        presetData: getPresetById(presetName, availablePresets)
      })
    } catch (error) {
      console.log('❌ Preset generation failed:', error)
      // Clear all options after preset generation failure
      clearAllOptionsAfterGeneration();
    }
  }



  // openComposerFromRemix function removed - no more remix functionality



  // Auto-generate with preset - simplified to use existing dispatchGenerate
  const handlePresetAutoGeneration = async (presetName: string) => {
    console.log('🚀 handlePresetAutoGeneration called with:', presetName)
    
    if (!previewUrl) {
      console.log('❌ No previewUrl available, cannot generate')
      return;
    }

    console.log('🚀 Auto-generating with preset:', presetName);
    
    // Update composer state for preset mode
    setComposerState(s => ({
      ...s,
      mode: 'preset',
      selectedPresetId: String(presetName),
      customPrompt: '', // Clear custom prompt
      status: 'idle',
      error: null,
      runOnOpen: false
    }))
    
    // Use the existing dispatchGenerate function with 'preset' kind
    // This ensures all the proper validation, error handling, and database saving happens
    await dispatchGenerate('preset');
  }

  // SEPARATE GENERATION FUNCTIONS FOR EACH MODE - NO MORE CROSS-CONTAMINATION
  
  // 1. CUSTOM MODE GENERATION - Only uses user's typed prompt
  const generateCustom = async () => {
    console.log('🎨 CUSTOM MODE: Generating with user prompt only')
    
    if (!prompt.trim()) {
      console.error('❌ Custom prompt required: Please enter a prompt to generate')
      return
    }
    
    // Update composer state for custom mode
    setComposerState(s => ({
      ...s,
      mode: 'custom',
      selectedPresetId: null, // Clear preset
      customPrompt: prompt.trim(), // Store custom prompt
      status: 'idle',
      error: null
    }))
    
    // Generate with ONLY the custom prompt - no preset contamination
    await dispatchGenerate('custom', {
      customPrompt: prompt.trim()
    })
    
    // Clear composer after successful generation
    setTimeout(() => {
      clearAllOptionsAfterGeneration()
    }, 200) // Reduced delay for faster response
  }
  
  // 2. PRESET MODE GENERATION - Only uses selected preset
  const generatePreset = async () => {
    console.log('🎯 PRESET MODE: Generating with preset only')
    
    if (!selectedPreset) {
      console.error('❌ Preset required: Please select a preset first')
      return
    }
    
    // Update composer state for preset mode
    setComposerState(s => ({
      ...s,
      mode: 'preset',
      selectedPresetId: selectedPreset as string | null,
      customPrompt: '', // Clear custom prompt
      status: 'idle',
      error: null
    }))
    
    // Generate with ONLY the preset - no custom prompt contamination
    await dispatchGenerate('preset', {
      presetId: selectedPreset as string,
      presetData: getPresetById(selectedPreset as string, availablePresets)
    })
    
    // Clear composer after successful generation
    setTimeout(() => {
      clearAllOptionsAfterGeneration()
    }, 200) // Reduced delay for faster response
  }
  

  
  // generateRemix function removed - no more remix functionality

  // 5. EMOTION MASK MODE GENERATION - Uses selected emotional variant
  const generateEmotionMask = async () => {
    console.log('🎭 EMOTION MASK MODE: Generating emotional truth portrait')
    
    if (!selectedEmotionMaskPreset) {
      console.error('❌ Emotion Mask preset required: Please select an emotional variant first')
      return
    }
    
    // Update composer state for Emotion Mask mode
    setComposerState(s => ({
      ...s,
      mode: 'emotionmask',
      selectedPresetId: null, // Clear preset
      
      selectedEmotionMaskPresetId: selectedEmotionMaskPreset, // Set selected emotional variant
      customPrompt: '', // Clear custom prompt
      status: 'idle',
      error: null
    }))
    
    // Generate with ONLY the selected Emotion Mask variant - no other contamination
    await dispatchGenerate('emotionmask', {
      emotionMaskPresetId: selectedEmotionMaskPreset
    });
    
    // Clear composer after successful generation
    setTimeout(() => {
      clearAllOptionsAfterGeneration()
    }, 200) // Reduced delay for faster response
  }









  const handleShare = async (media: UserMedia) => {
    // UI guards: prevent sharing until asset is ready
    if (!media.cloudinaryPublicId || !media.mediaType) {
      console.error('Cannot share: missing cloudinary_public_id or media_type');
              console.error('❌ Something went wrong: Cannot share incomplete media')
      return;
    }
    
    // Open social media share modal instead of feed sharing
  }

  const handleUnshare = async (media: UserMedia) => {
    if (!authService.getToken()) {
              // Sign up required - no notification needed
      navigate('/auth')
      return
    }
    

    
    console.log('📤 Unsharing media:', media.id)
    
    const r = await authenticatedFetch('/.netlify/functions/recordShare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        asset_id: media.id, 
        shareToFeed: false, 
 
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
              console.error('❌ Failed:', error.error || 'Failed to remove media from feed')
    }
  }

  // handleRemix function removed - no more remix functionality



  const handleMediaClick = (media: UserMedia) => {
    console.log('🔍 HomeNew handleMediaClick:', {
      id: media.id,
      prompt: media.prompt,
      userId: media.userId,
      type: media.type,
      hasPrompt: !!media.prompt,
      promptLength: media.prompt?.length || 0
    })
    
    // Find the index of the clicked media in the filtered feed
    const mediaIndex = filteredFeed.findIndex(item => item.id === media.id)
    const startIndex = mediaIndex >= 0 ? mediaIndex : 0
    
    // Pass the full filtered feed for navigation
    setViewerMedia(filteredFeed)
    setViewerStartIndex(startIndex)
    setViewerOpen(true)
  }

  // Apply filter to feed
  const filteredFeed = feed.filter((item) => {
    if (creatorFilter && item.userId !== creatorFilter) return false
    if (currentFilter === 'images') return item.type === 'photo'
    if (currentFilter === 'videos') return item.type === 'video'
    
    // Apply preset type filtering
    if (activeFeedFilter) {
      // Use the new mapping utility for consistent filtering
      const presetType = getPresetTypeForFilter(item)
      
      // Debug logging for filtering
      console.log(`🔍 [Filter] Item ${item.id}:`, {
        presetKey: item.presetKey,
        metadataPresetType: item.metadata?.presetType,
        calculatedPresetType: presetType,
        activeFeedFilter,
        matches: presetType === activeFeedFilter
      })
      
      if (presetType !== activeFeedFilter) return false
    }
    
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
            
            // Reset composer state for next upload
            resetComposerState();
            
            window.dispatchEvent(new CustomEvent('refreshFeed'))
            window.dispatchEvent(new Event('userMediaUpdated'))
          } else if (jobStatus && (jobStatus.status === 'failed' || jobStatus.status === 'timeout')) {
            clearInterval(interval)
            setVideoJobPolling(null)
            setCurrentVideoJob(null)
            console.error('❌ Failed:', jobStatus.error || (jobStatus.status === 'timeout' ? 'Timed out' : 'Video processing failed'))
            
            // Reset composer state even on failure
            resetComposerState();
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
               console.error('❌ Something went wrong: Upload media and enter a prompt first')
      return
    }
    
    try {
      const user = authService.getCurrentUser()
      if (!user?.id) {
        console.error('❌ Something went wrong: Please sign up to save drafts')
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
        isPublic: false,
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
              console.log('✅ Draft saved successfully')
      
      // Dispatch event to notify ProfileScreen to refresh drafts
      window.dispatchEvent(new Event('userMediaUpdated'))
      
    } catch (error) {
      console.error('Failed to save draft:', error)
              console.error('❌ Something went wrong: Could not save draft')
    }
  }

  // Magic Wand Enhancement - Free AI prompt enhancement
  const handleMagicWandEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return
    
    setIsEnhancing(true)
    console.log('✨ Magic Wand enhancing prompt:', prompt)
    
    try {
              // Call Fal.ai API for prompt enhancement (free)
        const enhancedPrompt = await enhancePromptWithFAL(prompt.trim())
      
      if (enhancedPrompt) {
        setPrompt(enhancedPrompt)
        console.log('✨ Prompt enhanced successfully:', enhancedPrompt)
        // Show success feedback - with safety check
                // Prompt enhanced silently - no toast notification
      }
    } catch (error) {
      console.error('❌ Magic Wand enhancement failed:', error)
      // Show error feedback but keep original prompt - with safety check
              console.error('❌ Enhancement failed: Could not enhance prompt, keeping original')
    } finally {
      setIsEnhancing(false)
    }
  }

        // Fal.ai API prompt enhancement function
      const enhancePromptWithFAL = async (originalPrompt: string): Promise<string> => {
    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error('Authentication required')
      }

              console.log('🚀 Calling Fal.ai API for prompt enhancement...')
      
      // 🎯 All generation now goes through GenerationPipeline - no direct aimlApi calls
      console.log('🆕 [New System] All generation goes through GenerationPipeline');
      return enhancePromptLocally(originalPrompt);
    } catch (error) {
      console.error('❌ Prompt enhancement failed, using local fallback:', error);
      return enhancePromptLocally(originalPrompt);
    }
  }

          // Local prompt enhancement fallback (when Fal.ai is unavailable)
  const enhancePromptLocally = (originalPrompt: string): string => {
    console.log('🔄 Using local prompt enhancement fallback')
    
    // Simple enhancement templates for common cases
    const enhancements = [
      ', professional photography style, high quality, sharp details, 8K resolution',
      ', cinematic lighting, dramatic shadows, professional composition, studio quality',
      ', artistic style, creative interpretation, enhanced colors, premium quality',
      ', professional editing, enhanced contrast, vibrant colors, high resolution',
      ', studio lighting, professional photography, enhanced details, premium finish'
    ]
    
    // Pick a random enhancement and add it
    const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)]
    return originalPrompt + randomEnhancement
  }



  // Tier promotions removed - simplified credit system

  // REMOVED: updateUserSettings - Settings are managed through ProfileScreen and UserSettingsService

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
  
  // Load user's media upload agreement status from database
  useEffect(() => {
    const loadUserAgreementStatus = async () => {
      if (!isAuthenticated) return;
      
      try {
        const token = authService.getToken();
        if (!token) return;
        
        const response = await fetch('/.netlify/functions/user-settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.settings && data.settings.media_upload_agreed) {
            setUserHasAgreed(true);
            console.log('✅ User has agreed to media upload');
          } else {
            setUserHasAgreed(false);
            console.log('⚠️ User has not agreed to media upload');
          }
        }
      } catch (error) {
        console.error('Failed to load user agreement status:', error);
        // Default to false if we can't load the status
        setUserHasAgreed(false);
      }
    };
    
    loadUserAgreementStatus();
  }, [isAuthenticated]);
  
  // Composer clearing function - defined early to avoid reference errors
  
  return (
    <div className="flex min-h-screen bg-black relative overflow-hidden w-full">
      {/* Hidden file uploader for intent-based uploads */}
      <HiddenUploader />

      {/* Floating Logo - Top Left */}
      <div className="fixed top-6 left-6 z-50 flex items-center">
        <img 
          src="/logo.png" 
          alt="Stefna Logo" 
          className="w-8 h-8 object-contain cursor-pointer hover:scale-110 transition-transform duration-200" 
        />
      </div>
      
      {/* Filter Banner - Center Top */}
      {activeFeedFilter && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/10 text-white text-sm px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm">
                      Filtering by <span className="font-medium capitalize">{getFilterDisplayName(activeFeedFilter)}</span> • 
          <button className="underline ml-1 hover:text-white/80 transition-colors" onClick={() => setActiveFeedFilter(null)}>
            clear
          </button>
        </div>
      )}

      {/* Floating Controls - Top Right */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        
        
        {/* Upload Button */}
        <button
          onClick={handleUploadClick}
          className={`w-12 h-12 rounded-full border transition-all duration-300 flex items-center justify-center hover:scale-105 relative group ${
            isAuthenticated 
              ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' 
              : 'bg-white text-black border-white hover:bg-white/90'
          }`}
          aria-label="Upload"
          title="Upload"
        >
          <Plus size={24} className="transition-transform duration-200" />
          
          {/* Hover Tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Upload
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black/80"></div>
          </div>
        </button>



        {/* Login/Profile Button */}
        {!isAuthenticated ? (
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 bg-white text-black rounded-full border border-white transition-all duration-300 hover:bg-white/90 hover:scale-105"
            aria-label="Login"
          >
            <span className="text-sm font-medium">Login</span>
          </button>
        ) : (
          <div className="relative">
            <button
                                  onClick={() => {
                      setProfileDropdownOpen(prev => !prev)
                    }}
              className="w-12 h-12 bg-white/10 text-white rounded-full border border-white/20 transition-all duration-300 flex items-center justify-center hover:bg-white/20 hover:scale-105"
              aria-label="Profile"
            >
              <ProfileIcon size={24} className="transition-transform duration-200" />
            </button>
            {/* Loading spinner around profile icon when generating */}
            {navGenerating && (
              <div className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            )}
            
            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div data-profile-dropdown className="absolute right-0 top-full mt-2 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-white/20 min-w-[120px] z-50">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full text-left px-3 py-2 text-gray-800 hover:bg-gray-100 rounded-md transition-colors text-sm"
                >
                  Profile
                </button>

                <button
                  onClick={() => {
                    authService.logout()
                    setProfileDropdownOpen(false)
                    navigate('/')
                  }}
                  className="w-full text-left px-3 py-2 text-gray-800 hover:bg-gray-100 rounded-md transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main content area - Full width with top padding for floating components */}
      <div className="w-full min-h-screen pt-24">
        {/* Feed content - 3 columns */}
        <div className="pt-0">
          {isLoadingFeed ? (
            <div className="w-full">
              {/* 🎨 Engaging skeleton loading inspired by Sora's aesthetic */}
              <SkeletonGrid columns={3} rows={6} />
            </div>
          ) : feed.length > 0 ? (
            <>
              <SafeMasonryGrid 
                feed={filteredFeed}
                handleMediaClick={handleMediaClick}
                onLastItemRef={setLastItemRef}
                // handleRemix removed
                onPresetTagClick={(presetType) => setActiveFeedFilter(presetType)}
                onToggleLike={handleToggleLike}
                userLikes={userLikes}
                isLoggedIn={isAuthenticated}
                onShowAuth={() => navigate('/auth')}
              />
              
              {/* 🚀 Unified infinite scroll: Loading indicator */}
              {isLoadingMore && hasMoreFeed && (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" text="Loading more masterpieces..." />
                </div>
              )}
              
              {/* End of feed indicator */}
              {!hasMoreFeed && feed.length > 0 && (
                <div className="text-center py-8 text-white/40 text-sm">
                  ✨ You've reached the end of the feed
                </div>
              )}
              
              {/* 🚀 Infinite scroll debug info */}
              {import.meta.env.DEV && (
                <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded backdrop-blur-sm z-50">
                  <div>📊 Feed: {feed.length}</div>
                                      <div>🔍 Filtered: {filteredFeed.length}</div>
                    <div>🎯 Active Filter: {activeFeedFilter ? getFilterDisplayName(activeFeedFilter) : 'none'}</div>
                    <div>📡 Has More: {hasMoreFeed ? 'Yes' : 'No'}</div>
                  <div>⏳ Loading: {isLoadingMore ? 'Yes' : 'No'}</div>
                </div>
              )}

            </>
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





      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {/* Full Screen Media Viewer */}
      <FullScreenMediaViewer
        isOpen={viewerOpen}
        media={viewerMedia}
        startIndex={viewerStartIndex}
        onClose={() => setViewerOpen(false)}
        onShowAuth={() => navigate('/auth')}
        // Likes functionality
        onToggleLike={handleToggleLike}
        userLikes={userLikes}
        isLoggedIn={isAuthenticated}
      />

                {/* Bottom-centered composer */}
          {isComposerOpen && (
            <div className="fixed inset-0 z-[999999] bg-black" style={{ zIndex: 999999 }}>
          {/* Close button */}
          <button type="button" onClick={closeComposer} className="absolute top-4 right-4 z-[999999] pointer-events-auto text-white/80 hover:text-white transition-colors bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full p-2" aria-label="Close">
            <X size={20} />
          </button>
          
  
          
          {/* Media preview area - centered above prompt */}
          <div className="absolute inset-0 flex items-center justify-center pb-48">
            <div className="relative w-full max-w-2xl px-6">
              <div ref={containerRef} className="w-full flex items-center justify-center">
                {/* Story Time Mode - Special UI */}
                {composerState.mode === 'storytime' ? (
                  <StoryTimeComposer
                    selectedFile={selectedFile}
                    additionalImages={additionalStoryImages}
                    onFileUpload={handleFileChange}
                    onAdditionalUpload={handleAdditionalStoryImageUpload}
                    onAdditionalRemove={handleAdditionalStoryImageRemove}
                    onFileRemove={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                    }}
                  />
                ) : (
                  /* Regular modes - show normal image/video preview */
                  <>
                    {previewUrl ? (
                      isVideoPreview ? (
                        <video ref={(el) => (mediaRef.current = el)} src={previewUrl || ''} className="max-w-full max-h-[60vh] object-contain" controls onLoadedMetadata={measure} onLoadedData={measure} />
                      ) : (
                    <img 
                      ref={(el) => (mediaRef.current = el as HTMLImageElement)} 
                      src={previewUrl || ''} 
                      alt="Preview" 
                      className="max-w-full max-h-[60vh] object-contain" 
                      referrerPolicy="no-referrer"
                      onLoad={(e) => {
                        console.log('🖼️ Image loaded successfully:', previewUrl)
                        measure()
                      }}
                      onError={(e) => {
                        console.error('❌ Image failed to load:', previewUrl, e)
                        console.error('❌ Error details:', {
                          url: previewUrl,
                          error: e,
                          target: e.target,
                          currentTarget: e.currentTarget
                        })
                      }}
                    />
                      )
                    ) : (
                      /* No file selected - show upload prompt */
                      <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center border-2 border-dashed border-white/30">
                          <Plus size={32} className="text-white/60" />
                        </div>
                        <p className="text-white/80 text-lg mb-2">Upload an image to get started</p>
                        <p className="text-white/60 text-sm">Drag & drop or click to browse</p>
                      </div>
                    )}
                  </>
                )}
                

              </div>
            </div>
          </div>

                      {/* Bottom composer bar - compact, horizontally 70% */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 transition-all duration-300 w-[70%] min-w-[500px] max-w-[800px]">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-4 py-3 transition-all duration-300 shadow-2xl shadow-black/20">
              

              

              {/* Prompt Input - ALWAYS VISIBLE for all modes */}
              <div className="mb-2">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      console.log('🎯 Prompt input changed:', e.target.value);
                      setPrompt(e.target.value);
                    }}
                    placeholder={composerState.mode === 'custom' 
                      ? "Describe your vision... (click ✨ to enhance your prompt)"
                      : "Custom prompt (optional) - will be combined with selected preset"
                    }
                    className="w-full px-3 py-2 pr-10 bg-white/10 backdrop-blur-md text-white placeholder-white/70 resize-none focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/15 transition-all duration-200 h-20 text-sm rounded-xl"
                    disabled={false}
                    data-testid="custom-prompt-input"
                  />
                  {/* Custom Mode Button - show when user types in prompt */}
                  {prompt.trim() && composerState.mode !== 'custom' && (
                    <button
                      onClick={() => {
                        setComposerState(s => ({ ...s, mode: 'custom' }))
                        setSelectedMode('presets') // Set selectedMode to match the new system
                      }}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-white/60 hover:text-white/80 transition-colors"
                      title="Switch to custom mode"
                    >
                      <span className="text-sm">🎨</span>
                    </button>
                  )}
                  
                  {/* Magic Wand Enhancement Button - only show for custom mode */}
                  {composerState.mode === 'custom' && (
                    <button
                      onClick={handleMagicWandEnhance}
                      disabled={isGenerating || !prompt.trim()}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-white/60 hover:text-white/80 transition-colors disabled:text-white/30 disabled:cursor-not-allowed"
                      title="Enhance prompt with AI (free)"
                    >
                      {isEnhancing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="text-lg">✨</span>
                      )}
                    </button>
                  )}
                  <div className="absolute bottom-2 right-2 text-white/30 text-xs">
                    {prompt.length}/500
                  </div>
                </div>
              </div>

              {/* Single row with all controls */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Left: Variations toggle + Presets + MoodMorph */}
                <div className="flex items-center gap-2">
                  {/* Variations selector removed - single generation only */}

                  {/* Presets dropdown button */}
                  <div className="relative" data-presets-dropdown>
                                        <button
                      onClick={() => {
                        // Check authentication first
                        if (!checkAuthAndRedirect()) return
                        
                        console.log('🎯 Presets button clicked!')
                        console.log('🔍 Current presetsOpen state:', presetsOpen)
                        console.log('🔍 Available presets:', weeklyPresetNames)
                        // Allow exploration - close all other dropdowns and toggle presets
                        closeAllDropdowns()
                        setPresetsOpen((v) => !v)
                        console.log('🔄 Toggling presetsOpen to:', !presetsOpen)
                      }}
                      className={`px-3 py-1.5 rounded-2xl text-xs transition-colors ${
                        isAuthenticated 
                          ? 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30' 
                          : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20'
                      }`}
                      data-nav-button
                      data-nav-type="presets"
                      title={isAuthenticated ? 'Choose AI style presets' : 'Explore AI style presets'}
                    >
                      {selectedPreset ? getPresetLabel(selectedPreset as string, availablePresets) : 'Presets'}
                    </button>
                    
                    {/* Presets dropdown - clean and simple */}
                    {presetsOpen && (
                                             <div className="absolute bottom-full left-0 mb-2 rounded-xl p-3 w-80 z-50 shadow-2xl shadow-black/20" style={{ backgroundColor: '#333333' }}>
                        {/* Preset options - all visible, no scrolling */}
                        <div className="space-y-1">
                          {/* Loading state */}
                          {presetsLoading && (
                            <div className="px-3 py-2 text-sm text-white/70">
                              Loading presets...
                            </div>
                          )}

                          {/* Error state */}
                          {presetsError && (
                            <div className="px-3 py-2 text-sm text-red-400">
                              Failed to load presets
                            </div>
                          )}

                          {/* Preset options */}
                          {!presetsLoading && !presetsError && weeklyPresetNames.map((name) => (
                            <button
                              key={name}
                              onClick={() => {
                                console.log('🎯 Preset clicked:', name)
                                console.log('🔍 About to call handlePresetClick with:', name)
                                handlePresetClick(name)
                                setPresetsOpen(false)
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                                selectedPreset === name 
                                  ? 'bg-white/90 backdrop-blur-md text-black' 
                                  : 'text-white hover:text-white hover:bg-white/20'
                              }`}
                            >
                              <span>{getPresetLabel(String(name), availablePresets)}</span>
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

                  {/* Identity Lock removed - IPA now runs automatically based on preset type */}

                  {/* MoodMorph removed - replaced with Anime Filters */}

                  {/* Emotion Mask™ button - SINGLE BUTTON with dropdown */}
                  <div className="relative" data-emotionmask-dropdown>
                    <button
                      onClick={async () => {
                        // Check authentication first
                        if (!checkAuthAndRedirect()) return
                        
                        if (composerState.mode === 'emotionmask') {
                          // Already in Emotion Mask mode - toggle dropdown
                          closeAllDropdowns()
                          setEmotionMaskDropdownOpen((v) => !v)
                        } else {
                          // Switch to Emotion Mask mode AND show dropdown immediately
                          closeAllDropdowns()
                          setComposerState(s => ({ ...s, mode: 'emotionmask' }))
                          setSelectedMode('presets') // Set selectedMode to match the new system
                          setSelectedEmotionMaskPreset(null)
                          setEmotionMaskDropdownOpen(true) // Show dropdown immediately
                        }
                      }}
                      className={
                        composerState.mode === 'emotionmask'
                          ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                          : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                      }
                      title={isAuthenticated ? 'Switch to Emotion Mask™ mode' : 'Explore Emotion Mask™ mode'}
                    >
                      {selectedEmotionMaskPreset ? 
                        EMOTION_MASK_PRESETS.find(p => p.id === selectedEmotionMaskPreset)?.label || 'Emotion Mask™' 
                        : 'Emotion Mask™'
                      }
                    </button>
                    
                    {/* Emotion Mask presets dropdown - show when in Emotion Mask mode */}
                    {composerState.mode === 'emotionmask' && emotionMaskDropdownOpen && (
                      <div className="absolute bottom-full left-0 mb-2 z-50">
                        <EmotionMaskPicker
                          value={selectedEmotionMaskPreset || undefined}
                            onChange={async (presetId) => {
                            setSelectedEmotionMaskPreset(presetId || null)
                            setEmotionMaskDropdownOpen(false)
                              
                            // Auto-generate when Emotion Mask preset is selected
                              if (presetId && selectedFile && isAuthenticated) {
                              console.log('🎭 Auto-generating Emotion Mask with preset:', presetId)
                                try {
                                await dispatchGenerate('emotionmask', {
                                  emotionMaskPresetId: presetId
                                  })
                                // Clear composer after successful generation
                                setTimeout(() => {
                                  clearAllOptionsAfterGeneration()
                                }, 500)
                                } catch (error) {
                                  console.error('❌ Emotion Mask auto-generation failed:', error)
                                  // Clear composer after generation error
                                  setTimeout(() => {
                                    clearAllOptionsAfterGeneration()
                                  }, 300)
                                }
                              }
                            }}
                            disabled={!isAuthenticated}
                          />
                        </div>
                      )}
                      

                  </div>

                  {/* Studio Ghibli Reaction™ button - SINGLE BUTTON with dropdown */}
                  <div className="relative" data-ghiblireact-dropdown>
                    <button
                      onClick={async () => {
                        // Check authentication first
                        if (!checkAuthAndRedirect()) return
                        
                        if (composerState.mode === 'ghiblireact') {
                          // Already in Ghibli Reaction mode - toggle dropdown
                          closeAllDropdowns()
                          setGhibliReactionDropdownOpen((v) => !v)
                        } else {
                          // Switch to Ghibli Reaction mode AND show dropdown immediately
                          closeAllDropdowns()
                          setComposerState(s => ({ ...s, mode: 'ghiblireact' }))
                          setSelectedMode('presets') // Set selectedMode to match the new system
                          setSelectedGhibliReactionPreset(null)
                          setGhibliReactionDropdownOpen(true) // Show dropdown immediately
                        }
                      }}
                      className={
                        composerState.mode === 'ghiblireact'
                          ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                          : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                      }
                      title={isAuthenticated ? 'Switch to Studio Ghibli Reaction mode' : 'Explore Studio Ghibli Reaction mode'}
                    >
                      {selectedGhibliReactionPreset ? 
                        GHIBLI_REACTION_PRESETS.find(p => p.id === selectedGhibliReactionPreset)?.label || 'Ghibli Reaction' 
                        : 'Ghibli Reaction'
                      }
                    </button>
                    
                    {/* Ghibli Reaction presets dropdown - show when in Ghibli Reaction mode */}
                    {composerState.mode === 'ghiblireact' && ghibliReactionDropdownOpen && (
                      <div className="absolute bottom-full left-0 mb-2 z-50">
                        <GhibliReactionPicker
                                                      value={selectedGhibliReactionPreset || undefined}
                          onChange={async (presetId) => {
                            setSelectedGhibliReactionPreset(presetId || null)
                            setGhibliReactionDropdownOpen(false)
                            
                            // Auto-generate when Ghibli Reaction preset is selected
                            if (presetId && selectedFile && isAuthenticated) {
                              console.log('🎭 Auto-generating Ghibli Reaction with preset:', presetId)
                              try {
                                await dispatchGenerate('ghiblireact', {
                                  ghibliReactionPresetId: presetId
                                })
                                // Clear composer after successful generation
                                setTimeout(() => {
                                  clearAllOptionsAfterGeneration()
                                }, 500)
                              } catch (error) {
                                console.error('❌ Ghibli Reaction auto-generation failed:', error)
                                // Clear composer after generation error
                                setTimeout(() => {
                                  clearAllOptionsAfterGeneration()
                                }, 300)
                              }
                            }
                          }}
                          disabled={!isAuthenticated}
                        />
                      </div>
                    )}
                  </div>



                  {/* Neo Tokyo Glitch™ button - SINGLE BUTTON with dropdown */}
                  <div className="relative" data-neotokyoglitch-dropdown>
                    <button
                      onClick={async () => {
                        // Check authentication first
                        if (!checkAuthAndRedirect()) return
                        
                        if (composerState.mode === 'neotokyoglitch') {
                          // Already in Neo Tokyo Glitch mode - toggle dropdown
                          closeAllDropdowns()
                          setNeoTokyoGlitchDropdownOpen((v) => !v)
                        } else {
                          // Switch to Neo Tokyo Glitch mode AND show dropdown immediately
                          closeAllDropdowns()
                          setComposerState(s => ({ ...s, mode: 'neotokyoglitch' }))
                          setSelectedMode('presets') // Set selectedMode to match the new system
                          setSelectedNeoTokyoGlitchPreset(null)
                          setNeoTokyoGlitchDropdownOpen(true) // Show dropdown immediately
                        }
                      }}
                      className={
                        composerState.mode === 'neotokyoglitch'
                          ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                          : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                      }
                      title={isAuthenticated ? 'Switch to Neo Tokyo Glitch mode' : 'Explore Neo Tokyo Glitch mode'}
                    >
                      {selectedNeoTokyoGlitchPreset ? 
                        NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === selectedNeoTokyoGlitchPreset)?.label || 'Neo Tokyo Glitch' 
                        : 'Neo Tokyo Glitch'
                      }
                    </button>
                    
                    {/* Neo Tokyo Glitch presets dropdown - show when in Neo Tokyo Glitch mode */}
                    {composerState.mode === 'neotokyoglitch' && neoTokyoGlitchDropdownOpen && (
                      <div className="absolute bottom-full left-0 mb-2 z-50">
                        <NeoTokyoGlitchPicker
                                                      value={selectedNeoTokyoGlitchPreset || undefined}
                          onChange={async (presetId) => {
                            setSelectedNeoTokyoGlitchPreset(presetId || null)
                            setNeoTokyoGlitchDropdownOpen(false)
                            
                            // Auto-generate when Neo Tokyo Glitch preset is selected
                            if (presetId && selectedFile && isAuthenticated) {
                              console.log('🎭 Auto-generating Neo Tokyo Glitch with preset:', presetId)
                              try {
                                await dispatchGenerate('neotokyoglitch', {
                                  neoTokyoGlitchPresetId: presetId
                                })
                                // Clear composer after successful generation
                                setTimeout(() => {
                                  clearAllOptionsAfterGeneration()
                                }, 500)
                              } catch (error) {
                                console.error('❌ Neo Tokyo Glitch auto-generation failed:', error)
                                // Clear composer after generation error
                                setTimeout(() => {
                                  clearAllOptionsAfterGeneration()
                                }, 300)
                              }
                            }
                          }}
                          disabled={!isAuthenticated}
                        />
                      </div>
                    )}
                  </div>

                  {/* Story Time™ button - SINGLE BUTTON with dropdown */}
                  <div className="relative" data-storytime-dropdown>
                    <button
                      onClick={async () => {
                        // Check authentication first
                        if (!checkAuthAndRedirect()) return
                        
                        if (composerState.mode === 'storytime') {
                          // Already in Story Time mode - auto-generate if ready
                          if (selectedStoryTimePreset && canGenerateStory && isAuthenticated) {
                            console.log('🎬 Auto-generating Story Time from button click')
                            try {
                              await dispatchGenerate('storytime', {
                                storyTimeImages: [selectedFile!, ...additionalStoryImages.filter(Boolean)],
                                storyTimePresetId: selectedStoryTimePreset
                              })
                            } catch (error) {
                              console.error('❌ Story Time generation failed:', error)
                            }
                          } else {
                          closeAllDropdowns()
                          }
                        } else {
                          // Switch to Story Time mode
                          closeAllDropdowns()
                          setComposerState(s => ({ ...s, mode: 'storytime' }))
                          setSelectedMode('presets') // Set selectedMode to match the new system
                          setSelectedStoryTimePreset(null)
                        }
                      }}
                      className={
                        composerState.mode === 'storytime'
                          ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                          : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                      }
                      title={isAuthenticated ? 'Switch to Story Time mode' : 'Explore Story Time mode'}
                    >
                      {selectedStoryTimePreset ? 
                        selectedStoryTimePreset === 'auto' ? 'Story Time (Auto)' :
                        selectedStoryTimePreset.charAt(0).toUpperCase() + selectedStoryTimePreset.slice(1)
                        : 'Story Time'
                      }
                    </button>
                    

                  </div>
                </div>

                {/* Right: Action buttons - Save to draft and Generate */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!checkAuthAndRedirect()) return
                      handleSaveDraft()
                    }}
                    title={authService.isAuthenticated() ? 'Save to draft' : 'Sign up to save drafts'}
                    className={(() => {
                      const baseClass = 'w-8 h-8 rounded-full flex items-center justify-center transition-colors';
                      const activeClass = 'bg-white/10 text-white hover:bg-white/15';
                      const disabledClass = 'bg-white/5 text-white/50 cursor-not-allowed';
                      return `${baseClass} ${authService.isAuthenticated() ? activeClass : disabledClass}`;
                    })()}
                    aria-label="Save to draft"
                    disabled={!authService.isAuthenticated()}
                  >
                    <FileText size={14} />
                  </button>
                  <button 
                    onClick={async () => {
                      // Check authentication first
                      if (!checkAuthAndRedirect()) return
                      
                      // Show immediate feedback that button was clicked
                      setNavGenerating(true)
                      
                      // Close composer immediately
                      window.dispatchEvent(new CustomEvent('close-composer'));
                      
                      // MODE-AWARE GENERATION - NO MORE CROSS-CONTAMINATION
                      if (composerState.mode === 'preset') {
                        // Preset mode - use preset generation
                        console.log('🎯 Preset mode - calling generatePreset')
                        await generatePreset()
                      } else if (composerState.mode === 'custom') {
                        // Custom mode - use custom generation
                        console.log('🎨 Custom mode - calling generateCustom')
                        await generateCustom()
                                             
                      } else if (composerState.mode === 'emotionmask') {
                        // Emotion Mask mode - use Emotion Mask generation
                        console.log('🎭 Emotion Mask mode - calling generateEmotionMask')
                        await generateEmotionMask()
                      } else if (composerState.mode === 'ghiblireact') {
                        // Ghibli Reaction mode - use dispatchGenerate directly
                        console.log('🎭 Ghibli Reaction mode - calling dispatchGenerate')
                        await dispatchGenerate('ghiblireact', {
                          ghibliReactionPresetId: selectedGhibliReactionPreset || undefined
                        })
                      } else if (composerState.mode === 'neotokyoglitch') {
                        // Neo Tokyo Glitch mode - use dispatchGenerate directly
                        console.log('🎭 Neo Tokyo Glitch mode - calling dispatchGenerate')
                        await dispatchGenerate('neotokyoglitch', {
                          neoTokyoGlitchPresetId: selectedNeoTokyoGlitchPreset || undefined
                        })
                      } else if (composerState.mode === 'storytime') {
                        // Story Time mode - use dispatchGenerate with all images
                        console.log('📖 Story Time mode - calling dispatchGenerate')
                        if (canGenerateStory) {
                          await dispatchGenerate('storytime', {
                            storyTimeImages: [selectedFile!, ...additionalStoryImages.filter(Boolean)],
                            storyTimePresetId: selectedStoryTimePreset || undefined
                          })
                        }
                        } else {
                        // Fallback - determine mode and generate
                        if (selectedPreset) {
                        // Run preset generation
                          await dispatchGenerate('preset', {
                          presetId: selectedPreset as string,
                          presetData: getPresetById(selectedPreset as string, availablePresets)
                        })
                          // Clear composer after successful generation
                          setTimeout(() => {
                            clearAllOptionsAfterGeneration()
                          }, 500)
                      } else {
                        // Run custom generation
                          await dispatchGenerate('custom', {
                          customPrompt: prompt
                        })
                          // Clear composer after successful generation
                          setTimeout(() => {
                            clearAllOptionsAfterGeneration()
                          }, 500)
                        }
                      }
                    }} 
                    disabled={
                      (composerState.mode === 'storytime' && !canGenerateStory) ||
                      (composerState.mode !== 'storytime' && !selectedFile) ||
                      (composerState.mode === 'preset' && !prompt.trim() && !selectedPreset) ||
                      navGenerating
                    } 
                    className={
                      ((composerState.mode === 'storytime' && !canGenerateStory) ||
                       (composerState.mode !== 'storytime' && !selectedFile) ||
                       (composerState.mode === 'preset' && !prompt.trim() && !selectedPreset) ||
                       navGenerating)
                        ? 'w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-white text-black hover:bg-white/90'
                    }
                    aria-label="Generate"
                    title={(() => {
                      if (!isAuthenticated) return 'Sign up to generate AI content';
                      if (composerState.mode === 'storytime') {
                        if (!canGenerateStory) {
                          const totalImages = (selectedFile ? 1 : 0) + additionalStoryImages.filter(Boolean).length;
                          return `Add ${3 - totalImages} more photos (minimum 3 needed)`;
                        }
                        return `Generate animated story with ${additionalStoryImages.filter(Boolean).length + 1} photos`;
                      }
                      if (!previewUrl) return 'Upload media first';

                      if (mode === 'presets' && !prompt.trim() && !selectedPreset) return 'Enter a prompt or select a preset first';
                      if (selectedPreset) return `Generate with ${getPresetLabel(selectedPreset as string, availablePresets)} preset`;
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
            
            {/* Clean disclaimer row under composer */}
            <div className="mt-3 text-center">
                              <p className="text-xs text-white">
                <span className="font-bold">Disclaimer:</span> It's AI. It's smart, but not perfect. expect some fun, wild, and maybe a few "what were they thinking?" moments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}



      {/* Video Job Status Display removed in favor of unified toasts */}

      {/* Media Upload Agreement Modal */}
      <MediaUploadAgreement
        isOpen={showUploadAgreement}
        onClose={handleUploadAgreementCancel}
        onAccept={handleUploadAgreementAccept}
        onAgreementAccepted={() => setUserHasAgreed(true)}
        userHasAgreed={userHasAgreed || false}
      />

    </div>
  )
}

export default HomeNew


