// src/hooks/usePresetRunner.ts
import { useRef, useState } from 'react';
import { PRESETS, OPTION_GROUPS } from '../utils/presets/types';
import { onPresetClick, onOptionClick } from '../utils/presets/handlers';

import { setCurrentSourceUrl } from '../stores/sourceStore';

type PresetId = keyof typeof PRESETS;

type PendingRun =
  | { kind: 'preset'; id: PresetId }
  | { kind: 'option'; group: keyof typeof OPTION_GROUPS; key: string };

export function usePresetRunner() {
  const pendingRef = useRef<PendingRun | null>(null);
  const [busy, setBusy] = useState(false);

  function queuePreset(id: PresetId) { 
    pendingRef.current = { kind: 'preset', id }; 
  }
  
  function queueOption(group: keyof typeof OPTION_GROUPS, key: string) {
    pendingRef.current = { kind: 'option', group, key };
  }
  


  async function onSourceReady(srcUrl: string) {
    // Called after Cloudinary upload succeeds
    // Always set the real Cloudinary URL as the current source, then run
    setCurrentSourceUrl(srcUrl); // <-- critical line
    
    const task = pendingRef.current;
    pendingRef.current = null;
    if (!task) return;

    setBusy(true);
    try {
      if (task.kind === 'preset') {
        await onPresetClick(task.id, srcUrl); // pass srcOverride
      } else if (task.kind === 'option') {
        await onOptionClick(task.group, task.key, srcUrl); // pass srcOverride
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

  return { queuePreset, queueOption, onSourceReady, clearQueue, busy };
}
