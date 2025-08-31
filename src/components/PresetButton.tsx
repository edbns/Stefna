// src/components/PresetButton.tsx
import React from 'react';
import { ensureSourceThenRun } from '../state/intentQueue';
import { useSelectedPreset } from '../stores/selectedPreset';
import { PROFESSIONAL_PRESETS } from '../config/professional-presets';

type PresetKey = keyof typeof PROFESSIONAL_PRESETS;

interface PresetButtonProps {
  presetId: PresetKey;
  children: React.ReactNode;
  className?: string;
}

export function PresetButton({ presetId, children, className = '' }: PresetButtonProps) {
  const { setSelectedPreset } = useSelectedPreset();

  async function onClick() {
    console.info('🎯 Preset button clicked:', presetId);
    
    // Keep UI in sync
    setSelectedPreset(presetId);
    
    // Close composer with 50ms delay
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('close-composer'));
    }, 50);
    
    // Use single orchestration point - no direct runs
    await ensureSourceThenRun({ kind: 'preset', presetId: presetId as string });
  }

  return (
    <button 
      onClick={onClick}
      className={`preset-button ${className}`}
    >
      {children}
    </button>
  );
}


