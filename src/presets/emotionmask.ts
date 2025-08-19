// src/presets/emotionmask.ts
export type EmotionMaskPreset = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  negative_prompt: string;
  vibe: string;
  strength: number;
  model: string;
  guidance_scale: number;
  num_inference_steps: number;
  face_fix: boolean;
  face_method: string;
  ipadapter_strength?: number;
  ipadapter_noise?: number;
  postprocessing: string[];
  features: string[];
  meta: {
    source: string;
    variant: string;
  };
};

export const EMOTION_MASK_PRESETS: EmotionMaskPreset[] = [
  {
    id: "confidence_loneliness",
    label: "Confidence + Loneliness",
    description: "Subtle contrast between inner strength and quiet solitude",
    prompt: "Portrait with subtle emotional duality. Keep the original face structure intact. Add gentle lighting that suggests both confidence and quiet loneliness - warm highlights on the eyes and cheeks, cooler shadows around the edges. Very subtle color grading: slight warmth in the highlights, gentle coolness in shadows. Maintain photorealistic quality with minimal facial changes.",
    negative_prompt: "dramatic face changes, cartoon, anime, distorted features, overly dramatic lighting, unrealistic colors",
    vibe: "I feel confident but also a bit lonely.",
    strength: 0.25,
    model: "stable-diffusion-v35-large",
    guidance_scale: 6.5,
    num_inference_steps: 25,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.2,
    ipadapter_noise: 0.02,
    postprocessing: ["subtle_color_grading", "gentle_lighting_enhancement", "face_preservation"],
    features: ["subtle_emotion", "gentle_lighting", "color_grading", "face_preservation"],
    meta: {
      source: "emotion_mask",
      variant: "confidence_loneliness"
    }
  },
  {
    id: "strength_vulnerability",
    label: "Strength + Vulnerability",
    description: "Balanced contrast of inner resilience with emotional openness",
    prompt: "Portrait balancing strength and vulnerability. Preserve the original facial structure completely. Apply subtle lighting: soft highlights that suggest inner strength, gentle shadows that hint at vulnerability. Very light color grading: slight warmth in the highlights, soft coolness in shadows. The effect should be barely noticeable - just a mood shift.",
    negative_prompt: "face distortion, dramatic changes, cartoon, anime, unrealistic lighting, strong color shifts",
    vibe: "I feel strong but also open and vulnerable.",
    strength: 0.25,
    model: "stable-diffusion-v35-large",
    guidance_scale: 6.5,
    num_inference_steps: 25,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.2,
    ipadapter_noise: 0.02,
    postprocessing: ["subtle_color_grading", "gentle_lighting_enhancement", "face_preservation"],
    features: ["subtle_emotion", "gentle_lighting", "color_grading", "face_preservation"],
    meta: {
      source: "emotion_mask",
      variant: "strength_vulnerability"
    }
  },
  {
    id: "joy_sadness",
    label: "Joy + Sadness",
    description: "Bittersweet emotional blend with gentle visual enhancement",
    prompt: "Portrait with bittersweet emotional undertones. Keep the face exactly as is. Apply very subtle lighting: gentle highlights that suggest joy, soft shadows that hint at sadness. Minimal color grading: slight warmth in highlights, gentle coolness in shadows. The effect should be so subtle it's barely noticeable - just a mood enhancement.",
    negative_prompt: "face changes, dramatic lighting, cartoon, anime, unrealistic colors, distorted features",
    vibe: "I feel happy but also a bit sad.",
    strength: 0.25,
    model: "stable-diffusion-v35-large",
    guidance_scale: 6.5,
    num_inference_steps: 25,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.2,
    ipadapter_noise: 0.02,
    postprocessing: ["subtle_color_grading", "gentle_lighting_enhancement", "face_preservation"],
    features: ["subtle_emotion", "gentle_lighting", "color_grading", "face_preservation"],
    meta: {
      source: "emotion_mask",
      variant: "joy_sadness"
    }
  },
  {
    id: "peace_fear",
    label: "Peace + Fear",
    description: "Calm exterior with subtle underlying tension",
    prompt: "Portrait showing calm exterior with subtle underlying tension. Preserve the face completely. Apply gentle lighting: soft highlights suggesting peace, very subtle shadows hinting at underlying tension. Minimal color grading: slight warmth in highlights, gentle coolness in shadows. The effect should be barely visible - just a mood enhancement.",
    negative_prompt: "face distortion, dramatic changes, cartoon, anime, unrealistic lighting, strong color shifts",
    vibe: "I feel peaceful but also a bit anxious.",
    strength: 0.25,
    model: "stable-diffusion-v35-large",
    guidance_scale: 6.5,
    num_inference_steps: 25,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.2,
    ipadapter_noise: 0.02,
    postprocessing: ["subtle_color_grading", "gentle_lighting_enhancement", "face_preservation"],
    features: ["subtle_emotion", "gentle_lighting", "color_grading", "face_preservation"],
    meta: {
      source: "emotion_mask",
      variant: "peace_fear"
    }
  }
];

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string) {
  return presetId.startsWith('em_');
}
