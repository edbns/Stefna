// src/presets/emotionMask.ts
// Stefna Presets — AIML-Safe (Minimal Params)
// Date: 2025-08-20
// Only uses parameters AIML supports: model, prompt, image_url, strength, num_variations
// No negative_prompt, no guidance/steps/sampler/adapters.

export type EmotionMaskPreset = {
  id: string;
  label: string;
  prompt: string;
  strength: number; // 0 = copy, 1 = full regenerate; keep low for identity safety
  model: string;
  num_variations?: number; // default 1
};

const EMOTION_GUARD =
  'Photorealistic single-subject portrait. Keep the exact same person: same gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles and moles. Natural skin texture; no smoothing. Do not change makeup. No anime, no cartoon, no cel shading, no outline lines, no vector/illustration look. Do not add or duplicate faces, no reflection faces, no double exposure, no extra eyes or mouth, no posters or mirrors with faces.';

export const EMOTION_MASK_PRESETS: EmotionMaskPreset[] = [
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
      `${EMOTION_GUARD} Modify only micro-expressions: gentle upward lip corners for an outer smile; eyes show inner melancholy with a slight inner-brow lift. No teeth visible. No changes to nose, jaw, cheeks or face shape.`,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt:
      `${EMOTION_GUARD} Modify only micro-expressions: confident steady gaze, faint lower-lid softness and tiny brow pinch to hint vulnerability. Keep head/chin angle identical.`,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt:
      `${EMOTION_GUARD} Micro-expression only: softened gaze as if recalling a memory; very faint closed-mouth micro-smile; tiny pupil defocus to suggest distance.`,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt:
      `${EMOTION_GUARD} Micro-expression only: relaxed cheeks and lips; slight brow raise with a touch more sclera showing to imply quiet fear. Mouth closed, no teeth.`,
    strength: 0.11,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt:
      `${EMOTION_GUARD} Micro-expression only: confident eyes and steady mouth line; subtle inner-brow raise and minute down-turn at mouth corners to imply loneliness.`,
    strength: 0.10,
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
