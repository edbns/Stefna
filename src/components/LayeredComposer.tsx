import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus, FileText, ArrowUp, ChevronUp, ChevronDown, Wand2, Facebook as FacebookIcon, Youtube as YouTubeIcon } from 'lucide-react'
import { UnrealReflectionPicker } from './UnrealReflectionPicker'
import { ParallelSelfPicker } from './ParallelSelfPicker'
import { GhibliReactionPicker } from './GhibliReactionPicker'
import { CyberSirenPicker } from './CyberSirenPicker'
import { CombinedPresetPicker } from './CombinedPresetPicker'

// Custom TikTok icon since lucide-react doesn't have one
const TikTokIcon = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.36 6.36 0 00-1-.05A6.35 6.35 0 005 15.77a6.34 6.34 0 0011.14 4.16v-6.61a8.16 8.16 0 004.65 1.46v-3.44a4.85 4.85 0 01-1.2-.65z"/>
  </svg>
)

// Custom X (formerly Twitter) icon
const XIconCustom = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

// Custom Reddit icon
const RedditIcon = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
)

// Import all the preset constants and types
import { UNREAL_REFLECTION_PRESETS } from '../presets/unrealReflection'
import { PARALLEL_SELF_PRESETS } from '../presets/parallelSelf'
import { GHIBLI_REACTION_PRESETS } from '../presets/ghibliReact'
import { CYBER_SIREN_PRESETS } from '../presets/cyberSiren'
import { MediaUploadAgreement } from './MediaUploadAgreement'
import { resetComposerState, resetHiddenUploader } from './HomeNew'

interface LayeredComposerProps {
  // Core state
  previewUrl: string | null
  selectedFile: File | null
  isVideoPreview: boolean
  prompt: string
  setPrompt: (prompt: string) => void
  
  // Composer state
  composerState: {
    mode: string | null
    status: string
  }
  setComposerState: (state: any) => void
  
  // Mode selections
  selectedPreset: string | null
  selectedMode: string | null
  setSelectedMode: (mode: "presets" | null) => void
  
  // Dropdown states
  presetsOpen: boolean
  setPresetsOpen: (open: boolean) => void
  unrealReflectionDropdownOpen: boolean
  setUnrealReflectionDropdownOpen: (open: boolean) => void
  parallelSelfDropdownOpen: boolean
  setParallelSelfDropdownOpen: (open: boolean) => void
  ghibliReactionDropdownOpen: boolean
  setGhibliReactionDropdownOpen: (open: boolean) => void
  cyberSirenDropdownOpen: boolean
  setCyberSirenDropdownOpen: (open: boolean) => void
  
  // Preset selections
  selectedUnrealReflectionPreset: string | null
  setSelectedUnrealReflectionPreset: (preset: string | null) => void
  selectedParallelSelfPreset: string | null
  setSelectedParallelSelfPreset: (preset: string | null) => void
  selectedGhibliReactionPreset: string | null
  setSelectedGhibliReactionPreset: (preset: string | null) => void
  selectedCyberSirenPreset: string | null
  setSelectedCyberSirenPreset: (preset: string | null) => void
  
  // Combined presets (for mobile)
  combinedPresetsDropdownOpen: boolean
  setCombinedPresetsDropdownOpen: (open: boolean) => void
  selectedCombinedPreset: string | null
  setSelectedCombinedPreset: (preset: string | null) => void
  
  // Video states
  isUnrealReflectionVideoEnabled: boolean
  setIsUnrealReflectionVideoEnabled: (enabled: boolean) => void
  
  // Generation states
  isGenerating: boolean
  isEnhancing: boolean
  navGenerating: boolean
  setNavGenerating: (generating: boolean) => void
  
  // Preset data
  weeklyPresetNames: string[]
  availablePresets: any[]
  presetsLoading: boolean
  presetsError: string | null
  
  // Auth state
  isAuthenticated: boolean
  
  // Mobile state
  isMobile?: boolean
  
  // Collapsible state
  isExpanded?: boolean
  setIsExpanded?: (expanded: boolean) => void
  
  // Mobile upload handler
  onMobileUploadClick?: () => void
  
  // Handlers
  closeComposer: () => void
  checkAuthAndRedirect: () => boolean
  handlePresetClick: (preset: string) => void
  handleMagicWandEnhance: () => void
  handleSaveDraft: () => void
  dispatchGenerate: (kind: "preset" | "custom" | "unrealreflection" | "ghiblireact" | "cyber-siren" | "parallelself" | "storytime" | "edit", options?: any) => Promise<void>
  clearAllOptionsAfterGeneration: () => void
  closeAllDropdowns: () => void
  getPresetLabel: (preset: string, presets: any[]) => string
  handleAdditionalStoryImageUpload: (file: File, index: number) => void
  onFileSelect: (file: File) => void
  onClearFile: () => void
  
  // Media upload agreement
  showUploadAgreement: boolean
  userHasAgreed: boolean
  pendingFile: File | null
  onUploadAgreementAccept: () => void
  onUploadAgreementCancel: () => void
  onAgreementAccepted: () => void
  
  // Refs and measurements
  containerRef: React.RefObject<HTMLDivElement>
  mediaRef: React.RefObject<HTMLImageElement | HTMLVideoElement>
  measure: () => void
}

const LayeredComposer: React.FC<LayeredComposerProps> = ({
  previewUrl,
  selectedFile,
  isVideoPreview,
  prompt,
  setPrompt,
  composerState,
  setComposerState,
  selectedPreset,
  selectedMode,
  setSelectedMode,
  presetsOpen,
  setPresetsOpen,
  unrealReflectionDropdownOpen,
  setUnrealReflectionDropdownOpen,
  parallelSelfDropdownOpen,
  setParallelSelfDropdownOpen,
  ghibliReactionDropdownOpen,
  setGhibliReactionDropdownOpen,
  cyberSirenDropdownOpen,
  setCyberSirenDropdownOpen,
  selectedUnrealReflectionPreset,
  setSelectedUnrealReflectionPreset,
  selectedParallelSelfPreset,
  setSelectedParallelSelfPreset,
  selectedGhibliReactionPreset,
  setSelectedGhibliReactionPreset,
  selectedCyberSirenPreset,
  setSelectedCyberSirenPreset,
  combinedPresetsDropdownOpen,
  setCombinedPresetsDropdownOpen,
  selectedCombinedPreset,
  setSelectedCombinedPreset,
  isUnrealReflectionVideoEnabled,
  setIsUnrealReflectionVideoEnabled,
  isGenerating,
  isEnhancing,
  navGenerating,
  setNavGenerating,
  weeklyPresetNames,
  availablePresets,
  presetsLoading,
  presetsError,
  isAuthenticated,
  isMobile,
  isExpanded = false,
  setIsExpanded,
  onMobileUploadClick,
  closeComposer,
  checkAuthAndRedirect,
  handlePresetClick,
  handleMagicWandEnhance,
  handleSaveDraft,
  dispatchGenerate,
  clearAllOptionsAfterGeneration,
  closeAllDropdowns,
  getPresetLabel,
  handleAdditionalStoryImageUpload,
  onFileSelect,
  onClearFile,
  showUploadAgreement,
  userHasAgreed,
  pendingFile,
  onUploadAgreementAccept,
  onUploadAgreementCancel,
  onAgreementAccepted,
  containerRef,
  mediaRef,
  measure
}) => {
  const navigate = useNavigate()
  
  // Track keyboard visibility for smart media resizing
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  
  // Detect keyboard open/close
  useEffect(() => {
    if (!isMobile) return
    
    const handleResize = () => {
      // On mobile, when keyboard opens, viewport height decreases significantly
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const screenHeight = window.screen.height
      
      // If viewport is significantly smaller than screen, keyboard is likely open
      const keyboardOpen = viewportHeight < screenHeight * 0.75
      setIsKeyboardVisible(keyboardOpen)
    }
    
    // Use visualViewport API if available (better for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
    } else {
      window.addEventListener('resize', handleResize)
    }
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
      } else {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [isMobile])
  
  // Calculate smart media height based on current mode and keyboard state
  const getSmartMediaHeight = () => {
    if (!isMobile) return 'max-h-96'
    
    // Keyboard is open - very small but visible
    if (isKeyboardVisible) {
      return 'clamp(100px, 12vh, 120px)'
    }
    
    // "Get These Looks" mode - smaller to show presets
    if (composerState.mode === 'combined-presets') {
      return 'clamp(140px, 16vh, 170px)'
    }
    
    // "Your Prompt" mode - BIG to showcase the photo
    if (composerState.mode === 'edit' || composerState.mode === 'custom') {
      return 'clamp(200px, 26vh, 260px)'
    }
    
    // Default
    return 'clamp(200px, 26vh, 260px)'
  }
  
  // Calculate smart media top position - always at top
  const getSmartMediaPosition = () => {
    if (!isMobile) return 'clamp(64px, 8vh, 72px)'
    
    // Always keep at top
    return 'clamp(64px, 8vh, 72px)'
  }
  
  // Calculate smart button position (only used for "Get These Looks" mode with top positioning)
  const getSmartButtonPosition = () => {
    // Get These Looks mode - position from top to make room for presets
    return 'clamp(230px, 28vh, 270px)'
  }
  
  // Calculate smart presets position (below buttons in "Get These Looks" mode)
  const getSmartPresetsPosition = () => {
    if (!isMobile) return 'clamp(345px, 40vh, 420px)'
    
    // Position below buttons in Get These Looks mode
    return 'clamp(280px, 34vh, 320px)'
  }
  
  // Comprehensive state reset function
  const resetComposerToDefault = useCallback(() => {
    console.log('🔄 Resetting composer to default state')
    
    // Reset composer mode to custom (default)
    setComposerState((s: any) => ({ ...s, mode: 'custom', status: 'idle' }))
    
    // Clear all selections
    setSelectedMode(null)
    setSelectedUnrealReflectionPreset(null)
    setSelectedParallelSelfPreset(null)
    setSelectedGhibliReactionPreset(null)
    setSelectedCyberSirenPreset(null)
    setSelectedCombinedPreset(null)
    
    // Close all dropdowns
    setPresetsOpen(false)
    setUnrealReflectionDropdownOpen(false)
    setParallelSelfDropdownOpen(false)
    setGhibliReactionDropdownOpen(false)
    setCyberSirenDropdownOpen(false)
    setCombinedPresetsDropdownOpen(false)
    
    // Clear prompt
    setPrompt('')
    
    // Reset video toggle
    setIsUnrealReflectionVideoEnabled(false)
    
    // Clear file
    onClearFile()
    
    // Reset expansion state (mobile)
    if (setIsExpanded) {
      setIsExpanded(false)
    }
    
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
    
    console.log('✅ Composer reset complete')
  }, [
    setComposerState,
    setSelectedMode,
    setSelectedUnrealReflectionPreset,
    setSelectedParallelSelfPreset,
    setSelectedGhibliReactionPreset,
    setSelectedCyberSirenPreset,
    setSelectedCombinedPreset,
    setPresetsOpen,
    setUnrealReflectionDropdownOpen,
    setParallelSelfDropdownOpen,
    setGhibliReactionDropdownOpen,
    setCyberSirenDropdownOpen,
    setCombinedPresetsDropdownOpen,
    setPrompt,
    setIsUnrealReflectionVideoEnabled,
    onClearFile,
    setIsExpanded
  ])
  
  // Add event listeners for composer state management
  useEffect(() => {
    const handleClearComposerState = () => {
      console.log('🧹 LayeredComposer: Clear composer state event received')
      resetComposerToDefault()
    }

    const handleResetHiddenUploader = () => {
      console.log('🔄 LayeredComposer: Reset hidden uploader event received')
      // This is handled by the HiddenUploader component itself
    }

    window.addEventListener('clear-composer-state', handleClearComposerState)
    window.addEventListener('reset-hidden-uploader', handleResetHiddenUploader)

    return () => {
      window.removeEventListener('clear-composer-state', handleClearComposerState)
      window.removeEventListener('reset-hidden-uploader', handleResetHiddenUploader)
    }
  }, [resetComposerToDefault])
  
  // Reset composer on route/navigation changes (mobile only)
  useEffect(() => {
    if (!isMobile) return
    
    const handleNavigation = () => {
      console.log('🧭 Navigation detected, resetting composer')
      resetComposerToDefault()
    }
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleNavigation)
    
    // Listen for custom navigation events
    window.addEventListener('composer-reset', handleNavigation)
    
    return () => {
      window.removeEventListener('popstate', handleNavigation)
      window.removeEventListener('composer-reset', handleNavigation)
    }
  }, [isMobile, resetComposerToDefault])
  
  // Reset composer after generation completes
  useEffect(() => {
    if (!isMobile) return
    
    const handleGenerationDone = () => {
      console.log('✅ Generation done, resetting composer after delay')
      // Small delay to allow user to see the result
      setTimeout(() => {
        resetComposerToDefault()
      }, 1500)
    }
    
    // Listen for the generation:done event from generationEvents
    window.addEventListener('generation:done', handleGenerationDone)
    
    return () => {
      window.removeEventListener('generation:done', handleGenerationDone)
    }
  }, [isMobile, resetComposerToDefault])

  // Auto-expand when media is uploaded (mobile only)
  useEffect(() => {
    if (isMobile && selectedFile && setIsExpanded && !isExpanded) {
      console.log('📱 Auto-expanding composer for uploaded media')
      setIsExpanded(true)
    }
  }, [isMobile, selectedFile, setIsExpanded, isExpanded])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Check if click is outside any dropdown
      if (!target.closest('[data-dropdown]') && !target.closest('[data-unrealreflection-dropdown]') && !target.closest('[data-parallelself-dropdown]')) {
        // Close all dropdowns
        if (unrealReflectionDropdownOpen) {
          setUnrealReflectionDropdownOpen(false)
        }
        if (parallelSelfDropdownOpen) {
          setParallelSelfDropdownOpen(false)
        }
        if (ghibliReactionDropdownOpen) {
          setGhibliReactionDropdownOpen(false)
        }
        if (cyberSirenDropdownOpen) {
          setCyberSirenDropdownOpen(false)
        }
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside)
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [unrealReflectionDropdownOpen, parallelSelfDropdownOpen, ghibliReactionDropdownOpen, cyberSirenDropdownOpen])

  return (
    <div className={`fixed ${isMobile ? 'bottom-0 left-0 right-0' : 'bottom-2 left-1/2 transform -translate-x-1/2 w-[60%] min-w-[600px]'} z-[999999]`}>
      {/* Mobile: Media Preview Right Under Header (Always Visible When Uploaded) */}
      {isMobile && previewUrl && (
        <>
          {/* Inline media with close button overlay - dynamically positioned */}
          <div className="fixed left-1/2 transform -translate-x-1/2 z-[999990] flex justify-center px-4 transition-all duration-300" style={{ top: getSmartMediaPosition(), maxWidth: '100vw' }}>
            <div className="relative">
                {isVideoPreview ? (
                  <video 
                    ref={(el) => {
                      if (mediaRef.current) {
                        (mediaRef.current as any) = el
                      }
                    }} 
                    src={previewUrl} 
                  className="w-auto object-contain max-w-[90vw] shadow-2xl transition-all duration-300" 
                  style={{ maxHeight: getSmartMediaHeight() }}
                    controls 
                    onLoadedMetadata={measure} 
                    onLoadedData={measure} 
                  />
                ) : (
                  <img 
                    ref={(el) => {
                      if (mediaRef.current) {
                        (mediaRef.current as any) = el as HTMLImageElement
                      }
                    }} 
                    src={previewUrl} 
                    alt="Uploaded media" 
                  className="w-auto object-contain max-w-[90vw] shadow-2xl transition-all duration-300" 
                  style={{ maxHeight: getSmartMediaHeight() }}
                    onLoad={measure}
                    onError={(e) => {
                      console.error('❌ Image failed to load:', previewUrl, e)
                    }}
                  />
                )}
              
              {/* Close button - top right corner of media */}
                <button
                  onClick={() => {
                  console.log('🗑️ Mobile close button clicked - resetting composer')
                    
                    // Close the composer (this sets isComposerOpen to false in parent)
                    closeComposer()
                    
                  // Reset everything to default state
                  resetComposerToDefault()
                }}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-white text-black hover:bg-gray-200 shadow-lg"
                  aria-label="Remove media"
                >
                <X size={14} />
                </button>
            </div>
          </div>
          
          {/* Action buttons - positioned dynamically */}
          <div 
            className="fixed left-0 right-0 px-4 z-[999995] transition-all duration-300"
            style={
              composerState.mode === 'combined-presets' 
                ? { top: getSmartButtonPosition() } 
                : { bottom: 'clamp(195px, 27vh, 240px)' } // Position from bottom, right on top of prompt box
            }
          >
            <div className="flex gap-2">
              {/* Your Prompt Button - Active (white) when in edit mode, grey when not */}
              <button
                onClick={() => {
                  // Switch to edit mode to show prompt box (triggers big media view)
                  setComposerState((s: any) => ({ ...s, mode: 'edit' }))
                  closeAllDropdowns()
                }}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors shadow-lg ${
                  composerState.mode === 'edit' || composerState.mode === 'custom'
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'text-white hover:bg-[#444444]'
                }`}
                style={composerState.mode === 'edit' || composerState.mode === 'custom' ? {} : { backgroundColor: '#333333' }}
              >
                Your Prompt
              </button>
              
              {/* Get These Looks Button - Active (white) when in combined-presets mode, grey when not */}
              <button
                onClick={() => {
                  // Switch to combined presets mode (triggers compact media view)
                  setComposerState((s: any) => ({ ...s, mode: 'combined-presets' }))
                  closeAllDropdowns()
                  setCombinedPresetsDropdownOpen(true)
                }}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors shadow-lg ${
                  composerState.mode === 'combined-presets'
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'text-white hover:bg-[#444444]'
                }`}
                style={composerState.mode === 'combined-presets' ? {} : { backgroundColor: '#333333' }}
              >
                Get These Looks
              </button>
            </div>
          </div>
          
          {/* Inline Combined Presets - show directly under buttons with smart scrolling */}
          {composerState.mode === 'combined-presets' && combinedPresetsDropdownOpen && (
            <div className="fixed left-0 right-0 px-4 z-[999994] overflow-y-auto pb-4 bg-black/95 transition-all duration-300" style={{ top: getSmartPresetsPosition(), bottom: '0' }}>
              <CombinedPresetPicker
                value={selectedCombinedPreset || undefined}
                onChange={async (presetId, type) => {
                  setSelectedCombinedPreset(presetId)
                  setCombinedPresetsDropdownOpen(false)
                  
                  // Auto-generate based on preset type
                  if (type === 'unreal') {
                    await dispatchGenerate('unrealreflection', {
                      unrealReflectionPresetId: presetId
                    })
                  } else if (type === 'parallel') {
                    await dispatchGenerate('parallelself', {
                      parallelSelfPresetId: presetId
                    })
                  }
                }}
                disabled={!isAuthenticated}
              />
            </div>
          )}
        </>
      )}

      {/* Photo preview container - shows above composer when photo is uploaded (desktop only, mobile shows in expanded section) */}
      {previewUrl && composerState.mode !== 'custom' && !isMobile && (
        <div className="mb-4 flex justify-center">
          <div className={`rounded-2xl p-4 shadow-2xl shadow-black/20 inline-block border ${isMobile ? 'max-w-xs' : ''}`} style={{ backgroundColor: '#000000', borderColor: '#ffffff' }}>
            
            {/* Media display */}
            <div className="flex justify-center mb-3">
              {isVideoPreview ? (
                <video 
                  ref={(el) => {
                    if (mediaRef.current) {
                      (mediaRef.current as any) = el
                    }
                  }} 
                  src={previewUrl} 
                  className={`${isMobile ? 'max-h-48' : 'max-h-96'} w-auto object-contain`} 
                  controls 
                  onLoadedMetadata={measure} 
                  onLoadedData={measure} 
                />
              ) : (
                <img 
                  ref={(el) => {
                    if (mediaRef.current) {
                      (mediaRef.current as any) = el as HTMLImageElement
                    }
                  }} 
                  src={previewUrl} 
                  alt="Uploaded media" 
                  className={`${isMobile ? 'max-h-48' : 'max-h-96'} w-auto object-contain`} 
                  onLoad={measure}
                  onError={(e) => {
                    console.error('❌ Image failed to load:', previewUrl, e)
                  }}
                />
              )}
            </div>
            
            {/* Close button under the media */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  console.log('🗑️ Desktop close button clicked - resetting composer')
                  
                  // Close composer
                  closeComposer()
                  
                  // Reset everything to default state
                  resetComposerToDefault()
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-black text-white hover:bg-white/10"
                aria-label="Remove media"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Composer bar - always visible with all existing functionality */}
      <div className={`${isMobile ? 'flex-1 flex flex-col' : 'px-4 py-3'}`}>
        

        {/* Prompt Input - ALWAYS VISIBLE (Custom is default, Edit when photo uploaded) */}
        {(['custom', 'edit'].includes(composerState.mode || '') || !composerState.mode) && (
          <div>
            {isMobile ? (
              /* Mobile Layout: Buttons integrated within the textarea container */
              <div className="mx-2 mt-3">
                {/* OR divider text above prompt box - only show in custom mode (text-to-image) */}
                {composerState.mode === 'custom' && !selectedFile && (
                  <div className="text-center mb-2">
                    <p className="text-white/30 text-xs">
                      Generate from text   -OR- Upload a photo to edit
                    </p>
                  </div>
                )}
                
                {/* Textarea without buttons inside */}
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      console.log('🎯 Prompt input changed:', e.target.value);
                      setPrompt(e.target.value);
                    }}
                    onFocus={(e) => {
                      // Let browser handle keyboard naturally - don't force scroll
                      if (isMobile) {
                        console.log('📝 Textarea focused, keyboard will appear')
                      }
                    }}
                    placeholder={(() => {
                      switch (composerState.mode) {
                        case 'edit': 
                          return !selectedFile ? "Upload a photo first to start editing..." : "Describe your edit..."
                        case 'custom': 
                          return "Describe your image..."
                        default: 
                          return "Describe your image..."
                      }
                    })()}
                    className="w-full px-3 py-2 text-white placeholder-white/70 resize-none focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 text-xs rounded-xl border"
                    style={{ 
                      backgroundColor: '#000000', 
                      borderColor: '#ffffff',
                      height: 'clamp(110px, 15vh, 130px)',
                      paddingBottom: isMobile && !selectedFile ? '46px' : '8px'
                    }}
                    disabled={composerState.mode === 'edit' ? !selectedFile : false}
                    maxLength={4000}
                    data-testid="custom-prompt-input"
                  />
                  
                  {/* Upload Button - bottom-left inside prompt box (mobile only, when no file) */}
                  {isMobile && !selectedFile && onMobileUploadClick && (
                    <div className="absolute bottom-3 left-2">
                      <button
                        onClick={onMobileUploadClick}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg"
                        aria-label="Upload photo"
                      >
                        <Plus size={18} className="text-black" />
                      </button>
                    </div>
                  )}
                  
                  {/* Character count - bottom-right inside textarea */}
                  <div className="absolute bottom-2 right-2">
                    <span className="text-white/30 text-xs">{prompt.length}/3000</span>
                  </div>
                </div>
                
                {/* Action buttons below prompt box */}
                <div className="flex gap-2 mt-2 mb-4">
                  {/* Enhance Button */}
                  <button
                    onClick={handleMagicWandEnhance}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1 py-2.5 px-4 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-500 transition-colors shadow-lg disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    title={composerState.mode === 'edit' ? "Enhance studio prompt with AI (free)" : "Enhance prompt with AI (free)"}
                  >
                    {isEnhancing ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Enhancing...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={14} />
                        <span>Enhance</span>
                      </>
                    )}
                  </button>
                  
                  {/* Generate Button */}
                  <button
                    onClick={async () => {
                      if (!checkAuthAndRedirect()) return
                      
                      window.dispatchEvent(new CustomEvent('close-composer'));
                      
                      // dispatchGenerate will handle navigation, generation start event, and spinner state
                      try {
                        if (composerState.mode === 'custom') {
                          console.log('Custom mode - calling dispatchGenerate')
                          await dispatchGenerate('custom', {
                            customPrompt: prompt
                          })
                        } else if (composerState.mode === 'edit') {
                          console.log('✏️ Edit mode - calling dispatchGenerate')
                          await dispatchGenerate('edit', {
                            editPrompt: prompt
                          })
                        }
                      } catch (error) {
                        console.error('❌ Generation failed:', error)
                      } finally {
                        setTimeout(() => {
                          clearAllOptionsAfterGeneration()
                          onClearFile()
                        }, 1000)
                      }
                    }}
                    disabled={
                      (composerState.mode === 'edit' && (!selectedFile || !prompt.trim())) ||
                      (composerState.mode === 'custom' && !prompt.trim()) ||
                      (composerState.mode === 'cyber-siren' && !selectedCyberSirenPreset) ||
                      navGenerating
                    }
                    className={
                      (composerState.mode === 'edit' && (!selectedFile || !prompt.trim())) ||
                      (composerState.mode === 'custom' && !prompt.trim()) ||
                      (composerState.mode === 'cyber-siren' && !selectedCyberSirenPreset) ||
                      navGenerating
                    ? 'flex-1 py-2.5 px-4 bg-white/10 text-white/30 text-xs font-medium rounded-lg cursor-not-allowed shadow-lg flex items-center justify-center gap-2'
                    : 'flex-1 py-2.5 px-4 bg-white text-black text-xs font-medium rounded-lg hover:bg-white/90 transition-colors shadow-lg flex items-center justify-center gap-2'
                  }
                  aria-label="Generate"
                  title="Generate AI content"
                >
                  {navGenerating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUp size={14} />
                      <span>Generate</span>
                    </>
                  )}
                </button>
                </div>
              </div>
            ) : (
              /* Desktop Layout: Original layout */
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    console.log('🎯 Prompt input changed:', e.target.value);
                    setPrompt(e.target.value);
                  }}
                  placeholder={(() => {
                    switch (composerState.mode) {
                      case 'edit': 
                        return !selectedFile ? "Upload a photo first to start editing..." : "Describe your edit..."
                      case 'custom': 
                        return "Describe your image..."
                      default: 
                        return "Describe your image..."
                    }
                  })()}
                  className="w-full px-3 py-2 pr-10 text-white placeholder-white/70 resize-none focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 h-20 text-sm rounded-xl border"
                  style={{ backgroundColor: '#000000', borderColor: '#ffffff' }}
                  disabled={composerState.mode === 'edit' ? !selectedFile : false}
                  maxLength={4000}
                  data-testid="custom-prompt-input"
                />
                  
                  {/* Desktop: Enhance Button */}
                  <button
                    onClick={handleMagicWandEnhance}
                    disabled={isGenerating || !prompt.trim()}
                    className="absolute top-1 right-1 px-1.5 py-0.5 flex items-center justify-center text-purple-400 hover:text-purple-300 transition-colors disabled:text-white/30 disabled:cursor-not-allowed text-[11px] font-medium"
                    title={composerState.mode === 'edit' ? "Enhance studio prompt with AI (free)" : "Enhance prompt with AI (free)"}
                  >
                    {isEnhancing ? (
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Enhance</span>
                    )}
                  </button>
                
                {/* Desktop: Character count and Generate Button */}
                <div className="absolute bottom-3 right-2 flex items-center gap-1">
                  <span className="text-white/30 text-xs">{prompt.length}/3000</span>
                  
                  {/* Generate Button - inside prompt box */}
                  <button
                    onClick={async () => {
                      if (!checkAuthAndRedirect()) return
                      
                      window.dispatchEvent(new CustomEvent('close-composer'));
                      
                      // dispatchGenerate will handle navigation, generation start event, and spinner state
                      try {
                        if (composerState.mode === 'custom') {
                          console.log('Custom mode - calling dispatchGenerate')
                          await dispatchGenerate('custom', {
                            customPrompt: prompt
                          })
                        } else if (composerState.mode === 'edit') {
                          console.log('✏️ Edit mode - calling dispatchGenerate')
                          await dispatchGenerate('edit', {
                            editPrompt: prompt
                          })
                        }
                      } catch (error) {
                        console.error('❌ Generation failed:', error)
                      } finally {
                        setTimeout(() => {
                          clearAllOptionsAfterGeneration()
                          onClearFile()
                        }, 1000)
                      }
                    }}
                    disabled={
                      (composerState.mode === 'edit' && (!selectedFile || !prompt.trim())) ||
                      (composerState.mode === 'custom' && !prompt.trim()) ||
                      (composerState.mode === 'cyber-siren' && !selectedCyberSirenPreset) ||
                      navGenerating
                    }
                    className={
                      (composerState.mode === 'edit' && (!selectedFile || !prompt.trim())) ||
                      (composerState.mode === 'custom' && !prompt.trim()) ||
                      (composerState.mode === 'cyber-siren' && !selectedCyberSirenPreset) ||
                      navGenerating
                    ? 'w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-black border border-white/40 text-white/50 cursor-not-allowed'
                    : 'w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-white border border-white text-black hover:bg-white/90'
                  }
                  aria-label="Generate"
                  title="Generate AI content"
                >
                  {navGenerating ? (
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowUp size={12} />
                  )}
                </button>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Mobile Collapsible Section - REMOVED: No longer needed with new UX */}
        {false && isMobile && (
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>

            {/* Mode Buttons in Expanded Section */}
            <div className="flex items-center justify-center gap-2 flex-wrap px-4 pb-3 bg-black">
            
            {/* Photo Editing Mode Label and Upload Button - Same Row */}
          <div className="flex items-center gap-2">
              <div className="text-white text-xs font-medium">
                Photo Editing
              </div>
            
            <button
              onClick={() => {
                  if (!checkAuthAndRedirect()) return
                  
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement
                  const file = target.files?.[0]
                  if (file) {
                    console.log('📸 Photo selected:', file.name)
                    onFileSelect(file)
                      // Automatically switch to edit mode when photo is uploaded
                      setComposerState((s: any) => ({ ...s, mode: 'edit' }))
                  }
                }
                input.click()
              }}
                className="px-3 py-1.5 rounded-2xl text-xs font-medium transition-all duration-300 text-white flex items-center gap-2 hover:scale-105 upload"
              style={{ backgroundColor: '#000000' }}
              title="Upload a photo to get started"
            >
                <Plus size={16} />
                <span>Upload</span>
            </button>
                  </div>

            {/* Studio Button */}
            <div className="relative">
                <button
                  onClick={async () => {
                    if (!checkAuthAndRedirect()) return
                    
                    // Require photo upload first
                    if (!selectedFile) {
                      return
                    }
                    
                    if (composerState.mode === 'edit') {
                      closeAllDropdowns()
                    } else {
                      closeAllDropdowns()
                      setComposerState((s: any) => ({ ...s, mode: 'edit' }))
                      setSelectedMode('presets')
                    }
                  }}
                  className={
                    composerState.mode === 'edit'
                      ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black'
                      : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black hover:bg-white/90'
                  }
                  style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
                title={!selectedFile ? 'Upload a photo first to use Studio mode' : 'Switch to Studio mode'}
                >
                  Studio
                </button>
            </div>

            {/* Unreal Reflection™ Button */}
            <div className="relative">
                <button
                onClick={async () => {
                  if (!checkAuthAndRedirect()) return
                  
                  // Require photo upload first
                  if (!selectedFile) {
                    return
                  }
                  
                  if (composerState.mode === 'unrealreflection') {
                    closeAllDropdowns()
                        setUnrealReflectionDropdownOpen(!unrealReflectionDropdownOpen)
                  } else {
                    closeAllDropdowns()
                    setComposerState((s: any) => ({ ...s, mode: 'unrealreflection' }))
                    setSelectedMode('presets')
                    setSelectedUnrealReflectionPreset(null)
                    setUnrealReflectionDropdownOpen(true)
                  }
                }}
                className={
                  composerState.mode === 'unrealreflection'
                    ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black'
                    : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black hover:bg-white/90'
                }
                style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
                title={!selectedFile ? 'Upload a photo first to use Unreal Reflection mode' : 'Switch to Unreal Reflection mode'}
              >
                Unreal Reflection™
              </button>
              
              {/* Unreal Reflection™ presets dropdown */}
              {composerState.mode === 'unrealreflection' && unrealReflectionDropdownOpen && (
                <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[999999]" data-unrealreflection-dropdown>
                  <UnrealReflectionPicker
                    value={selectedUnrealReflectionPreset || undefined}
                    onVideoToggle={(enabled) => {
                      setIsUnrealReflectionVideoEnabled(enabled);
                      console.log('Video enabled for Unreal Reflection:', enabled);
                    }}
                    onChange={async (presetId) => {
                      setSelectedUnrealReflectionPreset(presetId || null)
                      setUnrealReflectionDropdownOpen(false)
                        
                      // Auto-generate when Unreal Reflection preset is selected
                      if (presetId && selectedFile && isAuthenticated) {
                        console.log('Auto-generating Unreal Reflection with preset:', presetId)
                        // dispatchGenerate will handle navigation and generation start event
                        try {
                          await dispatchGenerate('unrealreflection', {
                            unrealReflectionPresetId: presetId,
                            enableVideo: isUnrealReflectionVideoEnabled,
                            forVideo: isUnrealReflectionVideoEnabled
                          })
                        } catch (error) {
                          console.error('❌ Unreal Reflection auto-generation failed:', error)
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

            {/* Parallel Self™ Button */}
            <div className="relative">
                <button
                onClick={async () => {
                  if (!checkAuthAndRedirect()) return
                  
                  // Require photo upload first
                  if (!selectedFile) {
                    return
                  }
                  
                  if (composerState.mode === 'parallelself') {
                    closeAllDropdowns()
                    setParallelSelfDropdownOpen(!parallelSelfDropdownOpen)
                  } else {
                    closeAllDropdowns()
                    setComposerState((s: any) => ({ ...s, mode: 'parallelself' }))
                    setSelectedMode('presets')
                    setSelectedParallelSelfPreset(null)
                    setParallelSelfDropdownOpen(true)
                  }
                }}
                className={
                  composerState.mode === 'parallelself'
                    ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black'
                    : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black hover:bg-white/90'
                }
                style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
                title={!selectedFile ? 'Upload a photo first to use Parallel Self mode' : 'Switch to Parallel Self mode'}
              >
                Parallel Self™
              </button>
              
              {/* Parallel Self™ presets dropdown */}
              {composerState.mode === 'parallelself' && parallelSelfDropdownOpen && (
                <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[999999]" data-parallelself-dropdown>
                  <ParallelSelfPicker
                    value={selectedParallelSelfPreset || undefined}
                    onChange={async (presetId) => {
                      setSelectedParallelSelfPreset(presetId || null)
                      setParallelSelfDropdownOpen(false)
                        
                      // Auto-generate when Parallel Self preset is selected
                      if (presetId && selectedFile && isAuthenticated) {
                        console.log('Auto-generating Parallel Self with preset:', presetId)
                        // dispatchGenerate will handle navigation and generation start event
                        try {
                          await dispatchGenerate('parallelself', {
                            parallelSelfPresetId: presetId
                          })
                        } catch (error) {
                          console.error('❌ Parallel Self auto-generation failed:', error)
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
          </div>
        )}


        {/* Desktop Layout: Original single row */}
        {!isMobile && (
          /* Desktop Layout: Original single row */
          <div className="flex items-center justify-between gap-1 flex-wrap rounded-xl p-3 border" style={{ backgroundColor: '#000000', borderColor: '#ffffff' }}>
            {/* Left: Upload button and Mode buttons */}
            <div className="flex items-center gap-2">
              
              {/* Photo Editing Mode Label */}
              <div className="text-white text-xs font-medium px-2 py-1">
                Photo Editing Mode
                      </div>

              {/* Upload Photo Button - ALWAYS VISIBLE */}
              <div className="relative">
                      <button
                        onClick={() => {
                  if (!checkAuthAndRedirect()) return
                  
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement
                    const file = target.files?.[0]
                    if (file) {
                      console.log('📸 Photo selected:', file.name)
                      onFileSelect(file)
                      // Automatically switch to edit mode when photo is uploaded
                      setComposerState((s: any) => ({ ...s, mode: 'edit' }))
                    }
                  }
                  input.click()
                }}
                className="px-3 py-1.5 rounded-2xl text-xs font-medium transition-all duration-300 text-white flex items-center gap-2 hover:scale-105 upload"
                style={{ backgroundColor: '#000000' }}
                title="Upload a photo to get started"
              >
                <Plus size={16} />
                <span>Upload</span>
              </button>
            </div>

              {/* Custom Prompt button - HIDDEN (prompt box makes it clear) */}
              {false && (
            <div className="relative" data-custom-dropdown>
              <div className="relative group">
                <button
                onClick={async () => {
                  if (!checkAuthAndRedirect()) return
                  
                    if (composerState.mode === 'custom') {
                    closeAllDropdowns()
                  } else {
                    closeAllDropdowns()
                      setComposerState((s: any) => ({ ...s, mode: 'custom' }))
                    setSelectedMode('presets')
                      // Clear uploaded photo when switching to Custom mode (text-to-image)
                      onClearFile()
                  }
                }}
                className={
                    composerState.mode === 'custom'
                    ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black'
                    : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black hover:bg-white/90'
                }
                  data-testid="custom-button"
                  style={{ cursor: 'pointer' }}
              >
                  Custom
              </button>
                </div>
            </div>
              )}

              {/* Edit My Photo™ button - ALWAYS VISIBLE */}
            <div className="relative" data-edit-dropdown>
              <div className="relative group">
                <button
                onClick={async () => {
                  if (!checkAuthAndRedirect()) return
                  
                  // Require photo upload first
                  if (!selectedFile) {
                    return
                  }
                  
                    if (composerState.mode === 'edit') {
                    closeAllDropdowns()
                  } else {
                    closeAllDropdowns()
                      setComposerState((s: any) => ({ ...s, mode: 'edit' }))
                    setSelectedMode('presets')
                  }
                }}
                className={
                    composerState.mode === 'edit'
                    ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black'
                    : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black hover:bg-white/90'
                }
                style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
                  title={!selectedFile ? 'Upload a photo first to use Studio mode' : 'Switch to Studio mode'}
              >
                  Studio
              </button>
              
              {/* Custom tooltip */}
              {!selectedFile && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[999999]" style={{ backgroundColor: '#000000' }}>
                    Upload a photo first to use Studio mode
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#000000' }}></div>
                </div>
              )}
            </div>
            </div>

            {/* Combined Identity Presets Button - ALWAYS VISIBLE */}
            <div className="relative" data-combined-presets-dropdown>
              <div className="relative group">
                <button
                onClick={async () => {
                  if (!checkAuthAndRedirect()) return
                  
                  // Require photo upload first
                  if (!selectedFile) {
                    return
                  }
                  
                  if (composerState.mode === 'combined-presets' || composerState.mode === 'unrealreflection' || composerState.mode === 'parallelself') {
                    // Toggle dropdown when already in combined presets mode
                    closeAllDropdowns()
                    setCombinedPresetsDropdownOpen(!combinedPresetsDropdownOpen)
                  } else {
                    closeAllDropdowns()
                    setComposerState((s: any) => ({ ...s, mode: 'combined-presets' }))
                    setSelectedMode('presets')
                    setCombinedPresetsDropdownOpen(true)
                  }
                }}
                className={
                  (composerState.mode === 'combined-presets' || composerState.mode === 'unrealreflection' || composerState.mode === 'parallelself')
                    ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black'
                    : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black hover:bg-white/90'
                }
                style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
                title={!selectedFile ? 'Upload a photo first to use Identity Presets' : (isAuthenticated ? 'Choose from Unreal Reflection™ and Parallel Self™ presets' : 'Explore Identity Presets')}
              >
                {selectedUnrealReflectionPreset ? 
                  UNREAL_REFLECTION_PRESETS.find((p: any) => p.id === selectedUnrealReflectionPreset)?.label || 'Identity Presets' 
                  : selectedParallelSelfPreset ?
                  PARALLEL_SELF_PRESETS.find((p: any) => p.id === selectedParallelSelfPreset)?.label || 'Identity Presets'
                  : 'Identity Presets'
                }
              </button>
              
              {/* Custom tooltip */}
              {!selectedFile && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[999999]" style={{ backgroundColor: '#000000' }}>
                  Upload a photo first to use Identity Presets
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#000000' }}></div>
                </div>
              )}
            </div>
              
              {/* Combined presets dropdown - 2-column grid with images */}
              {(composerState.mode === 'combined-presets' || composerState.mode === 'unrealreflection' || composerState.mode === 'parallelself') && combinedPresetsDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-[999999]">
                  <CombinedPresetPicker
                    value={selectedUnrealReflectionPreset || selectedParallelSelfPreset || undefined}
                    onChange={async (presetId, type) => {
                      setCombinedPresetsDropdownOpen(false)
                      
                      // Set the appropriate state based on preset type
                      if (type === 'unreal') {
                        setSelectedUnrealReflectionPreset(presetId || null)
                        setSelectedParallelSelfPreset(null)
                        setComposerState((s: any) => ({ ...s, mode: 'unrealreflection' }))
                        
                        // Auto-generate when Unreal Reflection preset is selected
                        if (presetId && selectedFile && isAuthenticated) {
                          console.log('Auto-generating Unreal Reflection with preset:', presetId)
                          try {
                            await dispatchGenerate('unrealreflection', {
                              unrealReflectionPresetId: presetId,
                              enableVideo: isUnrealReflectionVideoEnabled,
                              forVideo: isUnrealReflectionVideoEnabled
                            })
                          } catch (error) {
                            console.error('❌ Unreal Reflection auto-generation failed:', error)
                            setTimeout(() => {
                              clearAllOptionsAfterGeneration()
                            }, 300)
                          }
                        }
                      } else if (type === 'parallel') {
                        setSelectedParallelSelfPreset(presetId || null)
                        setSelectedUnrealReflectionPreset(null)
                        setComposerState((s: any) => ({ ...s, mode: 'parallelself' }))
                        
                        // Auto-generate when Parallel Self preset is selected
                        if (presetId && selectedFile && isAuthenticated) {
                          console.log('Auto-generating Parallel Self with preset:', presetId)
                          try {
                            await dispatchGenerate('parallelself', {
                              parallelSelfPresetId: presetId
                            })
                          } catch (error) {
                            console.error('❌ Parallel Self auto-generation failed:', error)
                            setTimeout(() => {
                              clearAllOptionsAfterGeneration()
                            }, 300)
                          }
                        }
                      }
                    }}
                    disabled={!isAuthenticated}
                  />
                </div>
              )}
            </div>

          </div>

          {/* Right: Action buttons */}
          <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}>
            {/* Draft button - temporarily hidden */}
            {false && (
            <button
              type="button"
              onClick={() => {
                if (!checkAuthAndRedirect()) return
                handleSaveDraft()
              }}
              title={isAuthenticated ? 'Save to draft' : 'Sign up to save drafts'}
              className={(() => {
                const baseClass = 'w-8 h-8 rounded-full flex items-center justify-center transition-colors';
                const activeClass = 'bg-black text-white hover:bg-white/10';
                const disabledClass = 'bg-black text-white/50 cursor-not-allowed';
                return `${baseClass} ${isAuthenticated ? activeClass : disabledClass}`;
              })()}
              aria-label="Save to draft"
              disabled={!isAuthenticated}
            >
              <FileText size={14} />
              </button>
            )}
          </div>
        </div>
        )}

      </div>
      
      {/* Social Media Icons - Under Composer (Desktop only, hide Instagram and Threads) */}
      {!isMobile && (
      <div className="flex items-center justify-center space-x-1.5 mt-1">
        <a
          href="https://x.com/StefnaXYZ"
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 rounded-full bg-black flex items-center justify-center hover:bg-gray-900 transition-colors"
          title="X"
        >
          <XIconCustom size={16} className="text-white" />
        </a>
        <a
          href="https://www.facebook.com/Stefnaxyz"
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 rounded-full bg-black flex items-center justify-center hover:bg-gray-900 transition-colors"
          title="Facebook"
        >
          <FacebookIcon size={16} className="text-white" />
        </a>
        <a
          href="https://www.tiktok.com/@stefnaxyz"
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 rounded-full bg-black flex items-center justify-center hover:bg-gray-900 transition-colors"
          title="TikTok"
        >
          <TikTokIcon size={16} className="text-white" />
        </a>
        <a
          href="https://www.reddit.com/user/StefnaXYZ/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 rounded-full bg-black flex items-center justify-center hover:bg-gray-900 transition-colors"
          title="Reddit"
        >
          <RedditIcon size={16} className="text-white" />
        </a>
        <a
          href="https://www.youtube.com/channel/UCNBAWuWc8luYN8F0dIXX0RA"
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 rounded-full bg-black flex items-center justify-center hover:bg-gray-900 transition-colors"
          title="YouTube"
        >
          <YouTubeIcon size={16} className="text-white" />
        </a>
      </div>
      )}
      
      {/* Media Upload Agreement Modal */}
      {showUploadAgreement && (
        <MediaUploadAgreement
          isOpen={showUploadAgreement}
          onClose={onUploadAgreementCancel}
          onAccept={onUploadAgreementAccept}
          onAgreementAccepted={onAgreementAccepted}
          userHasAgreed={userHasAgreed}
        />
      )}
    </div>
  )
}

export default LayeredComposer
