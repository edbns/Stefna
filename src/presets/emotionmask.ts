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
    id: "joy_sadness",
    label: "Joy + Sadness",
    description: "I'm smiling but I'm sad inside",
    prompt: "portrait of a person with a bittersweet smile, eyes slightly teary, warm golden hour lighting, photo-realistic skin, subtle facial expression, cinematic emotion, emotional storytelling",
    negative_prompt: "anime, cartoon, cyberpunk, glitch, fantasy, over-stylized, neon, distortion",
    vibe: "I'm smiling, but I'm breaking inside.",
    strength: 0.45,
    model: "RealVisXL_V4.0",
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
      variant: "joy_sadness"
    }
  },
  {
    id: "strength_vulnerability",
    label: "Strength + Vulnerability", 
    description: "I look composed but I'm holding it together",
    prompt: "close-up portrait of a strong person showing a hint of vulnerability, intense gaze with softened edges, natural light, expressive face, realistic texture, dramatic atmosphere",
    negative_prompt: "anime, fantasy, tech, neon, manga, glitch, distorted",
    vibe: "I look composed, but I'm holding it together.",
    strength: 0.45,
    model: "RealVisXL_V4.0",
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
      variant: "strength_vulnerability"
    }
  },
  {
    id: "nostalgia_distance",
    label: "Nostalgia + Distance",
    description: "I'm remembering but it's already far away", 
    prompt: "emotional portrait of a person gazing into the distance, soft ambient light, cinematic tone, expressive eyes, photo-realistic skin texture, emotional depth",
    negative_prompt: "cartoon, anime, fantasy, overly stylized, neon, sci-fi, robotic elements",
    vibe: "I'm remembering, but it's already far away.",
    strength: 0.45,
    model: "RealVisXL_V4.0",
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
      variant: "nostalgia_distance"
    }
  },
  {
    id: "peace_fear",
    label: "Peace + Fear",
    description: "I appear calm but I'm scared inside",
    prompt: "portrait of a calm face with a subtle expression of fear in the eyes, soft focus, moody natural lighting, intimate realism, emotionally rich, delicate skin details",
    negative_prompt: "cyberpunk, anime, techwear, bright neon, glitch, fantasy, illustration",
    vibe: "I appear calm, but I'm scared inside.",
    strength: 0.45,
    model: "RealVisXL_V4.0",
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
      variant: "peace_fear"
    }
  },
  {
    id: "confidence_loneliness",
    label: "Confidence + Loneliness",
    description: "I look strong but I feel alone",
    prompt: "realistic portrait of a confident expression masking subtle loneliness, reflective ambient light, eye contact with emotion, raw and poetic, soft shadows",
    negative_prompt: "cartoon, anime, glowing effects, over-exaggeration, comic, neon outlines",
    vibe: "I look strong, but I feel alone.",
    strength: 0.45,
    model: "RealVisXL_V4.0",
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
      variant: "confidence_loneliness"
    }
  }
];

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string) {
  return presetId.startsWith('em_');
}
