// src/presets/neoTokyoGlitch.ts
// Stefna — AIML Minimal (No‑Grid, No‑Anime, Two‑Pass)
// Only uses AIML-supported params: model, prompt, image_url, strength, num_variations
// Purpose: eliminate "double face" and anime drift without adapters.

import { MinimalPreset } from '../utils/presets/aimlUtils';

// ================================================================
// Neo Tokyo Glitch (Colorful cyberpunk overlays)
// ================================================================

// Global guards (inline into prompts)
const SINGLE_PANEL_GUARD =
  'Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. ' +
  'Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. ' +
  'Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. ' +
  'Preserve the person\'s identity exactly: same gender, skin tone, ethnicity, age, and facial structure.';

export const NEO_TOKYO_GLITCH_PRESETS: MinimalPreset[] = [
  {
    id: 'neo_tokyo_base',
    label: 'Base',
    prompt:
      `${SINGLE_PANEL_GUARD} Cinematic city-night palette. Add faint neon rim light around hair edges and a soft neon ambience in the background bokeh. ` +
      `Do not recolor facial skin; no lines over facial skin.`,
    strength: 0.06,
    model: 'stable-diffusion-v35-large',
    num_variations: 1,
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt:
      `${SINGLE_PANEL_GUARD} Add a translucent HUD visor above the eyes with bright neon UI glyphs and micro text. ` +
      `Eyebrows and eyelashes remain fully visible. Background neon bokeh becomes more saturated.`,
    strength: 0.06,
    model: 'stable-diffusion-v35-large',
    num_variations: 1,
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt:
      `${SINGLE_PANEL_GUARD} Add ultra-faint silver micro-circuit lines along temples and cheekbones. Hair-thin, semi-transparent; ` +
      `no recolor of skin and no lines over the eye regions.`,
    strength: 0.06,
    model: 'stable-diffusion-v35-large',
    num_variations: 1,
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt:
      `${SINGLE_PANEL_GUARD} Add subtle VHS scanlines and mild RGB split in the BACKGROUND only; never draw lines over facial skin. ` +
      `Boost city neon saturation behind the subject for a strong, colorful mood.`,
    strength: 0.05,
    model: 'stable-diffusion-v35-large',
    num_variations: 1,
  },
];

export function getNeoTokyoGlitchPreset(presetId: string): MinimalPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find((p) => p.id === presetId);
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some((p) => p.id === presetId);
}
