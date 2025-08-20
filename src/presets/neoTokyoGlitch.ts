// src/presets/neoTokyoGlitch.ts
// Stefna — AIML Minimal (No‑Grid, No‑Anime, Two‑Pass)
// Only uses AIML-supported params: model, prompt, image_url, strength, num_variations
// Purpose: eliminate "double face" and anime drift without adapters.

import { MinimalPreset } from '../utils/presets/aimlUtils';

// ================================================================
// Neo Tokyo Glitch (unchanged identity, additive overlays)
// ================================================================

export const NEO_TOKYO_GLITCH_PRESETS: MinimalPreset[] = [
  {
    id: 'neo_tokyo_base',
    label: 'Base',
    prompt:
      'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. Add faint neon ambience (soft magenta/teal rim glow) around hair edges and background. Keep skin tone and face unchanged.',
    strength: 0.08,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt:
      'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. Add a barely visible translucent HUD visor hovering above the eyes with ultra-thin UI lines and micro text. Eyebrows and eyelashes remain visible.',
    strength: 0.08,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt:
      'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. Add ultra-faint silver micro-circuit lines along temples and cheekbones. Hair-thin, semi-transparent. No recolor of skin.',
    strength: 0.08,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt:
      'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. Add extremely subtle VHS scanlines in the BACKGROUND only and mild chromatic aberration at image edges. Never put lines over facial skin.',
    strength: 0.07,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
];

export function getNeoTokyoGlitchPreset(presetId: string): MinimalPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find((p) => p.id === presetId);
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some((p) => p.id === presetId);
}
