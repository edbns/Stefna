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
    prompt: "portrait of a sad anime character, stylized glowing face patterns, symbolic teardrop overlay, cinematic lighting, focused facial emotion, clear mask-like markings around eyes and cheeks, bittersweet expression — smiling with teary eyes",
    negative_prompt: "realistic photo, bad anatomy, messy details, distorted face, harsh shadows, lowres, photorealistic, ugly, text artifacts",
    vibe: "I'm smiling, but I'm breaking inside.",
    strength: 0.55,
    model: "stable-diffusion-v35-large",
    guidance_scale: 9.5,
    num_inference_steps: 28,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.45,
    ipadapter_noise: 0.1,
    postprocessing: ["emotion_glow_overlay", "face_highlight_mask", "background_blur"],
    features: ["sad_emotion", "teardrop_mask", "bittersweet_expression", "cinematic_lighting"],
    meta: {
      source: "emotion_mask",
      variant: "joy_sadness"
    }
  },
  {
    id: "strength_vulnerability",
    label: "Strength + Vulnerability", 
    description: "I look composed but I'm holding it together",
    prompt: "portrait of a strong anime character, stylized glowing face patterns, symbolic strength overlay, cinematic lighting, focused facial emotion, clear mask-like markings around eyes and cheeks, inner strength with subtle vulnerability",
    negative_prompt: "realistic photo, bad anatomy, messy details, distorted face, harsh shadows, lowres, photorealistic, ugly, text artifacts",
    vibe: "I look composed, but I'm holding it together.",
    strength: 0.55,
    model: "stable-diffusion-v35-large",
    guidance_scale: 9.5,
    num_inference_steps: 28,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.45,
    ipadapter_noise: 0.1,
    postprocessing: ["emotion_glow_overlay", "face_highlight_mask", "background_blur"],
    features: ["strength_emotion", "vulnerability_mask", "composed_expression", "cinematic_lighting"],
    meta: {
      source: "emotion_mask",
      variant: "strength_vulnerability"
    }
  },
  {
    id: "nostalgia_distance",
    label: "Nostalgia + Distance",
    description: "I'm remembering but it's already far away", 
    prompt: "portrait of a nostalgic anime character, stylized glowing face patterns, symbolic memory overlay, cinematic lighting, focused facial emotion, clear mask-like markings around eyes and cheeks, soft reflective expression",
    negative_prompt: "realistic photo, bad anatomy, messy details, distorted face, harsh shadows, lowres, photorealistic, ugly, text artifacts",
    vibe: "I'm remembering, but it's already far away.",
    strength: 0.55,
    model: "stable-diffusion-v35-large",
    guidance_scale: 9.5,
    num_inference_steps: 28,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.45,
    ipadapter_noise: 0.1,
    postprocessing: ["emotion_glow_overlay", "face_highlight_mask", "background_blur"],
    features: ["nostalgia_emotion", "memory_mask", "reflective_expression", "cinematic_lighting"],
    meta: {
      source: "emotion_mask",
      variant: "nostalgia_distance"
    }
  },
  {
    id: "peace_fear",
    label: "Peace + Fear",
    description: "I appear calm but I'm scared inside",
    prompt: "portrait of a peaceful anime character, stylized glowing face patterns, symbolic fear overlay, cinematic lighting, focused facial emotion, clear mask-like markings around eyes and cheeks, serene expression with underlying tension",
    negative_prompt: "realistic photo, bad anatomy, messy details, distorted face, harsh shadows, lowres, photorealistic, ugly, text artifacts",
    vibe: "I appear calm, but I'm scared inside.",
    strength: 0.55,
    model: "stable-diffusion-v35-large",
    guidance_scale: 9.5,
    num_inference_steps: 28,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.45,
    ipadapter_noise: 0.1,
    postprocessing: ["emotion_glow_overlay", "face_highlight_mask", "background_blur"],
    features: ["peace_emotion", "fear_mask", "serene_expression", "cinematic_lighting"],
    meta: {
      source: "emotion_mask",
      variant: "peace_fear"
    }
  },
  {
    id: "confidence_loneliness",
    label: "Confidence + Loneliness",
    description: "I look strong but I feel alone",
    prompt: "portrait of a confident anime character, stylized glowing face patterns, symbolic isolation overlay, cinematic lighting, focused facial emotion, clear mask-like markings around eyes and cheeks, bold presence with subtle distance",
    negative_prompt: "realistic photo, bad anatomy, messy details, distorted face, harsh shadows, lowres, photorealistic, ugly, text artifacts",
    vibe: "I look strong, but I feel alone.",
    strength: 0.55,
    model: "stable-diffusion-v35-large",
    guidance_scale: 9.5,
    num_inference_steps: 28,
    face_fix: true,
    face_method: "ipadapter",
    ipadapter_strength: 0.45,
    ipadapter_noise: 0.1,
    postprocessing: ["emotion_glow_overlay", "face_highlight_mask", "background_blur"],
    features: ["confidence_emotion", "loneliness_mask", "bold_expression", "cinematic_lighting"],
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
