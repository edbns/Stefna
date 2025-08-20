// src/presets/ghibliReaction.ts
export type GhibliReactionPreset = {
  id: string;
  label: string;
  prompt: string;
};

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'gh_tears',
    label: 'Tears (Realistic)',
    prompt: "Apply subtle stylized reaction inspired by Studio Ghibli. Preserve facial identity, ethnicity, skin tone, and realism. Enhance eyes slightly with tears and sparkle. Add sketchy lighting or blush without anime-face distortion.",
  },
  {
    id: 'gh_shock',
    label: 'Shock (Subtle)',
    prompt: "Slightly exaggerate shock expression using anime-inspired cues (wide eyes, sparkles), while maintaining natural face, race, and realistic features. Avoid full anime conversion. Keep hair, skin, and facial geometry unchanged.",
  },
  {
    id: 'gh_wonder',
    label: 'Wonder (Cute)',
    prompt: "Add small stylized elements like sparkles, blush, and light sketch shadows to exaggerate a feeling of awe. Preserve the subject's real-world identity, race, and facial realism. Avoid changing the style or character.",
  },
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId);
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId);
}
