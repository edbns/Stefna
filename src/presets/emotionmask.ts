// src/presets/emotionmask.ts
// Stefna — AIML Minimal (No‑Grid, No‑Anime, Two‑Pass)
// Only uses AIML-supported params: model, prompt, image_url, strength, num_variations
// Purpose: eliminate "double face" and anime drift without adapters.

import { MinimalPreset } from '../utils/presets/aimlUtils';

// ================================================================
// Emotion Mask (Micro-expressions)
// ================================================================

// Global guards (inline into prompts)
const SINGLE_PANEL_GUARD =
  'Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. ' +
  'Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. ' +
  'Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. ' +
  'Preserve the person\'s identity exactly: same gender, skin tone, ethnicity, age, and facial structure.';

export const EMOTION_MASK_PRESETS: MinimalPreset[] = [
  {
    id: 'none',
    label: 'None',
    prompt: '',
    strength: 0.0,
    model: 'flux/dev/image-to-image',
    num_variations: 1,
  },
  {
    id: 'joy_sadness',
    label: 'Joy + Sadness',
    prompt:
      `${SINGLE_PANEL_GUARD} Modify only micro-expressions: gentle upward lip corners (no teeth) and eyes with subtle inner melancholy (slight inner-brow lift). ` +
      `No geometry changes to nose, jaw, cheeks, or head angle.`,
    strength: 0.07,
    model: 'flux/dev/image-to-image',
    num_variations: 1,
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt:
      `${SINGLE_PANEL_GUARD} Micro-only: confident steady gaze; faint lower-lid softness and a tiny brow pinch to hint vulnerability. ` +
      `Do not alter facial structure, hairline, or crop.`,
    strength: 0.07,
    model: 'flux/dev/image-to-image',
    num_variations: 1,
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt:
      `${SINGLE_PANEL_GUARD} Micro-only: softened gaze as if recalling a memory and a closed-mouth micro-smile; very slight pupil defocus to suggest distance.`,
    strength: 0.07,
    model: 'flux/dev/image-to-image',
    num_variations: 1,
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt:
      `${SINGLE_PANEL_GUARD} Micro-only: relaxed cheeks and lips; slight brow raise with a touch more sclera visibility to imply quiet fear. Mouth closed.`,
    strength: 0.07,
    model: 'flux/dev/image-to-image',
    num_variations: 1,
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt:
      `${SINGLE_PANEL_GUARD} Micro-only: confident eyes and steady mouth line; subtle inner-brow raise and minute down-turn at mouth corners to imply loneliness.`,
    strength: 0.07,
    model: 'flux/dev/image-to-image',
    num_variations: 1,
  },
];

export function getEmotionMaskPreset(presetId: string): MinimalPreset | undefined {
  return EMOTION_MASK_PRESETS.find((p) => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string): boolean {
  return EMOTION_MASK_PRESETS.some((p) => p.id === presetId);
}
