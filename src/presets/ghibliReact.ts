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
    prompt: `Transform the human face into a Studio Ghibli-style emotional reaction while preserving realistic skin, hair, and facial structure. Add glistening anime-inspired tears under the eyes. Eyes should appear larger and wetter, with soft sparkles and emotional intensity. Preserve skin tone, gender, and facial integrity. Lighting should be soft and warm, like sunset glow. Keep hairstyle and identity intact.`,
    negative_prompt: `anime face replacement, distorted features, overexaggerated proportions, fake texture, plastic skin, full anime rendering, gender swap, photorealism, 3D look, harsh shadows`,
    strength: 0.35,
    model: 'fal:flux/ghibli', // Updated to use fal.ai
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
    prompt: `Transform the human face into a shocked Studio Ghibli-style reaction while preserving identity and facial realism. Exaggerate expression with widened anime-style eyes and slightly parted lips. Add subtle sparkles, blush, or trembling mouth expression. Retain hair, skin texture, gender, and core facial structure. Background and lighting should feel soft and dreamy, like a still from a Ghibli film.`,
    negative_prompt: `cartoon face, huge bug eyes, distorted anatomy, face merged or replaced, fake skin, photorealism, bland expression, anime mask overlay`,
    strength: 0.35,
    model: 'fal:flux/ghibli', // Updated to use fal.ai
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
    prompt: `Transform the human face into a dreamy Ghibli-style expression with sparkles and soft blush. Retain the subject's identity, facial proportions, and realism. Enhance the eyes with light shimmer and gentle expression. Add whimsical sparkle particles around the cheeks and subtle pink blush. Skin, hair, and gender should stay accurate to the source. Use golden hour or pastel lighting for warmth and nostalgia.`,
    negative_prompt: `overdone sparkle, anime face swap, distorted head, full cartoon rendering, hard shadows, gender change, poor skin texture`,
    strength: 0.35,
    model: 'fal:flux/ghibli', // Updated to use fal.ai
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
