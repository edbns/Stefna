import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToasts } from './ui/Toasts';
import authService from '../services/authService';
import { MagicWandService } from '../services/magicWandService';
import { UNREAL_REFLECTION_PRESETS } from '../presets/unrealReflection';
import { PARALLEL_SELF_PRESETS } from '../presets/parallelSelf';
import { GHIBLI_REACTION_PRESETS } from '../presets/ghibliReact';
import { CYBER_SIREN_PRESETS } from '../presets/cyberSiren';

interface MobileComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (mode: string, options?: any) => Promise<void>;
  selectedFile: File | null;
  previewUrl: string | null;
  prompt: string;
  setPrompt: (prompt: string) => void;
  isGenerating: boolean;
  onFileSelect: (file: File) => void;
}

const MobileComposer: React.FC<MobileComposerProps> = ({
  isOpen,
  onClose,
  onGenerate,
  selectedFile,
  previewUrl,
  prompt,
  setPrompt,
  isGenerating,
  onFileSelect
}) => {
  const navigate = useNavigate();
  const { notifyError } = useToasts();
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'modes' | 'mode-specific'>('modes');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Preset selection states
  const [selectedUnrealPreset, setSelectedUnrealPreset] = useState<string | null>(null);
  const [selectedParallelPreset, setSelectedParallelPreset] = useState<string | null>(null);
  const [selectedGhibliPreset, setSelectedGhibliPreset] = useState<string | null>(null);
  const [selectedNeoPreset, setSelectedNeoPreset] = useState<string | null>(null);
  
  // Database presets state
  const [databasePresets, setDatabasePresets] = useState<any[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);

  // Auto-trigger file picker when composer opens (like desktop)
  useEffect(() => {
    if (isOpen && !selectedFile) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }, 100);
    }
  }, [isOpen, selectedFile]);

  // Reset when composer closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('modes');
      setSelectedMode('');
    }
  }, [isOpen]);

  // Check authentication and redirect to /auth if not authenticated
  const checkAuthAndRedirect = () => {
    if (!authService.isAuthenticated()) {
      console.log('❌ User not authenticated, redirecting to auth');
      navigate('/auth');
      return false;
    }
    return true;
  };

  // Handle mode selection
  const handleModeSelect = async (mode: string) => {
    if (!checkAuthAndRedirect()) return;
    
    setSelectedMode(mode);
    setCurrentStep('mode-specific');
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === 'mode-specific') {
      setCurrentStep('modes');
      setSelectedMode('');
    }
  };

  // Handle studio generation
  const handleMagicWand = async () => {
    if (!prompt.trim()) {
      notifyError({ title: 'Prompt Required', message: 'Please enter a prompt first' });
      return;
    }
    
    setIsEnhancing(true);
    try {
      const result = await MagicWandService.enhancePrompt(prompt.trim());
      setPrompt(result.enhancedPrompt);
    } catch (error) {
      console.error('Magic wand failed:', error);
      notifyError({ title: 'Enhancement Failed', message: 'Could not enhance prompt' });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleEditGenerate = async () => {
    if (!checkAuthAndRedirect()) return;
    if (!prompt.trim()) {
      notifyError({ title: 'Prompt Required', message: 'Please enter a prompt' });
      return;
    }
    
    try {
      await onGenerate(selectedMode, { prompt: prompt.trim() });
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  // Handle preset generation
  const handlePresetGenerate = async (presetId: string) => {
    if (!checkAuthAndRedirect()) return;
    
    try {
      await onGenerate(selectedMode, { presetId });
    } catch (error) {
      console.error('Preset generation failed:', error);
    }
  };

  // Load database presets
  const loadDatabasePresets = async () => {
    if (loadingPresets || databasePresets.length > 0) return;
    
    setLoadingPresets(true);
    try {
      // Use the same service as the website
      const presetsService = (await import('../services/presetsService')).default.getInstance();
      const response = await presetsService.getAvailablePresets();
      
      if (response.success && response.data) {
        setDatabasePresets(response.data.presets || []);
        console.log('🎨 [MobileComposer] Loaded', response.data.presets.length, 'presets for week', response.data.currentWeek);
      } else {
        console.error('❌ [MobileComposer] Failed to load presets:', response.error);
      }
    } catch (error) {
      console.error('❌ [MobileComposer] Error loading database presets:', error);
    } finally {
      setLoadingPresets(false);
    }
  };

  // Load database presets when composer opens
  useEffect(() => {
    if (isOpen) {
      loadDatabasePresets();
    }
  }, [isOpen]);

  // Load presets when preset modes are selected
  useEffect(() => {
    if (['presets', 'unrealreflection', 'ghiblireact', 'cyber-siren', 'parallelself'].includes(selectedMode)) {
      loadDatabasePresets();
    }
  }, [selectedMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header - only show when file is selected */}
      {selectedFile && (
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            {currentStep === 'mode-specific' && (
              <button
                onClick={handleBack}
                className="mr-3 p-1 text-white/60 hover:text-white"
              >
                ←
              </button>
            )}
            <h2 className="text-white text-lg font-medium">
              {currentStep === 'modes' ? 'Choose Style' : 
               selectedMode === 'edit' ? 'Studio' :
               selectedMode === 'presets' ? 'Presets' :
               selectedMode === 'unrealreflection' ? 'Unreal Reflection™' :
               selectedMode === 'parallelself' ? 'Parallel Self™' :
               selectedMode === 'ghiblireact' ? 'Ghibli Reaction' :
               'Cyber Siren'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mode Selection Screen (only show when file is selected) */}
        {currentStep === 'modes' && selectedFile && (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Custom - HIDDEN */}
              {false && (
              <button
                onClick={() => handleModeSelect('custom')}
                className="aspect-square bg-white/10 rounded-lg text-white text-center hover:bg-white/20 transition-colors flex items-center justify-center p-4"
              >
                <div className="text-sm font-medium">Custom</div>
              </button>
              )}

              {/* Studio */}
              <button
                onClick={() => handleModeSelect('edit')}
                className="aspect-square bg-white/10 rounded-lg text-white text-center hover:bg-white/20 transition-colors flex items-center justify-center p-4"
              >
                <div className="text-sm font-medium">Studio</div>
              </button>

              {/* Presets */}
              <button
                onClick={() => handleModeSelect('presets')}
                className="aspect-square bg-white/10 rounded-lg text-white text-center hover:bg-white/20 transition-colors flex items-center justify-center p-4"
              >
                <div className="text-sm font-medium">Presets</div>
              </button>

              {/* Unreal Reflection */}
              <button
                onClick={() => handleModeSelect('unrealreflection')}
                className="aspect-square bg-white/10 rounded-lg text-white text-center hover:bg-white/20 transition-colors flex items-center justify-center p-4"
              >
                <div className="text-sm font-medium">Unreal Reflection™</div>
              </button>

              {/* Parallel Self */}
              <button
                onClick={() => handleModeSelect('parallelself')}
                className="aspect-square bg-white/10 rounded-lg text-white text-center hover:bg-white/20 transition-colors flex items-center justify-center p-4"
              >
                <div className="text-sm font-medium">Parallel Self™</div>
              </button>

              {/* Ghibli Reaction */}
              <button
                onClick={() => handleModeSelect('ghiblireact')}
                className="aspect-square bg-white/10 rounded-lg text-white text-center hover:bg-white/20 transition-colors flex items-center justify-center p-4"
              >
                <div className="text-sm font-medium">Ghibli Reaction</div>
              </button>

              {/* Cyber Siren */}
              <button
                onClick={() => handleModeSelect('cyber-siren')}
                className="aspect-square bg-white/10 rounded-lg text-white text-center hover:bg-white/20 transition-colors flex items-center justify-center p-4"
              >
                <div className="text-sm font-medium">Cyber Siren</div>
              </button>
            </div>
          </div>
        )}

        {/* Mode-Specific Screen (with image preview) */}
        {currentStep === 'mode-specific' && (
          <>
            {/* Image Preview */}
            {previewUrl && (
              <div className="flex-1 p-2">
                <img
                  src={previewUrl}
                  alt="Selected"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}

            {/* Studio Mode: Prompt Input */}
            {selectedMode === 'edit' && (
              <div className="p-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Change something, add something — your call ... tap ✨ for a little magic."
                  className="w-full px-3 py-2 bg-white/10 backdrop-blur-md text-white placeholder-white/70 resize-none focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/15 transition-all duration-200 h-20 text-base rounded-xl"
                  maxLength={500}
                />
                
                {/* Generate Button Row with Magic Wand */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleEditGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1 py-3 bg-white text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                  >
                    {isGenerating ? 'Creating...' : 'Generate'}
                  </button>
                  
                  {/* Magic Wand Circle */}
                  <button
                    onClick={handleMagicWand}
                    disabled={isEnhancing || !prompt.trim()}
                    className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title={selectedMode === 'edit' ? "Enhance studio prompt with AI (free)" : "Enhance prompt with AI (free)"}
                  >
                    {isEnhancing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="text-lg">✨</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Preset Modes: Preset Selection */}
            {['presets', 'unrealreflection', 'parallelself', 'ghiblireact', 'cyber-siren'].includes(selectedMode) && (
              <div className="p-2">
                <div className="mb-3">
                  {/* Preset Grid - 2 columns with dynamic sizing */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Unreal Reflection Presets */}
                    {selectedMode === 'unrealreflection' && UNREAL_REFLECTION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetGenerate(preset.id)}
                        disabled={isGenerating}
                        className="bg-white/10 text-white text-left p-3 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px] flex items-center"
                      >
                        <div className="text-sm font-medium leading-tight">{preset.label}</div>
                      </button>
                    ))}
                    
                    {/* Parallel Self Presets */}
                    {selectedMode === 'parallelself' && PARALLEL_SELF_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetGenerate(preset.id)}
                        disabled={isGenerating}
                        className="bg-white/10 text-white text-left p-3 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px] flex items-center"
                      >
                        <div className="text-sm font-medium leading-tight">{preset.label}</div>
                      </button>
                    ))}
                    
                    {/* Ghibli Reaction Presets */}
                    {selectedMode === 'ghiblireact' && GHIBLI_REACTION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetGenerate(preset.id)}
                        disabled={isGenerating}
                        className="bg-white/10 text-white text-left p-3 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px] flex items-center"
                      >
                        <div className="text-sm font-medium leading-tight">{preset.label}</div>
                      </button>
                    ))}
                    
                    {/* Cyber Siren Presets */}
                    {selectedMode === 'cyber-siren' && CYBER_SIREN_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetGenerate(preset.id)}
                        disabled={isGenerating}
                        className="bg-white/10 text-white text-left p-3 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px] flex items-center"
                      >
                        <div className="text-sm font-medium leading-tight">{preset.label}</div>
                      </button>
                    ))}
                    
                    {/* Database Presets Mode */}
                    {selectedMode === 'presets' && (
                      <>
                        {loadingPresets ? (
                          <div className="col-span-2 p-3 bg-white/10 text-white/60 text-sm text-center rounded-lg min-h-[60px] flex items-center justify-center">
                            Loading presets...
                          </div>
                        ) : databasePresets.length > 0 ? (
                          databasePresets.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => handlePresetGenerate(preset.key)}
                              disabled={isGenerating}
                              className="bg-white/10 text-white text-left p-3 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px] flex items-center"
                            >
                              <div className="text-sm font-medium leading-tight">{preset.label}</div>
                            </button>
                          ))
                        ) : (
                          <div className="col-span-2 p-3 bg-white/10 text-white/60 text-sm text-center rounded-lg min-h-[60px] flex items-center justify-center">
                            No presets available
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4">
        {/* Generate button moved to prompt input section for Custom/Edit modes */}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileSelect(file);
          }
        }}
      />
    </div>
  );
};

export default MobileComposer;
