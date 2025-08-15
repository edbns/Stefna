// src/components/PresetButton.tsx
import { useIntentQueue } from '../state/intentQueue';
import { kickRunIfReady } from '../runner/kick';
import { useSelectedPreset } from '../stores/selectedPreset';
import { PRESETS } from '../utils/presets/types';

interface PresetButtonProps {
  presetId: keyof typeof PRESETS;
  children: React.ReactNode;
  className?: string;
}

export function PresetButton({ presetId, children, className = '' }: PresetButtonProps) {
  const { setIntent, sourceUrl } = useIntentQueue();
  const { setSelectedPreset } = useSelectedPreset();

  async function onClick() {
    console.info('🎯 Preset button clicked:', presetId);
    
    // Escape hatch for direct mode (bypass queue while debugging)
    if (import.meta.env.VITE_ONE_CLICK_DIRECT === '1') {
      console.info('🚨 Using direct mode (bypass intent queue)');
      // Direct mode would need pickAndUpload implementation
      console.warn('Direct mode not implemented yet - falling back to queue');
    }
    
    // Keep UI in sync
    setSelectedPreset(presetId);
    
    // Set intent in queue
    setIntent({ kind: 'preset', presetId: presetId as string });

    if (!sourceUrl || !/^https?:\/\//.test(sourceUrl)) {
      // No source yet → prompt file picker; upload handler will call kick()
      console.info('🎯 No source, opening file picker');
      document.getElementById('hidden-file-input')?.click();
    } else {
      // Source already present → run immediately
      console.info('🎯 Source available, running immediately');
      await kickRunIfReady();
    }
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
  const { setIntent, sourceUrl } = useIntentQueue();

  async function onClick() {
    console.info('🕰️ Time Machine button clicked:', optionKey);
    
    setIntent({ kind: 'time_machine', key: optionKey });

    if (!sourceUrl || !/^https?:\/\//.test(sourceUrl)) {
      console.info('🕰️ No source, opening file picker');
      document.getElementById('hidden-file-input')?.click();
    } else {
      console.info('🕰️ Source available, running immediately');
      await kickRunIfReady();
    }
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
  const { setIntent, sourceUrl } = useIntentQueue();

  async function onClick() {
    console.info('🔧 Restore button clicked:', optionKey);
    
    setIntent({ kind: 'restore', key: optionKey });

    if (!sourceUrl || !/^https?:\/\//.test(sourceUrl)) {
      console.info('🔧 No source, opening file picker');
      document.getElementById('hidden-file-input')?.click();
    } else {
      console.info('🔧 Source available, running immediately');
      await kickRunIfReady();
    }
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

// Story Button
interface StoryButtonProps {
  theme: string;
  children: React.ReactNode;
  className?: string;
}

export function StoryButton({ theme, children, className = '' }: StoryButtonProps) {
  const { setIntent, sourceUrl } = useIntentQueue();

  async function onClick() {
    console.info('📖 Story button clicked:', theme);
    
    setIntent({ kind: 'story', theme });

    if (!sourceUrl || !/^https?:\/\//.test(sourceUrl)) {
      console.info('📖 No source, opening file picker');
      document.getElementById('hidden-file-input')?.click();
    } else {
      console.info('📖 Source available, running immediately');
      await kickRunIfReady();
    }
  }

  return (
    <button 
      onClick={onClick}
      className={`story-button ${className}`}
    >
      {children}
    </button>
  );
}
