// utils/presets/handlers.ts
import type { Preset, PresetId } from './types';
import { OPTION_GROUPS, resolvePreset } from './types';
import { runGeneration, GenerateJob } from '../../services/generationPipeline';
import { getCurrentSourceUrl } from '../../stores/sourceStore';

function showToast(type: 'success' | 'error', message: string): void {
  window.dispatchEvent(new CustomEvent(`generation-${type}`, { 
    detail: { message, timestamp: Date.now() } 
  }));
}

// Core preset execution function
export async function runPreset(preset: Preset, srcOverride?: string, metadata?: { group?: string; optionKey?: string }): Promise<any> {
  try {
    console.log('🎯 Running preset:', preset.label);
    
    // 1) Source: prefer override (fresh Cloudinary URL), else global store
    const src = preset.requiresSource ? (srcOverride ?? getCurrentSourceUrl()) : null;

    // 2) Hard guard: never pass blob:/data:/preview into API
    if (preset.requiresSource) {
      if (!src || !/^https?:\/\//.test(src)) {
        // Do NOT attempt API call; let the queue wait for upload
        console.warn('🚫 Blocked non-https source:', src);
        showToast('error', 'Pick a photo/video first, then apply a preset.');
        return null;
      }
      console.info('✅ HTTPS source validated:', src);
    }

    // 3) Create generation job with both image_url and sourceUrl for compatibility
    const job: GenerateJob = {
      mode: preset.mode as any,
      presetId: preset.id,
      prompt: preset.prompt,
      params: {
        strength: preset.strength || 0.7,
        negative_prompt: preset.negative_prompt,
        model: preset.model || 'eagle',
        post: preset.post,
        image_url: src || undefined,    // server expects image_url
        sourceUrl: src || undefined     // keep old field for readers
      },
      source: src ? { url: src } : undefined,
      runId: crypto.randomUUID(),
      group: metadata?.group as any || null,
      optionKey: metadata?.optionKey || null,
      parentId: null // Will be set by the generation pipeline if needed
    };

    // 4) Final HTTPS gate before API call (no more preview/blob causing 400s)
    if (preset.requiresSource && job.params.image_url) {
      const imageUrl = String(job.params.image_url);
      if (!/^https?:\/\//.test(imageUrl)) {
        console.warn('🚫 Blocked non-https source in payload:', imageUrl);
        showToast('error', 'Invalid source URL. Please upload a new file.');
        return null;
      }
    }

    // 5) Use the existing generation pipeline
    const result = await runGeneration(() => Promise.resolve(job));
    
    if (!result?.success) {
      console.warn('❌ Generation failed:', result);
      showToast('error', result?.error ?? 'Generation failed. Please try again.');
      return null; // IMPORTANT: bail out here so no success logs fire
    }

    // Happy path only below
    console.info('✅ Generation completed successfully');
    showToast('success', `${preset.label} applied!`);
    return result;

  } catch (error) {
    console.error('❌ Preset execution failed:', error);
    showToast('error', 'Generation failed. Please try again.');
    return null;
  }
}

// Direct preset click handler
export async function onPresetClick(presetId: PresetId, srcOverride?: string): Promise<void> {
  try {
    const preset = resolvePreset(presetId);
    await runPreset(preset, srcOverride);
  } catch (error) {
    console.error('❌ Preset click failed:', error);
    showToast('error', `Failed to apply ${presetId}. Please try again.`);
  }
}

// Option click handler (time_machine, restore)
export async function onOptionClick(group: keyof typeof OPTION_GROUPS, key: string, srcOverride?: string): Promise<void> {
  try {
    const opt = OPTION_GROUPS[group]?.[key];
    if (!opt) { 
      console.warn(`Option ${group}/${key} not configured`);
      showToast('error', 'Coming soon!'); 
      return; 
    }
    
    const preset = resolvePreset(opt.use, opt.overrides);
    console.log(`🔧 Resolved option ${group}/${key} to preset:`, preset.label);
    console.info('🧭 Using new preset system', { mode: group, key });
    
    await runPreset(preset, srcOverride, { group, optionKey: key });
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
