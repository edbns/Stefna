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
    prompt: 'Close-up portrait of a real person with a strong emotional Ghibli-style reaction. Keep facial features realistic and human. Add expressive details: large glassy eyes with reflections, slight blush, light tears, subtle manga-style stress lines or sweat drop. Emotion: crying with glassy tears streaming down face. Lighting is warm and soft. Skin is smooth and luminous. The emotion should be exaggerated but believable, like a moment from a Studio Ghibli film. Stylized but not fully anime.',
    negative_prompt: 'full anime style, chibi, 3d, distorted face, cartoon, overly saturated colors, harsh outlines, surreal features, unrealistic proportions',
    strength: 0.35,
    model: 'stable-diffusion-v35-large',
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
    prompt: 'Close-up portrait of a real person with a strong emotional Ghibli-style reaction. Keep facial features realistic and human. Add expressive details: large glassy eyes with reflections, slight blush, light tears, subtle manga-style stress lines or sweat drop. Emotion: shocked with wide eyes and open mouth, surprise expression. Lighting is warm and soft. Skin is smooth and luminous. The emotion should be exaggerated but believable, like a moment from a Studio Ghibli film. Stylized but not fully anime.',
    negative_prompt: 'full anime style, chibi, 3d, distorted face, cartoon, overly saturated colors, harsh outlines, surreal features, unrealistic proportions',
    strength: 0.35,
    model: 'stable-diffusion-v35-large',
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
    prompt: 'Close-up portrait of a real person with a strong emotional Ghibli-style reaction. Keep facial features realistic and human. Add expressive details: large glassy eyes with reflections, slight blush, light tears, subtle manga-style stress lines or sweat drop. Emotion: overjoyed with sparkles around face and bright anime blush, happy expression. Lighting is warm and soft. Skin is smooth and luminous. The emotion should be exaggerated but believable, like a moment from a Studio Ghibli film. Stylized but not fully anime.',
    negative_prompt: 'full anime style, chibi, 3d, distorted face, cartoon, overly saturated colors, harsh outlines, surreal features, unrealistic proportions',
    strength: 0.35,
    model: 'stable-diffusion-v35-large',
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
