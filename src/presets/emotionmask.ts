// src/presets/emotionMask.ts
// Identity-Safe Presets for AIML API (image-to-image)
// Focus: preserve identity, gender, skin tone, ethnicity, age, and facial structure
// Only micro-expression / light overlays

export type EmotionMaskPreset = {
  id: string;
  label: string;
  prompt: string;
  negative_prompt: string;
  strength: number; // i2i denoise: 0 = copy, 1 = full regenerate
  model: string; // AIML model slug
  guidance_scale?: number; // 1.0–2.0 recommended for identity safety
  num_inference_steps?: number; // 10–18 typical for subtle edits
  sampler?: string; // optional sampler name
  ip_adapter?: 'faceid' | 'instantid' | 'none'; // if supported by AIML
  ip_adapter_strength?: number; // 0.7–1.0 for face lock
  mask_policy?: 'expression_only' | 'face_only' | 'none'; // hint for UI/router
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
  'new nose',
  'reshaped jaw',
  'altered eye shape',
  'toon face',
  'anime face',
  'caricature',
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
    guidance_scale: 1.2,
    num_inference_steps: 10,
    ip_adapter: 'none',
    ip_adapter_strength: 0.0,
    mask_policy: 'none',
  },
  {
    id: 'joy_sadness',
    label: 'Joy + Sadness',
    prompt:
      `${EMOTION_COMMON} Expression: outer smile with gentle upward lip corners, dampened orbicularis oculi; eyes carry a hint of melancholy (slight inner brow raise). Subtle tear film sheen only; no visible droplets.`,
    negative_prompt: EMOTION_IDENTITY_NEG,
    strength: 0.16,
    model: 'stable-diffusion-3.5-large-i2i',
    guidance_scale: 1.4,
    num_inference_steps: 14,
    sampler: 'DPM++ 2M Karras',
    ip_adapter: 'faceid',
    ip_adapter_strength: 0.9,
    mask_policy: 'expression_only',
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt:
      `${EMOTION_COMMON} Expression: firm jaw set and confident gaze; micro-tremble softness in the lower lids; slight brow pinch indicating vulnerability. Keep posture and chin angle unchanged.`,
    negative_prompt: EMOTION_IDENTITY_NEG,
    strength: 0.15,
    model: 'stable-diffusion-3.5-large-i2i',
    guidance_scale: 1.3,
    num_inference_steps: 12,
    sampler: 'DPM++ 2M Karras',
    ip_adapter: 'faceid',
    ip_adapter_strength: 0.9,
    mask_policy: 'expression_only',
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt:
      `${EMOTION_COMMON} Expression: softened gaze as if recalling a memory; minimal crow's-feet engagement; micro-smile without teeth; a touch of emotional distance in the pupils (slight defocus).`,
    negative_prompt: EMOTION_IDENTITY_NEG,
    strength: 0.15,
    model: 'stable-diffusion-3.5-large-i2i',
    guidance_scale: 1.3,
    num_inference_steps: 12,
    sampler: 'DPM++ 2M Karras',
    ip_adapter: 'faceid',
    ip_adapter_strength: 0.9,
    mask_policy: 'expression_only',
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt:
      `${EMOTION_COMMON} Expression: relaxed mouth and cheeks; tiny brow lift and slight sclera exposure signaling quiet fear. No mouth opening; no teeth.`,
    negative_prompt: EMOTION_IDENTITY_NEG,
    strength: 0.16,
    model: 'stable-diffusion-3.5-large-i2i',
    guidance_scale: 1.4,
    num_inference_steps: 14,
    sampler: 'DPM++ 2M Karras',
    ip_adapter: 'faceid',
    ip_adapter_strength: 0.9,
    mask_policy: 'expression_only',
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt:
      `${EMOTION_COMMON} Expression: confident eyes and stable mouth line; micro-sadness indicated by a faint inner-brow raise and minute down-turn at mouth corners.`,
    negative_prompt: EMOTION_IDENTITY_NEG,
    strength: 0.15,
    model: 'stable-diffusion-3.5-large-i2i',
    guidance_scale: 1.3,
    num_inference_steps: 12,
    sampler: 'DPM++ 2M Karras',
    ip_adapter: 'faceid',
    ip_adapter_strength: 0.9,
    mask_policy: 'expression_only',
  },
];

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find((p) => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string) {
  if (presetId === 'none') return true;
  return EMOTION_MASK_PRESETS.some((p) => p.id === presetId);
}
