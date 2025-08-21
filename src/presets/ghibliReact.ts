// src/presets/ghibliReact.ts
// Stefna — AIML Minimal (No‑Grid, No‑Anime, Two‑Pass)
// Only uses AIML-supported params: model, prompt, image_url, strength, num_variations
// Purpose: eliminate "double face" and anime drift without adapters.

import { MinimalPreset } from '../utils/presets/aimlUtils';

// ================================================================
// Ghibli Reaction (Face-only light anime)
// ================================================================

// Global guards (inline into prompts)
const SINGLE_PANEL_GUARD =
  'Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. ' +
  'Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. ' +
  'Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. ' +
  'Preserve the person\'s identity exactly: same gender, skin tone, ethnicity, age, and facial structure.';

const FACE_ONLY_GUARD =
  'Apply the following effect to the FACE ONLY. Keep body, hair, clothing, neck, and background photorealistic and unchanged.';

export const GHIBLI_REACTION_PRESETS: MinimalPreset[] = [
  {
    id: 'rx_tears',
    label: 'Tears',
    prompt:
      `${SINGLE_PANEL_GUARD} ${FACE_ONLY_GUARD} ` +
      `Add a delicate glossy tear film along the lower eyelids and ONE thin transparent teardrop on ONE cheek (8–12 mm trail) ` +
      `with tiny sparkle highlights in a gentle anime-inspired finish on the face only. Keep body/background photoreal.`,
    strength: 0.14,
    model: 'flux/dev/image-to-image',
    num_variations: 1,
  },
  {
    id: 'rx_shock',
    label: 'Shock',
    prompt:
      `${SINGLE_PANEL_GUARD} ${FACE_ONLY_GUARD} ` +
      `Subtle surprise: slightly raised brows, mild sclera visibility, micro-parted lips without teeth, brighter eye catchlights. ` +
      `Light anime influence limited to facial shading and catchlights; do not stylize neck, clothing, or background.`,
    strength: 0.14,
    model: 'flux/dev/image-to-image',
    num_variations: 1,
  },
  {
    id: 'rx_sparkle',
    label: 'Sparkle',
    prompt:
      `${SINGLE_PANEL_GUARD} ${FACE_ONLY_GUARD} ` +
      `Add small starry catchlights near the irises and a few miniature sparkles on the cheeks (face only). ` +
      `Keep pores and natural skin texture visible; body and background remain realistic.`,
    strength: 0.14,
    model: 'flux/dev/image-to-image',
    num_variations: 1,
  },
];

export function getGhibliReactionPreset(presetId: string): MinimalPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find((p) => p.id === presetId);
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some((p) => p.id === presetId);
}

// Legacy function names for backward compatibility
export function getReactionPreset(presetId: string): MinimalPreset | undefined {
  return getGhibliReactionPreset(presetId);
}

export function isReactionPreset(presetId: string): boolean {
  return isGhibliReactionPreset(presetId);
}
