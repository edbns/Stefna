// src/runner/kick.ts
import { useIntentQueue, hasHttpsUrl } from '../state/intentQueue';
import { PROFESSIONAL_PRESETS } from '../config/professional-presets';

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
      : PROFESSIONAL_PRESETS[pending.presetId as keyof typeof PROFESSIONAL_PRESETS]?.requiresSource ?? false;

    const src = needsSource ? getHttpsSourceOrThrow() : null;

    console.info('🚀 Running intent:', pending.kind, 'with source:', src);

    if (pending.kind === 'preset') {
      // For now, just log that we would run the preset
      // The actual generation is handled by the HomeNew component
      console.info('🎯 Would run preset:', pending.presetId);
      
      // Clear the intent since we're not actually running it here
      clearIntent();
    }
    
    console.info('✅ Intent completed successfully');
  } catch (error) {
    console.error('❌ Intent execution failed:', error);
    throw error;
  } finally {
    (kickRunIfReady as any)._busy = false;
  }
}
