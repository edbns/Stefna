// src/runner/kick.ts
import { useIntentQueue } from '../state/intentQueue';
import { PRESETS, OPTION_GROUPS } from '../utils/presets/types';
import { resolvePreset } from '../utils/presets/types';
import { runPreset } from '../utils/presets/handlers';
import { onStoryThemeClick } from '../utils/presets/story';

function isHttps(u?: string | null): boolean {
  return !!u && /^https?:\/\//.test(u);
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

    // For i2i/restore/story that need a source, block until we have a proper URL
    const needsSource = pending.kind !== 'preset'
      ? true
      : PRESETS[pending.presetId as keyof typeof PRESETS]?.requiresSource ?? false;

    if (needsSource && !isHttps(sourceUrl)) {
      console.info('🚀 Waiting for HTTPS source URL, current:', sourceUrl);
      return; // wait until upload finishes
    }

    console.info('🚀 Running intent:', pending.kind, 'with source:', sourceUrl);

    if (pending.kind === 'preset') {
      const preset = resolvePreset(pending.presetId as keyof typeof PRESETS);
      await runPreset(preset, sourceUrl ?? undefined);
    } else if (pending.kind === 'time_machine') {
      const opt = OPTION_GROUPS.time_machine?.[pending.key];
      if (!opt) throw new Error(`TIME_MACHINE_OPT_MISSING: ${pending.key}`);
      const preset = resolvePreset(opt.use, opt.overrides);
      await runPreset(preset, sourceUrl ?? undefined, { 
        group: 'time_machine', 
        optionKey: pending.key 
      });
    } else if (pending.kind === 'restore') {
      const opt = OPTION_GROUPS.restore?.[pending.key];
      if (!opt) throw new Error(`RESTORE_OPT_MISSING: ${pending.key}`);
      const preset = resolvePreset(opt.use, opt.overrides);
      await runPreset(preset, sourceUrl ?? undefined, { 
        group: 'restore', 
        optionKey: pending.key 
      });
    } else if (pending.kind === 'story') {
      await onStoryThemeClick(pending.theme as any, sourceUrl ?? undefined);
    }
    
    console.info('✅ Intent completed successfully');
  } catch (error) {
    console.error('❌ Intent execution failed:', error);
    throw error;
  } finally {
    clearIntent();
    (kickRunIfReady as any)._busy = false;
  }
}
