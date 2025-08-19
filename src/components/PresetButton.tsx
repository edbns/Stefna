// src/components/PresetButton.tsx
import { ensureSourceThenRun } from '../state/intentQueue';
import { useSelectedPreset } from '../stores/selectedPreset';
import { PRESETS } from '../utils/presets/types';

interface PresetButtonProps {
  presetId: keyof typeof PRESETS;
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

// Time Machine Button
interface TimeMachineButtonProps {
  optionKey: string;
  children: React.ReactNode;
  className?: string;
}

export function TimeMachineButton({ optionKey, children, className = '' }: TimeMachineButtonProps) {
  async function onClick() {
    console.info('🕰️ Time Machine button clicked:', optionKey);
    
    // Close composer with 50ms delay
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('close-composer'));
    }, 50);
    
    await ensureSourceThenRun({ kind: 'time_machine', key: optionKey });
  }

  return (
    <button 
      onClick={onClick}
      className={`time-machine-button ${className}`}
    >
      {children}
    </button>
  );
}

// Restore Button
interface RestoreButtonProps {
  optionKey: string;
  children: React.ReactNode;
  className?: string;
}

export function RestoreButton({ optionKey, children, className = '' }: RestoreButtonProps) {
  async function onClick() {
    console.info('🔧 Restore button clicked:', optionKey);
    
    // Close composer with 50ms delay
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('close-composer'));
    }, 50);
    
    await ensureSourceThenRun({ kind: 'restore', key: optionKey });
  }

  return (
    <button 
      onClick={onClick}
      className={`restore-button ${className}`}
    >
      {children}
    </button>
  );
}


