// utils/presets/handlers.ts
import type { Preset, PresetId } from './types';
import { OPTION_GROUPS, resolvePreset } from './types';
import { runGeneration } from '../../services/generationPipeline';
import type { GenerateJob } from '../../types/generation';
import { getCurrentSourceUrl } from '../../stores/sourceStore';


function showToast(type: 'success' | 'error', message: string): void {
  window.dispatchEvent(new CustomEvent(`generation-${type}`, { 
    detail: { message, timestamp: Date.now() } 
  }));
}

// A. Gate generation on a real https asset URL
function hasHttpsUrl(u?: string | null): boolean {
  return typeof u === 'string' && u.startsWith('https://');
}

// Preflight guard: ensure we have a valid HTTPS source before any generation
function validateHttpsSource(sourceUrl?: string | null): string | undefined {
  if (!hasHttpsUrl(sourceUrl)) {
    console.warn('🚫 Blocked non-https source:', sourceUrl);
    showToast('error', 'Please add/upload an image first.');
    return undefined;
  }
  console.info('✅ HTTPS source validated:', sourceUrl);
  return sourceUrl;
}

// Core preset execution function with proper runId tracking
export async function runPreset(preset: Preset, srcOverride?: string, metadata?: { group?: string; optionKey?: string }): Promise<any> {
  const runId = crypto.randomUUID();
  console.info(`🎯 [${runId}] Running preset:`, preset.label);
  
  try {
    // 1) Source: prefer override (fresh Cloudinary URL), else global store
    let src: string | undefined = preset.requiresSource ? (srcOverride ?? (getCurrentSourceUrl() || undefined)) : undefined;

    // 2) Preflight HTTPS validation - never pass blob:/data:/preview into API
    if (preset.requiresSource) {
      const validSrc = validateHttpsSource(src);
      if (!validSrc) {
        console.warn(`🚫 [${runId}] Blocked non-https source:`, src);
        return null;
      }
      // Update src to validated version
      src = validSrc;
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
      runId,
      group: metadata?.group as any || null,
      optionKey: metadata?.optionKey || null,
      parentId: null // Will be set by the generation pipeline if needed
    };

    // 4) Final HTTPS gate before API call (no more preview/blob causing 400s)
    if (preset.requiresSource && job.params.image_url) {
      const imageUrl = String(job.params.image_url);
      if (!hasHttpsUrl(imageUrl)) {
        console.warn(`🚫 [${runId}] Blocked non-https source in payload:`, imageUrl);
        showToast('error', 'Invalid source URL. Please upload a new file.');
        return null;
      }
    }

    // 5) Use the existing generation pipeline
    const result = await runGeneration(() => Promise.resolve(job));
    
    // 6) Check if this is a stale result (race condition protection)
    if (!result) {
      console.warn(`⚠️ [${runId}] No result returned from generation pipeline`);
      return null;
    }
    
    if (!result.success) {
      console.warn(`❌ [${runId}] Generation failed:`, result);
      showToast('error', result?.error ?? 'Generation failed. Please try again.');
      return null; // IMPORTANT: bail out here so no success logs fire
    }

    // Happy path only below
    console.info(`✅ [${runId}] Generation completed successfully`);
            // Preset applied silently - no toast notification
    return result;

  } catch (error) {
    console.error(`❌ [${runId}] Preset execution failed:`, error);
    showToast('error', 'Generation failed. Please try again.');
    return null;
  }
}

// B. Queue preset clicks until the asset URL is ready (no more 400s)
let pendingPreset: { presetId: PresetId; srcOverride?: string } | null = null;
let isGenerating = false;

// Direct preset click handler with HTTPS validation and queueing
export async function onPresetClick(presetId: PresetId, srcOverride?: string): Promise<void> {
  try {
    const preset = resolvePreset(presetId);
    
    // Don't start until we actually have an https URL
    if (!hasHttpsUrl(srcOverride ?? getCurrentSourceUrl()) || isGenerating) {
      pendingPreset = { presetId, srcOverride };
      showToast('error', 'Add/upload media first (we\'ll auto-run when it\'s ready).');
      return;
    }
    
    await generatePreset(preset, srcOverride);
  } catch (error) {
    console.error('❌ Preset click failed:', error);
    showToast('error', `Failed to apply ${presetId}. Please try again.`);
  }
}



// Option click handler with HTTPS validation and queueing
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
    
    // Don't start until we actually have an https URL
    if (!hasHttpsUrl(srcOverride ?? getCurrentSourceUrl()) || isGenerating) {
      pendingPreset = { presetId: opt.use, srcOverride };
      showToast('error', 'Add/upload media first (we\'ll auto-run when it\'s ready).');
      return;
    }
    
    await generatePreset(preset, srcOverride, { group, optionKey: key });
  } catch (error) {
    console.error(`❌ Option click failed for ${group}/${key}:`, error);
    showToast('error', 'Generation failed. Please try again.');
  }
}



// Core generation function with proper state management
async function generatePreset(preset: Preset, srcOverride?: string, metadata?: { group?: string; optionKey?: string }): Promise<void> {
  if (isGenerating) {
    console.warn('🚫 Generation already in progress, ignoring new request');
    return;
  }
  
  isGenerating = true;
  try {
    await runPreset(preset, srcOverride, metadata);
  } finally {
    isGenerating = false;
    
    // Check if we have a pending preset to run now
    if (pendingPreset && hasHttpsUrl(pendingPreset.srcOverride ?? getCurrentSourceUrl())) {
      const { presetId, srcOverride: pendingSrc } = pendingPreset;
      pendingPreset = null; // Clear before running to prevent loops
      
      console.info('🔄 Running pending preset:', presetId);
      const preset = resolvePreset(presetId);
      await generatePreset(preset, pendingSrc);
    }
  }
}



// Public function to check if we can run a preset now
export function canRunPreset(srcOverride?: string): boolean {
  return hasHttpsUrl(srcOverride ?? getCurrentSourceUrl()) && !isGenerating;
}

// Public function to get pending preset info
export function getPendingPreset() {
  return pendingPreset;
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
