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
    id: "sad",
    label: "Sad",
    description: "Deep emotional sadness with teary eyes",
    prompt: "Emotional portrait of a person looking deeply sad. Teary eyes, slightly trembling lips, furrowed brows. Lighting is moody and cinematic. Photorealistic style, realistic facial expression.",
    negative_prompt: "cartoon, anime, ugly face, poorly drawn, overexaggerated",
    vibe: "I'm feeling deeply sad and emotional.",
    strength: 0.45,
    model: "stable-diffusion-v35-large",
    guidance_scale: 7.5,
    num_inference_steps: 30,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.35,
    ipadapter_noise: 0.05,
    postprocessing: ["soft_light_blend", "face_restoration", "natural_color_enhancement"],
    features: ["human_emotion", "natural_lighting", "emotional_realism", "cinematic_portrait"],
    meta: {
      source: "emotion_mask",
      variant: "sad"
    }
  },
  {
    id: "angry",
    label: "Angry",
    description: "Intense anger with dramatic expression",
    prompt: "Close-up portrait showing intense anger. Eyebrows tightly pulled down, clenched jaw, flaring nostrils, strong eye focus. Dramatic lighting with warm tones. Cinematic realism.",
    negative_prompt: "cartoon, anime, deformed face, smiling",
    vibe: "I'm feeling intense anger and frustration.",
    strength: 0.45,
    model: "stable-diffusion-v35-large",
    guidance_scale: 7.5,
    num_inference_steps: 30,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.35,
    ipadapter_noise: 0.05,
    postprocessing: ["soft_light_blend", "face_restoration", "natural_color_enhancement"],
    features: ["human_emotion", "natural_lighting", "emotional_realism", "cinematic_portrait"],
    meta: {
      source: "emotion_mask",
      variant: "angry"
    }
  },
  {
    id: "love",
    label: "Love",
    description: "Affection and caring expression",
    prompt: "Portrait of a person showing affection and love. Soft eyes, slight smile, glowing skin, warm lighting, gentle expression. Looks caring and emotionally open.",
    negative_prompt: "sad, crying, anime style, overly dramatic",
    vibe: "I'm feeling love and affection.",
    strength: 0.45,
    model: "stable-diffusion-v35-large",
    guidance_scale: 7.5,
    num_inference_steps: 30,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.35,
    ipadapter_noise: 0.05,
    postprocessing: ["soft_light_blend", "face_restoration", "natural_color_enhancement"],
    features: ["human_emotion", "natural_lighting", "emotional_realism", "cinematic_portrait"],
    meta: {
      source: "emotion_mask",
      variant: "love"
    }
  },
  {
    id: "surprised",
    label: "Surprised",
    description: "Natural surprise expression",
    prompt: "Photorealistic portrait of a person looking surprised. Raised eyebrows, wide-open eyes, slightly opened mouth. Lighting is even and soft, expression is natural.",
    negative_prompt: "cartoon, fake, unnatural lighting, unrealistic face",
    vibe: "I'm feeling surprised and amazed.",
    strength: 0.45,
    model: "stable-diffusion-v35-large",
    guidance_scale: 7.5,
    num_inference_steps: 30,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.35,
    ipadapter_noise: 0.05,
    postprocessing: ["soft_light_blend", "face_restoration", "natural_color_enhancement"],
    features: ["human_emotion", "natural_lighting", "emotional_realism", "cinematic_portrait"],
    meta: {
      source: "emotion_mask",
      variant: "surprised"
    }
  },

];

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string) {
  return presetId.startsWith('em_');
}
