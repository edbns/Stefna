// src/presets/emotionMask.ts
// Identity-Safe Presets (Emotion Mask, Ghibli Reaction, Neo Tokyo Glitch)
// For AIML API (image-to-image). Focus: preserve identity, gender, skin tone,
// ethnicity, age, and facial structure. Only micro-expression / light overlays.

export type EmotionMaskPreset = {
  id: string;
  label: string;
  prompt: string;
  negative_prompt: string;
  strength: number; // i2i denoise: 0 = copy, 1 = full regenerate
  model: string; // AIML model slug
};

const EMOTION_IDENTITY_NEG = [
  'different person',
  'identity swap',
  'face replacement',
  'gender change',
  'ethnicity change',
  'race change',
  'skin tone change',
  'age change',
  'duplicate face',
  'two faces',
  'multiple faces',
  'double exposure',
  'twin face',
  'second person',
  'reflection face',
  'poster face',
  'extra eyes',
  'extra mouth',
  'new nose',
  'reshaped jaw',
  'altered eye shape',
  'anime',
  'manga',
  'cartoon',
  'cel shading',
  'lineart',
  'vector art',
  '3d render',
  'plastic skin',
  'overprocessed',
  'deformed',
  'blurry',
  'lowres',
].join(', ');

const EMOTION_COMMON =
  'Use the exact same person. Preserve gender, skin tone, ethnicity, age, facial proportions, hair texture, freckles, moles, and facial structure. '
  + 'Modify only micro-expressions around eyes, brows, and mouth. Natural skin; no makeup or beauty retouch added.';

export const EMOTION_MASK_PRESETS: EmotionMaskPreset[] = [
  {
    id: 'none',
    label: 'None',
    prompt: '',
    negative_prompt: '',
    strength: 0.0,
    model: 'stable-diffusion-3.5-large-i2i', // safer default for identity
  },
  {
    id: 'joy_sadness',
    label: 'Joy + Sadness',
    prompt:
      `${EMOTION_COMMON} Expression: outer smile with gentle upward lip corners, dampened orbicularis oculi; eyes carry a hint of melancholy (slight inner brow raise). Subtle tear film sheen only; no visible droplets.`,
    negative_prompt: EMOTION_IDENTITY_NEG,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt:
      `${EMOTION_COMMON} Expression: firm jaw set and confident gaze; micro-tremble softness in the lower lids; slight brow pinch indicating vulnerability. Keep posture and chin angle unchanged.`,
    negative_prompt: EMOTION_IDENTITY_NEG,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt:
      `${EMOTION_COMMON} Expression: softened gaze as if recalling a memory; minimal crow's-feet engagement; micro-smile without teeth; a touch of emotional distance in the pupils (slight defocus).`,
    negative_prompt: EMOTION_IDENTITY_NEG,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt:
      `${EMOTION_COMMON} Expression: relaxed mouth and cheeks; tiny brow lift and slight sclera exposure signaling quiet fear. No mouth opening; no teeth.`,
    negative_prompt: EMOTION_IDENTITY_NEG,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt:
      `${EMOTION_COMMON} Expression: confident eyes and stable mouth line; micro-sadness indicated by a faint inner-brow raise and minute down-turn at mouth corners.`,
    negative_prompt: EMOTION_IDENTITY_NEG,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
  },
];

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find((p) => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string) {
  if (presetId === 'none') return true;
  return EMOTION_MASK_PRESETS.some((p) => p.id === presetId);
}
