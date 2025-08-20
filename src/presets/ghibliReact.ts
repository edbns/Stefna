// src/presets/ghibliReaction.ts
// Identity-Safe Presets (Emotion Mask, Ghibli Reaction, Neo Tokyo Glitch)
// For AIML API (image-to-image). Focus: preserve identity, gender, skin tone,
// ethnicity, age, and facial structure. Only micro-expression / light overlays inspired by Ghibli aesthetic

export type GhibliReactionPreset = {
  id: string;
  label: string;
  prompt: string;
  negative_prompt: string;
  strength: number;
  model: string;
};

const GHIBLI_NEG = [
  'anime face', // disallow full anime conversion
  'toon shading on skin',
  'cell shading on face',
  'big eyes transformation',
  'chibi proportions',
  'different person',
  'gender change',
  'ethnicity change',
  'skin tone change',
  'age change',
  'duplicate face',
  'two faces',
  'multiple faces',
  'double exposure',
  'twin face',
  'second person',
  'reflection face',
  'poster face',
  'extra eyes',
  'extra mouth',
  'deformed',
  'lowres',
  'overprocessed',
].join(', ');

const GHIBLI_BASE =
  'Keep the face realistic and unchanged. Preserve gender, skin tone, ethnicity, age, facial proportions, and identity 100%. '
  + 'Add only small reaction overlays inspired by Ghibli — no cel-shaded skin, no anime facial restructuring.';

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_tears',
    label: 'Tears',
    prompt:
      `${GHIBLI_BASE} Add subtle glossy tear film at lower eyelids and a delicate single tear track on one cheek. Keep skin texture realistic; no cartoon outlines.`,
    negative_prompt: GHIBLI_NEG,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt:
      `${GHIBLI_BASE} Subtle surprise: slightly raised brows, mild sclera visibility, micro-parted lips without teeth. Optional tiny white sparkle highlight near pupils.`,
    negative_prompt: GHIBLI_NEG,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt:
      `${GHIBLI_BASE} Add very small catchlight sparkles near the irises and faint soft bokeh specks around the face. No color cast on skin; keep pores and complexion realistic.`,
    negative_prompt: GHIBLI_NEG,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
  },
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find((p) => p.id === presetId);
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some((p) => p.id === presetId);
}
