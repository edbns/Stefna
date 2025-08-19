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
    prompt: 'Keep the original photo completely natural. Only enhance the facial expression with subtle Ghibli-style emotional details: very gentle teary eyes with soft reflections, slight blush on cheeks, maybe a single tear drop. Keep the face structure, hair, clothing, background, and lighting exactly as they are. The effect should be barely noticeable - just a gentle emotional enhancement on the face.',
    negative_prompt: 'anime style, cartoon, distorted face, changed background, altered clothing, different hair, dramatic lighting changes, full face transformation, unrealistic features',
    strength: 0.2,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 7,
    num_inference_steps: 20,
    features: ['subtle_ghibli_enhancement', 'facial_expression_only', 'natural_preservation', 'gentle_emotion']
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: 'Keep the original photo completely natural. Only enhance the facial expression with subtle Ghibli-style emotional details: very gentle wide eyes with soft reflections, slight blush on cheeks, maybe a subtle surprised expression. Keep the face structure, hair, clothing, background, and lighting exactly as they are. The effect should be barely noticeable - just a gentle emotional enhancement on the face.',
    negative_prompt: 'anime style, cartoon, distorted face, changed background, altered clothing, different hair, dramatic lighting changes, full face transformation, unrealistic features',
    strength: 0.2,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 7,
    num_inference_steps: 20,
    features: ['subtle_ghibli_enhancement', 'facial_expression_only', 'natural_preservation', 'gentle_emotion']
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: 'Keep the original photo completely natural. Only enhance the facial expression with subtle Ghibli-style emotional details: very gentle sparkle in the eyes, slight blush on cheeks, maybe a subtle happy expression. Keep the face structure, hair, clothing, background, and lighting exactly as they are. The effect should be barely noticeable - just a gentle emotional enhancement on the face.',
    negative_prompt: 'anime style, cartoon, distorted face, changed background, altered clothing, different hair, dramatic lighting changes, full face transformation, unrealistic features',
    strength: 0.2,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 7,
    num_inference_steps: 20,
    features: ['subtle_ghibli_enhancement', 'facial_expression_only', 'natural_preservation', 'gentle_emotion']
  }
]

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId)
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId)
}
