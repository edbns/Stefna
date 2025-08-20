// src/presets/emotionMask.ts

export type EmotionMaskPreset = {
  id: string;
  label: string;
  prompt: string;
  negative_prompt: string;
  strength: number;
};

export const EMOTION_MASK_PRESETS: EmotionMaskPreset[] = [
  {
    id: 'none',
    label: 'None',
    prompt: '',
    negative_prompt: '',
    strength: 0.0,
  },
  {
    id: 'joy_sadness',
    label: 'Joy + Sadness',
    prompt: "On the **single subject in the photo**, subtly enhance expression to show joy mixed with sadness. **The output must contain only one person.** Preserve **photographic facial identity**, skin tone, and structure. Only adjust emotional cues in the eyes, eyebrows, and mouth. **Use natural, ambient lighting.** Cinematic realism with emotional depth.",
    negative_prompt: "two faces, multiple people, duplicate, twins, cartoon face, new character, different race, altered identity, gender change, anime character, fake face, distortion, full transformation",
    strength: 0.3,
  },
  {
    id: 'strength_vulnerability',
    label: 'Strength + Vulnerability',
    prompt: "On the **single subject in the photo**, subtly enhance expression to reflect strength with hidden vulnerability. **The output must contain only one person.** Do not alter facial identity, skin tone, or features. Adjust only emotional areas (eyes, brow tension, lips). Avoid artistic distortions. **Use soft, true-to-life lighting**.",
    negative_prompt: "two faces, multiple people, duplicate, twins, cartoon face, new character, different race, altered identity, gender change, anime character, fake face, distortion, full transformation",
    strength: 0.3,
  },
  {
    id: 'nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt: "On the **single subject in the photo**, modify emotional features to convey nostalgic longing and quiet detachment. **The output must contain only one person.** Do not change hair, ethnicity, or facial structure. Identity must remain fully intact. **Use soft, natural light and a slightly faded color palette**.",
    negative_prompt: "two faces, multiple people, duplicate, twins, cartoon face, new character, different race, altered identity, gender change, anime character, fake face, distortion, full transformation",
    strength: 0.3,
  },
  {
    id: 'peace_fear',
    label: 'Peace + Fear',
    prompt: "On the **single subject in the photo**, express inner calm layered with subtle fear. **The output must contain only one person.** Keep facial integrity, lighting, and tone unchanged. Modify expression minimally with realistic tension in key areas (eyes, lips). **Ensure realistic skin textures and fine details are retained.**",
    negative_prompt: "two faces, multiple people, duplicate, twins, cartoon face, new character, different race, altered identity, gender change, anime character, fake face, distortion, full transformation",
    strength: 0.3,
  },
  {
    id: 'confidence_loneliness',
    label: 'Confidence + Loneliness',
    prompt: "On the **single subject in the photo**, reveal hidden loneliness beneath a confident exterior. **The output must contain only one person.** Change only micro-expressions (eyebrows, lips, eyes). Preserve full face structure, skin tone, ethnicity, and identity. Use **high-fidelity, natural lighting** and cinematic mood.",
    negative_prompt: "two faces, multiple people, duplicate, twins, cartoon face, new character, different race, altered identity, gender change, anime character, fake face, distortion, full transformation",
    strength: 0.3,
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
