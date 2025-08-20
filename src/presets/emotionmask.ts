// src/presets/emotionMask.ts
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
    id: 'em_joy_sadness',
    label: 'Joy + Sadness',
    prompt: "Enhance facial expression to subtly reflect joy and sadness. Do not modify skin tone, ethnicity, facial structure, or hairstyle. Keep lighting, eyes, and mouth expression natural and realistic. Preserve identity 100%.",
  },
  {
    id: 'em_strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt: "Add emotional intensity to the face, showing strength blended with vulnerability. Strictly preserve facial identity, features, and ethnicity. Only alter eyes, brows, and mouth slightly to convey expression. No stylization.",
  },
  {
    id: 'em_nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt: "Slightly enhance the subject's expression to reflect emotional distance and nostalgia. Maintain original appearance, race, and identity. Output must match the input exactly in all physical traits.",
  },
  {
    id: 'em_peace_fear',
    label: 'Peace + Fear',
    prompt: "Create a calm but emotionally charged facial expression — peace mixed with fear. Do not change skin tone, ethnicity, gender, or identity. Avoid stylized output. Expression only.",
  },
  {
    id: 'em_confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt: "Enhance the expression to mix confidence and quiet loneliness. Focus only on emotional nuance. Maintain full realism, facial structure, skin tone, ethnicity, and hairstyle unchanged.",
  },
];

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string) {
  return presetId.startsWith('em_');
}
