// src/hooks/usePresetRunner.ts
import { useRef, useState } from 'react';
import { PROFESSIONAL_PRESETS } from '../config/professional-presets';
import { ensureSourceThenRun } from '../state/intentQueue';

type PresetKey = keyof typeof PROFESSIONAL_PRESETS;

export function usePresetRunner() {
  const pendingRef = useRef<PresetKey | null>(null);
  const [busy, setBusy] = useState(false);

  function queuePreset(id: PresetKey) { 
    pendingRef.current = id; 
  }

  async function runPending() {
    const presetId = pendingRef.current;
    if (!presetId) return;
    
    pendingRef.current = null;
    setBusy(true);
    
    try {
      await ensureSourceThenRun({ kind: 'preset', presetId });
    } finally {
      setBusy(false);
    }
  }

  return {
    queuePreset,
    runPending,
    busy,
    hasPending: pendingRef.current !== null
  };
}
