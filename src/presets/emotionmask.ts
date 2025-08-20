// src/presets/emotionMask.ts
// Stefna — AIML Minimal (No‑Grid, No‑Anime, Two‑Pass)
// Only uses AIML-supported params: model, prompt, image_url, strength, num_variations
// Purpose: eliminate "double face" and anime drift without adapters.

import { MinimalPreset } from '../utils/presets/aimlUtils';

// ================================================================
// Emotion Mask (micro-expression only)
// ================================================================

// Shared realism + single-panel guard (no negatives API needed)
const REALISM_ANCHOR =
  'Cinematic portrait photograph, natural skin pores, shallow depth of field, soft background bokeh.';

const SINGLE_PANEL_GUARD_V2 =
  'Use the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject centered. ' +
  'Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. ' +
  'Do NOT duplicate, mirror, or repeat any part of the face. Keep the original background and framing unchanged. ' +
  'Keep the person\'s gender, skin tone, ethnicity, age, and facial structure exactly the same. Not anime or cartoon.';

export const EMOTION_MASK_PRESETS: MinimalPreset[] = [
  {
    id: 'none',
    label: 'None',
    prompt: '',
    strength: 0.0,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'joy_sadness',
    label: 'Joy + Sadness',
    prompt:
      `${REALISM_ANCHOR} ${SINGLE_PANEL_GUARD_V2} ` +
      'Modify only micro-expressions: gentle upward lip corners for an outer smile; eyes convey subtle melancholy with a slight inner-brow lift. No teeth. Do not alter face shape, nose, jaw or cheeks.',
    strength: 0.07,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt:
      `${REALISM_ANCHOR} ${SINGLE_PANEL_GUARD_V2} ` +
      'Micro-only: confident steady gaze with faint lower-lid softness and a tiny brow pinch. Keep chin and head angle identical.',
    strength: 0.07,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt:
      `${REALISM_ANCHOR} ${SINGLE_PANEL_GUARD_V2} ` +
      'Micro-only: softened gaze as if recalling a memory; closed-mouth micro-smile; tiny pupil defocus to suggest distance.',
    strength: 0.07,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt:
      `${REALISM_ANCHOR} ${SINGLE_PANEL_GUARD_V2} ` +
      'Micro-only: relaxed cheeks and lips; slight brow raise with a touch more sclera showing to imply quiet fear. Mouth closed, no teeth.',
    strength: 0.07,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt:
      `${REALISM_ANCHOR} ${SINGLE_PANEL_GUARD_V2} ` +
      'Micro-only: confident eyes and steady mouth line; subtle inner-brow raise and minute down-turn at mouth corners to imply loneliness.',
    strength: 0.07,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
];

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find((p) => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string) {
  if (presetId === 'none') return true;
  return EMOTION_MASK_PRESETS.some((p) => p.id === presetId);
}
