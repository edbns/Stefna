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
    prompt: "Ghibli anime style, Studio Ghibli aesthetic, subtle tears in the eyes, keep the exact same face, only add tears, preserve identity 100%",
    negative_prompt: "different person, new face, distorted features, skin change, identity loss, realistic, photorealistic",
    strength: 0.03, // Extremely subtle
    model: 'anything-v5', // Better for anime/ghibli style
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: "Ghibli anime style, Studio Ghibli aesthetic, slight widening of eyes, subtle surprise, keep the exact same face, only modify expression, preserve identity 100%",
    negative_prompt: "different person, new face, distorted features, skin change, identity loss, realistic, photorealistic",
    strength: 0.03, // Extremely subtle
    model: 'anything-v5', // Better for anime/ghibli style
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: "Ghibli anime style, Studio Ghibli aesthetic, gentle light in the eyes, subtle glow, keep the exact same face, only add sparkle effect, preserve identity 100%",
    negative_prompt: "different person, new face, distorted features, skin change, identity loss, realistic, photorealistic",
    strength: 0.03, // Extremely subtle
    model: 'anything-v5', // Better for anime/ghibli style
  }
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId);
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId);
}
