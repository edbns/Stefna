// utils/presets/handlers.ts
import type { Preset, PresetId } from './types';
import { PRESETS, OPTION_GROUPS, resolvePreset } from './types';
import { buildAimlPayload } from './payload';

// Helper to resolve source from UI state (will be integrated with existing source resolution)
function resolveSourceOrToast(): string | null {
  // TODO: Integrate with existing source resolution logic from HomeNew
  // For now, this will be handled by the existing generation pipeline
  return null;
}

// Mock functions that will be replaced with actual implementations
async function callAimlApi(payload: any): Promise<any> {
  // This will be integrated with the existing AIML API call
  console.log('🚀 Calling AIML API with payload:', payload);
  return { success: true, resultUrl: 'mock-result-url' };
}

async function saveMediaToDbAndCloudinary(result: any): Promise<any> {
  // This will be integrated with existing save logic
  console.log('💾 Saving media to DB and Cloudinary:', result);
  return { id: 'mock-record-id', url: result.resultUrl };
}

function addResultToUi(record: any): void {
  // This will dispatch the generation-complete event
  console.log('🎉 Adding result to UI:', record);
  window.dispatchEvent(new CustomEvent('generation-complete', { 
    detail: { record, resultUrl: record.url, timestamp: Date.now() } 
  }));
}

function showToast(type: 'success' | 'error', message: string): void {
  // This will integrate with existing toast system
  console.log(`${type === 'success' ? '✅' : '❌'} Toast: ${message}`);
  window.dispatchEvent(new CustomEvent(`generation-${type}`, { 
    detail: { message, timestamp: Date.now() } 
  }));
}

// Core preset execution function
export async function runPreset(preset: Preset): Promise<void> {
  try {
    console.log('🎯 Running preset:', preset.label);
    
    // 1) Check source requirement
    const src = preset.requiresSource ? resolveSourceOrToast() : null;
    if (preset.requiresSource && !src) {
      showToast('error', 'Pick a photo/video first, then apply a preset.');
      return;
    }

    // 2) Build payload
    const payload = buildAimlPayload({ preset, src });
    console.log('📦 Built payload:', payload);

    // 3) Call model
    const result = await callAimlApi(payload);
    if (!result.success) {
      throw new Error('Generation failed');
    }

    // 4) Save to DB and Cloudinary
    const record = await saveMediaToDbAndCloudinary(result);

    // 5) Update UI
    addResultToUi(record);
    showToast('success', `${preset.label} applied!`);

  } catch (error) {
    console.error('❌ Preset execution failed:', error);
    showToast('error', 'Generation failed. Please try again.');
  }
}

// Direct preset click handler
export async function onPresetClick(presetId: PresetId): Promise<void> {
  try {
    const preset = resolvePreset(presetId);
    await runPreset(preset);
  } catch (error) {
    console.error('❌ Preset click failed:', error);
    showToast('error', `Failed to apply ${presetId}. Please try again.`);
  }
}

// Option click handler (time_machine, restore, story)
export async function onOptionClick(group: keyof typeof OPTION_GROUPS, key: string): Promise<void> {
  try {
    const opt = OPTION_GROUPS[group]?.[key];
    if (!opt) { 
      console.warn(`Option ${group}/${key} not configured`);
      showToast('error', 'Coming soon!'); 
      return; 
    }
    
    const preset = resolvePreset(opt.use, opt.overrides);
    console.log(`🔧 Resolved option ${group}/${key} to preset:`, preset.label);
    await runPreset(preset);
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

// Enhanced option click with telemetry
export async function onOptionClickWithTelemetry(group: keyof typeof OPTION_GROUPS, key: string): Promise<void> {
  const opt = OPTION_GROUPS[group]?.[key];
  if (!opt) { 
    showToast('error', 'Coming soon!'); 
    return; 
  }
  
  const preset = resolvePreset(opt.use, opt.overrides);
  await withTelemetry(
    { 
      runId: crypto.randomUUID(), 
      presetId: preset.id, 
      group, 
      optionKey: key 
    }, 
    () => runPreset(preset)
  );
}
