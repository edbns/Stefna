// router.ts - Advanced Region-Aware Editing Router
import { isEmotionMaskPreset, getEmotionMaskPreset } from '../presets/emotionmask';
import { isGhibliReactionPreset, getGhibliReactionPreset } from '../presets/ghibliReact';
import { isNeoTokyoGlitchPreset, getNeoTokyoGlitchPreset } from '../presets/neoTokyoGlitch';
import { isAdvancedEditingPreset, getAdvancedEditingPreset } from '../presets/advancedEditing';
import { PRESETS, PresetConfig } from '../config/presets';
import { EditPreset, hardenForIdentity, wrapAsBackgroundGrade } from '../types/editing';

export function buildPayload(presetId: string, image_url: string) {
  // Advanced Editing Presets → Region-aware with subject locking
  if (isAdvancedEditingPreset(presetId)) {
    const preset = getAdvancedEditingPreset(presetId)!;
    return buildAdvancedPayload(preset, image_url);
  }

  // Minimal families → Flux i2i (AIML)
  if (isEmotionMaskPreset(presetId)) {
    const p = getEmotionMaskPreset(presetId)!;
    return { model: p.model, prompt: p.prompt, image_url, strength: clamp(p.strength, 0.10, 0.15), num_variations: 1 };
  }
  if (isGhibliReactionPreset(presetId)) {
    const p = getGhibliReactionPreset(presetId)!;
    return { model: p.model, prompt: p.prompt, image_url, strength: clamp(p.strength, 0.12, 0.18), num_variations: 1 };
  }
  if (isNeoTokyoGlitchPreset(presetId)) {
    const p = getNeoTokyoGlitchPreset(presetId)!;
    return { model: p.model, prompt: p.prompt, image_url, strength: clamp(p.strength, 0.20, 0.30), num_variations: 1 };
  }

  // Professional → SD i2i, with negatives and safer strength (hardened)
  const pro: PresetConfig = PRESETS[presetId as keyof typeof PRESETS];
  if (!pro) throw new Error(`Unknown preset: ${presetId}`);
  
  // Harden the preset for identity safety
  const hardened = hardenForIdentity(pro);
  
  return {
    model: 'stable-diffusion-v35-large',           // keep SD here
    prompt: withSinglePanelGuard(hardened.prompt),      // inject the guard
    negative_prompt: hardened.negative_prompt || 'duplicate face, split screen, collage, grid, frame, border, anime, cartoon, 2D, low quality',
    image_url,
    strength: clamp(hardened.strength, 0.08, 0.22),     // color-grade range
    num_inference_steps: 20,                       // less for edits
    guidance_scale: 4.5,                           // lower = preserve identity
    num_variations: 1,
    // seed: 123456789, // set for determinism if you want stable A/Bs
  };
}

// Build payload for advanced editing presets
function buildAdvancedPayload(preset: EditPreset, image_url: string) {
  const basePayload = {
    model: 'stable-diffusion-v35-large', // Advanced editing requires SD
    prompt: preset.prompt,
    image_url,
    num_variations: 1,
    num_inference_steps: 24, // Slightly more for complex edits
    guidance_scale: 4.0,     // Balanced for creativity + control
  };

  // Add subject locking if enabled
  if (preset.subject_lock?.enabled) {
    return {
      ...basePayload,
      ...buildSubjectLockPayload(preset, image_url),
      ...buildControlNetPayload(preset),
      ...buildRegionLayerPayload(preset)
    };
  }

  // Fallback to standard payload
  return {
    ...basePayload,
    strength: clamp(preset.strength, 0.12, 0.22),
    negative_prompt: 'duplicate face, split screen, collage, grid, frame, border, anime, cartoon, 2D, low quality'
  };
}

// Build subject locking payload
function buildSubjectLockPayload(preset: EditPreset, image_url: string) {
  if (!preset.subject_lock?.enabled) return {};
  
  return {
    // IP-Adapter FaceID for subject preservation
    ip_adapter_face: {
      image: image_url, // Use source image as reference
      weight: preset.subject_lock.weight || 0.8
    }
  };
}

// Build ControlNet payload
function buildControlNetPayload(preset: EditPreset) {
  if (!preset.control?.length) return {};
  
  const controlNets = preset.control.map(control => ({
    type: control.type,
    weight: control.weight,
    image: control.ref || 'auto' // Generate automatically if no ref
  }));

  return { controlnet: controlNets };
}

// Build region layer payload
function buildRegionLayerPayload(preset: EditPreset) {
  if (!preset.applies?.length) return {};
  
  // For now, use the highest denoise value as global strength
  // In a full implementation, this would handle per-region masking
  const maxDenoise = Math.max(...preset.applies.map(layer => layer.denoise));
  
  return {
    strength: clamp(maxDenoise, 0.12, 0.80),
    // Note: Full region-aware editing would require mask generation
    // and multiple passes, which is beyond current scope
  };
}

function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }

function withSinglePanelGuard(p: string) {
  const GUARD = 'Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. Do NOT duplicate or mirror any part of the face. Keep the original camera crop and background.';
  return `${GUARD} ${p}`;
}
