// src/hooks/usePresetRunner.ts
import { useRef, useState } from 'react';
import { PRESETS, OPTION_GROUPS } from '../utils/presets/types';
import { onPresetClick, onOptionClick } from '../utils/presets/handlers';
import { onStoryThemeClick } from '../utils/presets/story';

type PresetId = keyof typeof PRESETS;

type PendingRun =
  | { kind: 'preset'; id: PresetId }
  | { kind: 'option'; group: keyof typeof OPTION_GROUPS; key: string }
  | { kind: 'story'; theme: keyof typeof import('../utils/presets/story').STORY_THEMES };

export function usePresetRunner() {
  const pendingRef = useRef<PendingRun | null>(null);
  const [busy, setBusy] = useState(false);

  function queuePreset(id: PresetId) { 
    pendingRef.current = { kind: 'preset', id }; 
  }
  
  function queueOption(group: keyof typeof OPTION_GROUPS, key: string) {
    pendingRef.current = { kind: 'option', group, key };
  }
  
  function queueStory(theme: keyof typeof import('../utils/presets/story').STORY_THEMES) {
    pendingRef.current = { kind: 'story', theme };
  }

  async function onSourceReady(srcUrl: string) {
    // Called after Cloudinary upload succeeds
    const task = pendingRef.current;
    pendingRef.current = null;
    if (!task) return;

    setBusy(true);
    try {
      if (task.kind === 'preset') {
        await onPresetClick(task.id);
      } else if (task.kind === 'option') {
        await onOptionClick(task.group, task.key);
      } else {
        await onStoryThemeClick(task.theme);
      }
    } catch (error) {
      console.error('Preset runner error:', error);
    } finally {
      setBusy(false);
    }
  }

  function clearQueue() {
    pendingRef.current = null;
    setBusy(false);
  }

  return { queuePreset, queueOption, queueStory, onSourceReady, clearQueue, busy };
}
