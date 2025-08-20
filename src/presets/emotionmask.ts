// src/presets/emotionMask.ts
// Stefna — AIML Minimal (No‑Grid, No‑Anime, Two‑Pass)
// Only uses AIML-supported params: model, prompt, image_url, strength, num_variations
// Purpose: eliminate "double face" and anime drift without adapters.

import { MinimalPreset } from '../utils/presets/aimlUtils';

// ================================================================
// Emotion Mask (micro-expression only)
// ================================================================

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
      'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. Modify only micro-expressions: gentle upward lip corners for an outer smile; eyes convey subtle melancholy with a slight inner-brow lift. No teeth. Do not alter face shape, nose, jaw or cheeks.',
    strength: 0.08,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt:
      'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. Micro-only: confident steady gaze with faint lower-lid softness and a tiny brow pinch. Keep chin and head angle identical.',
    strength: 0.08,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt:
      'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. Micro-only: softened gaze as if recalling a memory; closed-mouth micro-smile; tiny pupil defocus to suggest distance.',
    strength: 0.08,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt:
      'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. Micro-only: relaxed cheeks and lips; slight brow raise with a touch more sclera showing to imply quiet fear. Mouth closed, no teeth.',
    strength: 0.09,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt:
      'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. Micro-only: confident eyes and steady mouth line; subtle inner-brow raise and minute down-turn at mouth corners to imply loneliness.',
    strength: 0.08,
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
