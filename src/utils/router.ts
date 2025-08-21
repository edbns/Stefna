// router.ts
import { isEmotionMaskPreset, getEmotionMaskPreset } from '../presets/emotionmask';
import { isGhibliReactionPreset, getGhibliReactionPreset } from '../presets/ghibliReact';
import { isNeoTokyoGlitchPreset, getNeoTokyoGlitchPreset } from '../presets/neoTokyoGlitch';
import { PRESETS, PresetConfig } from '../config/presets';

export function buildPayload(presetId: string, image_url: string) {
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

  // Professional → SD i2i, with negatives and safer strength
  const pro: PresetConfig = PRESETS[presetId as keyof typeof PRESETS];
  if (!pro) throw new Error(`Unknown preset: ${presetId}`);
  return {
    model: 'stable-diffusion-v35-large',           // keep SD here
    prompt: withSinglePanelGuard(pro.prompt),      // inject the guard
    negative_prompt: pro.negative_prompt || 'duplicate face, split screen, collage, grid, frame, border, anime, cartoon, 2D, low quality',
    image_url,
    strength: clamp(pro.strength, 0.08, 0.22),     // color-grade range
    num_inference_steps: 20,                       // less for edits
    guidance_scale: 4.5,                           // lower = preserve identity
    num_variations: 1,
    // seed: 123456789, // set for determinism if you want stable A/Bs
  };
}

function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }

function withSinglePanelGuard(p: string) {
  const GUARD = 'Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. Do NOT duplicate or mirror any part of the face. Keep the original camera crop and background.';
  return `${GUARD} ${p}`;
}
