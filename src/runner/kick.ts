// src/runner/kick.ts
import { useIntentQueue, hasHttpsUrl } from '../state/intentQueue';
import { PRESETS, OPTION_GROUPS } from '../utils/presets/types';
import { resolvePreset } from '../utils/presets/types';
import { runPreset } from '../utils/presets/handlers';

function getHttpsSourceOrThrow(): string {
  const { sourceUrl } = useIntentQueue.getState();
  if (!hasHttpsUrl(sourceUrl)) {
    throw new Error('Pick a photo/video first, then apply a preset.');
  }
  return sourceUrl!;
}

export async function kickRunIfReady(): Promise<void> {
  // Single pending run at a time
  if ((kickRunIfReady as any)._busy) {
    console.info('🚀 Already running, skipping');
    return;
  }
  (kickRunIfReady as any)._busy = true;

  try {
    const { pending, sourceUrl, clearIntent } = useIntentQueue.getState();
    
    console.info('🚀 kickRunIfReady called:', { pending, hasSource: !!sourceUrl });
    
    if (!pending) {
      console.info('🚀 No pending intent, skipping');
      return;
    }

    // Determine if we need a source and get HTTPS source or throw
    const needsSource = pending.kind !== 'preset'
      ? true
      : PRESETS[pending.presetId as keyof typeof PRESETS]?.requiresSource ?? false;

    const src = needsSource ? getHttpsSourceOrThrow() : null;

    console.info('🚀 Running intent:', pending.kind, 'with source:', src);

    if (pending.kind === 'preset') {
      const preset = resolvePreset(pending.presetId as keyof typeof PRESETS);
      await runPreset(preset, src ?? undefined);
    }
    
    console.info('✅ Intent completed successfully');
  } catch (error) {
    console.error('❌ Intent execution failed:', error);
    throw error;
  } finally {
    (kickRunIfReady as any)._busy = false;
  }
}
