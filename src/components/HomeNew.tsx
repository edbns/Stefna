import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, X, ArrowUp, Filter, FileText } from 'lucide-react'
import { authenticatedFetch, signedFetch } from '../utils/apiClient'
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

import { uploadSourceToCloudinary } from '../services/uploadSource'
import { storeSelectedFile } from '../services/mediaSource'
import { useGenerationMode } from '../stores/generationMode'
// MoodMorph removed - replaced with Anime Filters
import { EmotionMaskPicker } from './EmotionMaskPicker'
import { GhibliReactionPicker } from './GhibliReactionPicker'
import { NeoTokyoGlitchPicker } from './NeoTokyoGlitchPicker'

// Identity-safe generation fallback system (integrated with IPA)
// Uses Replicate's face-preserving models when primary generation fails

import { paramsForI2ISharp } from '../services/infer-params'
// import { clampStrength } from '../lib/strengthPolicy' // REMOVED - drama file deleted





// Safe wrapper for MasonryMediaGrid with fallback
interface SafeMasonryGridProps {
  feed: UserMedia[]
  handleMediaClick: (media: UserMedia) => void
  // handleRemix removed - no more remix functionality
}

const SafeMasonryGrid: React.FC<SafeMasonryGridProps> = ({
  feed,
  handleMediaClick,
  // handleRemix removed
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
      />
    )
  } catch (error) {
    console.error('🚨 MasonryMediaGrid failed, using fallback:', error)
    // Safe fallback - simple grid without fancy components
    return (
      <div className="grid grid-cols-4 gap-1 pb-24 w-full">
        {feed.slice(0, 16).map((item, index) => (
          <div key={item.id} className="aspect-square bg-gray-200 rounded overflow-hidden">
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


  


// Import from the new professional presets system
import { PROFESSIONAL_PRESETS, ProfessionalPresetConfig } from '../config/professional-presets'

// Import the actual preset files
import { EMOTION_MASK_PRESETS } from '../presets/emotionmask'
import { GHIBLI_REACTION_PRESETS } from '../presets/ghibliReact'
import { NEO_TOKYO_GLITCH_PRESETS } from '../presets/neoTokyoGlitch'
import NeoGlitchService from '../services/neoGlitchService'

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

// import { validateModeMappings } from '../utils/validateMappings' // REMOVED - complex drama file
import FullScreenMediaViewer from './FullScreenMediaViewer'
import ShareModal from './ShareModal'


// import { requireUserIntent } from '../utils/generationGuards' // REMOVED - complex drama file
import userMediaService from '../services/userMediaService'
// import { pickResultUrl, ensureRemoteUrl } from '../utils/aimlUtils' // REMOVED - drama file deleted
import { cloudinaryUrlFromEnv } from '../utils/cloudinaryUtils'
import { createAsset } from '../lib/api'
import { saveMedia, togglePublish } from '../lib/api'
import { Mode, MODE_LABELS } from '../config/modes'
// Removed old preset services - using new professional presets system
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
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [prompt, setPrompt] = useState('')
  
  // Mode state
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)
  
  // Identity lock state
  const [identityLock, setIdentityLock] = useState(false)
  
  // Composer state with explicit mode - CLEAN SEPARATION
  const [composerState, setComposerState] = useState({
    mode: 'custom' as 'preset' | 'custom' | 'emotionmask' | 'ghiblireact' | 'neotokyoglitch', // remix mode removed
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
        const { queuePreset, queueOption, onSourceReady, clearQueue, busy: presetRunnerBusy } = usePresetRunner()
  const { selectedPreset: stickySelectedPreset, setSelectedPreset: setStickySelectedPreset, ensureDefault } = useSelectedPreset()
  
  // Selected preset using sticky store instead of local state
  const selectedPreset = stickySelectedPreset
  const setSelectedPreset = setStickySelectedPreset

  // Stable ref for selectedPreset to prevent re-render issues during generation
  const selectedPresetRef = useRef<string | null>(null)
  const genIdRef = useRef(0) // increments per job to prevent race conditions
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  
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

  // Clear all options after generation (success or failure)
  const clearAllOptionsAfterGeneration = () => {
    console.log('🎭 Clearing all options after generation')
    setSelectedMode(null)
    setSelectedPreset(null)
    setSelectedEmotionMaskPreset(null)
    setSelectedGhibliReactionPreset(null)
    setSelectedNeoTokyoGlitchPreset(null)
    setPrompt('')
    setSelectedFile(null)
    setPreviewUrl(null)
    setComposerState(s => ({
      ...s,
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
    }))
    
    // Reset HiddenUploader component by dispatching a custom event
    window.dispatchEvent(new CustomEvent('reset-hidden-uploader'))
    
    // Clear any file input elements
    const fileInputs = document.querySelectorAll('input[type="file"]')
    fileInputs.forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.value = ''
        // Force remount by updating key attribute
        input.setAttribute('key', String(Date.now()))
      }
    })
    
    console.log('🎭 All options cleared, HiddenUploader reset triggered')
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

  // Initialize sticky preset system when PROFESSIONAL_PRESETS are loaded
  useEffect(() => {
    if (Object.keys(PROFESSIONAL_PRESETS).length > 0) {
      const activePresets = Object.keys(PROFESSIONAL_PRESETS)
      ensureDefault(activePresets)
    }
  }, [PROFESSIONAL_PRESETS, ensureDefault])

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
const [showNeoTokyoGlitchDisclaimer, setShowNeoTokyoGlitchDisclaimer] = useState(false)
  




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
      
      // Update composer state for remix mode
      setComposerState(s => ({
        ...s,
        mode: 'custom', // remix mode removed
        file: null,
        sourceUrl: url,
        status: 'idle',
        error: null,
        runOnOpen: false
      }))
      
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
          actualPreviewUrl: previewUrl,
          composerMode: composerState.mode,
          composerStatus: composerState.status
        })
      })
    }
  }, [isComposerOpen, previewUrl, selectedFile, isVideoPreview, composerState.mode, composerState.status])

  // Add global debug functions for identity-safe generation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).checkIdentitySafeGeneration = async () => {
        try {
          const { isIdentitySafeGenerationAvailable } = await import('../utils/identitySafeGeneration');
          const isAvailable = isIdentitySafeGenerationAvailable();
          console.log('🔍 Identity-safe generation available:', isAvailable);
          return isAvailable;
        } catch (error) {
          console.error('❌ Failed to check identity-safe generation:', error);
          return false;
        }
      };

      (window as any).testIdentitySafeGeneration = async (prompt: string, imageUrl: string) => {
        try {
          const { runIdentitySafeFallback } = await import('../utils/identitySafeGeneration');
          console.log('🧪 Testing identity-safe generation...');
          const result = await runIdentitySafeFallback(prompt, imageUrl);
          console.log('✅ Test successful:', result);
          return result;
        } catch (error) {
          console.error('❌ Test failed:', error);
          throw error;
        }
      };
    }
  }, []);

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
        remixCount: 0,
        isPublic: false,
        allowRemix: false,
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
      
      // Clear composer state immediately after generation completes
      console.log('🧹 Clearing composer state immediately after generation completion')
      handleClearComposerState()
      
      // Force immediate UI refresh
      setTimeout(() => {
        console.log('🔄 Forcing immediate UI refresh...')
        // Force a re-render by updating state
        setSelectedFile(null)
        setPreviewUrl(null)
        setPrompt('')
        setIsComposerOpen(false)
      }, 100) // Very fast refresh
      
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
    }

    const handleGenerationSuccess = (event: CustomEvent) => {
      const { message, mode } = event.detail
      console.log('✅ Generation success:', message, 'Mode:', mode)
      // The toast is already handled by the generation pipeline
      
      // Clear composer state immediately after successful generation
      console.log('🧹 Clearing composer state after generation success')
      handleClearComposerState()
      
      // Force additional clearing for stubborn cases
      setTimeout(() => {
        console.log('🧹 Force clearing composer after generation success (delayed)');
        handleClearComposerState();
      }, 300);
    }

    const handleGenerationError = (event: CustomEvent) => {
      const { message } = event.detail
      console.log('❌ Generation error:', message)
      notifyError({ title: 'Media failed', message: 'Try again' })
      
      // Clear composer state immediately after generation error
      console.log('🧹 Clearing composer state after generation error')
      handleClearComposerState()
      
      // Force additional clearing for stubborn cases
      setTimeout(() => {
        console.log('🧹 Force clearing composer after generation error (delayed)');
        handleClearComposerState();
      }, 300);
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
      
      // Force additional composer clearing for stubborn cases
      setTimeout(() => {
        console.log('🧹 Force clearing composer after user media update (delayed)');
        handleClearComposerState();
      }, 300);
    }

    const handleRefreshUserMedia = () => {
      console.log('🔄 Refresh user media event received, refreshing user profile...')
      // Load user profile from database to refresh user media
      loadUserProfileFromDatabase()
    }

    const handleCloseComposer = () => {
      setIsComposerOpen(false)
    }

    const handleClearComposerState = () => {
      console.log('🧹 Clearing composer state...')
      // Clear all composer-related state
      setSelectedFile(null)
      setPreviewUrl(null)
      setPrompt('')
      setSelectedPreset(null)
      setSelectedEmotionMaskPreset(null)
      setSelectedGhibliReactionPreset(null)
      setSelectedNeoTokyoGlitchPreset(null)
      setSelectedMode(null)
      setIsVideoPreview(false)
      
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
      
      // Clear any file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
        // Force remount if needed
        fileInput.setAttribute('key', String(Date.now()))
      }
      
      // Clear composer open state
      setIsComposerOpen(false)
      
      console.log('🧹 Composer state completely cleared')
    }

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

  // Load more feed items (for infinite scroll)
  const loadMoreFeed = async () => {
    if (!hasMoreFeed || isLoadingMore) return
    await loadFeed(false)
  }

  // Scroll detection for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        // User is near bottom, load more
        loadMoreFeed()
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
      const offset = isInitial ? 0 : feedPage * pageSize
      
      const res = await fetch(`/.netlify/functions/getPublicFeed?limit=${pageSize}&offset=${offset}`)
      console.log('📡 Feed response status:', res.status)
      
      if (res.ok) {
        const resp = await res.json()
        console.log('📊 Raw feed response:', resp)
        console.log('📥 Feed items received:', resp.success ? 'success' : 'failed')
        
        if (!resp.success) {
          console.error('❌ Feed API error:', resp.error)
          return
        }
        
        const { items: media, hasMore } = resp
        console.log('📊 Raw feed data:', media)
        console.log('📊 Feed length:', media?.length || 0)
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
            userId: item.userId || '', // Use actual user ID or empty string to hide tooltip
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
            timestamp: item.createdAt,
            originalMediaId: item.sourceAssetId || undefined,
            tokensUsed: item.mediaType === 'video' ? 5 : 2,
            likes: 0, // Not exposed in public feed
            isPublic: true,
            tags: [],
            metadata: { quality: 'high', generationTime: 0, modelVersion: '1.0' },
            // Store additional fields needed for functionality
            cloudinaryPublicId: item.cloudinaryPublicId,
            mediaType: item.mediaType,
          })
        })
          .filter((item): item is UserMedia => item !== null) // Filter out null items
        
        console.log('🎯 Mapped feed items:', mapped.length)
        
        if (isInitial) {
          console.log('🎯 Setting initial feed with items:', mapped.length, 'first item ID:', mapped[0]?.id)
          setFeed(mapped)
        } else {
          console.log('🎯 Adding more items to feed:', mapped.length)
          setFeed(prev => [...prev, ...mapped])
          setFeedPage(prev => prev + 1)
        }
        
        setHasMoreFeed(hasMore !== false)
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
          shareToFeed: profile.shareToFeed || false,
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
    
    // Generate run ID to avoid cross-talk
    const runId = crypto.randomUUID();
    setCurrentRunId(runId);
    console.info('▶ NEW dispatchGenerate', { kind, options, runId });
    
    // 🛡️ Runtime Guard (For Safety) - Prevent unknown modes from crashing the app
    if (!['preset', 'custom', 'emotionmask', 'ghiblireact', 'neotokyoglitch'].includes(kind)) {
      console.warn("[dispatchGenerate] Unknown mode: ", kind);
      notifyError({ title: 'Unsupported generation mode', message: 'This generation mode is not supported.' });
      return;
    }
    
    // 🛡️ Model Validation Guard - Ensure only supported models are used
    const ALLOWED_MODELS = [
      "flux/dev/image-to-image",
      "flux-pro/v1.1-ultra",
      "flux-realism",
      "dall-e-2",
      "dall-e-3"
    ];
    
      // Helper function to validate model
  const validateModel = (model: string) => {
    if (!ALLOWED_MODELS.includes(model)) {
      console.error("🚫 Invalid model:", model);
      notifyError({ title: 'Model Error', message: `Model '${model}' is not supported. Using fallback.` });
      return "flux/dev/image-to-image"; // Fallback to known working model
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
      
      // Show "Add to queue" notification for all generation modes
      notifyQueue({ title: 'Add to queue', message: 'We will start processing shortly.' });

    // Get current profile settings
    const { shareToFeed } = await getUserProfileSettings() // allowRemix removed
    console.log('🔧 Using profile settings:', { shareToFeed }) // allowRemix removed

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
      generationMeta = { mode: 'custom', source: 'user_prompt' };
      console.log('🎨 CUSTOM MODE: Using user prompt only:', effectivePrompt);
      
    } else if (kind === 'preset') {
      // PRESET MODE: Use ONLY the selected preset
      const presetId = options?.presetId || selectedPreset;
      if (!presetId || !PRESETS[presetId]) {
        console.error('❌ Invalid preset:', presetId);
        notifyError({ title: 'Invalid preset', message: 'Please select a valid style preset' });
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      effectivePrompt = PRESETS[presetId].prompt;
      generationMeta = { mode: 'preset', presetId, presetLabel: PRESETS[presetId].label };
      console.log('🎯 PRESET MODE: Using preset only:', effectivePrompt);
      
    // Remix mode removed - focus on personal creativity
      
    } else if (kind === 'emotionmask') {
      // HYBRID EMOTION MASK MODE: Use curated presets or dynamic prompts
      const emotionMaskPresetId = options?.emotionMaskPresetId || selectedEmotionMaskPreset;
      
      if (!emotionMaskPresetId) {
        console.error('❌ Invalid Emotion Mask preset:', emotionMaskPresetId);
        notifyError({ title: 'Invalid Emotion Mask preset', message: 'Please select an emotional variant first' });
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      
      const emotionMaskPreset = EMOTION_MASK_PRESETS.find(p => p.id === emotionMaskPresetId);
      if (!emotionMaskPreset) {
        console.error('❌ Emotion Mask preset not found:', emotionMaskPresetId);
        notifyError({ title: 'Emotion Mask preset not found', message: 'Please select a valid emotional variant' });
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      
      // 🎭 EMOTION MASK MODE: ALWAYS use the original, curated prompt
      // NO MORE SYNTHETIC PROMPT GENERATION - preserve emotional intent
      effectivePrompt = emotionMaskPreset.prompt;
      
      // Apply identity lock adjustments - more aggressive for Emotion Mask
      const adjustedStrength = identityLock ? Math.min(emotionMaskPreset.strength * 0.5, 0.32) : emotionMaskPreset.strength;
      
              generationMeta = { 
          mode: 'emotionmask', 
          emotionMaskPresetId, 
        emotionMaskPresetLabel: emotionMaskPreset.label,
          model: "flux/dev/image-to-image", // Use known working model
        strength: adjustedStrength, // Adjusted for identity lock
          guidance_scale: 7.5, // Standard guidance for consistency
          cfg_scale: 7.0, // Balanced creativity vs adherence
        denoising_strength: adjustedStrength, // Match adjusted strength
        generation_type: identityLock ? "emotion_mask_identity_preserved" : "emotion_mask_standard",
        identityLock: identityLock // Track identity lock state
        };
      console.log('🎭 EMOTION MASK MODE: Using ORIGINAL prompt:', emotionMaskPreset.label, effectivePrompt);
    } else if (kind === 'ghiblireact') {
      // GHIBLI REACTION MODE: Use the selected Ghibli reaction preset
      const ghibliReactionPresetId = options?.ghibliReactionPresetId || selectedGhibliReactionPreset;
      if (!ghibliReactionPresetId) {
        console.error('❌ Invalid Ghibli Reaction preset:', ghibliReactionPresetId);
        notifyError({ title: 'Invalid Ghibli Reaction preset', message: 'Please select a Ghibli reaction preset first' });
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      
      const ghibliReactionPreset = GHIBLI_REACTION_PRESETS.find(p => p.id === ghibliReactionPresetId);
      if (!ghibliReactionPreset) {
        console.error('❌ Ghibli Reaction preset not found:', ghibliReactionPresetId);
        notifyError({ title: 'Ghibli Reaction preset not found', message: 'Please select a valid Ghibli reaction preset' });
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      
      effectivePrompt = ghibliReactionPreset.prompt;
              generationMeta = { 
          mode: 'ghiblireact', 
          ghibliReactionPresetId, 
          ghibliReactionLabel: ghibliReactionPreset.label, 
          model: "flux/dev/image-to-image", // Use known working model for Ghibli style
          strength: ghibliReactionPreset.strength, // Use actual preset strength
          guidance_scale: 7.5, // Standard guidance for consistency
          cfg_scale: 7.0, // Balanced creativity vs adherence
          denoising_strength: ghibliReactionPreset.strength, // Match preset strength
          generation_type: "ghibli_reaction_balanced" // Mark as balanced transformation
        };
              console.log('🎭 GHIBLI REACTION MODE: Using Ghibli reaction preset:', ghibliReactionPreset.label, effectivePrompt, 'Model: flux/dev/image-to-image');
      
    } else if (kind === 'neotokyoglitch') {
      // NEO TOKYO GLITCH MODE: Use Replicate integration for maximum glitch intensity
      const neoTokyoGlitchPresetId = options?.neoTokyoGlitchPresetId || selectedNeoTokyoGlitchPreset;
      if (!neoTokyoGlitchPresetId) {
        console.error('❌ Invalid Neo Tokyo Glitch preset:', neoTokyoGlitchPresetId);
        notifyError({ title: 'Invalid Neo Tokyo Glitch preset', message: 'Please select a Neo Tokyo Glitch preset first' });
        endGeneration(genId);
        setNavGenerating(false);
        return;
      }
      
      const neoTokyoGlitchPreset = NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === neoTokyoGlitchPresetId);
      if (!neoTokyoGlitchPreset) {
        console.error('❌ Neo Tokyo Glitch preset not found:', neoTokyoGlitchPresetId);
        notifyError({ title: 'Neo Tokyo Glitch preset not found', message: 'Please select a valid Neo Tokyo Glitch preset' });
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
        notifyError({ title: 'Unknown preset', message: 'Please select a valid Neo Tokyo Glitch preset' });
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
        generation_type: "neo_tokyo_stability_glitch", // Mark as Stability.ai glitch transformation
        presetKey // Store which preset to use
        };
      console.log('🎭 NEO TOKYO GLITCH MODE: Using Stability.ai + AIML fallback:', neoTokyoGlitchPreset.label, 'Preset:', presetKey);
      
    } else {
      console.error('❌ Unknown generation kind:', kind);
      notifyError({ title: 'Generation error', message: 'Unknown generation type' });
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

      // For Neo Tokyo Glitch, use our new Stability.ai + AIML fallback system
      if (kind === 'neotokyoglitch') {
        console.log('🚀 [NeoGlitch] Starting generation with Stability.ai + AIML fallback');
        
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
          notifyError({ title: 'Invalid source', message: 'Please use an original photo, not a generated image' });
          endGeneration(genId);
          setNavGenerating(false);
          return;
        }
        
        // Call our new neo-glitch-generate function
        const neoGlitchResponse = await authenticatedFetch('/.netlify/functions/neo-glitch-generate', {
          method: 'POST',
          body: JSON.stringify({
            prompt: effectivePrompt,
            userId: authService.getCurrentUser()?.id,
            presetKey: generationMeta?.presetKey || 'base',
            sourceUrl,
            runId: genId
          })
        });
        
        if (!neoGlitchResponse.ok) {
          throw new Error(`Neo Glitch generation failed: ${neoGlitchResponse.status}`);
        }
        
        const neoGlitchResult = await neoGlitchResponse.json();
        console.log('✅ [NeoGlitch] Generation result:', neoGlitchResult);
        
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
              tags: ['neo-tokyo-glitch', 'cyberpunk', 'ai-generated'],
              metadata: {
                quality: 'high' as const,
                generationTime: Date.now(),
                modelVersion: neoGlitchResult.model || 'stability-ai',
                presetId: generationMeta?.neoTokyoGlitchPresetId,
                mode: 'i2i' as const,
                group: null
              }
            };
            
            await userMediaService.saveMedia(mediaToSave, { shareToFeed: true });
            console.log('✅ [NeoGlitch] Media saved successfully');
            
            // Refresh the public feed to show new media
            loadFeed();
          } catch (error) {
            console.error('❌ [NeoGlitch] Failed to save media:', error);
          }
          
          // End generation successfully
          endGeneration(genId);
          setNavGenerating(false);
          
          // Show unified toast with thumbnail
          notifyReady({ 
            title: 'Your media is ready', 
            message: 'Tap to open',
            thumbUrl: neoGlitchResult.imageUrl,
            onClickThumb: () => {
              // Open the generated image in a new tab
              window.open(neoGlitchResult.imageUrl, '_blank');
            }
          });
          
          return;
        } else if (neoGlitchResult.status === 'generating') {
          // Generation is in progress, start polling
          console.log('🔄 [NeoGlitch] Generation in progress, starting polling');
          
          // Start polling for completion
          const pollInterval = setInterval(async () => {
            try {
              const statusResponse = await authenticatedFetch('/.netlify/functions/neo-glitch-status', {
                method: 'POST',
                body: JSON.stringify({
                  stabilityJobId: neoGlitchResult.stabilityJobId,
                  runId: genId
                })
              });
              
              if (statusResponse.ok) {
                const statusResult = await statusResponse.json();
                
                if (statusResult.status === 'completed' && statusResult.imageUrl) {
                  console.log('🎉 [NeoGlitch] Polling completed successfully');
                  clearInterval(pollInterval);
                  
                  // Save the generated media to user profile
                  try {
                    const mediaToSave = {
                      userId: authService.getCurrentUser()?.id || '',
                      type: 'photo' as const,
                      url: statusResult.imageUrl,
                      thumbnailUrl: statusResult.imageUrl, // Use same URL for thumbnail
                      prompt: effectivePrompt,
                      aspectRatio: 1, // Default to 1:1 for Neo Tokyo Glitch
                      width: 1024, // Default dimensions
                      height: 1024,
                      tokensUsed: 1, // Default token usage
                      isPublic: true, // Share to feed by default
                      tags: ['neo-tokyo-glitch', 'cyberpunk', 'ai-generated'],
                      metadata: {
                        quality: 'high' as const,
                        generationTime: Date.now(),
                        modelVersion: statusResult.model || 'stability-ai',
                        presetId: generationMeta?.neoTokyoGlitchPresetId,
                        mode: 'i2i' as const,
                        group: null
                      }
                    };
                    
                    await userMediaService.saveMedia(mediaToSave, { shareToFeed: true });
                    console.log('✅ [NeoGlitch] Media saved successfully from polling');
                    
                    // Refresh the public feed to show new media
                    loadFeed();
                  } catch (error) {
                    console.error('❌ [NeoGlitch] Failed to save media from polling:', error);
                  }
                  
                  // End generation successfully
                  endGeneration(genId);
                  setNavGenerating(false);
                  
                  // Show unified toast with thumbnail
                  notifyReady({ 
                    title: 'Your media is ready', 
                    message: 'Tap to open',
                    thumbUrl: statusResult.imageUrl,
                    onClickThumb: () => {
                      // Open the generated image in a new tab
                      window.open(statusResult.imageUrl, '_blank');
                    }
                  });
                }
              }
            } catch (error) {
              console.error('❌ [NeoGlitch] Polling error:', error);
            }
          }, 2000); // Poll every 2 seconds
          
          // Set timeout for polling (2 minutes)
          setTimeout(() => {
            clearInterval(pollInterval);
            console.error('❌ [NeoGlitch] Polling timeout');
            notifyError({ title: 'Generation timeout', message: 'Please try again' });
            endGeneration(genId);
            setNavGenerating(false);
          }, 120000);
          
          return;
        } else {
          throw new Error(`Unexpected Neo Glitch response: ${JSON.stringify(neoGlitchResult)}`);
        }
      }
      
      // For other modes, use the existing AIML API flow
      console.log('🚀 Using existing AIML API flow for mode:', kind);
      
      // Upload source image to Cloudinary
      const uploadResult = await uploadSourceToCloudinary({
        file: selectedFile,
        url: undefined
      });
      const sourceUrl = uploadResult.secureUrl;
      
      // Validate source URL
      try {
        assertIsSourceUrl(sourceUrl);
      } catch (error) {
        console.error('❌ Source URL validation failed:', error);
        notifyError({ title: 'Invalid source', message: 'Please use an original photo, not a generated image' });
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

      // Model normalization function with Flux Dev as primary, Flux Pro as fallback
      const normalizeModel = (model?: string, mode?: string) => {
        // 🎯 CONSISTENT MODEL STRATEGY: Use flux/dev for all modes, flux-pro as fallback
        // This ensures consistent style and identity preservation across all generations
        
        // Primary model for ALL modes (consistent style, reliable identity preservation)
        const primaryModel = 'flux/dev/image-to-image';
        
        // Fallback model if primary fails (higher quality, different approach)
        const fallbackModel = 'flux-pro/v1.1-ultra';
        
        // For now, always use primary model to fix the "6 different results" issue
        // Fallback logic can be added later when we implement retry mechanisms
        // 
        // FALLBACK STRATEGY (Future Implementation):
        // 1. Try primaryModel (flux/dev/image-to-image) first
        // 2. If primary fails, retry with fallbackModel (flux-pro/v1.1-ultra)
        // 3. This ensures users always get results, even if primary model is down
        return primaryModel;
      };

      // Build payload with correct URL key based on media type
      const payload = {
        mode: kind,
        prompt: effectivePrompt, // server will prepend the identity prelude
        image_url: sourceUrl,
        strength: generationMeta?.strength || 0.85, // No drama clamping - use simple values
        model: normalizeModel(generationMeta?.model || 'flux/dev', kind),
        num_variations: 1,
        seed: Date.now(), // Fixed seed for consistency - same input = same output
        single_image: true, // Force single output to prevent variations
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
        if (preset.negative_prompt) payload.negative_prompt = preset.negative_prompt;
        if (typeof preset.strength === 'number') payload.strength = preset.strength;
        payload.presetName = selectedPreset;
      }

      console.info('aimlApi payload', payload);

      // Reserve credits before generation - dynamically calculate based on variations
      let creditsNeeded = 1; // Default for single generation
      
      if (kind === 'ghiblireact' || kind === 'neotokyoglitch') {
        creditsNeeded = 1; // Single generation for new modes
      } else {
        creditsNeeded = 1; // Single generation (preset, custom single, emotionmask, remix)
      }
      
      console.log(`💰 Reserving ${creditsNeeded} credits before generation...`);
      console.log('🔍 Credit reservation debug:', { 
        kind, 
        mode, 
        creditsNeeded, 
        kindType: typeof kind, 
        modeType: typeof mode 
      });
      
      // Map generation modes to valid credit reservation actions
      let creditAction = kind;
      if (kind === 'ghiblireact' || kind === 'neotokyoglitch') {
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
                allowRemix: false,
                tags: [],
                metadata: { quality: 'high', generationTime: 0, modelVersion: 'pending' }
              }
              // Don't dispatch userMediaUpdated during generation - it clears the composer!
              // The profile will refresh when the actual save completes
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

      // 🎭 NEO TOKYO GLITCH: Use Replicate integration for maximum glitch intensity
      let skipAimlApi = false;
      let replicateResultUrl: string | null = null;
      let replicateAllResultUrls: string[] = [];
      let replicateVariationsGenerated = 1;
      
      if (kind === 'neotokyoglitch' && generationMeta?.replicatePreset) {
        console.log('🚀 NEO TOKYO GLITCH: Using new first-class generation pipeline');
        console.log('🎭 Replicate preset:', generationMeta.replicatePreset);
        
        try {
          // Use the new NeoGlitchService for complete pipeline management
          const neoGlitchService = NeoGlitchService.getInstance();
          
          // Start the complete Neo Tokyo Glitch generation
          const generationRequest = {
            prompt: effectivePrompt,
            presetKey: generationMeta.replicatePreset, // Use the actual preset key (visor, base, etc.)
            sourceAssetId: sourceUrl || '',
            userId: authService.getCurrentUser()?.id || '',
            runId: genId,
            meta: {
              mode: 'neotokyoglitch',
              presetId: selectedPreset,
              replicatePreset: generationMeta.replicatePreset,
              features: generationMeta.features
            }
          };
          
          console.log('🎭 [NeoGlitch] Starting generation with request:', generationRequest);
          
          // 🧪 DEBUG: Log the exact payload being sent to the backend
          console.log('🧪 [NeoGlitch] DEBUG - Payload validation:', {
            hasPrompt: !!generationRequest.prompt,
            promptLength: generationRequest.prompt?.length,
            hasUserId: !!generationRequest.userId,
            hasPresetKey: !!generationRequest.presetKey,
            presetKeyValue: generationRequest.presetKey,
            hasSourceAssetId: !!generationRequest.sourceAssetId,
            sourceAssetIdValue: generationRequest.sourceAssetId,
            hasRunId: !!generationRequest.runId,
            runIdValue: generationRequest.runId
          });
          
          // Create the initial glitch record and start Replicate generation
          const generationResult = await neoGlitchService.startGeneration(generationRequest);
          
          console.log('✅ [NeoGlitch] Generation started successfully:', generationResult);
          
          // Poll for completion
          const finalStatus = await neoGlitchService.pollForCompletion(generationResult.id);
          
          if (finalStatus.status === 'completed' && finalStatus.cloudinaryUrl) {
            console.log('✅ [NeoGlitch] Generation completed with Cloudinary URL:', finalStatus.cloudinaryUrl);
            
            // Set the result URL from Cloudinary (permanent)
            replicateResultUrl = finalStatus.cloudinaryUrl;
          replicateAllResultUrls = [replicateResultUrl];
          replicateVariationsGenerated = 1;
          skipAimlApi = true;
          
            console.log('🎭 [NeoGlitch] Using permanent Cloudinary URL, skipping aimlApi');
          } else {
            throw new Error(`Generation failed or incomplete: ${finalStatus.status} - ${finalStatus.error || 'Unknown error'}`);
          }
          
        } catch (error) {
          console.error('❌ [NeoGlitch] Generation failed:', error);
          notifyError({ title: 'Neo Tokyo Glitch generation failed', message: error.message || 'Please try again' });
          endGeneration(genId);
          setNavGenerating(false);
          return;
        }
      }

      // Declare variables that will be used later
      let resultUrl: string;
      let allResultUrls: string[];
      let variationsGenerated: number;
      let body: any;
      let res: Response | null = null; // Declare res at top level

      // 🧪 DEBUG: Log complete payload before API call
      console.log('🧪 DEBUG: Complete aimlApi payload:', {
        prompt: effectivePrompt,
        image_url: payload.image_url || payload.init_image,
        model: payload.model || 'default',
        strength: payload.strength || 'default',
        guidance_scale: payload.guidance_scale || 'default',
        cfg_scale: payload.cfg_scale || 'default',
        denoising_strength: payload.denoising_strength || 'default',
        generation_meta: generationMeta,
        full_payload: payload
      });

      // Skip aimlApi if we already have Replicate results
      if (skipAimlApi && replicateResultUrl) {
        console.log('🎭 Skipping aimlApi - using Replicate results');
        resultUrl = replicateResultUrl;
        allResultUrls = replicateAllResultUrls;
        variationsGenerated = replicateVariationsGenerated;
        body = { success: true, image_url: resultUrl };
        
        // Ensure allResultUrls is properly set for Neo Tokyo Glitch
        if (kind === 'neotokyoglitch' && (!allResultUrls || allResultUrls.length === 0)) {
          allResultUrls = [replicateResultUrl];
          console.log('🎭 Fixed Neo Tokyo Glitch allResultUrls:', allResultUrls);
        }
        
        // Debug logging for Neo Tokyo Glitch URL handling
        if (kind === 'neotokyoglitch') {
          console.log('🎭 Neo Tokyo Glitch URL Debug:', {
            replicateResultUrl,
            replicateAllResultUrls,
            allResultUrls,
            resultUrl,
            body
          });
        }
        
        // For Neo Tokyo Glitch, ensure we have a proper body structure for asset creation
        if (kind === 'neotokyoglitch') {
          body = {
            success: true,
            image_url: resultUrl,
            modeMeta: generationMeta,
            prompt: effectivePrompt
          };
          console.log('🎭 Neo Tokyo Glitch body prepared for asset creation:', body);
        }
        
        // Continue to result processing
      } else {
        // Add timeout guard to prevent 504 errors
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Request timeout approaching, aborting to prevent 504');
          controller.abort();
        }, 24000); // 24s cushion before Netlify's 26s limit

        try {
          res = await authenticatedFetch('/.netlify/functions/aimlApi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId); // Clear timeout if request completes

          console.info('aimlApi status', res.status);
          body = await res.json().catch(() => ({}));
          console.info('aimlApi body', body);
        } catch (error) {
          clearTimeout(timeoutId); // Clear timeout on error
          if (error.name === 'AbortError') {
            console.warn('⚠️ Request aborted due to timeout');
            throw new Error('Request timed out. Please try again with a smaller image or different prompt.');
          }
          throw error; // Re-throw other errors
        }

        // Process aimlApi results
        if (res && !res.ok) {
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

        // Extract result URLs from aimlApi response
        resultUrl = body?.image_url || body?.image_urls?.[0] || null;
        allResultUrls = body.result_urls || [resultUrl];
        variationsGenerated = body.variations_generated || 1;
      }

      // Handle video job creation (status 202) - only for aimlApi responses
      if (!skipAimlApi && res?.status === 202 && body?.job_id && isVideoPreview) {
          notifyQueue({ title: 'Add to queue', message: 'Processing will begin shortly.' })
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
      
      // 🔒 IDENTITY PRESERVATION CHECK - if identity lock is enabled
      let finalResultUrl = resultUrl;

      
      if (identityLock && sourceUrl) {

        try {
          const { checkIdentityPreservation } = await import('../hooks/useIPAFaceCheck');
          
          const ipaResult = await checkIdentityPreservation({
            originalUrl: sourceUrl,
            generatedUrl: resultUrl,
            threshold: 0.38, // Slightly higher than default for stricter identity preservation
          });
          

          
          if (!ipaResult.passed) {
            console.log(`🔒 IPA check failed (${generationMeta?.mode || 'unknown'} mode) - similarity: ${ipaResult.similarity.toFixed(3)}`);
            
            // Show user feedback for identity check failure
            if (generationMeta?.mode === 'emotionmask') {
              toast.info('Identity check failed, retrying with lower strength...', { duration: 3000 });
            }
            
            // Retry with lower strength for better identity preservation
            // More aggressive for Emotion Mask to preserve identity
            const retryMultiplier = generationMeta?.mode === 'emotionmask' ? 0.4 : 0.6;
            const retryPayload = {
              ...payload,
              strength: Math.min(payload.strength * retryMultiplier, 0.25),
            };
            
            console.log(`🔒 Retry with ${retryMultiplier}x strength: ${payload.strength} → ${retryPayload.strength}`);
            

            
            const retryRes = await authenticatedFetch('/.netlify/functions/aimlApi', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(retryPayload),
              signal: controller.signal
            });
            
            if (retryRes.ok) {
              const retryBody = await retryRes.json();
              const retryUrl = retryBody?.image_url || retryBody?.image_urls?.[0];
              
              if (retryUrl) {

                
                const retryIpaResult = await checkIdentityPreservation({
                  originalUrl: sourceUrl,
                  generatedUrl: retryUrl,
                  threshold: 0.38,
                });
                
                if (retryIpaResult.passed) {
                  finalResultUrl = retryUrl;
                } else {
                  // Attempt face blending as final fallback
                  if (generationMeta?.mode === 'emotionmask') {
                    toast.info('Enabling face blending fallback...', { duration: 3000 });
                  }
                  
                  try {
                    const { blendOriginalFace } = await import('../hooks/useIPAFaceCheck');
                    const blendedResult = await blendOriginalFace(sourceUrl, retryUrl, 16);
                    finalResultUrl = blendedResult;
                    
                    if (generationMeta?.mode === 'emotionmask') {
                      toast.success('Face blending completed - identity preserved!', { duration: 4000 });
                    }
                  } catch (blendError) {
                    console.log('🔒 Face blending failed, trying identity-safe generation fallback...');
                    
                    // Final fallback: Identity-safe generation with Replicate
                    try {
                      const { runIdentitySafeFallback } = await import('../utils/identitySafeGeneration');
                      
                      if (generationMeta?.mode === 'emotionmask') {
                        toast.info('Trying identity-safe generation...', { duration: 3000 });
                      }
                      
                      const fallbackResult = await runIdentitySafeFallback(
                        payload.prompt,
                        sourceUrl,
                        { strength: 0.5, guidance: 8.0 } // Conservative settings for identity preservation
                      );
                      
                      finalResultUrl = fallbackResult.outputUrl;
                      
                      if (generationMeta?.mode === 'emotionmask') {
                        toast.success('Identity-safe generation completed!', { duration: 4000 });
                      }
                      
                      console.log('✅ Identity-safe fallback successful:', {
                        predictionId: fallbackResult.predictionId,
                        outputUrl: fallbackResult.outputUrl.substring(0, 100) + '...'
                      });
                      
                    } catch (fallbackError) {
                      console.error('❌ Identity-safe fallback also failed:', fallbackError);
                      finalResultUrl = retryUrl; // Use retry result as final fallback
                      
                      if (generationMeta?.mode === 'emotionmask') {
                        toast.warning('All identity preservation methods failed, using retry result', { duration: 4000 });
                      }
                    }
                  }
                }
                              } else {
                  finalResultUrl = resultUrl;
                }
              } else {
                finalResultUrl = resultUrl;
              }
            }
          } catch (ipaError) {
            finalResultUrl = resultUrl;
          }
      }

      // 🎨 FX POST-PROCESSING - Apply visual effects based on generation mode
      if (finalResultUrl && generationMeta?.mode) {
        try {
          let fxProcessedUrl = finalResultUrl;
          
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
            
            fxProcessedUrl = await applyNeoTokyoGlitch(finalResultUrl, fxOptions);
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
          
          // Apply Emotion Mask FX (subtle enhancement)
          else if (generationMeta.mode === 'emotionmask' && selectedEmotionMaskPreset) {
            console.log('🎭 Applying Emotion Mask FX...');
            const { applyEmotionMaskFX } = await import('../hooks/useEmotionMask');
            
            const fxOptions = {
              enableCinematicLighting: true,
              enableSkinEnhancement: true,
              enableExpressionBoost: true,
              lightingIntensity: 0.6,
              skinSmoothing: 0.4,
              expressionIntensity: 0.7
            };
            
            fxProcessedUrl = await applyEmotionMaskFX(finalResultUrl, fxOptions);
            console.log('✅ Emotion Mask FX applied successfully');
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
        
        await userMediaService.saveMedia(mediaToSave, { shareToFeed: true });
        console.log('✅ [Media] Saved successfully to profile and feed');
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
                allowRemix: false,
                tags: [],
                metadata: { quality: 'high', generationTime: 0, modelVersion: 'pending' }
              }
              // Don't dispatch userMediaUpdated during generation - it clears the composer!
              // The profile will refresh when the actual save completes
            }
          } catch {}
          try {
            const saved = await saveMedia({
              resultUrl: finalResultUrl, // Use final result (original or retry)
              userId,
              presetKey: selectedPreset ?? null,
              sourcePublicId: sourceUrl ? sourceUrl.split('/').pop()?.split('.')[0] || '' : null,
              allowRemix: false,
              shareNow: !!shareToFeed,
              mediaTypeHint: 'image',
            })
            console.log('✅ saveMedia ok:', saved)
            // Refresh both feed and user profile
            setTimeout(() => window.dispatchEvent(new CustomEvent('refreshFeed')), 800)
            // DON'T dispatch userMediaUpdated here - it clears the composer!
            // The composer should stay open so user can see their result
          } catch (e:any) {
            console.error('❌ saveMedia failed:', e)
            notifyError({ title: 'Something went wrong', message: e?.message || 'Failed to save media' })
            try {
              if (userId) {
                const removeId = undefined // not tracked precisely for images; grid will refresh shortly
              }
            } catch {}
          }
          endGeneration(genId);
          setNavGenerating(false);
          
          // Clear composer after a delay so user can see their result
          setTimeout(() => {
            console.log('🧹 Clearing composer after generation completion');
            handleClearComposerState();
          }, 3000); // 3 seconds delay
          
          return
        }

        // First, create an asset record (skip for Neo Tokyo Glitch and Ghibli Reaction since we use save-media directly)
        let assetId: string | null = null;
        
        if (composerState.mode !== 'neotokyoglitch' && composerState.mode !== 'ghiblireact') {
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

          // Handle different generation modes
          if (composerState.mode === 'emotionmask') {
            console.log('🎭 Emotion Mask mode - updating asset with final result');
            
            // For Emotion Mask, we need to update the asset with the final generated image
            if (allResultUrls.length > 0 && assetId) {
              const updateRes = await authenticatedFetch('/.netlify/functions/update-asset-result', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  assetId: assetId, // Use the asset ID from create-asset
                  finalUrl: allResultUrls[0], // The generated image URL from AIML API
                  status: 'ready', // Mark as ready
                  prompt: effectivePrompt,
                  meta: {
                    mode: 'emotionmask',
                    presetId: selectedPreset,
                    runId: genId
                  }
              })
            });
            
              const updateText = await updateRes.text();
              let updateBody: any = {};
              try { updateBody = JSON.parse(updateText); } catch {}
              
              if (updateRes.ok && updateBody?.ok) {
                console.log('✅ Emotion Mask asset updated successfully:', updateBody);
                
                // Refresh user media to show the new image
              setTimeout(() => window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
                  detail: { count: 1, runId: genId } 
              })), 800);
            } else {
                console.error(`❌ Emotion Mask asset update failed:`, updateRes.status, updateBody || updateText);
                notifyError({ title: 'Update failed', message: updateBody?.error || 'Failed to update Emotion Mask asset' });
              }
            } else {
              console.warn('⚠️ Cannot update Emotion Mask asset: missing result URL or asset ID');
            }
          } else if (composerState.mode === 'ghiblireact') {
            console.log(`🎭 ${composerState.mode} mode - calling save-media for complete user profile linking`);
            
            // For Ghibli Reaction and Neo Tokyo Glitch, we need to call save-media
            // to properly link the generated media to the user profile with all features
            if (allResultUrls.length > 0) {
              console.log(`✅ ${composerState.mode} generation completed - calling save-media for complete processing`);
              
              try {
                // Call save-media to properly link the generated media to the user profile
                const saveRes = await authenticatedFetch('/.netlify/functions/save-media', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': genId // prevents double-saves on retries
                  },
                  body: JSON.stringify({
                    finalUrl: allResultUrls[0], // The generated image URL from Replicate
                    media_type: 'image',
                    preset_key: composerState.mode === 'neotokyoglitch' ? 'neotokyoglitch' : selectedPreset,
                    prompt: effectivePrompt,
                    source_public_id: sourceUrl ? sourceUrl.split('/').pop()?.split('.')[0] || '' : '',
                    meta: {
                      mode: composerState.mode,
                      presetId: selectedPreset,
                      runId: genId,
                      userId,
                      shareNow: !!shareToFeed,
                      generationType: 'replicate',
                      model: generationMeta?.model || 'replicate/stability-ai/stable-diffusion-img2img',
                      variation_index: 0,
                      totalVariations: allResultUrls.length
                    }
                  })
                });
                
                const saveText = await saveRes.text();
                let saveBody: any = {};
                try { saveBody = JSON.parse(saveText); } catch {}
                
                if (saveRes.ok && saveBody?.success) {
                  console.log(`✅ ${composerState.mode} media saved to user profile successfully:`, saveBody);
                  
                  // Refresh user media to show the new image
              setTimeout(() => window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
                detail: { count: 1, runId: genId } 
                  })), 800);
            } else {
                  console.error(`❌ ${composerState.mode} media save failed:`, saveRes.status, saveBody || saveText);
                  notifyError({ title: 'Save failed', message: saveBody?.error || `Failed to save ${composerState.mode} media to profile` });
                }
              } catch (saveError) {
                console.error(`❌ ${composerState.mode} save-media call failed:`, saveError);
                notifyError({ title: 'Save failed', message: `Failed to save ${composerState.mode} media to profile` });
              }
            } else {
              console.warn(`⚠️ Cannot save ${composerState.mode} media: missing result URL`);
            }
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
          } else if (composerState.mode === 'preset' || composerState.mode === 'custom') {
            console.log(`🎭 ${composerState.mode} mode - checking variation count: ${allResultUrls.length}`);
            
            if (allResultUrls.length === 1) {
              // Single variation - update the asset directly
              console.log(`🎭 ${composerState.mode} mode - single variation, updating asset`);
              if (allResultUrls.length > 0 && assetId) {
                const updateRes = await authenticatedFetch('/.netlify/functions/update-asset-result', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    assetId: assetId, // Use the asset ID from create-asset
                    finalUrl: allResultUrls[0], // The generated image URL from AIML API
                    status: 'ready', // Mark as ready
                    prompt: effectivePrompt,
                    meta: {
                      mode: composerState.mode,
                      presetId: selectedPreset,
                      runId: genId
                    }
                  })
                });
                
                const updateText = await updateRes.text();
                let updateBody: any = {};
                try { updateBody = JSON.parse(updateText); } catch {}
                
                if (updateRes.ok && updateBody?.ok) {
                  console.log(`✅ ${composerState.mode} asset updated successfully:`, updateBody);
                  
                  // Refresh user media to show the new image
                  setTimeout(() => window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
                    detail: { count: 1, runId: genId } 
                  })), 800);
                } else {
                  console.error(`❌ ${composerState.mode} asset update failed:`, updateRes.status, updateBody || updateText);
                  notifyError({ title: 'Update failed', message: updateBody?.error || `Failed to update ${composerState.mode} asset` });
                }
              } else {
                console.warn(`⚠️ Cannot update ${composerState.mode} asset: missing result URL or asset ID`);
              }
            } else if (allResultUrls.length > 1) {
              // Multiple variations - use unified save-media
              console.log(`🎭 ${composerState.mode} mode - multiple variations (${allResultUrls.length}), using unified save-media`);
              
              try {
              const saveRes = await authenticatedFetch('/.netlify/functions/save-media', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'X-Idempotency-Key': genId // prevents double-saves on retries
                },
                body: JSON.stringify({
                  variations: variations.map((url, index) => ({
                    image_url: url,
                    prompt: prompt?.trim() || 'AI Generated Content',
                    media_type: 'image',
                    meta: {
                      variation_index: index,
                      mode: composerState.mode,
                      run_id: genId
                    }
                  })),
                  runId: genId
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
                          preset_key: selectedPreset,
                          prompt: effectivePrompt,
                          source_public_id: sourceUrl ? sourceUrl.split('/').pop()?.split('.')[0] || '' : '',
                          meta: {
                            mode: composerState.mode,
                            presetId: selectedPreset,
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
                    notifyError({ title: 'Save failed', message: 'Failed to save any variations' });
                  }
                }
              } catch (batchSaveError) {
                console.error(`❌ ${composerState.mode} batch save error:`, batchSaveError);
                notifyError({ title: 'Save failed', message: 'Failed to save variations' });
              }
            } else {
              console.warn(`⚠️ ${composerState.mode} mode - no result URLs to save`);
            }
          } else {
            console.log(`🎭 ${composerState.mode} mode - no additional save needed`);
          }
        } catch (error) {
          console.error(`❌ Save error:`, error);
          notifyError({ title: 'Save failed', message: error instanceof Error ? error.message : 'Unknown error' });
          
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
        notifyError({ title: 'Something went wrong', message: 'Failed to save generated media' });
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
      
      // Handle V2V processing status
      if (isVideoPreview) {
        if (body.status === 'processing' || body.status === 'queued') {
          notifyQueue({ title: 'Added to queue', message: 'We will start processing shortly.' });
          // TODO: Implement polling for V2V status updates
          console.log('🎬 V2V job started:', body.job_id || 'unknown');
        } else if (body.status === 'completed') {
          notifyReady({ title: 'Your media is ready', message: 'Tap to open' });
          // Clear all options after successful generation
          clearAllOptionsAfterGeneration();
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
        if (e.message.includes('cloud_name is disabled') || e.message.includes('cloud_name')) {
          errorMessage = 'Upload service temporarily unavailable';
        } else if (e.message.includes('Invalid api_key') || e.message.includes('api_key')) {
          errorMessage = 'Upload service temporarily unavailable';
        } else if (e.message.includes('timeout')) {
          errorMessage = 'Upload took too long, please try again';
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
      
      notifyError({ title: 'Error! Please try again', message: errorMessage });
      
      // Clear all options after generation failure
      clearAllOptionsAfterGeneration();
      
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
      // Get current profile settings
      const { shareToFeed } = await getUserProfileSettings() // allowRemix removed
      
      // Enforce server-side quota and generate via aimlApi
      // Use new uploadSource service - never fetch blob URLs
      const uploadResult = await uploadSourceToCloudinary({
        file: selectedFile,
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
        allow_remix: false, // Remix functionality removed - focus on personal creativity
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
      const creditsNeeded = 1; // Single generation only
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
      
      // 🧪 DEBUG: Log complete payload before second aimlApi call
      console.log('🧪 DEBUG: Second aimlApi payload:', {
        prompt: body.prompt || 'default',
        image_url: body.image_url || body.init_image,
        model: body.model || 'default',
        strength: body.strength || 'default',
        guidance_scale: body.guidance_scale || 'default',
        cfg_scale: body.cfg_scale || 'default',
        denoising_strength: body.denoising_strength || 'default',
        full_payload: body
      });

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
        
        // Clear all mode selections after successful generation (per architecture)
        clearAllOptionsAfterGeneration();
      }
      
      // 💰 Finalize credits (commit) after successful generation
      try {
        console.log('💰 Alt path: Finalizing credits (commit)...');
        const finalizeResponse = await authenticatedFetch('/.netlify/functions/credits-finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_id: creditsResult.request_id,
            disposition: 'commit'
          })
        });
        
        if (finalizeResponse.ok) {
          const finalizeResult = await finalizeResponse.json();
          console.log('✅ Alt path: Credits finalized successfully:', finalizeResult);
        } else {
          console.error('❌ Alt path: Credits finalization failed:', finalizeResponse.status);
          // Don't throw here - generation succeeded, just log the credit issue
        }
      } catch (finalizeError) {
        console.error('❌ Alt path: Credits finalization error:', finalizeError);
        // Don't throw here - generation succeeded, just log the credit issue
      }
      
      // Optionally refresh quota
      try {
        const qRes = await authenticatedFetch('/.netlify/functions/getQuota')
        if (qRes.ok) setQuota(await qRes.json())
      } catch {}
    } catch (e) {
      console.error('Generate error', e)
      
      // 💰 Refund credits if generation failed
      if (creditsResult?.request_id) {
        try {
          console.log('💰 Alt path: Refunding credits due to generation failure...');
          const refundResponse = await authenticatedFetch('/.netlify/functions/credits-finalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              request_id: creditsResult.request_id,
              disposition: 'refund'
            })
          });
          
          if (refundResponse.ok) {
            const refundResult = await refundResponse.json();
            console.log('✅ Alt path: Credits refunded successfully:', refundResult);
          } else {
            console.error('❌ Alt path: Credits refund failed:', refundResponse.status);
          }
        } catch (refundError) {
          console.error('❌ Alt path: Credits refund error:', refundError);
        }
      }
      
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
      selectedPresetId: presetName,
      status: 'idle',
      error: null,
      runOnOpen: false
    }))
    
    // Set the selected preset in the store
    setSelectedPreset(presetName)
    console.log('✅ Preset set in store:', presetName)
    
    // Check if we can auto-generate
    if (!selectedFile) {
      console.log('❌ No file selected, cannot generate with preset')
      notifyError({ title: 'Add an image first', message: `Select an image to use ${presetName}` })
      return
    }
    
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to auth')
      navigate('/auth')
      return
    }
    
    try {
      // Check Cloudinary signer
      const jwt = await authService.getToken()
      if (!jwt) {
        console.log('❌ Not authenticated, cannot generate with preset')
        return
      }
      
      // Test Cloudinary signer
      const signRes = await authenticatedFetch('/.netlify/functions/cloudinary-sign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ folder: 'stefna/sources' })
      })
      
      if (!signRes.ok) {
        console.log('❌ Cloudinary signer failed, cannot generate with preset')
        return
      }
      
      const sig = await signRes.json()
      if (!sig.cloudName) {
        console.log('❌ Cloudinary misconfigured, cannot generate with preset')
        return
      }
      
      // All checks passed - auto-generate with preset
      console.log('🚀 Auto-generating with preset:', presetName)
      await dispatchGenerate('preset', {
        presetId: presetName,
        presetData: PRESETS[presetName]
      })
      
    } catch (error) {
      console.log('❌ Auto-run check failed:', error)
      notifyError({ title: 'Media failed', message: 'Try again' })
      // Clear all options after preset generation failure
      clearAllOptionsAfterGeneration();
      // Don't proceed with generation if Cloudinary signer fails
      return
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
      selectedPresetId: presetName,
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
      notifyError({ title: 'Custom prompt required', message: 'Please enter a prompt to generate' })
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
    }, 500)
  }
  
  // 2. PRESET MODE GENERATION - Only uses selected preset
  const generatePreset = async () => {
    console.log('🎯 PRESET MODE: Generating with preset only')
    
    if (!selectedPreset) {
      notifyError({ title: 'Preset required', message: 'Please select a preset first' })
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
    }, 500)
  }
  

  
  // generateRemix function removed - no more remix functionality

  // 5. EMOTION MASK MODE GENERATION - Uses selected emotional variant
  const generateEmotionMask = async () => {
    console.log('🎭 EMOTION MASK MODE: Generating emotional truth portrait')
    
    if (!selectedEmotionMaskPreset) {
      notifyError({ title: 'Emotion Mask preset required', message: 'Please select an emotional variant first' })
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
    }, 500)
  }

  // Mode handlers for one-click generation
          const handleModeClick = async (mode: 'time_machine'|'restore', option: string) => {
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
      
      // Always prefer the File object - never fall back to blob URL
      if (!selectedFile) {
        notifyError({ title: 'File required', message: 'Please select a file to continue' });
        setNavGenerating(false);
        return;
      }
      const source = selectedFile;
      const { url: remoteUrl, resource_type } = await prepareSourceAsset(source)
      if (resource_type !== 'image') { 
        notifyError({ title: 'Photo required', message: 'Time Machine / Restore need a photo' })
        setNavGenerating(false)
        return
      }

      // Set UI state
      setSelectedMode(mode)
      
      // Use bulletproof handlers
      if (mode === 'time_machine') {
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
    
    const r = await authenticatedFetch('/.netlify/functions/recordShare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        if (typeof notifySuccess === 'function') {
        notifySuccess({ title: 'Prompt enhanced!', message: 'Your prompt has been enhanced with AI' })
        }
      }
    } catch (error) {
      console.error('❌ Magic Wand enhancement failed:', error)
      // Show error feedback but keep original prompt - with safety check
      if (typeof notifyError === 'function') {
      notifyError({ title: 'Enhancement failed', message: 'Could not enhance prompt, keeping original' })
      }
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
      
      // Call AIML API for text enhancement (free)
      const enhancementPayload = {
        action: 'enhance_prompt',
        prompt: originalPrompt,
        enhancement_type: 'artistic_photography'
      };
      
      // 🧪 DEBUG: Log prompt enhancement payload
      console.log('🧪 DEBUG: Prompt enhancement payload:', enhancementPayload);
      
      const response = await authenticatedFetch('/.netlify/functions/aimlApi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enhancementPayload)
      })

      if (!response.ok) {
        throw new Error(`AIML API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.enhanced_prompt) {
        return data.enhanced_prompt
      } else {
        // Fallback enhancement if AIML doesn't return expected format
        return enhancePromptLocally(originalPrompt)
      }
    } catch (error) {
      console.error('❌ AIML API enhancement failed, using local fallback:', error)
      // Use local enhancement as fallback
      return enhancePromptLocally(originalPrompt)
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
              onClick={() => setProfileDropdownOpen(prev => !prev)}
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
              <div className="absolute right-0 top-full mt-2 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-white/20 min-w-[120px]">
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
              {/* Media loading skeleton - 3 columns */}
              <div className="grid grid-cols-3 gap-1 w-full">
                {[...Array(12)].map((_, index) => (
                  <div key={index} className="aspect-[4/3] bg-gradient-to-br from-white/5 to-white/10 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : feed.length > 0 ? (
            <>
              <SafeMasonryGrid 
                feed={feed}
                handleMediaClick={handleMediaClick}
                // handleRemix removed
              />
              

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
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm navbar-stable">
          {/* Close button */}
          <button type="button" onClick={closeComposer} className="absolute top-4 right-4 z-50 pointer-events-auto text-white/80 hover:text-white transition-colors bg-black/60 hover:bg-black/80 rounded-full p-2 backdrop-blur-sm" aria-label="Close">
            <X size={20} />
          </button>
          
          {/* Remix mode UI removed - focus on personal creativity */}
          
          {/* Media preview area - centered above prompt */}
          <div className="absolute inset-0 flex items-center justify-center pb-32">
            <div className="relative w-full max-w-2xl px-6">
              <div ref={containerRef} className="w-full flex items-center justify-center">
                {isVideoPreview ? (
                  <video ref={(el) => (mediaRef.current = el)} src={previewUrl || ''} className="max-w-full max-h-[60vh] object-contain" controls onLoadedMetadata={measure} onLoadedData={measure} referrerPolicy="no-referrer" />
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
                )}
                

              </div>
            </div>
          </div>

          {/* Bottom composer bar - compact, horizontally 70% */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-300 w-[70%] min-w-[500px] max-w-[800px]">
            <div className="bg-black border border-[#333333] rounded-2xl px-4 py-3 shadow-2xl transition-all duration-300">
              

              

              {/* Prompt Input - ALWAYS VISIBLE for all modes */}
              <div className="mb-2">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={composerState.mode === 'custom' 
                      ? "Describe your vision... (click ✨ to enhance your prompt)"
                      : "Custom prompt (optional) - will be combined with selected preset"
                    }
                    className="w-full px-3 py-2 pr-10 bg-white/5 border border-[#333333] rounded-xl text-white placeholder-white/40 resize-none focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors h-20 text-sm"
                    disabled={isGenerating}
                  />
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
                          // Close emotion mask dropdown when presets are clicked
                          setEmotionMaskDropdownOpen(false)
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
                          setEmotionMaskDropdownOpen((v) => !v)
                        } else {
                          // Switch to Emotion Mask mode AND show dropdown immediately
                          setComposerState(s => ({ ...s, mode: 'emotionmask' }))
                          setSelectedEmotionMaskPreset(null)
                          setEmotionMaskDropdownOpen(true) // Show dropdown immediately
                        }
                      }}
                      className={
                        !isAuthenticated
                          ? 'px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-white/5 text-white/50 border-white/10 cursor-not-allowed'
                          : composerState.mode === 'emotionmask'
                          ? 'px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-white text-black'
                          : 'px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-white/10 text-white border-white/20 hover:bg-white/15'
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
                          value={selectedEmotionMaskPreset}
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
                                  notifyError({ title: 'Media failed', message: 'Try again' })
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
                      
                      {/* Identity Lock Toggle - show when in Emotion Mask mode */}
                      {composerState.mode === 'emotionmask' && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            id="identity-lock-emotion"
                            checked={identityLock}
                            onChange={(e) => setIdentityLock(e.target.checked)}
                            className="rounded border-gray-300"
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
                          setGhibliReactionDropdownOpen((v) => !v)
                        } else {
                          // Switch to Ghibli Reaction mode AND show dropdown immediately
                          setComposerState(s => ({ ...s, mode: 'ghiblireact' }))
                          setSelectedGhibliReactionPreset(null)
                          setGhibliReactionDropdownOpen(true) // Show dropdown immediately
                        }
                      }}
                      className={
                        !isAuthenticated
                          ? 'px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-white/5 text-white/50 border-white/10 cursor-not-allowed'
                          : composerState.mode === 'ghiblireact'
                          ? 'px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-white text-black'
                          : 'px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-white/10 text-white border-white/20 hover:bg-white/15'
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
                                notifyError({ title: 'Media failed', message: 'Try again' })
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
                          setNeoTokyoGlitchDropdownOpen((v) => !v)
                        } else {
                          // Check if user has agreed to disclaimer
                          const hasAgreed = localStorage.getItem('neoTokyoGlitchAgreed') === 'true'
                          
                          if (!hasAgreed) {
                            // Show disclaimer popup first
                            setShowNeoTokyoGlitchDisclaimer(true)
                          } else {
                            // User has agreed - switch to Neo Tokyo Glitch mode AND show dropdown immediately
                            setComposerState(s => ({ ...s, mode: 'neotokyoglitch' }))
                            setSelectedNeoTokyoGlitchPreset(null)
                            setNeoTokyoGlitchDropdownOpen(true) // Show dropdown immediately
                          }
                        }
                      }}
                      className={
                        !isAuthenticated
                          ? 'px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-white/5 text-white/50 border-white/10 cursor-not-allowed'
                          : composerState.mode === 'neotokyoglitch'
                          ? 'px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-white text-black'
                          : 'px-3 py-1.5 rounded-2xl text-xs border transition-colors bg-white/10 text-white border-white/20 hover:bg-white/15'
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
                                notifyError({ title: 'Media failed', message: 'Try again' })
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
                                                     // Remix mode removed - focus on personal creativity
                      } else if (composerState.mode === 'emotionmask') {
                        // Emotion Mask mode - use Emotion Mask generation
                        console.log('🎭 Emotion Mask mode - calling generateEmotionMask')
                        await generateEmotionMask()
                      } else if (composerState.mode === 'ghiblireact') {
                        // Ghibli Reaction mode - use dispatchGenerate directly
                        console.log('🎭 Ghibli Reaction mode - calling dispatchGenerate')
                        await dispatchGenerate('ghiblireact', {
                          ghibliReactionPresetId: selectedGhibliReactionPreset
                        })
                      } else if (composerState.mode === 'neotokyoglitch') {
                        // Neo Tokyo Glitch mode - use dispatchGenerate directly
                        console.log('🎭 Neo Tokyo Glitch mode - calling dispatchGenerate')
                        await dispatchGenerate('neotokyoglitch', {
                          neoTokyoGlitchPresetId: selectedNeoTokyoGlitchPreset
                        })
                        } else {
                        // Fallback - determine mode and generate
                        if (selectedPreset) {
                        // Run preset generation
                          await dispatchGenerate('preset', {
                          presetId: selectedPreset,
                          presetData: PRESETS[selectedPreset],
                          promptOverride: prompt
                        })
                          // Clear composer after successful generation
                          setTimeout(() => {
                            clearAllOptionsAfterGeneration()
                          }, 500)
                      } else {
                        // Run custom generation
                          await dispatchGenerate('custom', {
                          promptOverride: prompt
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

      {/* Neo Tokyo Glitch Disclaimer Popup */}
      {showNeoTokyoGlitchDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          {/* Glitchy Background Overlay */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Animated scanlines */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/10 to-transparent animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            
            {/* Floating particles */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
            <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.7s' }}></div>
          </div>

          {/* Main Popup */}
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-pink-500/50 rounded-2xl p-8 max-w-lg mx-4 shadow-2xl backdrop-blur-md">
            {/* Enhanced Glitchy Border Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/30 via-cyan-500/30 via-purple-500/30 via-yellow-500/20 to-pink-500/30 animate-pulse"></div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            
            {/* Close Button */}
            <button
              onClick={() => setShowNeoTokyoGlitchDisclaimer(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="relative z-10">
              {/* Title with enhanced glitch effect */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-cyan-400 via-yellow-300 via-blue-400 to-purple-400 animate-pulse">
                  ⚠️ NEO TOKYO GLITCH DISCLAIMER
                </h2>
                {/* Additional neon glow effect */}
                <div className="absolute inset-0 blur-sm bg-gradient-to-r from-pink-500/50 via-cyan-500/50 via-yellow-400/50 via-blue-500/50 to-purple-500/50 rounded-lg"></div>
              </div>

              {/* Disclaimer text */}
              <div className="text-gray-300 text-sm leading-relaxed mb-8 space-y-3">
                <p>
                  This preset transforms you into a future self in a Neo Tokyo glitch — 
                  expect chaos, color, and surprises.
                </p>
                <p>
                  By proceeding, you acknowledge that:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-pink-300">
                  <li>Results may vary significantly from your original image</li>
                  <li>Identity features may be artistically transformed</li>
                  <li>This is for creative/entertainment purposes only</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem('neoTokyoGlitchAgreed', 'true')
                    setShowNeoTokyoGlitchDisclaimer(false)
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:via-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-pink-500/25 animate-pulse border border-pink-400/50"
                >
                  I AGREE - LET'S GET GLITCHY! ⚡
                </button>
                <button
                  onClick={() => setShowNeoTokyoGlitchDisclaimer(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Job Status Display removed in favor of unified toasts */}

    </div>
  )
}

export default HomeNew


