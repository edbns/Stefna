// src/presets/ghibliReaction.ts

export type GhibliReactionPreset = {
  id: string;
  label: string;
  prompt: string;
  negative_prompt: string;
  strength: number;
  model: string;
};

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_tears',
    label: 'Tears',
    prompt: "Keep the exact same realistic face, only add subtle realistic tears in the eyes, preserve identity 100%, same person, same features, minimal change, realistic style",
    negative_prompt: "different person, new face, distorted features, skin change, identity loss, anime, cartoon, stylized, dramatic effect",
    strength: 0.01, // Extremely subtle for realistic effects
    model: 'realistic-vision', // Keep realistic face, not anime
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: "Keep the exact same realistic face, only modify expression to show subtle surprise, preserve identity 100%, same person, same features, minimal change, realistic style",
    negative_prompt: "different person, new face, distorted features, skin change, identity loss, anime, cartoon, stylized, dramatic effect",
    strength: 0.01, // Extremely subtle for realistic effects
    model: 'realistic-vision', // Keep realistic face, not anime
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: "Keep the exact same realistic face, only add subtle light in the eyes, preserve identity 100%, same person, same features, minimal change, realistic style",
    negative_prompt: "different person, new face, distorted features, skin change, identity loss, anime, cartoon, stylized, dramatic effect",
    strength: 0.01, // Extremely subtle for realistic effects
    model: 'realistic-vision', // Keep realistic face, not anime
  }
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId);
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId);
}
