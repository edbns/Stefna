// src/presets/ghibliReact.ts
export type GhibliReactionPreset = {
  id: string
  label: string
  prompt: string
  negative_prompt: string
  strength: number
  model: string
  mode: string
  input: string
  requiresSource: boolean
  source: string
  guidance_scale?: number
  num_inference_steps?: number
  features?: string[]
}

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_tears',
    label: 'Tears',
    prompt: `Transform the human face into a realistic Studio Ghibli-style reaction with a focus on emotion, not full anime. Add glistening tears under the eyes and emotional intensity. Exaggerate the expression only — widened eyes, trembling lips, slight blush. Keep the facial structure, ethnicity, skin, and identity fully intact. Do not add cartoon outlines. Keep lighting soft and dreamy, like a frame from a Ghibli film.`,
    negative_prompt: `cartoon, anime outline, 2D face, unrealistic face, manga, lineart, flat colors, full anime rendering, face replacement, distorted features, overexaggerated proportions, fake texture, plastic skin, gender swap, photorealism, 3D look, harsh shadows`,
    strength: 0.55,
    model: 'fal-ai/ghiblify', // Updated to use fal.ai
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 9,
    num_inference_steps: 28,
    features: ['ghibli_style', 'emotional_reaction', 'tears', 'soft_lighting', 'identity_preserved']
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: `Transform the human face into a realistic Studio Ghibli-style reaction with a focus on emotion, not full anime. Exaggerate the expression only — widened eyes, slightly parted lips, subtle sparkles, or trembling mouth expression. Keep the facial structure, ethnicity, skin, and identity fully intact. Do not add cartoon outlines. Keep lighting soft and dreamy, like a frame from a Ghibli film.`,
    negative_prompt: `cartoon, anime outline, 2D face, unrealistic face, manga, lineart, flat colors, huge bug eyes, distorted anatomy, face merged or replaced, fake skin, photorealism, bland expression, anime mask overlay`,
    strength: 0.55,
    model: 'fal-ai/ghiblify', // Updated to use fal.ai
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 9,
    num_inference_steps: 28,
    features: ['ghibli_style', 'emotional_reaction', 'shock', 'soft_lighting', 'identity_preserved']
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: `Transform the human face into a realistic Studio Ghibli-style reaction with a focus on emotion, not full anime. Add dreamy sparkles and soft blush around the cheeks. Exaggerate the expression only — enhanced eyes with light shimmer, gentle expression. Keep the facial structure, ethnicity, skin, and identity fully intact. Do not add cartoon outlines. Keep lighting soft and dreamy, like a frame from a Ghibli film.`,
    negative_prompt: `cartoon, anime outline, 2D face, unrealistic face, manga, lineart, flat colors, overdone sparkle, anime face swap, distorted head, full cartoon rendering, hard shadows, gender change, poor skin texture`,
    strength: 0.55,
    model: 'fal-ai/ghiblify', // Updated to use fal.ai
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 9,
    num_inference_steps: 28,
    features: ['ghibli_style', 'emotional_reaction', 'sparkles', 'soft_lighting', 'identity_preserved']
  }
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId)
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId)
}
