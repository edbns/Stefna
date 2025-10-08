import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus, FileText, ArrowUp, ChevronUp, ChevronDown } from 'lucide-react'
import { generationStart } from '../lib/generationEvents'
import { UnrealReflectionPicker } from './UnrealReflectionPicker'
import { ParallelSelfPicker } from './ParallelSelfPicker'
import { GhibliReactionPicker } from './GhibliReactionPicker'
import { CyberSirenPicker } from './CyberSirenPicker'
import { CombinedPresetPicker } from './CombinedPresetPicker'

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
  
  // Add event listeners for composer state management
  useEffect(() => {
    const handleClearComposerState = () => {
      console.log('🧹 LayeredComposer: Clear composer state event received')
      setComposerState((s: any) => ({ ...s, mode: null }))
      setSelectedMode(null)
      closeAllDropdowns()
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
  }, [setComposerState, setSelectedMode, closeAllDropdowns])

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
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-[999998] flex justify-center">
            <div className="rounded-2xl p-4 shadow-2xl shadow-black/20 max-w-sm" style={{ backgroundColor: '#000000' }}>
              
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
                    className="max-h-64 w-auto object-contain" 
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
                    className="max-h-64 w-auto object-contain" 
                    onLoad={measure}
                    onError={(e) => {
                      console.error('❌ Image failed to load:', previewUrl, e)
                    }}
                  />
                )}
              </div>
              
              {/* Close button */}
              <div className="flex justify-center mb-3">
                <button
                  onClick={() => {
                    // Clear preview
                    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                    if (fileInput) fileInput.value = ''
                    
                    // Clear the selected file in parent component
                    onClearFile()
                    
                    // Close the composer (this sets isComposerOpen to false in parent)
                    closeComposer()
                    
                    // Reset composer to default state (switch back to Custom mode)
                    setComposerState((s: any) => ({ ...s, mode: 'custom' }))
                    setSelectedMode(null)
                    closeAllDropdowns()
                    
                    // Reset preset selection states
                    if (setCombinedPresetsDropdownOpen) {
                      setCombinedPresetsDropdownOpen(false)
                    }
                    if (setSelectedCombinedPreset) {
                      setSelectedCombinedPreset(null)
                    }
                    
                    // Auto-collapse when media is removed
                    if (setIsExpanded) {
                      setIsExpanded(false)
                    }
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-white/10 text-white hover:bg-white/20"
                  aria-label="Remove media"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Action buttons - positioned directly under media preview, full width */}
          <div className="fixed left-0 right-0 px-4 z-[999997]" style={{ top: '420px' }}>
            <div className="flex gap-2">
              {/* Describe Button */}
              <button
                onClick={() => {
                  // Switch to edit mode to show prompt box
                  setComposerState((s: any) => ({ ...s, mode: 'edit' }))
                  closeAllDropdowns()
                }}
                className="flex-1 py-3 px-4 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors shadow-lg"
              >
                Describe
              </button>
              
              {/* Get This Look Button */}
              <button
                onClick={() => {
                  // Switch to combined presets mode
                  setComposerState((s: any) => ({ ...s, mode: 'combined-presets' }))
                  closeAllDropdowns()
                  setCombinedPresetsDropdownOpen(true)
                }}
                className="flex-1 py-3 px-4 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors shadow-lg"
              >
                Get This Look
              </button>
            </div>
          </div>
          
          {/* Inline Combined Presets - show directly under buttons with proper scrolling */}
          {composerState.mode === 'combined-presets' && combinedPresetsDropdownOpen && (
            <div className="fixed left-0 right-0 px-4 z-[999996] overflow-y-auto" style={{ top: '490px', bottom: '80px' }}>
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
                  // Clear preview
                  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                  if (fileInput) fileInput.value = ''
                  
                  // Clear the selected file in parent component
                  onClearFile()
                  
                  // Reset composer to default state (switch back to Custom mode)
                  setComposerState((s: any) => ({ ...s, mode: 'custom' }))
                  setSelectedMode(null)
                  closeAllDropdowns()
                  
                  // Close composer
                  closeComposer()
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
              <div className="relative mx-2 mt-3">
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
                  className="w-full px-3 py-2 pr-10 text-white placeholder-white/70 resize-none focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 h-20 text-xs rounded-xl border"
                  style={{ backgroundColor: '#000000', borderColor: '#ffffff' }}
                  disabled={composerState.mode === 'edit' ? !selectedFile : false}
                  maxLength={4000}
                  data-testid="custom-prompt-input"
                />
                  
                  {/* Mobile: Enhance button positioned top-right corner inside textarea */}
                  <button
                    onClick={handleMagicWandEnhance}
                    disabled={isGenerating || !prompt.trim()}
                    className="absolute top-1 right-1 px-1.5 py-0.5 flex items-center justify-center text-purple-400 hover:text-purple-300 transition-colors disabled:text-white/30 disabled:cursor-not-allowed text-[10px] font-medium"
                    title={composerState.mode === 'edit' ? "Enhance studio prompt with AI (free)" : "Enhance prompt with AI (free)"}
                  >
                    {isEnhancing ? (
                      <div className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Enhance</span>
                    )}
                  </button>
                
                {/* Mobile: Character count and Generate Button positioned like desktop - bottom-right inside textarea */}
                <div className="absolute bottom-3 right-2 flex items-center gap-1">
                  <span className="text-white/30 text-xs">{prompt.length}/3000</span>
                  
                  {/* Generate Button */}
                  <button
                    onClick={async () => {
                      if (!checkAuthAndRedirect()) return
                      
                      setNavGenerating(true)
                      
                      // Dispatch generation start event BEFORE navigation
                      console.log('🚀 Dispatching generationStart event for mobile gallery');
                      generationStart({ kind: 'image' });
                      console.log('✅ generationStart event dispatched');
                      
                      window.dispatchEvent(new CustomEvent('close-composer'));
                      
                      // Small delay to ensure event is processed before navigation
                      await new Promise(resolve => setTimeout(resolve, 50));
                      
                      // Now redirect to gallery on mobile, profile on desktop
                      console.log('🔄 Mobile redirect check:', { isMobile, target: isMobile ? '/gallery' : '/profile' })
                      const targetPath = isMobile ? '/gallery' : '/profile'
                      console.log('🔄 About to navigate to:', targetPath)
                      navigate(targetPath)
                      console.log('🔄 Navigate called successfully');
                      
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
                          setNavGenerating(false)
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
                    ? 'w-6 h-6 rounded-full flex items-center justify-center transition-colors bg-black border border-white/30 text-white/50 cursor-not-allowed'
                    : 'w-6 h-6 rounded-full flex items-center justify-center transition-colors bg-white border border-white text-black hover:bg-white/90'
                  }
                  aria-label="Generate"
                  title="Generate AI content"
                >
                  {navGenerating ? (
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowUp size={10} />
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
                      
                      setNavGenerating(true)
                      
                      // Dispatch generation start event BEFORE navigation
                      console.log('🚀 Dispatching generationStart event');
                      generationStart({ kind: 'image' });
                      console.log('✅ generationStart event dispatched');
                      
                      window.dispatchEvent(new CustomEvent('close-composer'));
                      
                      // Small delay to ensure event is processed before navigation
                      await new Promise(resolve => setTimeout(resolve, 50));
                      
                      // Now redirect to gallery on mobile, profile on desktop
                      console.log('🔄 Mobile redirect check:', { isMobile, target: isMobile ? '/gallery' : '/profile' })
                      const targetPath = isMobile ? '/gallery' : '/profile'
                      console.log('🔄 About to navigate to:', targetPath)
                      navigate(targetPath)
                      console.log('🔄 Navigate called successfully')
                      
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
                          setNavGenerating(false)
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


        {/* Mobile Collapsible Section */}
        {isMobile && (
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
                        // Dispatch generation start event BEFORE navigation
                        generationStart({ kind: 'image' });
                        // Small delay to ensure event is processed
                        await new Promise(resolve => setTimeout(resolve, 50));
                        // Redirect to gallery on mobile, profile on desktop
                        navigate(isMobile ? '/gallery' : '/profile')
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
                        // Dispatch generation start event BEFORE navigation
                        generationStart({ kind: 'image' });
                        // Small delay to ensure event is processed
                        await new Promise(resolve => setTimeout(resolve, 50));
                        // Redirect to gallery on mobile, profile on desktop
                        navigate(isMobile ? '/gallery' : '/profile')
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

            {/* Unreal Reflection™ button - ALWAYS VISIBLE */}
            <div className="relative" data-unrealreflection-dropdown>
              <div className="relative group">
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
                title={!selectedFile ? 'Upload a photo first to use Unreal Reflection™' : (isAuthenticated ? 'Switch to Unreal Reflection™ mode' : 'Explore Unreal Reflection™ mode')}
              >
                {selectedUnrealReflectionPreset ? 
                  UNREAL_REFLECTION_PRESETS.find((p: any) => p.id === selectedUnrealReflectionPreset)?.label || 'Unreal Reflection™' 
                  : 'Unreal Reflection™'
                }
              </button>
              
              {/* Custom tooltip */}
              {!selectedFile && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[999999]" style={{ backgroundColor: '#000000' }}>
                  Upload a photo first to use Unreal Reflection™
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#000000' }}></div>
                </div>
              )}
            </div>
              
              {/* Unreal Reflection™ presets dropdown */}
              {composerState.mode === 'unrealreflection' && unrealReflectionDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-[999999]">
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
                        // Dispatch generation start event BEFORE navigation
                        generationStart({ kind: 'image' });
                        // Small delay to ensure event is processed
                        await new Promise(resolve => setTimeout(resolve, 50));
                        // Redirect to gallery on mobile, profile on desktop
                        navigate(isMobile ? '/gallery' : '/profile')
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

            {/* Parallel Self™ button - ALWAYS VISIBLE */}
            <div className="relative" data-parallelself-dropdown>
              <div className="relative group">
                <button
                onClick={() => {
                  if (!checkAuthAndRedirect()) return
                  
                  // Require photo upload first
                  if (!selectedFile) {
                    return
                  }
                  
                  if (composerState.mode === 'parallelself') {
                    // Toggle dropdown when already in parallelself mode
                    setParallelSelfDropdownOpen(!parallelSelfDropdownOpen)
                  } else {
                    closeAllDropdowns()
                    setComposerState((s: any) => ({ ...s, mode: 'parallelself' }))
                    setParallelSelfDropdownOpen(true)
                  }
                }}
                className={
                  composerState.mode === 'parallelself'
                    ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black'
                    : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white text-black hover:bg-white/90'
                }
                style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
                title={!selectedFile ? 'Upload a photo first to use Parallel Self™' : (isAuthenticated ? 'Switch to Parallel Self™ mode' : 'Explore Parallel Self™ mode')}
              >
                {selectedParallelSelfPreset ? 
                  PARALLEL_SELF_PRESETS.find((p: any) => p.id === selectedParallelSelfPreset)?.label || 'Parallel Self™' 
                  : 'Parallel Self™'
                }
              </button>
              
              {/* Custom tooltip */}
              {!selectedFile && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[999999]" style={{ backgroundColor: '#000000' }}>
                  Upload a photo first to use Parallel Self™
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#000000' }}></div>
                </div>
              )}
            </div>
              
              {/* Parallel Self™ presets dropdown */}
              {composerState.mode === 'parallelself' && parallelSelfDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-[999999]">
                  <ParallelSelfPicker
                    value={selectedParallelSelfPreset || undefined}
                    onChange={async (presetId) => {
                      setSelectedParallelSelfPreset(presetId || null)
                      setParallelSelfDropdownOpen(false)
                      
                      // Auto-generate when Parallel Self preset is selected
                      if (presetId && selectedFile && isAuthenticated) {
                        console.log('Auto-generating Parallel Self with preset:', presetId)
                        // Dispatch generation start event BEFORE navigation
                        generationStart({ kind: 'image' });
                        // Small delay to ensure event is processed
                        await new Promise(resolve => setTimeout(resolve, 50));
                        // Redirect to gallery on mobile, profile on desktop
                        navigate(isMobile ? '/gallery' : '/profile')
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
