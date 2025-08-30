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
    description: "Bittersweet expression — smiling with teary eyes",
    prompt: "A close-up portrait of a single person showing bittersweet expression — smiling with teary eyes, cinematic lighting with warm soft light on one side and cool blue shadows on the other, surreal dream-like softness, high-detail skin texture. Do not change facial features, ethnicity, or add other faces. Original person must remain intact.",
    negative_prompt: "cartoon, anime, ugly face, poorly drawn, overexaggerated",
    vibe: "I'm feeling bittersweet joy and sadness.",
    strength: 0.45,
    model: "fal:flux/ghibli", // Updated to use fal.ai model
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
    description: "Inner strength and subtle vulnerability",
    prompt: "A close-up portrait of a single person showing inner strength and subtle vulnerability, confident golden light from one side and soft blue-gray shadow on the other, strong eye contact, realistic skin texture, slight emotional tension in pose. Do not change facial features, ethnicity, or add other faces. Original person must remain intact.",
    negative_prompt: "cartoon, anime, deformed face, smiling",
    vibe: "I'm feeling strong yet vulnerable.",
    strength: 0.45,
    model: "fal:flux/ghibli", // Updated to use fal.ai model
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
    description: "Nostalgic tone with reflective expression",
    prompt: "A close-up portrait of a single person with nostalgic tone — faded warm backlight, cool desaturated face lighting, misty cinematic blur in background, soft and reflective expression. Do not change facial features, ethnicity, or add other faces. Original person must remain intact.",
    negative_prompt: "sad, crying, anime style, overly dramatic",
    vibe: "I'm feeling nostalgic and distant.",
    strength: 0.45,
    model: "fal:flux/ghibli", // Updated to use fal.ai model
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
    description: "Calm with underlying fear",
    prompt: "A close-up portrait of a single person expressing calm with underlying fear, soft warm top light above the face, cool shadows under eyes and jaw, foggy or abstract background blur, serene expression but eyes slightly tense. Do not change facial features, ethnicity, or add other faces. Original person must remain intact.",
    negative_prompt: "cartoon, fake, unnatural lighting, unrealistic face",
    vibe: "I'm feeling peaceful yet afraid.",
    strength: 0.45,
    model: "fal:flux/ghibli", // Updated to use fal.ai model
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
