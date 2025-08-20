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
    prompt: "I'm smiling, but my heart is heavy.",
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt: "I look strong, but I'm still healing.",
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt: "It feels like yesterday, but it's far away now.",
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt: "I look calm, but I'm bracing inside.",
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt: "I look strong, but I feel alone.",
  },
];

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string) {
  return presetId.startsWith('em_');
}
