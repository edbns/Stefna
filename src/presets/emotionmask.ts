// Original Emotion Mask Setup (Working & Clean)
export type EmotionMaskPreset = {
  id: string;
  label: string;
  prompt: string;
};

export const EMOTION_MASK_PRESETS: EmotionMaskPreset[] = [
  {
    id: 'none',
    label: 'None',
    prompt: '',
  },
  {
    id: 'joy_sadness',
    label: 'Joy + Sadness',
    prompt: "Enhance facial expression to show joy mixed with sadness. Strictly preserve identity, skin tone, and facial structure. Modify only expression-related features: eyes, eyebrows, mouth. Avoid changing hairstyle or face shape. Output must resemble input image. Natural cinematic lighting. Shallow depth of field.",
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt: "Enhance facial expression to show strength mixed with vulnerability. Strictly preserve identity, skin tone, and facial structure. Modify only expression-related features: eyes, eyebrows, mouth. Avoid changing hairstyle or face shape. Output must resemble input image. Natural cinematic lighting. Shallow depth of field.",
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt: "Enhance facial expression to show nostalgia mixed with distance. Strictly preserve identity, skin tone, and facial structure. Modify only expression-related features: eyes, eyebrows, mouth. Avoid changing hairstyle or face shape. Output must resemble input image. Natural cinematic lighting. Shallow depth of field.",
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt: "Enhance facial expression to show peace mixed with fear. Strictly preserve identity, skin tone, and facial structure. Modify only expression-related features: eyes, eyebrows, mouth. Avoid changing hairstyle or face shape. Output must resemble input image. Natural cinematic lighting. Shallow depth of field.",
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt: "Enhance facial expression to show confidence mixed with loneliness. Strictly preserve identity, skin tone, and facial structure. Modify only expression-related features: eyes, eyebrows, mouth. Avoid changing hairstyle or face shape. Output must resemble input image. Natural cinematic lighting. Shallow depth of field.",
  },
];

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string) {
  return presetId.startsWith('em_');
}
