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
    prompt: 'Portrait with a dramatic Studio Ghibli-style reaction. Human face kept realistic with cel-shading, sparkling eyes, small anime-style effects (teardrop, blushing, stress lines). Expression must be exaggerated: crying with big glassy tears. Natural background blur or light sketchy shading. Cute and expressive, not fully anime.',
    negative_prompt: 'full anime face, 3d render, bad anatomy, distorted face, unrealistic, photo artifacts, harsh lighting',
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
    prompt: 'Portrait with a dramatic Studio Ghibli-style reaction. Human face kept realistic with cel-shading, sparkling eyes, small anime-style effects (teardrop, blushing, stress lines). Expression must be exaggerated: shocked with wide eyes and open mouth. Natural background blur or light sketchy shading. Cute and expressive, not fully anime.',
    negative_prompt: 'full anime face, 3d render, bad anatomy, distorted face, unrealistic, photo artifacts, harsh lighting',
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
    prompt: 'Portrait with a dramatic Studio Ghibli-style reaction. Human face kept realistic with cel-shading, sparkling eyes, small anime-style effects (teardrop, blushing, stress lines). Expression must be exaggerated: overjoyed with sparkles around face and big anime blush. Natural background blur or light sketchy shading. Cute and expressive, not fully anime.',
    negative_prompt: 'full anime face, 3d render, bad anatomy, distorted face, unrealistic, photo artifacts, harsh lighting',
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
