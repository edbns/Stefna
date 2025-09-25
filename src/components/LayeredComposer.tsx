import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus, FileText, ArrowUp } from 'lucide-react'
import { UnrealReflectionPicker } from './UnrealReflectionPicker'
import { ParallelSelfPicker } from './ParallelSelfPicker'
import { GhibliReactionPicker } from './GhibliReactionPicker'
import { NeoTokyoGlitchPicker } from './NeoTokyoGlitchPicker'

// Import all the preset constants and types
import { UNREAL_REFLECTION_PRESETS } from '../presets/unrealReflection'
import { PARALLEL_SELF_PRESETS } from '../presets/parallelSelf'
import { GHIBLI_REACTION_PRESETS } from '../presets/ghibliReact'
import { NEO_TOKYO_GLITCH_PRESETS } from '../presets/neoTokyoGlitch'
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
  neoTokyoGlitchDropdownOpen: boolean
  setNeoTokyoGlitchDropdownOpen: (open: boolean) => void
  
  // Preset selections
  selectedUnrealReflectionPreset: string | null
  setSelectedUnrealReflectionPreset: (preset: string | null) => void
  selectedParallelSelfPreset: string | null
  setSelectedParallelSelfPreset: (preset: string | null) => void
  selectedGhibliReactionPreset: string | null
  setSelectedGhibliReactionPreset: (preset: string | null) => void
  selectedNeoTokyoGlitchPreset: string | null
  setSelectedNeoTokyoGlitchPreset: (preset: string | null) => void
  
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
  
  // Handlers
  closeComposer: () => void
  checkAuthAndRedirect: () => boolean
  handlePresetClick: (preset: string) => void
  handleMagicWandEnhance: () => void
  handleSaveDraft: () => void
  dispatchGenerate: (kind: "preset" | "custom" | "unrealreflection" | "ghiblireact" | "neotokyoglitch" | "parallelself" | "storytime" | "edit", options?: any) => Promise<void>
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
  neoTokyoGlitchDropdownOpen,
  setNeoTokyoGlitchDropdownOpen,
  selectedUnrealReflectionPreset,
  setSelectedUnrealReflectionPreset,
  selectedParallelSelfPreset,
  setSelectedParallelSelfPreset,
  selectedGhibliReactionPreset,
  setSelectedGhibliReactionPreset,
  selectedNeoTokyoGlitchPreset,
  setSelectedNeoTokyoGlitchPreset,
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

  return (
    <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-[999999] w-[67%] min-w-[600px]">
      {/* Photo preview container - shows above composer when photo is uploaded */}
      {previewUrl && (
        <div className="mb-4 flex justify-center">
          <div className="rounded-2xl p-4 shadow-2xl shadow-black/20 inline-block border" style={{ backgroundColor: '#000000', borderColor: '#333333' }}>
            
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
                  className="max-h-96 w-auto object-contain" 
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
                  className="max-h-96 w-auto object-contain" 
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
                  
                  // Reset composer to default state (keep Edit mode as default)
                  setComposerState((s: any) => ({ ...s, mode: 'edit' }))
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
      <div className="px-4 py-3">
        
        {/* Prompt Input - ONLY VISIBLE for manual modes (Custom, Edit) */}
        {(['custom', 'edit'].includes(composerState.mode || '')) && (
          <div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => {
                  console.log('🎯 Prompt input changed:', e.target.value);
                  setPrompt(e.target.value);
                }}
                placeholder={(() => {
                  if (!selectedFile) {
                    return "Upload a photo first to start editing..."
                  }
                  switch (composerState.mode) {
                    case 'edit': 
                      return "Change something, add something — your call ... tap ✨ for a little magic."
                    case 'custom': 
                      return "Type something weird. We'll make it art ... tap ✨ for a little magic."
                    default: 
                      return "Custom prompt (optional) - will be combined with selected preset"
                  }
                })()}
                className="w-full px-3 py-2 pr-10 text-white placeholder-white/70 resize-none focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 h-20 text-sm rounded-xl border"
                style={{ backgroundColor: '#000000', borderColor: '#333333' }}
                disabled={!selectedFile}
                maxLength={3000}
                data-testid="custom-prompt-input"
              />
                
                {/* Magic Wand Enhancement Button - show for custom and edit modes */}
                <button
                  onClick={handleMagicWandEnhance}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-white/60 hover:text-white/80 transition-colors disabled:text-white/30 disabled:cursor-not-allowed"
                  title={composerState.mode === 'edit' ? "Enhance studio prompt with AI (free)" : "Enhance prompt with AI (free)"}
                >
                  {isEnhancing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="text-lg">✨</span>
                  )}
                </button>
              <div className="absolute bottom-3 right-2 flex items-center gap-2">
                <span className="text-white/30 text-xs">{prompt.length}/3000</span>
                
                {/* Generate Button - inside prompt box */}
                <button
                  onClick={async () => {
                    if (!checkAuthAndRedirect()) return
                    
                    // Redirect immediately when user clicks generate
                    navigate('/profile')
                    
                    setNavGenerating(true)
                    window.dispatchEvent(new CustomEvent('close-composer'));
                    
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
                    !selectedFile ||
                    !prompt.trim() ||
                    (composerState.mode === 'custom' && !prompt.trim()) ||
                    navGenerating
                  }
                  className={
                    !selectedFile ||
                    !prompt.trim() ||
                    (composerState.mode === 'custom' && !prompt.trim()) ||
                    navGenerating
                  ? 'w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-black text-white/50 cursor-not-allowed'
                  : 'w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-white text-black hover:bg-white/90'
                }
                aria-label="Generate"
                title="Generate AI content"
              >
                {navGenerating ? (
                  <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <ArrowUp size={12} />
                )}
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Single row with all controls */}
        <div className="flex items-center justify-between gap-1 flex-wrap rounded-xl p-3 border" style={{ backgroundColor: '#000000', borderColor: '#333333' }}>
          {/* Left: Upload button and Mode buttons */}
          <div className="flex items-center gap-2">
            
            {/* Upload Photo Button */}
            <button
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement
                  const file = target.files?.[0]
                  if (file) {
                    console.log('📸 Photo selected:', file.name)
                    onFileSelect(file)
                  }
                }
                input.click()
              }}
              className="px-3 py-1.5 rounded-2xl text-xs font-medium transition-all duration-300 text-black flex items-center gap-2 hover:scale-105 upload"
              title="Upload a photo to get started"
            >
              <Plus size={16} />
              Upload
            </button>
            
            {/* Custom Prompt button */}
            <div className="relative" data-custom-dropdown>
              <div className="relative group">
                <button
                  onClick={async () => {
                    if (!checkAuthAndRedirect()) return
                    
                    // Require photo upload first
                    if (!selectedFile) {
                      return
                    }
                    
                    if (composerState.mode === 'custom') {
                      closeAllDropdowns()
                    } else {
                      closeAllDropdowns()
                      setComposerState((s: any) => ({ ...s, mode: 'custom' }))
                      setSelectedMode('presets')
                    }
                  }}
                  className={
                    composerState.mode === 'custom'
                      ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                      : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white backdrop-blur-md text-black hover:bg-white/90'
                  }
                  data-testid="custom-button"
                  style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
                  data-has-file={!!selectedFile}
                >
                  Custom
                </button>
                
                {/* Custom tooltip */}
                {!selectedFile && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50" style={{ backgroundColor: '#000000' }}>
                    Please upload a photo first to get started
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#000000' }}></div>
                  </div>
                )}
              </div>
            </div>

            {/* Edit My Photo™ button */}
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
                      ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                      : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white backdrop-blur-md text-black hover:bg-white/90'
                  }
                  style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
                >
                  Studio
                </button>
                
                {/* Custom tooltip */}
                {!selectedFile && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50" style={{ backgroundColor: '#000000' }}>
                    Please upload a photo first to get started
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#000000' }}></div>
                  </div>
                )}
              </div>
            </div>

            {/* Presets dropdown button */}
            <div className="relative" data-presets-dropdown>
              <div className="relative group">
                <button
                  onClick={() => {
                    if (!checkAuthAndRedirect()) return
                    
                    // Require photo upload first
                    if (!selectedFile) {
                      return
                    }
                    
                    console.log('🎯 Presets button clicked!')
                    console.log('🔍 Current presetsOpen state:', presetsOpen)
                    console.log('🔍 Available presets:', weeklyPresetNames)
                    
                    // Close Custom/Edit modes when presets is clicked
                    if (composerState.mode === 'custom' || composerState.mode === 'edit') {
                      setComposerState((s: any) => ({ ...s, mode: null }))
                    }
                    
                    // Toggle presets dropdown
                      setPresetsOpen(!presetsOpen)
                    console.log('🔄 Toggling presetsOpen to:', !presetsOpen)
                  }}
                  className={
                    selectedPreset
                      ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                      : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white backdrop-blur-md text-black hover:bg-white/90'
                  }
                  data-nav-button
                  data-nav-type="presets"
                  style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
                >
                  {selectedPreset ? getPresetLabel(selectedPreset as string, availablePresets) : 'Presets'}
                </button>
                
                {/* Custom tooltip */}
                {!selectedFile && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50" style={{ backgroundColor: '#000000' }}>
                    Please upload a photo first to get started
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#000000' }}></div>
                  </div>
                )}
              </div>
              {presetsOpen && (
                <div className="absolute bottom-full left-0 mb-2 rounded-xl p-3 w-80 z-50 shadow-2xl shadow-black/20 border" style={{ backgroundColor: '#000000', borderColor: '#333333' }}>
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
                            : 'text-white hover:text-white hover:bg-white/10'
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

            {/* Unreal Reflection™ button */}
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
                    ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                    : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white backdrop-blur-md text-black hover:bg-white/90'
                }
                title={!selectedFile ? 'Please upload a photo first to get started' : (isAuthenticated ? 'Switch to Unreal Reflection™ mode' : 'Explore Unreal Reflection™ mode')}
                style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
              >
                {selectedUnrealReflectionPreset ? 
                  UNREAL_REFLECTION_PRESETS.find((p: any) => p.id === selectedUnrealReflectionPreset)?.label || 'Unreal Reflection™' 
                  : 'Unreal Reflection™'
                }
              </button>
              
              {/* Custom tooltip */}
              {!selectedFile && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50" style={{ backgroundColor: '#000000' }}>
                  Please upload a photo first to get started
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#000000' }}></div>
                </div>
              )}
            </div>
              
              {/* Unreal Reflection™ presets dropdown */}
              {composerState.mode === 'unrealreflection' && unrealReflectionDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
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
                        // Redirect immediately when preset is selected
                        navigate('/profile')
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

            {/* Parallel Self™ button */}
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
                    closeAllDropdowns()
                  } else {
                    closeAllDropdowns()
                    setComposerState((s: any) => ({ ...s, mode: 'parallelself' }))
                    setParallelSelfDropdownOpen(true)
                  }
                }}
                className={
                  composerState.mode === 'parallelself'
                    ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                    : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white backdrop-blur-md text-black hover:bg-white/90'
                }
                title={!selectedFile ? 'Please upload a photo first to get started' : (isAuthenticated ? 'Switch to Parallel Self™ mode' : 'Explore Parallel Self™ mode')}
                style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
              >
                {selectedParallelSelfPreset ? 
                  PARALLEL_SELF_PRESETS.find((p: any) => p.id === selectedParallelSelfPreset)?.label || 'Parallel Self™' 
                  : 'Parallel Self™'
                }
              </button>
              
              {/* Custom tooltip */}
              {!selectedFile && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50" style={{ backgroundColor: '#000000' }}>
                  Please upload a photo first to get started
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#000000' }}></div>
                </div>
              )}
            </div>
              
              {/* Parallel Self™ presets dropdown */}
              {composerState.mode === 'parallelself' && parallelSelfDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                  <ParallelSelfPicker
                    value={selectedParallelSelfPreset || undefined}
                    onChange={async (presetId) => {
                      setSelectedParallelSelfPreset(presetId || null)
                      setParallelSelfDropdownOpen(false)
                        
                      // Auto-generate when Parallel Self preset is selected
                      if (presetId && selectedFile && isAuthenticated) {
                        console.log('Auto-generating Parallel Self with preset:', presetId)
                        // Redirect immediately when preset is selected
                        navigate('/profile')
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

            {/* Studio Ghibli Reaction™ button */}
            <div className="relative" data-ghiblireact-dropdown>
              <div className="relative group">
                <button
                onClick={async () => {
                  if (!checkAuthAndRedirect()) return
                  
                  // Require photo upload first
                  if (!selectedFile) {
                    return
                  }
                  
                  if (composerState.mode === 'ghiblireact') {
                    closeAllDropdowns()
                        setGhibliReactionDropdownOpen(!ghibliReactionDropdownOpen)
                  } else {
                    closeAllDropdowns()
                    setComposerState((s: any) => ({ ...s, mode: 'ghiblireact' }))
                    setSelectedMode('presets')
                    setSelectedGhibliReactionPreset(null)
                    setGhibliReactionDropdownOpen(true)
                  }
                }}
                className={
                  composerState.mode === 'ghiblireact'
                    ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                    : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white backdrop-blur-md text-black hover:bg-white/90'
                }
                title={!selectedFile ? 'Please upload a photo first to get started' : (isAuthenticated ? 'Switch to Studio Ghibli Reaction mode' : 'Explore Studio Ghibli Reaction mode')}
                style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
              >
                {selectedGhibliReactionPreset ? 
                  GHIBLI_REACTION_PRESETS.find((p: any) => p.id === selectedGhibliReactionPreset)?.label || 'Ghibli Reaction' 
                  : 'Ghibli Reaction'
                }
              </button>
              
              {/* Custom tooltip */}
              {!selectedFile && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50" style={{ backgroundColor: '#000000' }}>
                  Please upload a photo first to get started
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#000000' }}></div>
                </div>
              )}
            </div>
              
              {/* Ghibli Reaction presets dropdown */}
              {composerState.mode === 'ghiblireact' && ghibliReactionDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                  <GhibliReactionPicker
                    value={selectedGhibliReactionPreset || undefined}
                    onChange={async (presetId) => {
                      setSelectedGhibliReactionPreset(presetId || null)
                      setGhibliReactionDropdownOpen(false)
                      
                      // Auto-generate when Ghibli Reaction preset is selected
                      if (presetId && selectedFile && isAuthenticated) {
                        console.log('Auto-generating Ghibli Reaction with preset:', presetId)
                        // Redirect immediately when preset is selected
                        navigate('/profile')
                        try {
                          await dispatchGenerate('ghiblireact', {
                            ghibliReactionPresetId: presetId
                          })
                        } catch (error) {
                          console.error('❌ Ghibli Reaction auto-generation failed:', error)
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

            {/* Neo Tokyo Glitch™ button */}
            <div className="relative" data-neotokyoglitch-dropdown>
              <div className="relative group">
                <button
                onClick={async () => {
                  if (!checkAuthAndRedirect()) return
                  
                  // Require photo upload first
                  if (!selectedFile) {
                    return
                  }
                  
                  if (composerState.mode === 'neotokyoglitch') {
                    closeAllDropdowns()
                        setNeoTokyoGlitchDropdownOpen(!neoTokyoGlitchDropdownOpen)
                  } else {
                    closeAllDropdowns()
                    setComposerState((s: any) => ({ ...s, mode: 'neotokyoglitch' }))
                    setSelectedMode('presets')
                    setSelectedNeoTokyoGlitchPreset(null)
                    setNeoTokyoGlitchDropdownOpen(true)
                  }
                }}
                className={
                  composerState.mode === 'neotokyoglitch'
                    ? 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white/90 backdrop-blur-md text-black'
                    : 'px-3 py-1.5 rounded-2xl text-xs transition-colors bg-white backdrop-blur-md text-black hover:bg-white/90'
                }
                title={!selectedFile ? 'Please upload a photo first to get started' : (isAuthenticated ? 'Switch to Neo Tokyo Glitch mode' : 'Explore Neo Tokyo Glitch mode')}
                style={{ cursor: !selectedFile ? 'not-allowed' : 'pointer' }}
              >
                {selectedNeoTokyoGlitchPreset ? 
                  NEO_TOKYO_GLITCH_PRESETS.find((p: any) => p.id === selectedNeoTokyoGlitchPreset)?.label || 'Neo Tokyo Glitch' 
                  : 'Neo Tokyo Glitch'
                }
              </button>
              
              {/* Custom tooltip */}
              {!selectedFile && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50" style={{ backgroundColor: '#000000' }}>
                  Please upload a photo first to get started
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{ borderTopColor: '#000000' }}></div>
                </div>
              )}
            </div>
              
              {/* Neo Tokyo Glitch presets dropdown */}
              {composerState.mode === 'neotokyoglitch' && neoTokyoGlitchDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                  <NeoTokyoGlitchPicker
                    value={selectedNeoTokyoGlitchPreset || undefined}
                    onChange={async (presetId) => {
                      setSelectedNeoTokyoGlitchPreset(presetId || null)
                      setNeoTokyoGlitchDropdownOpen(false)
                      
                      // Auto-generate when Neo Tokyo Glitch preset is selected
                      if (presetId && selectedFile && isAuthenticated) {
                        console.log('Auto-generating Neo Tokyo Glitch with preset:', presetId)
                        // Redirect immediately when preset is selected
                        navigate('/profile')
                        try {
                          await dispatchGenerate('neotokyoglitch', {
                            neoTokyoGlitchPresetId: presetId
                          })
                        } catch (error) {
                          console.error('❌ Neo Tokyo Glitch auto-generation failed:', error)
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
          <div className="flex items-center gap-2">
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
            {/* Generate button moved to prompt box */}
            {false && (['custom', 'edit'].includes(composerState.mode || '')) && (
              <button 
                onClick={async () => {
                  if (!checkAuthAndRedirect()) return
                  
                  // Redirect immediately when user clicks generate
                  navigate('/profile')
                  
                  setNavGenerating(true)
                  window.dispatchEvent(new CustomEvent('close-composer'));
                  
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
                    setNavGenerating(false)
                  }
                }} 
                disabled={
                  (composerState.mode === 'edit' && (!selectedFile || !prompt.trim())) ||
                  (composerState.mode === 'custom' && !prompt.trim()) ||
                  navGenerating
                } 
                className={
                  ((composerState.mode === 'edit' && (!selectedFile || !prompt.trim())) ||
                   (composerState.mode === 'custom' && !prompt.trim()) ||
                   navGenerating)
                  ? 'w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-black text-white/50 cursor-not-allowed'
                  : 'w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-white text-black hover:bg-white/90'
                }
                aria-label="Generate"
                title="Generate AI content"
              >
                {navGenerating ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <ArrowUp size={16} />
                )}
              </button>
            )}
          </div>
        </div>
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
