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
    prompt: 'Transform the human face to resemble an anime reaction shot in the style of Studio Ghibli. Keep realistic skin and hair texture. Emphasize exaggerated emotion with stylized features like large glistening eyes, sparkles, tears, or shocked expressions. Add big glassy tears like Chihiro crying.',
    negative_prompt: 'full anime face, 3d render, bad anatomy, distorted face, unrealistic, photo artifacts, harsh lighting',
    strength: 0.35,
    model: 'flux/dev', // Working system ignored this and used flux/dev/image-to-image
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 9,
    num_inference_steps: 28,
    features: ['ghibli_style', 'emotional_reaction', 'tears', 'soft_lighting']
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: 'Transform the human face to resemble an anime reaction shot in the style of Studio Ghibli. Keep realistic skin and hair texture. Emphasize exaggerated emotion with stylized features like large glistening eyes, sparkles, tears, or shocked expressions. Exaggerate shocked anime face like Sophie from Howl\'s Moving Castle.',
    negative_prompt: 'full anime face, 3d render, bad anatomy, distorted face, unrealistic, photo artifacts, harsh lighting',
    strength: 0.35,
    model: 'flux/dev', // Working system ignored this and used flux/dev/image-to-image
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 9,
    num_inference_steps: 28,
    features: ['ghibli_style', 'emotional_reaction', 'shock', 'soft_lighting']
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: 'Transform the human face to resemble an anime reaction shot in the style of Studio Ghibli. Keep realistic skin and hair texture. Emphasize exaggerated emotion with stylized features like large glistening eyes, sparkles, tears, or shocked expressions. Add sparkles around face and big anime blush.',
    negative_prompt: 'full anime face, 3d render, bad anatomy, distorted face, unrealistic, photo artifacts, harsh lighting',
    strength: 0.35,
    model: 'flux/dev', // Working system ignored this and used flux/dev/image-to-image
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 9,
    num_inference_steps: 28,
    features: ['ghibli_style', 'emotional_reaction', 'sparkles', 'soft_lighting']
  }
]

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId)
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId)
}
