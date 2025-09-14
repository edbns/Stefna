// Mobile Browser Generation Modes Component
// Converted from mobile app GenerationModes.tsx
import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export type GenerationMode = 'custom-prompt' | 'edit-photo' | 'presets' | 'unreal-reflection' | 'ghibli-reaction' | 'neo-glitch';

interface MobileGenerationModesProps {
  selectedMode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  onGenerate: (presetId?: string, mode?: GenerationMode) => void;
  customPrompt: string;
  onCustomPromptChange: (text: string) => void;
  isGenerating: boolean;
  availablePresets?: any[];
  presetsLoading?: boolean;
  presetsError?: string | null;
}

export default function MobileGenerationModes({
  selectedMode,
  onModeChange,
  onGenerate,
  customPrompt,
  onCustomPromptChange,
  isGenerating,
  availablePresets = [],
  presetsLoading = false,
  presetsError = null,
}: MobileGenerationModesProps) {
  const [showPromptInput, setShowPromptInput] = useState(false);

  const handleModePress = (mode: GenerationMode) => {
    console.log('[MobileGenerationModes] Mode pressed:', mode);
    
    onModeChange(mode);
    
    // Show prompt input for custom and edit modes
    if (mode === 'custom-prompt' || mode === 'edit-photo') {
      setShowPromptInput(true);
    } else {
      setShowPromptInput(false);
    }
  };

  const getModeTitle = (mode: GenerationMode): string => {
    const titles: Record<GenerationMode, string> = {
      'custom-prompt': 'Custom',
      'edit-photo': 'Studio',
      'presets': 'Presets',
      'unreal-reflection': 'Unreal Reflection',
      'ghibli-reaction': 'Ghibli Reaction',
      'neo-glitch': 'Neo Tokyo Glitch',
    };
    return titles[mode] || mode;
  };

  const handleGenerate = () => {
    if ((selectedMode === 'custom-prompt' || selectedMode === 'edit-photo') && !customPrompt.trim()) {
      alert('Please enter a prompt for this generation mode.');
      return;
    }
    
    if (!selectedMode) {
      alert('Generation mode is not selected. Please try again.');
      return;
    }
    
    onGenerate(undefined, selectedMode);
  };

  const handlePresetClick = (presetId: string) => {
    console.log('[MobileGenerationModes] Preset clicked:', presetId);
    
    if (!selectedMode) {
      alert('Generation mode is not selected. Please try again.');
      return;
    }
    
    // Auto-run generation immediately when preset is clicked
    onGenerate(presetId, selectedMode);
  };

  const handleMagicWand = async () => {
    try {
      if (!customPrompt.trim()) return;
      
      // Call backend magic-wand function
      const response = await fetch('/.netlify/functions/magic-wand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customPrompt, enhanceNegativePrompt: false })
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to enhance prompt');
      }
      
      onCustomPromptChange(data.enhancedPrompt || customPrompt);
    } catch (err: any) {
      alert(err?.message || 'Failed to enhance prompt.');
    }
  };

  // Get current week's presets from database
  const getCurrentWeekPresets = () => {
    return availablePresets.filter(preset => preset.isActive);
  };

  // Define modes in website order: Custom, Edit (Studio), Presets, Unreal Reflection, Ghibli React, Neo Tokyo
  const modes: GenerationMode[] = ['custom-prompt', 'edit-photo', 'presets', 'unreal-reflection', 'ghibli-reaction', 'neo-glitch'];
  
  // Split into two rows of 3 modes each
  const firstRow = modes.slice(0, 3);
  const secondRow = modes.slice(3, 6);

  return (
    <div className="mobile-generation-modes">
      {/* Mode Selection - 2 rows of 3 modes each */}
      <div className="modes-grid">
        {/* First Row */}
        <div className="modes-row">
          {firstRow.map((mode) => (
            <button
              key={mode}
              className={`mode-button ${selectedMode === mode ? 'mode-button-selected' : ''}`}
              onClick={() => handleModePress(mode)}
            >
              <span className="mode-title">{getModeTitle(mode)}</span>
            </button>
          ))}
        </div>

        {/* Options appear full width under first row */}
        {(selectedMode === 'custom-prompt' || selectedMode === 'edit-photo') && showPromptInput && (
          <div className="prompt-container">
            <div className="prompt-input-wrapper">
              <textarea
                className="prompt-input"
                value={customPrompt}
                onChange={(e) => onCustomPromptChange(e.target.value)}
                placeholder={
                  selectedMode === 'custom-prompt'
                    ? "Type something weird. We'll make it art ... tap ✨ for a little magic."
                    : "Change something, add something — your call ... tap ✨ for a little magic."
                }
                rows={3}
              />
              
              {/* Magic Wand Button - Inside text input */}
              <button
                className="magic-wand-button"
                onClick={handleMagicWand}
                disabled={!customPrompt.trim() || isGenerating}
                title="Enhance prompt with AI"
              >
                <span className="magic-wand-icon">✨</span>
              </button>
              
              {/* Generate Button - Inside text input */}
              <button
                className={`generate-icon-button ${(!customPrompt.trim() || isGenerating) ? 'generate-icon-button-disabled' : ''}`}
                onClick={handleGenerate}
                disabled={!customPrompt.trim() || isGenerating}
                title="Generate"
              >
                {isGenerating ? (
                  <div className="spinner" />
                ) : (
                  <ArrowUp size={16} />
                )}
              </button>
            </div>
          </div>
        )}
        
        {selectedMode === 'presets' && (
          <div className="preset-container">
            {presetsLoading ? (
              <div className="loading-container">
                <div className="spinner" />
                <span className="loading-text">Loading presets...</span>
              </div>
            ) : presetsError ? (
              <div className="error-container">
                <span className="error-text">Failed to load presets</span>
                <span className="error-subtext">{presetsError}</span>
                <button 
                  className="retry-button" 
                  onClick={() => window.location.reload()}
                >
                  <span className="retry-button-text">Retry</span>
                </button>
              </div>
            ) : (
              <div className="preset-grid">
                {(() => {
                  const currentPresets = getCurrentWeekPresets();
                  const firstRow = currentPresets.slice(0, 3);
                  const secondRow = currentPresets.slice(3, 5);
                  
                  return (
                    <>
                      <div className="preset-row">
                        {firstRow.map((preset) => (
                          <button 
                            key={preset.id} 
                            className="preset-button" 
                            onClick={() => handlePresetClick(preset.key)}
                          >
                            <span className="preset-text">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="preset-row">
                        {secondRow.map((preset) => (
                          <button 
                            key={preset.id} 
                            className="preset-button" 
                            onClick={() => handlePresetClick(preset.key)}
                          >
                            <span className="preset-text">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Second Row */}
        <div className="modes-row">
          {secondRow.map((mode) => (
            <button
              key={mode}
              className={`mode-button ${selectedMode === mode ? 'mode-button-selected' : ''}`}
              onClick={() => handleModePress(mode)}
            >
              <span className="mode-title">{getModeTitle(mode)}</span>
            </button>
          ))}
        </div>
        
        {/* Options appear full width under second row */}
        {selectedMode === 'unreal-reflection' && (
          <div className="preset-container">
            <div className="preset-grid">
              <div className="preset-row">
                <button className="preset-button" onClick={() => handlePresetClick('unreal_reflection_digital_monk')}>
                  <span className="preset-text">Digital Monk</span>
                </button>
                <button className="preset-button" onClick={() => handlePresetClick('unreal_reflection_urban_oracle')}>
                  <span className="preset-text">Urban Oracle</span>
                </button>
                <button className="preset-button" onClick={() => handlePresetClick('unreal_reflection_desert_mirror')}>
                  <span className="preset-text">Desert Mirror</span>
                </button>
              </div>
              <div className="preset-row">
                <button className="preset-button" onClick={() => handlePresetClick('unreal_reflection_lumin_void')}>
                  <span className="preset-text">Lumin Void</span>
                </button>
                <button className="preset-button" onClick={() => handlePresetClick('unreal_reflection_prism_break')}>
                  <span className="preset-text">Prism Break</span>
                </button>
                <button className="preset-button" onClick={() => handlePresetClick('unreal_reflection_chromatic_bloom')}>
                  <span className="preset-text">Chromatic Bloom</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedMode === 'ghibli-reaction' && (
          <div className="preset-container">
            <div className="preset-grid">
              <div className="preset-row">
                <button className="preset-button" onClick={() => handlePresetClick('ghibli_tears')}>
                  <span className="preset-text">Tears</span>
                </button>
                <button className="preset-button" onClick={() => handlePresetClick('ghibli_shock')}>
                  <span className="preset-text">Shock</span>
                </button>
                <button className="preset-button" onClick={() => handlePresetClick('ghibli_sparkle')}>
                  <span className="preset-text">Sparkle</span>
                </button>
              </div>
              <div className="preset-row">
                <button className="preset-button" onClick={() => handlePresetClick('ghibli_sadness')}>
                  <span className="preset-text">Sadness</span>
                </button>
                <button className="preset-button" onClick={() => handlePresetClick('ghibli_love')}>
                  <span className="preset-text">Love</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedMode === 'neo-glitch' && (
          <div className="preset-container">
            <div className="preset-grid">
              <div className="preset-row">
                <button className="preset-button" onClick={() => handlePresetClick('neo_tokyo_base')}>
                  <span className="preset-text">Base</span>
                </button>
                <button className="preset-button" onClick={() => handlePresetClick('neo_tokyo_visor')}>
                  <span className="preset-text">Glitch Visor</span>
                </button>
                <button className="preset-button" onClick={() => handlePresetClick('neo_tokyo_tattoos')}>
                  <span className="preset-text">Tech Tattoos</span>
                </button>
              </div>
              <div className="preset-row">
                <button className="preset-button" onClick={() => handlePresetClick('neo_tokyo_scanlines')}>
                  <span className="preset-text">Scanline FX</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .mobile-generation-modes {
          padding: 20px;
        }
        
        .modes-grid {
          margin-bottom: 16px;
        }
        
        .modes-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 8px;
        }
        
        .mode-button {
          flex: 1;
          background-color: #ffffff;
          border-radius: 8px;
          padding: 12px;
          min-height: 50px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid #333333;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .mode-button:hover {
          background-color: #f5f5f5;
        }
        
        .mode-button-selected {
          background-color: #ffffff;
          border-color: #000000;
          border-width: 2px;
        }
        
        .mode-title {
          font-size: 13px;
          font-weight: 500;
          color: #000000;
          text-align: center;
        }
        
        .prompt-container {
          margin-top: 8px;
          margin-bottom: 12px;
        }
        
        .prompt-input-wrapper {
          position: relative;
          background-color: #1a1a1a;
          border-radius: 12px;
          min-height: 100px;
          border: 1px solid #333333;
        }
        
        .prompt-input {
          background-color: transparent;
          padding: 20px;
          padding-right: 80px;
          font-size: 14px;
          color: #ffffff;
          min-height: 100px;
          width: 100%;
          border: none;
          outline: none;
          resize: vertical;
          font-family: inherit;
        }
        
        .prompt-input::placeholder {
          color: #666666;
        }
        
        .magic-wand-button {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }
        
        .magic-wand-button:hover {
          opacity: 1;
        }
        
        .magic-wand-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .magic-wand-icon {
          font-size: 18px;
          color: #ffffff;
        }
        
        .generate-icon-button {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          background-color: #ffffff;
          border-radius: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .generate-icon-button:hover {
          background-color: #f0f0f0;
        }
        
        .generate-icon-button-disabled {
          background-color: #cccccc;
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #000000;
          border-top-color: transparent;
          border-radius: 8px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .preset-container {
          margin-top: 8px;
          margin-bottom: 12px;
        }
        
        .preset-grid {
          display: flex;
          flex-direction: column;
        }
        
        .preset-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          gap: 8px;
        }
        
        .preset-button {
          flex: 1;
          background-color: #1a1a1a;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          min-height: 40px;
          justify-content: center;
          border: 1px solid #333333;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .preset-button:hover {
          background-color: #2a2a2a;
        }
        
        .preset-text {
          font-size: 12px;
          font-weight: 500;
          color: #ffffff;
          text-align: center;
        }
        
        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 0;
        }
        
        .loading-text {
          font-size: 14px;
          color: #ffffff;
          margin-left: 8px;
        }
        
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 0;
        }
        
        .error-text {
          font-size: 16px;
          font-weight: 600;
          color: #ff4444;
          text-align: center;
          margin-bottom: 4px;
        }
        
        .error-subtext {
          font-size: 12px;
          color: #cccccc;
          text-align: center;
          margin-bottom: 16px;
        }
        
        .retry-button {
          background-color: #ffffff;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }
        
        .retry-button-text {
          font-size: 14px;
          font-weight: 600;
          color: #000000;
        }
      `}</style>
    </div>
  );
}
