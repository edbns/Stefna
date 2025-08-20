// src/presets/ghibliReact.ts
// Stefna — AIML Minimal (No‑Grid, No‑Anime, Two‑Pass)
// Only uses AIML-supported params: model, prompt, image_url, strength, num_variations
// Purpose: eliminate "double face" and anime drift without adapters.

import { MinimalPreset } from '../utils/presets/aimlUtils';

// ================================================================
// Reaction Overlays (formerly "Ghibli Reaction" — no anime keywords)
// ================================================================

export const REACTION_OVERLAY_PRESETS: MinimalPreset[] = [
  {
    id: 'rx_tears',
    label: 'Tears',
    prompt:
      'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. Add a delicate glossy tear film on the lower eyelids and a single thin tear track on one cheek. Transparent and subtle. Do not alter geometry or skin tone.',
    strength: 0.08,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'rx_shock',
    label: 'Shock',
    prompt:
      'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. Subtle surprise: slightly raised brows, mild sclera visibility, micro-parted lips without teeth. Optional tiny white highlight near the pupils.',
    strength: 0.08,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'rx_sparkle',
    label: 'Sparkle',
    prompt:
      'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. Add very small catchlight sparkles close to the irises and faint soft bokeh specks near the face edges. Keep skin tone and texture unchanged.',
    strength: 0.08,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
];

export function getReactionPreset(presetId: string): MinimalPreset | undefined {
  return REACTION_OVERLAY_PRESETS.find((p) => p.id === presetId);
}

export function isReactionPreset(presetId: string): boolean {
  return REACTION_OVERLAY_PRESETS.some((p) => p.id === presetId);
}

// Legacy function names for backward compatibility
export function getGhibliReactionPreset(presetId: string): MinimalPreset | undefined {
  return getReactionPreset(presetId);
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return isReactionPreset(presetId);
}
