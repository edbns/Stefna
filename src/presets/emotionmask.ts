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
    id: 'joy_sadness',
    label: 'Joy + Sadness',
    prompt: "Subtly enhance expression to show joy mixed with sadness. Preserve real facial identity, skin tone, and structure. Only adjust emotional cues in the eyes, eyebrows, and mouth. No changes to hair, background, or lighting. Cinematic realism with emotional depth.",
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt: "Subtly enhance expression to reflect strength with hidden vulnerability. Do not alter facial identity, skin tone, or features. Adjust only emotional areas (eyes, brow tension, lips). Avoid artistic distortions. Use soft cinematic lighting.",
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt: "Modify emotional features to convey nostalgic longing and quiet detachment. Do not change hair, ethnicity, or facial structure. Identity must remain fully intact. Use cinematic grading and shallow depth of field.",
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt: "Express inner calm layered with subtle fear. Keep facial integrity, lighting, and tone unchanged. Modify expression minimally with realistic tension in key areas (eyes, lips). Keep cinematic tone intact.",
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt: "Reveal hidden loneliness beneath a confident exterior. Change only micro-expressions (eyebrows, lips, eyes). Preserve full face structure, skin tone, ethnicity, and identity. Use natural lighting and cinematic mood.",
  },
];

export function getEmotionMaskPreset(presetId: string) {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId);
}

export function isEmotionMaskPreset(presetId: string) {
  // Handle the special 'none' case and check if it's a valid emotion mask preset
  if (presetId === 'none') return true;
  return EMOTION_MASK_PRESETS.some(p => p.id === presetId);
}
