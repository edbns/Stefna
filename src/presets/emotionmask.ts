// EmotionMask.ts
export type EmotionMaskPreset = {
  id: string;
  label: string;
  prompt: string;
};

export const EMOTION_MASK_PRESETS: EmotionMaskPreset[] = [
  {
    id: 'em_none',
    label: 'None',
    prompt: '',
  },
  {
    id: 'em_joy_sadness',
    label: 'Joy + Sadness',
    prompt: "Enhance expression to show joy mixed with sadness. Do not alter identity, skin tone, or facial structure. Only adjust emotional zones: eyes, brows, mouth. Subtle cinematic lighting and shallow depth of field.",
  },
  {
    id: 'em_strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt: "Show strength blended with vulnerability in facial expression. Identity must be intact. Do not change hairstyle or face shape. Use natural lighting, focus on expression only.",
  },
  {
    id: 'em_nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt: "Infuse the face with a distant nostalgic emotion. No change to identity, skin tone, or bone structure. Modify only eyes and micro-expression. Subtle light and soft focus.",
  },
  {
    id: 'em_peace_fear',
    label: 'Peace + Fear',
    prompt: "Subtly blend peace and fear in the expression. Keep full identity preservation. No makeup, no glam. Only emotion-focused expression control.",
  },
  {
    id: 'em_confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt: "Create a look of quiet confidence mixed with loneliness. Keep facial features unaltered. Adjust only emotional micro-expressions. Realistic tone and mood.",
  },
];

export function getEmotionMaskPreset(presetId: string): EmotionMaskPreset | undefined {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string): boolean {
  return presetId.startsWith('em_');
}
