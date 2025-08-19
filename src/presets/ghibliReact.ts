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
    prompt: 'anime character in Studio Ghibli style, exaggerated facial expression, wide teary eyes, soft lighting, cinematic feel, freckles or sparkles, emotional reaction, lush nature background, gentle color grading, big glassy tears like Chihiro crying',
    negative_prompt: 'uncanny, overexposed, photorealistic, distorted face, multiple heads, digital artifacts, watermark',
    strength: 0.55,
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
    prompt: 'anime character in Studio Ghibli style, exaggerated facial expression, wide shocked eyes, soft lighting, cinematic feel, freckles or sparkles, emotional reaction, lush nature background, gentle color grading, shocked anime face like Sophie from Howl\'s Moving Castle',
    negative_prompt: 'uncanny, overexposed, photorealistic, distorted face, multiple heads, digital artifacts, watermark',
    strength: 0.55,
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
    prompt: 'anime character in Studio Ghibli style, exaggerated facial expression, wide sparkly eyes, soft lighting, cinematic feel, freckles or sparkles, emotional reaction, lush nature background, gentle color grading, sparkles around face and big anime blush',
    negative_prompt: 'uncanny, overexposed, photorealistic, distorted face, multiple heads, digital artifacts, watermark',
    strength: 0.55,
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
