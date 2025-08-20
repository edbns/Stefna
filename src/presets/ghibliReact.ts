// src/presets/ghibliReaction.ts

export type GhibliReactionPreset = {
  id: string;
  label: string;
  prompt: string;
  negative_prompt: string; // Added
  strength: number; // Added
  model: string; // Added
};

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_tears',
    label: 'Tears',
    prompt: "Subtle, realistic tears in the eyes. Preserve exact facial identity.",
    negative_prompt: "cartoon, anime, distorted face, different person, fake tears",
    strength: 0.1, // More subtle for better identity preservation
    model: 'portraitplus', // Specialized for portrait quality
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: "Slight widening of eyes, subtle surprise. Preserve exact facial identity.",
    negative_prompt: "cartoon, anime, distorted face, different person, exaggerated",
    strength: 0.1, // More subtle for better identity preservation
    model: 'portraitplus', // Specialized for portrait quality
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: "Gentle light in the eyes, subtle glow. Preserve exact facial identity.",
    negative_prompt: "cartoon, anime, distorted face, different person, glitter",
    strength: 0.1, // More subtle for better identity preservation
    model: 'portraitplus', // Specialized for portrait quality
  }
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId);
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId);
}
