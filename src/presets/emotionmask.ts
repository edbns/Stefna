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
    prompt: "Subtly enhance expression to show joy mixed with sadness. Preserve **photographic facial identity**, skin tone, and structure. Only adjust emotional cues in the eyes, eyebrows, and mouth. **Use natural, ambient lighting.** Cinematic realism with emotional depth.",
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt: "Subtly enhance expression to reflect strength with hidden vulnerability. Do not alter facial identity, skin tone, or features. Adjust only emotional areas (eyes, brow tension, lips). Avoid artistic distortions. **Use soft, true-to-life lighting**.",
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt: "Modify emotional features to convey nostalgic longing and quiet detachment. Do not change hair, ethnicity, or facial structure. Identity must remain fully intact. **Use soft, natural light and a slightly faded color palette**.",
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt: "Express inner calm layered with subtle fear. Keep facial integrity, lighting, and tone unchanged. Modify expression minimally with realistic tension in key areas (eyes, lips). **Ensure realistic skin textures and fine details are retained.**",
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt: "Reveal hidden loneliness beneath a confident exterior. Change only micro-expressions (eyebrows, lips, eyes). Preserve full face structure, skin tone, ethnicity, and identity. Use **high-fidelity, natural lighting** and cinematic mood.",
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
