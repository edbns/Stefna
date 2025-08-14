// utils/presets/handlers.ts
import type { Preset, PresetId } from './types';
import { PRESETS, OPTION_GROUPS, resolvePreset } from './types';
import { runGeneration, GenerateJob } from '../../services/generationPipeline';

// Helper to resolve source from UI state (will be integrated with existing source resolution)
function resolveSourceOrToast(): { id: string; url: string } | null {
  // TODO: Integrate with existing source resolution logic from HomeNew
  // For now, this will be handled by the calling component
  return null;
}

function showToast(type: 'success' | 'error', message: string): void {
  window.dispatchEvent(new CustomEvent(`generation-${type}`, { 
    detail: { message, timestamp: Date.now() } 
  }));
}

// Core preset execution function
export async function runPreset(preset: Preset, source?: { id: string; url: string }, metadata?: { group?: string; optionKey?: string }): Promise<any> {
  try {
    console.log('🎯 Running preset:', preset.label);
    
    // 1) Check source requirement
    const src = source || (preset.requiresSource ? resolveSourceOrToast() : null);
    if (preset.requiresSource && !src) {
      showToast('error', 'Pick a photo/video first, then apply a preset.');
      return null;
    }

    // 2) Create generation job
    const job: GenerateJob = {
      mode: preset.mode as any,
      presetId: preset.id,
      prompt: preset.prompt,
      params: {
        strength: preset.strength || 0.7,
        negative_prompt: preset.negative_prompt,
        model: preset.model || 'eagle',
        post: preset.post
      },
      source: src ? { url: src.url } : undefined,
      runId: crypto.randomUUID(),
      group: metadata?.group as any || null,
      optionKey: metadata?.optionKey || null,
      parentId: src?.id || null
    };

    // 3) Use the existing generation pipeline
    const result = await runGeneration(() => Promise.resolve(job));
    
    if (result?.success) {
      showToast('success', `${preset.label} applied!`);
    }
    
    return result;

  } catch (error) {
    console.error('❌ Preset execution failed:', error);
    showToast('error', 'Generation failed. Please try again.');
    return null;
  }
}

// Direct preset click handler
export async function onPresetClick(presetId: PresetId, source?: { id: string; url: string }): Promise<void> {
  try {
    const preset = resolvePreset(presetId);
    await runPreset(preset, source);
  } catch (error) {
    console.error('❌ Preset click failed:', error);
    showToast('error', `Failed to apply ${presetId}. Please try again.`);
  }
}

// Option click handler (time_machine, restore)
export async function onOptionClick(group: keyof typeof OPTION_GROUPS, key: string, source?: { id: string; url: string }): Promise<void> {
  try {
    const opt = OPTION_GROUPS[group]?.[key];
    if (!opt) { 
      console.warn(`Option ${group}/${key} not configured`);
      showToast('error', 'Coming soon!'); 
      return; 
    }
    
    const preset = resolvePreset(opt.use, opt.overrides);
    console.log(`🔧 Resolved option ${group}/${key} to preset:`, preset.label);
    
    await runPreset(preset, source, { group, optionKey: key });
  } catch (error) {
    console.error(`❌ Option click failed for ${group}/${key}:`, error);
    showToast('error', 'Generation failed. Please try again.');
  }
}

// Telemetry wrapper (optional)
export async function withTelemetry<T>(
  ctx: { runId: string; presetId: string; group?: string; optionKey?: string },
  fn: () => Promise<T>
): Promise<T> {
  const t0 = performance.now();
  let success = false, error: unknown;
  try {
    const out = await fn(); 
    success = true; 
    return out;
  } catch (e) { 
    error = e; 
    throw e; 
  } finally {
    const durationMs = Math.round(performance.now() - t0);
    console.info('📊 Telemetry:', { 
      ...ctx, 
      success, 
      durationMs, 
      error: error ? String(error) : undefined 
    });
  }
}
