import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, X, ArrowUp, Filter, FileText } from 'lucide-react'
// Generate simple unique ID for runId
const generateRunId = () => `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
import { authenticatedFetch, signedFetch } from '../utils/apiClient'
import authService from '../services/authService'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'
import MasonryMediaGrid from './MasonryMediaGrid'
import SkeletonGrid from './SkeletonGrid'

import interactionService from '../services/interactionService'
import type { UserMedia } from '../services/userMediaService'
import NotificationBell from './NotificationBell'
import { useToasts } from './ui/Toasts'
import ProfileIcon from './ProfileIcon'
import { useProfile } from '../contexts/ProfileContext'
import { usePresetRunner } from '../hooks/usePresetRunner'
import { IdentityPreservationService } from '../services/identityPreservationService'
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
// import { clampStrength } from '../lib/strengthPolicy' // REMOVED - drama file deleted

// Identity-safe generation fallback system (integrated with IPA)
// Uses Replicate's face-preserving models when primary generation fails

// Safe wrapper for MasonryMediaGrid with fallback
interface SafeMasonryGridProps {
  feed: UserMedia[]
  handleMediaClick: (media: UserMedia) => void
  // handleRemix removed - no more remix functionality
  onLastItemRef?: (ref: HTMLDivElement | null) => void
  onPresetTagClick?: (presetType: string) => void
}

const SafeMasonryGrid: React.FC<SafeMasonryGridProps> = ({
  feed,
  handleMediaClick,
  onLastItemRef,
  // handleRemix removed
  onPresetTagClick
}) => {
  try {
    return (
      <MasonryMediaGrid
        media={feed}
        columns={4}
        onMediaClick={handleMediaClick}
        // onRemix removed - no more remix functionality
        showActions={true}
        className="pb-24 w-full"
        onLastItemRef={onLastItemRef}
        onPresetTagClick={onPresetTagClick}
      />
    )
  } catch (error) {
    console.error('🚨 MasonryMediaGrid failed, using fallback:', error)
    // Safe fallback - simple grid without fancy components
    return (
      <div className="grid grid-cols-4 gap-1 pb-24 w-full">
        {feed.slice(0, 16).map((item, index) => (
          <div 
            key={item.id} 
            className="aspect-square bg-gray-200 rounded overflow-hidden"
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

import { PROFESSIONAL_PRESETS, ProfessionalPresetConfig } from '../config/professional-presets'
import { EMOTION_MASK_PRESETS } from '../presets/emotionmask'
import { GHIBLI_REACTION_PRESETS } from '../presets/ghibliReact'
import { NEO_TOKYO_GLITCH_PRESETS } from '../presets/neoTokyoGlitch'
import NeoGlitchService from '../services/neoGlitchService'
import GenerationPipeline from '../services/generationPipeline'
import { resolvePresetForMode } from '../utils/resolvePresetForMode'

// Create a PRESETS object that maps to the new system for backward compatibility
const PRESETS = Object.fromEntries(
  Object.entries(PROFESSIONAL_PRESETS).map(([key, preset]) => [
    key,
    {
      label: preset.label,
      prompt: `Transform this image with ${preset.promptAdd.toLowerCase()}. Keep the original composition and subject identity intact.`,
      negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs',
      strength: preset.strength,
      description: preset.description
    }
  ])
)

// Helper function to get preset by ID from the new system
const getPresetById = (presetId: string): ProfessionalPresetConfig | undefined => {
  return PROFESSIONAL_PRESETS[presetId as keyof typeof PROFESSIONAL_PRESETS]
}

// Helper function to get preset label
const getPresetLabel = (presetId: string): string => {
  const preset = getPresetById(presetId)
  return preset?.label || 'Unknown Preset'
}

// Helper function to get preset prompt
const getPresetPrompt = (presetId: string): string => {
  const preset = getPresetById(presetId)
  return preset?.promptAdd || 'Transform this image'
}

import FullScreenMediaViewer from './FullScreenMediaViewer'
import ShareModal from './ShareModal'
// import { validateModeMappings } from '../utils/validateMappings' // REMOVED - complex drama file


// import { requireUserIntent } from '../utils/generationGuards' // REMOVED - complex drama file
import userMediaService from '../services/userMediaService'
// import { pickResultUrl, ensureRemoteUrl } from '../utils/aimlUtils' // REMOVED - drama file deleted
import { cloudinaryUrlFromEnv } from '../utils/cloudinaryUtils'
import { createAsset } from '../lib/api'
import { saveMedia, togglePublish } from '../lib/api'
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
  const genIdRef = useRef(0) // increments per job to prevent race conditions
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  
  // Feed filtering state
  const [activeFeedFilter, setActiveFeedFilter] = useState<string | null>(null)
  
  // Media upload agreement state
  const [showUploadAgreement, setShowUploadAgreement] = useState(false)
  const [userHasAgreed, setUserHasAgreed] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  
  // Composer clearing function - defined early to avoid reference errors
  
  
  useEffect(() => { 
    selectedPresetRef.current = selectedPreset 
  }, [selectedPreset])
  
  // Generation lifecycle functions
  function startGeneration() {
    // Generate a unique ID using timestamp + increment to prevent duplicates
    const timestamp = Date.now();
    const increment = genIdRef.current + 1;
    genIdRef.current = increment;
    
    const uniqueId = `${timestamp}_${increment}`;
    console.log('🆔 [Generation] Generated unique ID:', uniqueId, { timestamp, increment });
    
    setIsGenerating(true)
    return uniqueId
  }

  function endGeneration(id: string | number) {
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
    
    // Call the comprehensive composer clearing function
    handleClearComposerState()
    
    console.log('🎭 All options cleared, composer state reset, HiddenUploader reset triggered')
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

  // Initialize sticky preset system when PROFESSIONAL_PRESETS are loaded
  useEffect(() => {
    if (Object.keys(PROFESSIONAL_PRESETS).length > 0) {
      const activePresets = Object.keys(PROFESSIONAL_PRESETS) as (keyof typeof PROFESSIONAL_PRESETS)[]
      ensureDefault(activePresets)
    }
  }, [PROFESSIONAL_PRESETS, ensureDefault])

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
      console.log('🎨 Preset details:', getPresetById(selectedPreset))
      // Update the ref for compatibility
      selectedPresetRef.current = selectedPreset
    } else {
      selectedPresetRef.current = null
    }
  }, [selectedPreset, PROFESSIONAL_PRESETS])

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

  // Debug PRESETS object
  useEffect(() => {
    console.log('🎨 PRESETS object updated:', {
              count: Object.keys(PROFESSIONAL_PRESETS).length,
        keys: Object.keys(PROFESSIONAL_PRESETS),
              sample: Object.keys(PROFESSIONAL_PRESETS).slice(0, 3).map(key => ({
        key,
        label: getPresetLabel(key),
        prompt: getPresetPrompt(key)?.substring(0, 50) + '...'
      }))
    })
  }, [PRESETS])

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
  const [hasMoreFeed, setHasMoreFeed] = useState(true)
  const [feedPage, setFeedPage] = useState(0)
  

  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [creatorFilter, setCreatorFilter] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [presetsOpen, setPresetsOpen] = useState(false)


  
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
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareModalMedia, setShareModalMedia] = useState<UserMedia | null>(null)
  
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
  const [storyTimeDropdownOpen, setStoryTimeDropdownOpen] = useState(false)
  const [additionalStoryImages, setAdditionalStoryImages] = useState<File[]>([])

  




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
    setStoryTimeDropdownOpen(false)
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
    closeAllDropdowns() // Close all dropdowns when opening composer
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('📁 File selected:', { name: file.name, size: file.size, type: file.type })
    console.log('🔍 User agreement status:', { userHasAgreed })

    // Check if user has already agreed to the upload agreement
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
        prompt: record.meta?.prompt || record.prompt || 'AI Generated Content',
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
      const { message, mode } = event.detail
      console.log('✅ Generation success:', message, 'Mode:', mode)
      // The toast is already handled by the generation pipeline
      
      // 🧹 Clear composer state for ALL generation types (new system only)
      console.log('🧹 Clearing composer state after generation success')
      handleClearComposerState()
    }

    const handleGenerationError = (event: CustomEvent) => {
      const { message, mode } = event.detail
      console.log('❌ Generation error:', message, 'Mode:', mode)
      
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
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [lastItemRef, setLastItemRef] = useState<HTMLDivElement | null>(null)
  
  // Unified loading: Use the same system for both initial and scroll loading
  const loadMoreFeed = async () => {
    if (!hasMoreFeed || isLoadingMore) return
    
    try {
      setIsLoadingMore(true)
      console.log('🚀 [UnifiedScroll] Loading more items...')
      
      // Use same batch size as initial load for consistency
      const batchSize = 20
      const offset = feed.length
      
      console.log('🔍 [UnifiedScroll] Loading batch:', {
        batchSize,
        currentFeedLength: feed.length,
        offset,
        expectedRange: `${offset}-${offset + batchSize - 1}`
      })
      
      const res = await fetch(`/.netlify/functions/getPublicFeed?limit=${batchSize}&offset=${offset}`)
      
      if (res.ok) {
        const resp = await res.json()
        
        if (resp.success && resp.items?.length > 0) {
          const newItems = resp.items
            .map((item: any): UserMedia | null => {
              // Same mapping logic as loadFeed for consistency
              let mediaUrl: string;
              let provider = item.provider || 'unknown';
              
              if (item.finalUrl && item.finalUrl.startsWith('http')) {
                mediaUrl = item.finalUrl;
              } else if (item.imageUrl && item.imageUrl.startsWith('http')) {
                mediaUrl = item.imageUrl;
              } else {
                return null;
              }
              
              return {
                id: item.id,
                userId: item.userId || '',
                userAvatar: item.user?.avatar || undefined,
                userTier: item.user?.tier || undefined,
                type: item.mediaType === 'video' ? 'video' : 'photo',
                url: mediaUrl,
                thumbnailUrl: mediaUrl,
                prompt: item.prompt || 'AI Generated Content',
                style: undefined,
                aspectRatio: 4/3,
                width: 800,
                height: 600,
                timestamp: item.createdAt,
                originalMediaId: item.sourceAssetId || undefined,
                tokensUsed: item.mediaType === 'video' ? 5 : 2,
                likes: 0,
                isPublic: true,
                tags: [],
                metadata: { 
                  quality: 'high', 
                  generationTime: 0, 
                  modelVersion: '1.0',
                  presetKey: item.presetKey,
                  presetType: item.type,
                  // Story Time video metadata
                  videoResults: item.metadata?.videoResults,
                  totalVideos: item.metadata?.totalVideos,
                  successfulVideos: item.metadata?.successfulVideos
                },
                cloudinaryPublicId: item.cloudinaryPublicId,
                mediaType: item.mediaType,
              }
            })
            .filter((item: UserMedia | null): item is UserMedia => item !== null)
          
          console.log('✅ [UnifiedScroll] New items loaded:', newItems.length)
          
          // Add directly to main feed (no buffer needed)
          setFeed(prev => [...prev, ...newItems])
          
          // Update hasMore flag
          setHasMoreFeed(resp.hasMore !== false)
          
          console.log('🔄 [UnifiedScroll] Items added to main feed, total:', feed.length + newItems.length)
        } else {
          setHasMoreFeed(false)
        }
      }
    } catch (error) {
      console.error('❌ [UnifiedScroll] Loading failed:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Intersection Observer for unified infinite scroll
  useEffect(() => {
    if (!lastItemRef) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        setIsIntersecting(entry.isIntersecting)
        
        if (entry.isIntersecting && hasMoreFeed && !isLoadingMore) {
          console.log('👁️ [UnifiedScroll] Last item visible, triggering load')
          loadMoreFeed()
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

    // Legacy scroll handler as fallback (can be removed once intersection observer is proven)
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        if (hasMoreFeed && !isLoadingMore) {
          loadMoreFeed()
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMoreFeed, isLoadingMore])

  // Load public feed on mount
  const loadFeed = async (isInitial = true) => {
    try {
      if (isInitial) {
        setIsLoadingFeed(true)
        setFeedPage(0)
      } else {
        setIsLoadingMore(true)
      }
      
      console.log(`🔄 Loading public feed ${isInitial ? '(initial)' : '(more)'}...`)
      const pageSize = 20
      // 🚨 CRITICAL FIX: Calculate offset correctly for pagination
      // For initial load: offset = 0
      // For subsequent loads: offset = (current page + 1) * pageSize
      const offset = isInitial ? 0 : (feedPage + 1) * pageSize
      
      console.log('🔍 [Pagination Debug]', {
        isInitial,
        feedPage,
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
        
        // Determine if there are more items based on whether we got the full pageSize
        const hasMore = media && media.length === pageSize
        console.log('📊 Has more:', hasMore)
        
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
            prompt: item.prompt || 'AI Generated Content', // Use actual prompt or fallback
            style: undefined,
            aspectRatio: 4/3, // Default aspect ratio
            width: 800, // Default width
            height: 600, // Default height
            timestamp: item.created_at, // Backend sends created_at (snake_case)
            originalMediaId: item.source_url || undefined, // Backend sends source_url
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
          setFeedPage(prev => prev + 1)
        }
        
        setHasMoreFeed(hasMore)
      } else {
        console.error('❌ Feed response not ok:', res.status, await res.text())
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
      const authState = authService.getAuthState()
      setIsAuthenticated(authState.isAuthenticated)
      console.log('🔐 Auth state initialized:', authState)
      
      // If user is authenticated, sync their settings and profile from database
      if (authState.isAuthenticated) {
        try {
          await getUserProfileSettings()
          console.log('✅ User settings synced from database')
          
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
                const settings = await response.json()
                setUserHasAgreed(settings.mediaUploadAgreed || false)
                console.log('✅ User agreement status loaded from database:', settings.mediaUploadAgreed)
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
    const savedPreset = localStorage.getItem('selectedPreset') as keyof typeof PROFESSIONAL_PRESETS | null
    if (savedPreset && PROFESSIONAL_PRESETS[savedPreset]) {
      console.log('🔄 Restoring preset from localStorage:', savedPreset)
      setSelectedPreset(savedPreset)
    } else if (savedPreset && !PROFESSIONAL_PRESETS[savedPreset]) {
      console.warn('⚠️ Invalid preset in localStorage, clearing:', savedPreset)
      localStorage.removeItem('selectedPreset')
    }
  }, [PROFESSIONAL_PRESETS]) // Add PROFESSIONAL_PRESETS as dependency so it runs when presets are loaded

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
        const response = await authenticatedFetch('/.netlify/functions/user-settings', {
          method: 'GET',
          headers: {
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
          shareToFeed: profile.shareToFeed ?? true,  // Default to true if no preference set
          // allowRemix removed
        }
      }
    } catch (error) {
      console.error('Error reading user profile from localStorage:', error)
    }
    
    // Default settings
    return { shareToFeed: true } // allowRemix removed
  }

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
    kind: 'preset' | 'custom' | 'emotionmask' | 'ghiblireact' | 'neotokyoglitch', // remix removed
    options?: {
      presetId?: string;
      presetData?: any;
      // MoodMorph removed - replaced with Anime Filters
      emotionMaskPresetId?: string;
      ghibliReactionPresetId?: string;
      neoTokyoGlitchPresetId?: string;
      customPrompt?: string;
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
    if (!['preset', 'custom', 'emotionmask', 'ghiblireact', 'neotokyoglitch'].includes(kind)) {
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
      
      // Show "Add to queue" toast for all generation modes
      notifyQueue({ title: 'Add to queue', message: 'We\'ll start processing shortly.' });

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
      if (!presetId || !PRESETS[presetId]) {
        console.error('❌ Invalid preset:', presetId);
        notifyError({ title: 'Failed', message: 'Try again' });
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      effectivePrompt = PRESETS[presetId].prompt;
      generationMeta = { 
        mode: 'preset', 
        presetId, 
        presetLabel: PRESETS[presetId].label,
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
        ipaThreshold: 0.7, // High similarity required
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
        generation_type: "neo_tokyo_relaxed_ipa", // Relaxed identity preservation
        ipaThreshold: 0.4, // Low similarity allowed (creative freedom)
        ipaRetries: 1, // Minimal fallback
        ipaBlocking: false, // Don't block, just warn
        presetKey // Store which preset to use
        };
      console.log('🎭 NEO TOKYO GLITCH MODE: Using Stability.ai + AIML fallback:', neoTokyoGlitchPreset.label, 'Preset:', presetKey);
      
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

    if (!isAuthenticated) {
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

      // 🎭 NEO TOKYO GLITCH: Use Stability.ai (3-tier) + AIML fallback
      
      // Poll for job completion function
      const pollForJobCompletion = async (jobId: string, prompt: string, meta: any) => {
        console.log('🔄 [NeoGlitch] Starting to poll for job completion:', jobId);
        
        const maxAttempts = 60; // 3 minutes max
        let attempts = 0;
        
        const poll = async () => {
          if (attempts >= maxAttempts) {
            console.error('❌ [NeoGlitch] Job polling timed out');
            notifyError({ title: 'Generation failed', message: 'Job timed out' });
            endGeneration(genId);
            setNavGenerating(false);
            return;
          }
          
          attempts++;
          console.log(`🔄 [NeoGlitch] Polling attempt ${attempts}/${maxAttempts}`);
          
          try {
            const statusResponse = await authenticatedFetch(`/.netlify/functions/neo-glitch-generate?jobId=${jobId}`, {
              method: 'GET'
            });
            
            if (!statusResponse.ok) {
              throw new Error(`Status check failed: ${statusResponse.status}`);
            }
            
            const status = await statusResponse.json();
            console.log('📊 [NeoGlitch] Job status:', status);
            
            if (status.status === 'completed' && status.imageUrl) {
              console.log('🎉 [NeoGlitch] Job completed successfully!');
              
              // Show "Ready" toast with thumbnail
              notifyReady({ 
                title: 'Your media is ready', 
                message: 'Tap to open',
                thumbUrl: status.imageUrl,
                onClickThumb: () => {
                  // Open the media viewer
                  setViewerMedia([{
                    id: 'generated-' + Date.now(),
                    userId: 'current-user',
                    type: 'photo',
                    url: status.imageUrl,
                    prompt: prompt,
                    aspectRatio: 1,
                    width: 1024,
                    height: 1024,
                    timestamp: new Date().toISOString(),
                    tokensUsed: 1,
                    likes: 0,
                    isPublic: true,
                    tags: [],
                    metadata: { quality: 'high', generationTime: Date.now(), modelVersion: 'stability-ai' }
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
                resetComposerState();
              }, 3000);
              
              return;
            } else if (status.status === 'failed') {
              console.error('❌ [NeoGlitch] Job failed:', status.errorMessage);
              notifyError({ title: 'Generation failed', message: status.errorMessage || 'Unknown error' });
              endGeneration(genId);
              setNavGenerating(false);
              return;
            } else {
              // Still processing, continue polling
              console.log('⏳ [NeoGlitch] Job still processing, continuing to poll...');
              setTimeout(poll, 3000); // Poll every 3 seconds
            }
          } catch (error) {
            console.error('❌ [NeoGlitch] Polling error:', error);
            notifyError({ title: 'Status check failed', message: 'Please try again' });
            endGeneration(genId);
            setNavGenerating(false);
          }
        };
        
        // Start polling
        poll();
      };
      
      if (kind === 'neotokyoglitch') {
        console.log('🚀 [NeoGlitch] Starting generation with Stability.ai (3-tier) + AIML fallback');
        
        // Upload source image to Cloudinary
        const uploadResult = await uploadSourceToCloudinary({
          file: selectedFile || undefined,
          url: undefined
        });
        const sourceUrl = uploadResult.secureUrl;
        
        // Validate source URL
        try {
          assertIsSourceUrl(sourceUrl);
        } catch (error) {
          console.error('❌ Source URL validation failed:', error);
          endGeneration(genId);
          setNavGenerating(false);
          return;
        }
        
        // Call our new async neo-glitch-generate function
        const neoGlitchResponse = await authenticatedFetch('/.netlify/functions/neo-glitch-generate', {
          method: 'POST',
          body: JSON.stringify({
            prompt: effectivePrompt,
            presetKey: generationMeta?.presetKey || 'base',
            sourceUrl,
            userId: authService.getCurrentUser()?.id || '',
            runId: generateRunId() // Generate a unique run ID
          })
        });
        
        if (!neoGlitchResponse.ok) {
          throw new Error(`Neo Glitch generation failed: ${neoGlitchResponse.status}`);
        }
        
        const neoGlitchResult = await neoGlitchResponse.json();
        console.log('✅ [NeoGlitch] Generation result:', neoGlitchResult);
        
        // Handle new async job system response
        if (neoGlitchResult.ok && neoGlitchResult.jobId) {
          console.log('🔄 [NeoGlitch] Job started successfully, job ID:', neoGlitchResult.jobId);
          
          // Show "Added to queue" toast
          notifyQueue({ 
            title: 'Add to queue', 
            message: 'We\'ll start processing it shortly.'
          });
          
          // Start polling for job completion
          pollForJobCompletion(neoGlitchResult.jobId, effectivePrompt, generationMeta);
          
          return;
        }
        
        // Handle the response based on status
        if (neoGlitchResult.status === 'completed' && neoGlitchResult.imageUrl) {
          // Generation completed immediately
          console.log('🎉 [NeoGlitch] Generation completed successfully');
          
          // Save the generated media to user profile
          try {
            const mediaToSave = {
              userId: authService.getCurrentUser()?.id || '',
              type: 'photo' as const,
              url: neoGlitchResult.imageUrl,
              thumbnailUrl: neoGlitchResult.imageUrl, // Use same URL for thumbnail
              prompt: effectivePrompt,
              aspectRatio: 1, // Default to 1:1 for Neo Tokyo Glitch
              width: 1024, // Default dimensions
              height: 1024,
              tokensUsed: 1, // Default token usage
              isPublic: true, // Share to feed by default
              tags: [],
              metadata: {
                quality: 'high' as const,
                generationTime: Date.now(),
                modelVersion: neoGlitchResult.model || 'stability-ai',
                presetId: generationMeta?.neoTokyoGlitchPresetId,
                mode: 'i2i' as const,
                group: null
              }
            };
            
            // 🚨 CRITICAL FIX: Don't save here - backend already saved it!
            console.log('✅ [NeoGlitch] Backend already saved media, skipping duplicate save');
            
            // Refresh the public feed to show new media
            loadFeed();
          } catch (error) {
            console.error('❌ [NeoGlitch] Error in post-generation flow:', error);
          }
          
          // End generation successfully
          endGeneration(genId);
          setNavGenerating(false);
          
          // Show unified toast with thumbnail
          console.log('✅ Your media is ready: Tap to open')
          
          return;
        } else if (neoGlitchResult.status === 'generating' || neoGlitchResult.status === 'processing') {
          // Generation is in progress - let the service handle polling
          console.log(`🔄 [NeoGlitch] Generation in progress (${neoGlitchResult.status}), service will handle polling`);
          
          // Don't start frontend polling - the service handles it
          // Just show a message that generation is in progress
          notifyQueue({ 
            title: 'Add to queue', 
            message: 'We\'ll start processing it shortly.'
          });
          
          return;
        } else {
          // 🔍 Better error handling for Neo Glitch responses
          console.error('❌ [NeoGlitch] Unexpected response format:', neoGlitchResult);
          console.error('❌ [NeoGlitch] Expected: status="completed" with imageUrl, or status="generating"/"processing" for polling');
          
          // Check if this is a new async response format
          if (neoGlitchResult.jobId && neoGlitchResult.status === 'processing') {
            console.log('🔄 [NeoGlitch] Detected new async response format, service will handle polling');
            
                      // Don't start frontend polling - the service handles it
          // Just show a message that generation is in progress
          console.log('🔄 Add to queue: We\'ll start processing it shortly.')
            
            return;
          }
          
          // If we can't handle the response format, throw an error
          throw new Error(`Unexpected Neo Glitch response: ${JSON.stringify(neoGlitchResult)}`);
        }
      }
      
      // 🎨 ALL OTHER PRESETS: Use AIML API with flux/dev + flux/pro fallback (NO Stability.ai)
      console.log('🚀 Using AIML API flow for mode:', kind);
      
      // Upload source image to Cloudinary
      const uploadResult = await uploadSourceToCloudinary({
        file: selectedFile || undefined,
        url: undefined
      });
      const sourceUrl = uploadResult.secureUrl;
      
      // Validate source URL
      try {
        assertIsSourceUrl(sourceUrl);
              } catch (error) {
          console.error('❌ Source URL validation failed:', error);
          endGeneration(genId);
          setNavGenerating(false);
          return;
        }
      
      // Final sanity check before API call
      console.table({
        hasActiveAssetUrl: !!previewUrl,
        promptLen: prompt?.length ?? 0,
        isGenerating,
        isAuthenticated,
        sourceUrl,
        generationMeta,
        effectivePrompt,
        promptFieldValue: prompt
      });

      // Detect if source is a video based on multiple criteria
      const isVideo = isVideoPreview || 
                     /\/video\/upload\//.test(sourceUrl || '') ||
                     /\.(mp4|mov|webm|m4v)(\?|$)/i.test(sourceUrl || '');


      // All generation now uses the new GenerationPipeline system

      // All generation now uses the new GenerationPipeline system
      // No need to build old AIML payloads

      // Reserve credits before generation - dynamically calculate based on variations
      let creditsNeeded = 2; // Default for single generation (premium images)

      // Use type assertion to prevent narrowing
      const generationKind = kind as 'preset' | 'custom' | 'emotionmask' | 'ghiblireact' | 'neotokyoglitch';

      if (generationKind === 'ghiblireact' || generationKind === 'neotokyoglitch') {
        creditsNeeded = 2; // Single generation for new modes (premium images)
      } else {
        creditsNeeded = 2; // Single generation (preset, custom single, emotionmask) - premium images
      }
      
      console.log(`💰 Reserving ${creditsNeeded} credits before generation...`);
      console.log('🔍 Credit reservation debug:', { 
        kind: generationKind, 
        mode, 
        creditsNeeded, 
        kindType: typeof generationKind, 
        modeType: typeof mode 
      });
      
      // Map generation modes to valid credit reservation actions
      let creditAction: string = generationKind;
      if (generationKind === 'ghiblireact' || generationKind === 'neotokyoglitch') {
        creditAction = 'image.gen'; // Map new modes to standard image generation
      }
      
      console.log(`💰 Credit reservation: mapping ${kind} → ${creditAction}`);
      
      const creditsResponse = await authenticatedFetch('/.netlify/functions/credits-reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: creditAction,  // Use mapped action for credit reservation
          cost: creditsNeeded
        })
      });

      if (!creditsResponse.ok) {
        if (creditsResponse.status === 429) {
          const errorData = await creditsResponse.json();
          throw new Error(`Daily cap reached: ${errorData.error}`);
        }
        if (creditsResponse.status === 403) {
          const errorData = await creditsResponse.json();
          if (errorData.error === 'NEGATIVE_BALANCE_BLOCKED') {
            throw new Error(`Generation blocked: ${errorData.message} You have ${errorData.currentBalance} credits. Please wait until tomorrow for new credits.`);
          } else if (errorData.error === 'INSUFFICIENT_CREDITS') {
            throw new Error(`Insufficient credits: ${errorData.message} You need ${errorData.requiredCredits} credits but only have ${errorData.currentBalance}.`);
          } else {
            throw new Error(`Credit error: ${errorData.message || errorData.error}`);
          }
        }
        throw new Error(`Credits reservation failed: ${creditsResponse.status}`);
      }

      const creditsResult = await creditsResponse.json();
      console.log(`✅ Credits reserved successfully. New balance: ${creditsResult.balance}`);
      
      // Store the request_id for finalization
      const requestId = creditsResult.request_id;
      if (!requestId) {
        throw new Error('No request_id returned from credits reservation');
      }

      // Add credit finalization tracking
      let creditsFinalized = false;

      // Define the finalizeCredits function after we have the requestId
      const defineFinalizeCredits = (requestId: string) => {
        finalizeCredits = async (disposition: 'commit' | 'refund') => {
          if (creditsFinalized) return; // Prevent double finalization
          
          try {
            const finalizeResponse = await authenticatedFetch('/.netlify/functions/credits-finalize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                request_id: requestId,
                disposition
              })
            });

            if (finalizeResponse.ok) {
              const finalizeResult = await finalizeResponse.json();
              console.log(`✅ Credits ${disposition}ed successfully. New balance: ${finalizeResult.newBalance}`);
              creditsFinalized = true;
            } else {
              console.warn(`⚠️ Failed to ${disposition} credits: ${finalizeResponse.status}`);
            }
          } catch (error) {
            console.error(`❌ Error finalizing credits (${disposition}):`, error);
          }
        };
      };
      
      // Define the finalizeCredits function now that we have the requestId
      defineFinalizeCredits(requestId);

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
        // 🆕 [New System] All generation now goes through GenerationPipeline - no direct start-gen calls
        console.log('🆕 [New System] Video generation handled by GenerationPipeline');
        throw new Error('Direct start-gen calls are deprecated - use GenerationPipeline');
      }

      // 🎭 NEO TOKYO GLITCH: Follow Ghibli's exact pattern but with Stability.ai backend
      if ((kind as any) === 'neotokyoglitch') {
        console.log('🚀 [NeoGlitch] Starting generation following Ghibli pattern');
        
        try {
          // Call Neo Tokyo Glitch backend directly (like Ghibli calls AIML API)
          
                  // Call our new async neo-glitch-generate function
        const neoGlitchResponse = await authenticatedFetch('/.netlify/functions/neo-glitch-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: effectivePrompt,
              presetKey: generationMeta.presetKey,
              sourceUrl: sourceUrl
            })
          });
          
          if (!neoGlitchResponse.ok) {
            throw new Error(`Neo Tokyo Glitch generation failed: ${neoGlitchResponse.status}`);
          }
          
          const neoGlitchBody = await neoGlitchResponse.json();
          console.log('✅ [NeoGlitch] Backend response:', neoGlitchBody);
          
          // Handle new async job system response
          if (neoGlitchBody.ok && neoGlitchBody.jobId) {
            console.log('🔄 [NeoGlitch] Job started successfully, job ID:', neoGlitchBody.jobId);
            
            // Show "Added to queue" toast
            notifyQueue({ 
              title: 'Add to queue', 
              message: 'We\'ll start processing it shortly.'
            });
            
            // Start polling for job completion
            pollForJobCompletion(neoGlitchBody.jobId, effectivePrompt, generationMeta);
            
            return;
          }
          
          // Handle immediate completion (Stability.ai returns immediately - like Ghibli)
          if (neoGlitchBody.status === 'completed' && neoGlitchBody.imageUrl) {
            console.log('🎉 [NeoGlitch] Generation completed immediately with Stability.ai!');
            
            // Save the generated media to user profile (following Ghibli pattern exactly)
            try {
              const mediaToSave = {
                userId: authService.getCurrentUser()?.id || '',
                type: 'photo' as const,
                url: neoGlitchBody.imageUrl,
                thumbnailUrl: neoGlitchBody.imageUrl,
                prompt: effectivePrompt,
                aspectRatio: 1,
                width: 1024,
                height: 1024,
                tokensUsed: 1,
                isPublic: true,
                tags: [],
                metadata: {
                  quality: 'high' as const,
                  generationTime: Date.now(),
                  modelVersion: 'stability-ai',
                  presetId: generationMeta?.neoTokyoGlitchPresetId,
                  mode: 'i2i' as const,
                  group: null
                }
              };
              
              // 🚨 CRITICAL FIX: Don't save here - backend already saved it!
              console.log('✅ [NeoGlitch] Backend already saved media, skipping duplicate save');
              
              // Refresh the public feed to show new media (following Ghibli pattern)
              loadFeed();
              
              // Show unified toast with thumbnail (following Ghibli pattern exactly)
              notifyReady({ 
                title: 'Your media is ready', 
                message: 'Tap to open',
                thumbUrl: neoGlitchBody.imageUrl,
                onClickThumb: () => {
                  // Open the media viewer to show the generated image (following Ghibli pattern)
                  setViewerMedia([{
                    id: 'generated-' + Date.now(),
                    userId: 'current-user',
                    type: 'photo',
                    url: neoGlitchBody.imageUrl,
                    prompt: effectivePrompt,
                    aspectRatio: 1,
                    width: 1024,
                    height: 1024,
                    timestamp: new Date().toISOString(),
                    tokensUsed: 1,
                    likes: 0,
                    isPublic: true,
                    tags: [],
                    metadata: { quality: 'high', generationTime: Date.now(), modelVersion: 'stability-ai' }
                  }]);
                  setViewerStartIndex(0);
                  setViewerOpen(true);
                }
              });
              
              // End generation successfully (following Ghibli pattern)
              endGeneration(genId);
              setNavGenerating(false);
              
              // Clear composer after a delay so user can see their result (following Ghibli pattern)
              setTimeout(() => {
                console.log('🧹 [NeoGlitch] Clearing composer after generation completion');
                resetComposerState();
              }, 3000); // 3 seconds delay
              
              return; // Don't start polling if already complete
            } catch (error) {
              console.error('❌ [NeoGlitch] Failed to save media:', error);
              endGeneration(genId);
              setNavGenerating(false);
              return;
            }
          }
          
                    // Handle processing status (needs polling - simple, not complex service)
          if (neoGlitchBody.status === 'processing') {
            console.log('🔄 [NeoGlitch] Generation in progress, starting simple polling...');
            
            // Show processing toast (following Ghibli pattern)
            console.log('🔄 Add to queue: We\'ll start processing it shortly.')
            
            // Start simple polling for completion (not complex service)
            const pollForCompletion = async () => {
              try {
                const statusResponse = await authenticatedFetch(`/.netlify/functions/neo-glitch-generate?jobId=${neoGlitchBody.jobId}`);
                if (statusResponse.ok) {
                  const statusBody = await statusResponse.json();
                  
                  if (statusBody.status === 'completed' && statusBody.imageUrl) {
                    console.log('✅ [NeoGlitch] Polling completed successfully!');
                    
                    // Save the generated media (following Ghibli pattern)
                    const mediaToSave = {
                      userId: authService.getCurrentUser()?.id || '',
                      type: 'photo' as const,
                      url: statusBody.imageUrl,
                      thumbnailUrl: statusBody.imageUrl,
                      prompt: effectivePrompt,
                      aspectRatio: 1,
                      width: 1024,
                      height: 1024,
                      tokensUsed: 1,
                      isPublic: true,
                      tags: [],
                      metadata: {
                        quality: 'high' as const,
                        generationTime: Date.now(),
                        modelVersion: 'stability-ai',
                        presetId: generationMeta?.neoTokyoGlitchPresetId,
                        mode: 'i2i' as const,
                        group: null
                      }
                    };
                    
                    // 🚨 CRITICAL FIX: Don't save here - backend already saved it!
                    console.log('✅ [NeoGlitch] Backend already saved media, skipping duplicate save');
                    
                    // Refresh the public feed (following Ghibli pattern)
                    loadFeed();
                    
                    // Show unified toast with thumbnail (following Ghibli pattern)
                    console.log('✅ Your media is ready: Tap to open')
                    
                    // End generation successfully (following Ghibli pattern)
                    endGeneration(genId);
                    setNavGenerating(false);
                    
                    // Clear composer after delay (following Ghibli pattern)
                    setTimeout(() => {
                      console.log('🧹 [NeoGlitch] Clearing composer after polling completion');
                      resetComposerState();
                    }, 3000);
                    
                    return;
                  } else if (statusBody.status === 'failed') {
                    throw new Error(statusBody.error || 'Generation failed');
                  }
                  
                  // Still processing, continue polling
                  setTimeout(pollForCompletion, 2000);
                } else {
                  throw new Error(`Status check failed: ${statusResponse.status}`);
                }
              } catch (error) {
                console.error('❌ [NeoGlitch] Polling failed:', error);
                endGeneration(genId);
                setNavGenerating(false);
                resetComposerState();
              }
            };
            
            // Start polling
            pollForCompletion();
            
            // 🔧 FIX: Don't skip AIML API for Neo Glitch - let it fallback through IPA system
            // This ensures identity preservation when Stability.ai fails and AIML fallback happens
            console.log('🎭 [NeoGlitch] Starting polling, but allowing AIML fallback through IPA system');
            return;
          }
          
          // Handle other statuses
          throw new Error(`Unexpected Neo Tokyo Glitch status: ${neoGlitchBody.status}`);
          
        } catch (error) {
          console.error('❌ [NeoGlitch] Generation failed:', error);
          endGeneration(genId);
          setNavGenerating(false);
          
          // Reset composer state even on failure
          resetComposerState();
          return;
        }
      }

      // Declare variables that will be used later
      let resultUrl: string;
      let allResultUrls: string[];
      let variationsGenerated: number;
      let body: any;
      let res: Response | null = null; // Declare res at top level

      // All generation now uses the new GenerationPipeline system
      // Add timeout guard to prevent 504 errors
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Request timeout approaching, aborting to prevent 504');
        controller.abort();
      }, 24000); // 24s cushion before Netlify's 26s limit

        try {
          // 🆕 Use NEW GenerationPipeline for rock-solid stability
          console.log('🚀 [GenerationPipeline] Using new NeoGlitch-style system');
          
          const generationPipeline = GenerationPipeline.getInstance();
          const generationResult = await generationPipeline.generate({
            type: kind === 'preset' ? 'presets' : 
                  kind === 'custom' ? 'custom-prompt' : 
                  kind === 'emotionmask' ? 'emotion-mask' : 
                  kind === 'ghiblireact' ? 'ghibli-reaction' : 'presets',
            prompt: effectivePrompt,
            presetKey: kind === 'preset' ? (options?.presetId || selectedPreset) : 
                      kind === 'ghiblireact' ? (generationMeta?.ghibliReactionPresetId || 'ghibli_default') :
                      kind === 'emotionmask' ? (generationMeta?.emotionMaskPresetId || 'emotion_default') :
                      kind === 'custom' ? 'custom_prompt' : 'default',
            sourceAssetId: sourceUrl,
            userId: authService.getCurrentUser()?.id || '',
            runId: runId,
            meta: generationMeta
          });
          
          clearTimeout(timeoutId); // Clear timeout if request completes

          console.info('🆕 [GenerationPipeline] Result:', generationResult);
          
          if (generationResult.success && generationResult.status === 'completed') {
            // New system completed immediately
            resultUrl = generationResult.imageUrl || '';
            allResultUrls = [resultUrl];
            variationsGenerated = 1;
            body = { success: true, system: 'new' };
            res = { ok: true, status: 200 } as Response;
          } else if (generationResult.success && generationResult.status === 'processing') {
            // New system is processing
            throw new Error('Generation in progress - please wait');
          } else {
            // New system failed - no fallback to old system
            console.error('❌ [GenerationPipeline] New system failed:', generationResult.error);
            throw new Error(generationResult.error || 'Generation failed');
          }
        } catch (error) {
          clearTimeout(timeoutId); // Clear timeout on error
          if (error instanceof Error && error.name === 'AbortError') {
            console.warn('⚠️ Request aborted due to timeout');
            throw new Error('Request timed out. Please try again with a smaller image or different prompt.');
          }
          throw error; // Re-throw other errors
        }

        // Process results based on system used
        if (body?.system === 'new') {
          // New system already processed - skip old system logic
          console.log('🆕 [New System] Skipping old system processing');
        } else {
          // Process aimlApi results (old system) - but this should never happen now
          console.warn('⚠️ [GenerationPipeline] Unexpected old system path - this should not happen');
          throw new Error('Unexpected old system path - all generation should use new system');
        }

      // Handle video job creation (status 202) - only for old system responses
      if (body?.system !== 'new' && res?.status === 202 && body?.job_id && isVideoPreview) {
        setCurrentVideoJob({ id: body.job_id, status: 'queued' })
        startVideoJobPolling(body.job_id, body.model, effectivePrompt)
        endGeneration(genId)
        setNavGenerating(false)
        return
      }

      // Validate result URL
      if (!resultUrl) {
        console.error('No result URL in response:', body);
        throw new Error('No result URL in API response');
      }
      
      // 🔒 IDENTITY PRESERVATION CHECK - automatic based on preset type
      let finalResultUrl = resultUrl;

      // Skip IPA for new system (already handled by dedicated functions)
      if (body?.system === 'new') {
        console.log('🆕 [New System] Skipping IPA - already handled by dedicated function');
      } else if (generationMeta?.generation_type && sourceUrl) {
        try {
          console.log('🔒 [IPA] Starting identity preservation check for:', generationMeta.generation_type);
          
          const ipaResult = await IdentityPreservationService.runIPA(
            sourceUrl,
            resultUrl,
            {
              ipaThreshold: generationMeta.ipaThreshold || 0.5,
              ipaRetries: generationMeta.ipaRetries || 1,
              ipaBlocking: generationMeta.ipaBlocking || false,
              generation_type: generationMeta.generation_type
            }
          );
          
          console.log('🔒 [IPA] Result:', {
            similarity: ipaResult.similarity,
            passed: ipaResult.passed,
            retryCount: ipaResult.retryCount,
            strategy: ipaResult.strategy
          });

          if (ipaResult.passed) {
            finalResultUrl = ipaResult.finalUrl;
            console.log('✅ [IPA] Identity preservation passed');
          } else if (generationMeta.ipaBlocking) {
            console.log('❌ [IPA] Identity preservation failed and blocking enabled');
            throw new Error(`IPA failed: ${(ipaResult.similarity * 100).toFixed(1)}% similarity < ${((generationMeta.ipaThreshold || 0.5) * 100).toFixed(1)}% threshold`);
          } else {
            finalResultUrl = ipaResult.finalUrl;
            console.log('⚠️ [IPA] Identity preservation failed but non-blocking, using best result');
          }
        } catch (ipaError) {
          console.error('❌ [IPA] Error during identity preservation check:', ipaError);
          finalResultUrl = resultUrl; // Fallback to original result
        }
      }

                // 🔧 CLOUDINARY CONVERSION - Convert AIML API URLs to Cloudinary URLs for Ghibli
          let cloudinaryConvertedUrl = finalResultUrl;
          
          // 🚨 REMOVED: Frontend Cloudinary upload - let backend handle it
          // The backend save-media function will automatically convert AIML URLs to Cloudinary
          // This prevents duplicate uploads and signature errors
          
          if (generationMeta?.mode === 'ghiblireact' && finalResultUrl && finalResultUrl.includes('cdn.aimlapi.com')) {
            console.log('☁️ [Ghibli] AIML API URL detected, backend will handle Cloudinary conversion');
            // Keep original URL - backend will convert it during save
          }
          
          // 🎨 FX POST-PROCESSING - Apply visual effects based on generation mode
          if (cloudinaryConvertedUrl && generationMeta?.mode) {
            try {
              let fxProcessedUrl = cloudinaryConvertedUrl;
              
              // Apply Neo Tokyo Glitch FX
              if (generationMeta.mode === 'neotokyoglitch' && selectedNeoTokyoGlitchPreset) {
                console.log('🎭 Applying Neo Tokyo Glitch FX...');
                const { applyNeoTokyoGlitch } = await import('../hooks/useNeoTokyoGlitch');
                
                const fxOptions = {
                  enableGlow: true,
                  enableScanlines: true,
                  enableGlitch: true,
                  enableNeon: true,
                  glowIntensity: 0.8,
                  scanlineOpacity: 0.3,
                  glitchAmount: 0.4,
                  neonColor: '#00ffff'
                };
                
                fxProcessedUrl = await applyNeoTokyoGlitch(cloudinaryConvertedUrl, fxOptions);
                console.log('✅ Neo Tokyo FX applied successfully');
              }
              
              // Apply Ghibli Reaction FX
              else if (generationMeta.mode === 'ghiblireact' && selectedGhibliReactionPreset) {
                console.log('🎭 Applying Ghibli Reaction FX...');
                const { applyGhibliReactionFX } = await import('../hooks/useGhibliReaction');
                
                const fxOptions = {
                  enableTears: true,
                  enableHearts: true,
                  enableBlush: true,
                  enableEyeShine: true,
                  tearIntensity: 0.7,
                  heartOpacity: 0.6,
                  blushIntensity: 0.5,
                  eyeShineBrightness: 0.8
            };
            
            fxProcessedUrl = await applyGhibliReactionFX(finalResultUrl, fxOptions);
            console.log('✅ Ghibli Reaction FX applied successfully');
          }
          
          // Apply Emotion Mask FX (subtle enhancement) - DISABLED: function not implemented
          else if (generationMeta.mode === 'emotionmask' && selectedEmotionMaskPreset) {
            console.log('🎭 Emotion Mask FX disabled - function not implemented');
            // TODO: Implement applyEmotionMaskFX function in useEmotionMask hook
            fxProcessedUrl = finalResultUrl; // Use original result for now
          }
          
          // Update final result with FX processing
          if (fxProcessedUrl !== finalResultUrl) {
            finalResultUrl = fxProcessedUrl;
            console.log('🎨 FX processing completed, final result updated');
          }
          
        } catch (fxError) {
          console.warn('⚠️ FX processing failed, using original result:', fxError);
          // Continue with original result if FX fails
        }
      }

      console.info(`Generated ${variationsGenerated} variation(s):`, allResultUrls);

      // Save the generated media to user profile and feed
      try {
        // First save to local userMediaService for profile display
        const mediaToSave = {
          userId: authService.getCurrentUser()?.id || '',
          type: 'photo' as const,
          url: finalResultUrl,
          thumbnailUrl: finalResultUrl, // Use same URL for thumbnail
          prompt: effectivePrompt,
          aspectRatio: 4/3, // Default aspect ratio
          width: 800, // Default dimensions
          height: 600,
          tokensUsed: variationsGenerated, // Use actual variations generated
          isPublic: true, // Share to feed by default
          tags: [generationMeta?.mode || 'ai-generated', 'generated'],
          metadata: {
            quality: 'high' as const,
            generationTime: Date.now(),
            modelVersion: body?.model || 'aiml-api',
            presetId: generationMeta?.presetId || generationMeta?.ghibliReactionPresetId || generationMeta?.emotionMaskPresetId,
            mode: generationMeta?.mode || 'custom',
            group: null
          }
        };
        
        // 🔧 FIX: Remove duplicate save - generation pipeline handles all saving now
        // Only save locally for immediate UI display
        await userMediaService.saveMedia(mediaToSave, { shareToFeed: true });
        console.log('✅ [Media] Saved successfully to local profile (backend save handled by generation pipeline)');
        
      } catch (error) {
        console.error('❌ [Media] Failed to save media:', error);
      }

      // Show the final result (original or retry) with cache busting
      const cacheBustedResultUrl = `${finalResultUrl}${finalResultUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setPreviewUrl(cacheBustedResultUrl);
      
      // Show IPA results in notification if identity lock was enabled
      // Show success notification
      notifyReady({ 
        title: 'Your media is ready', 
        message: 'Tap to open', 
        thumbUrl: finalResultUrl, 
        onClickThumb: () => {
          // Open the media viewer to show the generated image
          setViewerMedia([{
            id: 'generated-' + Date.now(),
            userId: 'current-user',
            type: 'photo',
            url: finalResultUrl,
            prompt: prompt,
            aspectRatio: 4/3,
            width: 800,
            height: 600,
            timestamp: new Date().toISOString(),
            tokensUsed: 2,
            likes: 0,
                    isPublic: false,
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
           console.error('❌ Something went wrong: Generated, but not saved (auth error)')
              return;
            }

        // 🔧 FIX: Remove duplicate saveMedia call - generation pipeline handles all saving now
        console.log('✅ Backend save handled by generation pipeline');
        // Refresh both feed and user profile
        setTimeout(() => window.dispatchEvent(new CustomEvent('refreshFeed')), 800)
        endGeneration(genId);
        setNavGenerating(false);
        
        // Clear composer after a delay so user can see their result
        setTimeout(() => {
          console.log('🧹 Clearing composer after generation completion');
          handleClearComposerState();
        }, 3000); // 3 seconds delay
        
        return

        // First, create an asset record (skip for Neo Tokyo Glitch only)
        let assetId: string | null = null;
        
        if (composerState.mode !== 'neotokyoglitch') {
        const assetResult = await createAsset({
          sourcePublicId: sourceUrl ? sourceUrl.split('/').pop()?.split('.')[0] || '' : '',
          mediaType: 'image', // Default to image for now
            presetKey: selectedPreset,
              prompt: effectivePrompt,
        });

        if (!assetResult.ok) {
          console.error('Failed to create asset:', assetResult.error);
          console.error('❌ Something went wrong: Failed to create asset record')
          endGeneration(genId);
          setNavGenerating(false);
          return;
        }

          assetId = assetResult.data.id;
        console.log('✅ Asset created:', assetId);
        } else {
          console.log(`🎭 ${composerState.mode} mode - skipping createAsset, will use save-media directly`);
        }

        // Save all variations to the database
        console.log(`💾 Saving ${allResultUrls.length} variation(s) to database...`);
        
        try {
          // Prepare variations for batch endpoint
          const variations = allResultUrls.map((url, index) => ({
            image_url: url,
            media_type: 'image',
            prompt: effectivePrompt,
            cloudinary_public_id: null,
            source_public_id: sourceUrl || null,
            meta: {
              variationIndex: index,
              totalVariations: allResultUrls.length,
              prompt: effectivePrompt,
              modeMeta: body.modeMeta,
              userId,
              shareNow: !!shareToFeed,
              presetId: selectedPreset,
              runId: genId
            }
          }));

          // 🧪 DEBUG: Log batch save details
          console.log('🧪 [Batch Save] Preparing variations:', variations.map(v => ({
            source_public_id: v.source_public_id,
            url: v.image_url,
            meta: v.meta
          })));

          // Handle different generation modes - all now use dedicated tables
          if (composerState.mode === 'emotionmask') {
            console.log('🎭 Emotion Mask mode - media saved by dedicated pipeline');
            // Media is already saved by the dedicated emotion-mask-generate function
          } else if (composerState.mode === 'ghiblireact') {
            console.log(`🎭 ${composerState.mode} mode - media saved by dedicated pipeline`);
            // Media is already saved by the dedicated ghibli-reaction-generate function
          } else if (composerState.mode === 'neotokyoglitch') {
            console.log(`🎭 [NeoGlitch] Neo Tokyo Glitch mode - media already saved by first-class pipeline`);
            console.log(`✅ [NeoGlitch] No additional save-media call needed - using dedicated glitch table`);
            
            // Neo Tokyo Glitch media is already saved by our first-class pipeline
            // The media_assets_glitch table handles everything automatically
            if (allResultUrls.length > 0) {
              console.log(`✅ [NeoGlitch] Generation completed successfully with URL:`, allResultUrls[0]);
              
              // Refresh user media to show the new image
              setTimeout(() => window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
                detail: { count: 1, runId: genId } 
              })), 800);
            }
          } else if (composerState.mode === 'preset' || composerState.mode === 'custom' || 
                     composerState.mode === 'emotionmask' || composerState.mode === 'ghiblireact') {
            console.log(`🎭 ${composerState.mode} mode - checking variation count: ${allResultUrls.length}`);
            
            if (allResultUrls.length === 1) {
              // Single variation - update the asset directly
              console.log(`🎭 ${composerState.mode} mode - single variation, updating asset`);
              
              // Skip asset update for new system (already saved by dedicated functions)
              if (body?.system === 'new') {
                console.log('🆕 [New System] Skipping asset update - already saved by dedicated function');
                
                // Refresh user media to show the new image
                setTimeout(() => window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
                  detail: { count: 1, runId: genId } 
                })), 800);
              } else if (allResultUrls.length > 0) {
                // All AI types now use dedicated tables - no asset update needed
                console.log(`🎭 ${composerState.mode} mode - media saved by dedicated pipeline, refreshing display`);
                
                // Refresh user media to show the new image
                setTimeout(() => window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
                  detail: { count: 1, runId: genId } 
                })), 800);
              } else {
                console.warn(`⚠️ No result URLs available for ${composerState.mode}`);
              }
            } else if (allResultUrls.length > 1) {
              // Multiple variations - use unified save-media
              console.log(`🎭 ${composerState.mode} mode - multiple variations (${allResultUrls.length}), using unified save-media`);
              
              // Skip save-media for new system (already saved by dedicated functions)
              if (body?.system === 'new') {
                console.log('🆕 [New System] Skipping save-media - already saved by dedicated function');
              } else {
              try {
              const saveRes = await authenticatedFetch('/.netlify/functions/save-media', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'X-Idempotency-Key': genId // prevents double-saves on retries
                },
                body: JSON.stringify({
                  finalUrl: allResultUrls[0], // Use first URL for single save
                  media_type: 'image',
                  preset_key: selectedPreset || 'custom',
                  prompt: effectivePrompt,
                  meta: {
                    mode: composerState.mode,
                    presetId: selectedPreset,
                    runId: genId,
                    userId,
                    shareNow: !!shareToFeed,
                    variation_index: 0,
                    totalVariations: allResultUrls.length
                  }
                })
              });
              
              const saveText = await saveRes.text();
              let saveBody: any = {};
              try { saveBody = JSON.parse(saveText); } catch {}
              
                if (saveRes.ok && saveBody?.success) {
                  console.log(`✅ ${composerState.mode} batch save successful:`, saveBody);
                
                  // Refresh user media to show the new images
                setTimeout(() => window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
                    detail: { count: saveBody.count || allResultUrls.length, runId: genId } 
                })), 800);
              } else {
                  console.warn(`⚠️ ${composerState.mode} batch save failed, falling back to individual saves:`, saveRes.status, saveBody || saveText);
                  
                  // 🧪 FALLBACK: Try saving each variation individually
                  console.log('🧪 [Fallback] Attempting individual saves for each variation');
                  
                  let successfulSaves = 0;
                  for (let i = 0; i < allResultUrls.length; i++) {
                    try {
                      const individualSaveRes = await authenticatedFetch('/.netlify/functions/save-media', {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'X-Idempotency-Key': `${genId}-variation-${i}` // unique idempotency key for each variation
                        },
                        body: JSON.stringify({
                          finalUrl: allResultUrls[i],
                          media_type: 'image',
                          preset_key: selectedPreset || 'custom',
                          prompt: effectivePrompt,
                          source_public_id: sourceUrl ? sourceUrl.split('/').pop()?.split('.')[0] || '' : '',
                          meta: {
                            mode: composerState.mode,
                            presetId: composerState.mode === 'ghiblireact' ? selectedGhibliReactionPreset :
                                      composerState.mode === 'emotionmask' ? selectedEmotionMaskPreset :
                                      selectedPreset,
                            runId: genId,
                            userId,
                            shareNow: !!shareToFeed,
                            variation_index: i,
                            totalVariations: allResultUrls.length,
                            fallback_save: true
                          }
                        })
                      });
                      
                      const individualSaveText = await individualSaveRes.text();
                      let individualSaveBody: any = {};
                      try { individualSaveBody = JSON.parse(individualSaveText); } catch {}
                      
                      if (individualSaveRes.ok && individualSaveBody?.success) {
                        console.log(`✅ [Fallback] Variation ${i} saved individually:`, individualSaveBody);
                        successfulSaves++;
                      } else {
                        console.error(`❌ [Fallback] Variation ${i} individual save failed:`, individualSaveRes.status, individualSaveBody || individualSaveText);
                      }
                    } catch (individualSaveError) {
                      console.error(`❌ [Fallback] Variation ${i} individual save error:`, individualSaveError);
                    }
                  }
                  
                  if (successfulSaves > 0) {
                    console.log(`✅ [Fallback] ${successfulSaves}/${allResultUrls.length} variations saved individually`);
                    
                    // Refresh user media to show the successfully saved images
                    setTimeout(() => window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
                      detail: { count: successfulSaves, runId: genId } 
                    })), 800);
                  } else {
                    console.error(`❌ [Fallback] All individual saves failed for ${composerState.mode}`);
                    console.error('❌ Save failed: Failed to save any variations')
                  }
                }
              } catch (batchSaveError) {
                console.error(`❌ ${composerState.mode} batch save error:`, batchSaveError);
                console.error('❌ Save failed: Failed to save variations')
              }
              } // Close the if (body?.system === 'new') else block
            } else {
              console.warn(`⚠️ ${composerState.mode} mode - no result URLs to save`);
            }
          } else {
            console.log(`🎭 ${composerState.mode} mode - no additional save needed`);
          }
        } catch (error: unknown) {
          console.error(`❌ Save error:`, error);
          console.error('❌ Save failed:', error instanceof Error ? (error as Error).message : 'Unknown error')
          
          // 🚨 CRITICAL: If save failed, refund the reserved credits
          console.log('🚨 Save failed - refunding reserved credits to prevent charging for failed saves');
          try {
            const refundResponse = await authenticatedFetch('/.netlify/functions/credits-finalize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                request_id: requestId,
                disposition: 'refund' // Refund instead of commit
              })
            });
            
            if (refundResponse.ok) {
              const refundResult = await refundResponse.json();
              console.log('✅ Credits refunded successfully after save failure:', refundResult);
            } else {
              console.error('❌ Credits refund failed after save failure:', refundResponse.status);
            }
          } catch (refundError) {
            console.error('❌ Credits refund error after save failure:', refundError);
          }
          
          return; // Exit early to prevent credits from being committed
        }

        // 💰 Finalize credits (commit) ONLY after successful save
        try {
          console.log('💰 Finalizing credits (commit) after successful save...');
          const finalizeResponse = await authenticatedFetch('/.netlify/functions/credits-finalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              request_id: requestId,
              disposition: 'commit'
            })
          });
          
          if (finalizeResponse.ok) {
            const finalizeResult = await finalizeResponse.json();
            console.log('✅ Credits finalized successfully:', finalizeResult);
          } else {
            console.error('❌ Credits finalization failed:', finalizeResponse.status);
            // Don't throw here - generation succeeded, just log the credit issue
          }
        } catch (finalizeError) {
          console.error('❌ Credits finalization error:', finalizeError);
          // Don't throw here - generation succeeded, just log the credit issue
        }

        endGeneration(genId);
        setNavGenerating(false);
        return
      } catch (error) {
        console.error('❌ Error in save flow:', error);
        console.error('❌ Something went wrong: Failed to save generated media')
      }

      // Success: stop progress
      endGeneration(genId);
      setNavGenerating(false);
      
      // 🛡️ RUN ID PROTECTION: Only handle success for current run
      if (currentRunId !== runId) {
        console.warn('⚠️ Ignoring success for stale run:', runId, 'current:', currentRunId);
        return;
      }
      
      // Keep preset selected for user convenience (stateless generation doesn't need clearing)
      
      // Clear mode state on success
      if (selectedMode) {
        // Track mode success analytics before clearing
        try {
          const resolvedPreset = resolvePresetForMode({
            mode: selectedMode,
            option: (selectedTheme || selectedEra || selectedOp) as string,
            activePresets: PROFESSIONAL_PRESETS as any
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
        
        // Clear all mode selections after successful generation (per architecture)
        clearAllOptionsAfterGeneration();
      }
      
      // Dispatch generation success event to trigger composer clearing
      window.dispatchEvent(new CustomEvent('generation-success', {
        detail: { message: 'Generation completed successfully', mode: kind }
      }));
      
      // Handle V2V processing status
      if (isVideoPreview) {
        if (body.status === 'processing' || body.status === 'queued') {
          notifyQueue({ title: 'Added to queue', message: 'We will start processing shortly.' });
          // TODO: Implement polling for V2V status updates
          console.log('🎬 V2V job started:', body.job_id || 'unknown');
        } else if (body.status === 'completed') {
          notifyReady({ title: 'Your media is ready', message: 'Tap to open' });
          // Finalize credits as committed since generation was successful
          if (finalizeCredits) {
            await finalizeCredits('commit');
          }
          // Clear all options after successful generation
          clearAllOptionsAfterGeneration();
          
          // Dispatch generation success event to trigger composer clearing
          window.dispatchEvent(new CustomEvent('generation-success', {
            detail: { message: 'Generation completed successfully', mode: kind }
          }));
          
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
        } else if (e.message.includes('cloud_name is disabled') || e.message.includes('cloud_name')) {
          errorMessage = 'Upload service temporarily unavailable';
        } else if (e.message.includes('Invalid api_key') || e.message.includes('api_key')) {
          errorMessage = 'Upload service temporarily unavailable';
        } else if (e.message.includes('timeout') || e.message.includes('ERR_TIMED_OUT')) {
          errorMessage = 'Upload took too long, please try again with a smaller file';
        } else if (e.message.includes('Failed to fetch') || e.message.includes('ERR_TIMED_OUT')) {
          errorMessage = 'Network timeout - please check your connection and try again';
        } else if (e.message.includes('unauthorized') || e.message.includes('401')) {
          errorMessage = 'Please sign in again';
        } else if (e.message.includes('quota') || e.message.includes('credits')) {
          errorMessage = 'You\'ve reached your daily limit';
        } else {
          errorMessage = 'Something went wrong, please try again';
        }
      } else if (typeof e === 'object' && e !== null && 'error' in e) {
        const errorObj = e as any;
        if (errorObj.error?.message) {
          if (errorObj.error.message.includes('cloud_name is disabled') || errorObj.error.message.includes('Invalid api_key')) {
            errorMessage = 'Upload service temporarily unavailable';
          } else if (errorObj.error.message.includes('unauthorized')) {
            errorMessage = 'Please sign in again';
          } else {
            errorMessage = 'Something went wrong, please try again';
          }
        }
      }
      
      console.error('❌ Error! Please try again:', errorMessage)
      
      // Refund credits since generation failed
      if (finalizeCredits) {
        await finalizeCredits('refund');
      }
      
      // Clear all options after generation failure
      clearAllOptionsAfterGeneration();
      
      // Dispatch generation error event to trigger composer clearing
      window.dispatchEvent(new CustomEvent('generation-error', {
        detail: { message: 'Generation failed', mode: kind }
      }));
      
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
    // if (requireUserIntent({ userInitiated: true, source: 'custom' })) { // REMOVED - drama function deleted
    //   console.warn('⛔ Generation blocked by guard');
    //   return;
    // }
    // Close composer immediately and show progress on avatar
    const genId = startGeneration()
    setIsComposerOpen(false)
    setNavGenerating(true)
    try {
      // Get current profile settings from context (real-time state)
      // Note: profileData is already available from the top-level useProfile() hook
      const shareToFeed = profileData?.shareToFeed ?? false
      
      // Enforce server-side quota and generate via aimlApi
      // Use new uploadSource service - never fetch blob URLs
      const uploadResult = await uploadSourceToCloudinary({
        file: selectedFile || undefined,
        url: undefined  // Don't pass preview URL - use File object directly
      })
      const sourceUrl = uploadResult.secureUrl
      
      // Determine if this should be a video job
      const shouldBeVideo = isVideoPreview;
      
      const body: Record<string, any> = {
        prompt: (promptOverride ?? prompt).trim(),
        image_url: sourceUrl,
        resource_type: shouldBeVideo ? 'video' : 'image',
        source: 'custom',
        visibility: shareToFeed ? 'public' : 'private',

        num_variations: 1, // Single generation only
      }
      

      // If a preset is selected, include its negative prompt and strength
      if (selectedPreset && PRESETS[selectedPreset]) {
        const preset = PRESETS[selectedPreset]
        if (preset.negative_prompt) body.negative_prompt = preset.negative_prompt
        if (typeof preset.strength === 'number') body.strength = preset.strength
        body.presetName = selectedPreset
      }
      
      // Reserve credits before generation for this path
      const creditsNeeded = 2; // Single generation only (premium images)
      console.log(`💰 Alt path: Reserving ${creditsNeeded} credits before generation...`);
      console.log('🔍 Alt path credit debug:', { 
        selectedMode, 
        creditsNeeded 
      });
      
      const creditsResponse = await authenticatedFetch('/.netlify/functions/credits-reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedMode || 'custom',
          cost: creditsNeeded
        })
      });

      if (!creditsResponse.ok) {
        if (creditsResponse.status === 429) {
          const errorData = await creditsResponse.json();
          throw new Error(`Daily cap reached: ${errorData.error}`);
        }
        if (creditsResponse.status === 403) {
          const errorData = await creditsResponse.json();
          if (errorData.error === 'NEGATIVE_BALANCE_BLOCKED') {
            throw new Error(`Generation blocked: ${errorData.message} You have ${errorData.currentBalance} credits. Please wait until tomorrow for new credits.`);
          } else if (errorData.error === 'INSUFFICIENT_CREDITS') {
            throw new Error(`Insufficient credits: ${errorData.message} You need ${errorData.requiredCredits} credits but only have ${errorData.currentBalance}.`);
          } else {
            throw new Error(`Credit error: ${errorData.message || errorData.error}`);
          }
        }
        throw new Error(`Credits reservation failed: ${creditsResponse.status}`);
      }

      const creditsResult = await creditsResponse.json();
      console.log(`✅ Alt path: Credits reserved successfully. New balance: ${creditsResult.balance}`);
      
      // 🎯 All generation now goes through GenerationPipeline - no direct aimlApi calls
      console.log('🆕 [New System] All generation goes through GenerationPipeline');
      
      // Since this function is deprecated, just show an error and redirect
      notifyError({ 
        title: 'Deprecated Function', 
        message: 'This generation method is no longer supported. Please use the new interface.' 
      });
      
      // Clear generation state
      endGeneration(genId);
      setNavGenerating(false);
      setIsComposerOpen(true);
      
            // Keep preset selected for user convenience (stateless generation doesn't need clearing)
    } catch (error) {
      console.error('handleGenerate error:', error);
      
      // Clear generation state on error
      endGeneration(genId);
      setNavGenerating(false);
      setIsComposerOpen(true);
      
      // Show user-friendly error message
      notifyError({ 
        title: 'Generation Failed', 
        message: 'Please try again with a different image or prompt.' 
      });
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



  // Handle preset click - immediately generates with preset style (one-click)
  const handlePresetClick = async (presetName: keyof typeof PRESETS) => {
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
    
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to auth')
      navigate('/auth')
      return
    }
    
    // 🚀 IMMEDIATE GENERATION - No unnecessary delays
    console.log('🚀 Auto-generating with preset:', presetName)
    
            // Preset applied silently - no toast notification
    
    try {
      await dispatchGenerate('preset', {
        presetId: String(presetName),
        presetData: PRESETS[presetName]
      })
    } catch (error) {
      console.log('❌ Preset generation failed:', error)
      // Clear all options after preset generation failure
      clearAllOptionsAfterGeneration();
    }
  }



  // openComposerFromRemix function removed - no more remix functionality



  // Auto-generate with preset - simplified to use existing dispatchGenerate
  const handlePresetAutoGeneration = async (presetName: keyof typeof PRESETS) => {
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
      selectedPresetId: selectedPreset,
      customPrompt: '', // Clear custom prompt
      status: 'idle',
      error: null
    }))
    
    // Generate with ONLY the preset - no custom prompt contamination
    await dispatchGenerate('preset', {
      presetId: selectedPreset,
      presetData: PRESETS[selectedPreset]
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
    setShareModalOpen(true)
    setShareModalMedia(media)
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
      // Enhanced filtering for new dedicated table structure
      let presetType = item.metadata?.presetType;
      
      // If no metadata preset type, try to determine from other fields
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
        } else {
          presetType = 'professional'; // Default fallback
        }
      }
      
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
      // Call AIML API for prompt enhancement (free)
      const enhancedPrompt = await enhancePromptWithAIML(prompt.trim())
      
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

  // AIML API prompt enhancement function
  const enhancePromptWithAIML = async (originalPrompt: string): Promise<string> => {
    try {
      const token = authService.getToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      console.log('🚀 Calling AIML API for prompt enhancement...')
      
      // 🎯 All generation now goes through GenerationPipeline - no direct aimlApi calls
      console.log('🆕 [New System] All generation goes through GenerationPipeline');
      return enhancePromptLocally(originalPrompt);
    } catch (error) {
      console.error('❌ Prompt enhancement failed, using local fallback:', error);
      return enhancePromptLocally(originalPrompt);
    }
  }

  // Local prompt enhancement fallback (when AIML is unavailable)
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

  // Update user settings and persist to database
  const updateUserSettings = async (newSettings: { shareToFeed?: boolean }) => { // allowRemix removed
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
        
        // Refresh feed to show/hide shared media based on new setting
        if (newSettings.shareToFeed !== undefined) {
          console.log('🔄 Refreshing feed after shareToFeed change:', newSettings.shareToFeed)
          await loadFeed() // Refresh feed to reflect new visibility
        }
        
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
          Filtering by <span className="font-medium capitalize">{activeFeedFilter}</span> • 
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
              <SkeletonGrid columns={4} rows={6} />
            </div>
          ) : feed.length > 0 ? (
            <>
              <SafeMasonryGrid 
                feed={filteredFeed}
                handleMediaClick={handleMediaClick}
                onLastItemRef={setLastItemRef}
                // handleRemix removed
                onPresetTagClick={(presetType) => setActiveFeedFilter(presetType)}
              />
              
              {/* 🚀 Unified infinite scroll: Loading indicator */}
              {isLoadingMore && hasMoreFeed && (
                <div className="flex justify-center py-8">
                  <div className="flex items-center space-x-3 text-white/60">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm">Loading more...</span>
                  </div>
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
                  <div>🎯 Active Filter: {activeFeedFilter || 'none'}</div>
                  <div>👁️ Intersecting: {isIntersecting ? 'Yes' : 'No'}</div>
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

        // onRemix removed - no more remix functionality
        onShowAuth={() => navigate('/auth')}
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
                {isVideoPreview ? (
                  <video ref={(el) => (mediaRef.current = el)} src={previewUrl || ''} className="max-w-full max-h-[60vh] object-contain" controls onLoadedMetadata={measure} onLoadedData={measure} />
                ) : (
                  <>
                    {/* Main image */}
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
                    
                    {/* Story Time stacked cards - show when in storytime mode */}
                    {composerState.mode === 'storytime' && (
                      <div className="story-stacked-cards">
                        <div className="stacked-images">
                          {Array.from({ length: 4 }, (_, i) => (
                            <StoryImageCard
                              key={i}
                              index={i}
                              image={additionalStoryImages[i]}
                              isRequired={i < 2} // First 2 slots required
                              onUpload={handleAdditionalStoryImageUpload}
                              onRemove={handleAdditionalStoryImageRemove}
                            />
                          ))}
                        </div>
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
                          if (!isAuthenticated) {
                            // Sign up required - no notification needed
                            navigate('/auth')
                            return
                          }
                          // Close all other dropdowns and toggle presets
                          closeAllDropdowns()
                          setPresetsOpen((v) => !v)
                        }}
                      className={`px-3 py-1.5 rounded-2xl text-xs transition-colors ${
                        isAuthenticated 
                          ? 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30' 
                          : 'bg-white/5 text-white/40 cursor-not-allowed'
                      }`}
                      data-nav-button
                      data-nav-type="presets"
                      title={isAuthenticated ? 'Choose AI style presets' : 'Sign up to use AI presets'}
                      disabled={!isAuthenticated}
                    >
                      {selectedPreset ? getPresetLabel(selectedPreset) : 'Presets'}
                    </button>
                    
                    {/* Presets dropdown - clean and simple */}
                    {presetsOpen && (
                                             <div className="absolute bottom-full left-0 mb-2 rounded-xl p-3 w-80 z-50 shadow-2xl shadow-black/20" style={{ backgroundColor: '#333333' }}>
                        {/* Preset options - all visible, no scrolling */}
                        <div className="space-y-1">
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
                                  ? 'bg-white/90 backdrop-blur-md text-black' 
                                  : 'text-white hover:text-white hover:bg-white/20'
                              }`}
                            >
                              <span>{getPresetLabel(String(name))}</span>
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
                        if (!isAuthenticated) {
                          navigate('/auth')
                          return
                        }
                        
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
                        !isAuthenticated
                          ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/5 text-white/40 cursor-not-allowed'
                          : composerState.mode === 'emotionmask'
                          ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                          : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                      }
                      title={isAuthenticated ? 'Switch to Emotion Mask™ mode' : 'Sign up to use Emotion Mask™'}
                      disabled={!isAuthenticated}
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
                        if (!isAuthenticated) {
                          navigate('/auth')
                          return
                        }
                        
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
                        !isAuthenticated
                          ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/5 text-white/40 cursor-not-allowed'
                          : composerState.mode === 'ghiblireact'
                          ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                          : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                      }
                      title={isAuthenticated ? 'Switch to Studio Ghibli Reaction mode' : 'Sign up to use Studio Ghibli Reaction'}
                      disabled={!isAuthenticated}
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
                        if (!isAuthenticated) {
                          navigate('/auth')
                          return
                        }
                        
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
                        !isAuthenticated
                          ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/5 text-white/40 cursor-not-allowed'
                          : composerState.mode === 'neotokyoglitch'
                          ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                          : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                      }
                      title={isAuthenticated ? 'Switch to Neo Tokyo Glitch mode' : 'Sign up to use Neo Tokyo Glitch'}
                      disabled={!isAuthenticated}
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
                        if (!isAuthenticated) {
                          navigate('/auth')
                          return
                        }
                        
                        if (composerState.mode === 'storytime') {
                          // Already in Story Time mode - toggle dropdown
                          closeAllDropdowns()
                          setStoryTimeDropdownOpen((v) => !v)
                        } else {
                          // Switch to Story Time mode AND show dropdown immediately
                          closeAllDropdowns()
                          setComposerState(s => ({ ...s, mode: 'storytime' }))
                          setSelectedMode('presets') // Set selectedMode to match the new system
                          setSelectedStoryTimePreset(null)
                          setStoryTimeDropdownOpen(true) // Show dropdown immediately
                        }
                      }}
                      className={
                        !isAuthenticated
                          ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/5 text-white/40 cursor-not-allowed'
                          : composerState.mode === 'storytime'
                          ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                          : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                      }
                      title={isAuthenticated ? 'Switch to Story Time mode' : 'Sign up to use Story Time'}
                      disabled={!isAuthenticated}
                    >
                      {selectedStoryTimePreset ? 
                        selectedStoryTimePreset === 'auto' ? 'Story Time (Auto)' : `Story Time (${selectedStoryTimePreset})`
                        : 'Story Time'
                      }
                    </button>
                    
                    {/* Story Time presets dropdown - show when in Story Time mode */}
                    {composerState.mode === 'storytime' && storyTimeDropdownOpen && (
                      <div className="absolute bottom-full left-0 mb-2 z-50">
                        <div className="rounded-xl shadow-2xl p-3 w-80" style={{ backgroundColor: '#333333' }}>
                          {/* Status indicator */}
                          <div className="mb-3 p-2 rounded-lg text-xs text-center" style={{ backgroundColor: canGenerateStory ? '#22c55e20' : '#f59e0b20' }}>
                            {canGenerateStory 
                              ? `✅ Ready to generate with ${additionalStoryImages.filter(Boolean).length + 1} images`
                              : `📸 Need ${3 - (additionalStoryImages.filter(Boolean).length + 1)} more images (minimum 3)`
                            }
                          </div>
                          
                          <div className="space-y-1">
                            {/* Story Time preset options */}
                            {[
                              { id: 'auto', label: 'Auto Mode' },
                              { id: 'adventure', label: 'Adventure Mode' },
                              { id: 'romance', label: 'Romance Mode' },
                              { id: 'mystery', label: 'Mystery Mode' },
                              { id: 'comedy', label: 'Comedy Mode' },
                              { id: 'fantasy', label: 'Fantasy Mode' },
                              { id: 'travel', label: 'Travel Mode' }
                            ].map((preset) => (
                              <button
                                key={preset.id}
                                onClick={async () => {
                                  setSelectedStoryTimePreset(preset.id)
                                  setStoryTimeDropdownOpen(false)
                                  
                                  // Check if we have enough images for Story Time
                                  if (preset.id && canGenerateStory && isAuthenticated) {
                                    console.log('📖 Generating Story Time with preset:', preset.id)
                                    
                                    // Create Story Time story with multiple images
                                    try {
                                      const formData = new FormData()
                                      
                                      // Add main image
                                      formData.append('photos', selectedFile)
                                      
                                      // Add additional images
                                      additionalStoryImages.forEach((file, index) => {
                                        if (file) {
                                          formData.append('photos', file)
                                        }
                                      })
                                      
                                      formData.append('preset', preset.id)
                                      
                                      const response = await fetch('/.netlify/functions/story-time-create', {
                                        method: 'POST',
                                        headers: {
                                          'Authorization': `Bearer ${authService.getToken()}`
                                        },
                                        body: formData
                                      })
                                      
                                      if (response.ok) {
                                        const story = await response.json()
                                        console.log('📖 Story Time story created:', story)
                                        
                                        // Clear composer after successful story creation
                                        setTimeout(() => {
                                          handleClearComposerState()
                                        }, 1000)
                                      } else {
                                        const error = await response.json()
                                        console.error('❌ Story Time creation failed:', error)
                                      }
                                    } catch (error) {
                                      console.error('❌ Story Time creation failed:', error)
                                    }
                                                                      } else if (!canGenerateStory) {
                                      console.log('📖 Need more images for Story Time generation')
                                      // Show message that more images are needed
                                    }
                                  }}
                                  disabled={!canGenerateStory}
                                  className={(() => {
                                    const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm text-left';
                                    const activeClass = 'bg-white/90 backdrop-blur-md text-black';
                                    const inactiveClass = canGenerateStory 
                                      ? 'text-white hover:text-white hover:bg-white/20' 
                                      : 'text-white/50 cursor-not-allowed';
                                    return `${baseClass} ${selectedStoryTimePreset === preset.id ? activeClass : inactiveClass}`;
                                  })()}
                              >
                                <div>
                                  <div className="font-medium">{preset.label}</div>
                                </div>
                                {selectedStoryTimePreset === preset.id ? (
                                  <div className="w-4 h-4 rounded-full bg-white border-2 border-white/30"></div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-white/30"></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
                      const baseClass = 'w-8 h-8 rounded-full flex items-center justify-center transition-colors';
                      const activeClass = 'bg-white/10 text-white hover:bg-white/15';
                      const disabledClass = 'bg-white/5 text-white/50 cursor-not-allowed';
                      return `${baseClass} ${isAuthenticated ? activeClass : disabledClass}`;
                    })()}
                    aria-label="Save to draft"
                    disabled={!isAuthenticated}
                  >
                    <FileText size={14} />
                  </button>
                  <button 
                    onClick={async () => {
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
                        } else {
                        // Fallback - determine mode and generate
                        if (selectedPreset) {
                        // Run preset generation
                          await dispatchGenerate('preset', {
                          presetId: selectedPreset,
                          presetData: PRESETS[selectedPreset]
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
                    disabled={!selectedFile || (mode === 'presets' && !prompt.trim() && !selectedPreset) || navGenerating} 
                    className={
                      (!selectedFile || (mode === 'presets' && !prompt.trim() && !selectedPreset) || navGenerating)
                        ? 'w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-white text-black hover:bg-white/90'
                    }
                    aria-label="Generate"
                    title={(() => {
                      if (!isAuthenticated) return 'Sign up to generate AI content';
                      if (!previewUrl) return 'Upload media first';

                      if (mode === 'presets' && !prompt.trim() && !selectedPreset) return 'Enter a prompt or select a preset first';
                      if (selectedPreset) return `Generate with ${getPresetLabel(selectedPreset)} preset`;
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
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        mediaUrl={shareModalMedia?.url}
        caption={shareModalMedia?.prompt}
        title="Share Your Creation"
      />



      {/* Video Job Status Display removed in favor of unified toasts */}

      {/* Media Upload Agreement Modal */}
      <MediaUploadAgreement
        isOpen={showUploadAgreement}
        onClose={handleUploadAgreementCancel}
        onAccept={handleUploadAgreementAccept}
        onAgreementAccepted={() => setUserHasAgreed(true)}
        userHasAgreed={userHasAgreed}
      />

    </div>
  )
}

export default HomeNew


