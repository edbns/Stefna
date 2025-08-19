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
    prompt: "portrait of a woman sitting by a window, soft natural light, bittersweet expression - gentle smile with eyes that hold quiet sadness, photo-realistic skin texture, emotional authenticity, cinematic framing, moody ambient lighting, human vulnerability",
    negative_prompt: "anime, cartoon, neon, cyberpunk, distortion, over-stylized, fantasy, glowing patterns, mask markings, unrealistic skin, artificial lighting, harsh shadows",
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
    prompt: "portrait of a woman in natural daylight, composed expression with subtle vulnerability in her eyes, soft shadows, photo-realistic skin, emotional depth, natural beauty, human resilience, gentle strength, authentic emotion",
    negative_prompt: "anime, cartoon, neon, cyberpunk, distortion, over-stylized, fantasy, glowing patterns, mask markings, unrealistic skin, artificial lighting, harsh shadows",
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
    prompt: "portrait of a woman gazing into the distance, soft golden hour lighting, reflective expression with gentle melancholy, photo-realistic skin, emotional authenticity, natural beauty, human memory, wistful mood, cinematic composition",
    negative_prompt: "anime, cartoon, neon, cyberpunk, distortion, over-stylized, fantasy, glowing patterns, mask markings, unrealistic skin, artificial lighting, harsh shadows",
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
    prompt: "portrait of a woman in soft ambient light, serene expression with subtle tension in her eyes, natural skin texture, emotional complexity, human vulnerability, quiet strength, authentic emotion, natural beauty, cinematic mood",
    negative_prompt: "anime, cartoon, neon, cyberpunk, distortion, over-stylized, fantasy, glowing patterns, mask markings, unrealistic skin, artificial lighting, harsh shadows",
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
    prompt: "portrait of a woman in dramatic natural lighting, confident pose with subtle isolation in her expression, photo-realistic skin, emotional depth, human strength, natural beauty, authentic emotion, cinematic composition, quiet solitude",
    negative_prompt: "anime, cartoon, neon, cyberpunk, distortion, over-stylized, fantasy, glowing patterns, mask markings, unrealistic skin, artificial lighting, harsh shadows",
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
