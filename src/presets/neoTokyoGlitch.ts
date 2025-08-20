// src/presets/neoTokyoGlitch.ts
// Stefna — AIML Minimal (No‑Grid, No‑Anime, Two‑Pass)
// Only uses AIML-supported params: model, prompt, image_url, strength, num_variations
// Purpose: eliminate "double face" and anime drift without adapters.

import { MinimalPreset } from '../utils/presets/aimlUtils';

// ================================================================
// Neo Tokyo Glitch (unchanged identity, additive overlays)
// ================================================================

// Shared realism + single-panel guard (no negatives API needed)
const REALISM_ANCHOR =
  'Cinematic portrait photograph, natural skin pores, shallow depth of field, soft background bokeh.';

const SINGLE_PANEL_GUARD_V2 =
  'Use the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject centered. ' +
  'Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. ' +
  'Do NOT duplicate, mirror, or repeat any part of the face. Keep the original background and framing unchanged. ' +
  'Keep the person\'s gender, skin tone, ethnicity, age, and facial structure exactly the same. Not anime or cartoon.';

export const NEO_TOKYO_GLITCH_PRESETS: MinimalPreset[] = [
  {
    id: 'neo_tokyo_base',
    label: 'Base',
    prompt:
      `${REALISM_ANCHOR} ${SINGLE_PANEL_GUARD_V2} ` +
      'Add faint neon ambience (soft magenta/teal rim glow) around hair edges and background. Keep skin tone and face unchanged.',
    strength: 0.06,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt:
      `${REALISM_ANCHOR} ${SINGLE_PANEL_GUARD_V2} ` +
      'Add a barely visible translucent HUD visor hovering above the eyes with ultra-thin UI lines and micro text. Eyebrows and eyelashes remain visible.',
    strength: 0.06,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt:
      `${REALISM_ANCHOR} ${SINGLE_PANEL_GUARD_V2} ` +
      'Add ultra-faint silver micro-circuit lines along temples and cheekbones. Hair-thin, semi-transparent. No recolor of skin.',
    strength: 0.06,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt:
      `${REALISM_ANCHOR} ${SINGLE_PANEL_GUARD_V2} ` +
      'Add extremely subtle VHS scanlines in the BACKGROUND only and mild chromatic aberration at image edges. Never put lines over facial skin.',
    strength: 0.05,
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
