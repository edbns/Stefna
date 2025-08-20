// src/presets/ghibliReact.ts
// Stefna — AIML Minimal (No‑Grid, No‑Anime, Two‑Pass)
// Only uses AIML-supported params: model, prompt, image_url, strength, num_variations
// Purpose: eliminate "double face" and anime drift without adapters.

import { MinimalPreset } from '../utils/presets/aimlUtils';

// ================================================================
// Reaction Overlays (formerly "Ghibli Reaction" — no anime keywords)
// ================================================================

// Shared realism + single-panel guard (no negatives API needed)
const REALISM_ANCHOR =
  'Cinematic portrait photograph, natural skin pores, shallow depth of field, soft background bokeh.';

const SINGLE_PANEL_GUARD_V2 =
  'Use the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject centered. ' +
  'Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. ' +
  'Do NOT duplicate, mirror, or repeat any part of the face. Keep the original background and framing unchanged. ' +
  'Keep the person\'s gender, skin tone, ethnicity, age, and facial structure exactly the same. Not anime or cartoon.';

export const REACTION_OVERLAY_PRESETS: MinimalPreset[] = [
  {
    id: 'rx_tears',
    label: 'Tears',
    prompt:
      `${REALISM_ANCHOR} ${SINGLE_PANEL_GUARD_V2} ` +
      'Add a delicate glossy tear film along the lower eyelids and ONE thin transparent teardrop on ONE cheek (8–12 mm trail) with a tiny specular highlight. ' +
      'Do not change face shape or skin tone.',
    strength: 0.06,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'rx_shock',
    label: 'Shock',
    prompt:
      `${REALISM_ANCHOR} ${SINGLE_PANEL_GUARD_V2} ` +
      'Subtle surprise: slightly raised brows, mild sclera visibility, micro-parted lips without teeth, tiny white eye highlight. ' +
      'No changes to facial geometry, framing, or background.',
    strength: 0.06,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'rx_sparkle',
    label: 'Sparkle',
    prompt:
      `${REALISM_ANCHOR} ${SINGLE_PANEL_GUARD_V2} ` +
      'Add a few very small catchlight sparkles close to the irises and faint soft bokeh specks near the cheeks. ' +
      'No outlines; keep skin texture and tone realistic.',
    strength: 0.06,
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
