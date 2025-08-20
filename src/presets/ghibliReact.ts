// src/presets/ghibliReaction.ts
// Stefna Presets — AIML-Safe (Minimal Params)
// Date: 2025-08-20
// Only uses parameters AIML supports: model, prompt, image_url, strength, num_variations
// No negative_prompt, no guidance/steps/sampler/adapters.

export type GhibliReactionPreset = {
  id: string;
  label: string;
  prompt: string;
  strength: number;
  model: string;
  num_variations?: number;
};

// Keep the face realistic; add only tiny whimsical overlays. Avoid anime trigger words
// causing full stylization.
const REACTION_GUARD =
  'Photorealistic single-subject portrait. Keep the exact same person and facial structure. Natural skin texture with pores. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look. No duplicate faces, no reflection faces, no double exposure, no extra eyes or mouth.';

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_tears',
    label: 'Tears',
    prompt:
      `${REACTION_GUARD} Add a delicate glossy tear film on the lower eyelids and a single thin tear track on one cheek. Very subtle, transparent, and realistic; do not alter facial geometry or skin tone.`,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt:
      `${REACTION_GUARD} Subtle surprise reaction: slightly raised brows, mild sclera visibility, micro-parted lips without teeth. Optional tiny white sparkle highlight near the pupils.`,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt:
      `${REACTION_GUARD} Add very small catchlight sparkles near the irises and faint soft bokeh specks around, keeping skin tone and texture unchanged. Subtle and photorealistic.`,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find((p) => p.id === presetId);
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some((p) => p.id === presetId);
}
