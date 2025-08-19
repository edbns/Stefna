// src/presets/neoTokyoGlitch.ts
export type NeoTokyoGlitchPreset = {
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
  features?: string[]
}

export const NEO_TOKYO_GLITCH_PRESETS: NeoTokyoGlitchPreset[] = [
  {
    id: 'neo_tokyo_base',
    label: 'Base',
    prompt: 'Transform this image into a cyberpunk anime character. Use cel-shaded style, sharp neon outlines, and glitch effects. Background should look like a digital city with flickering lights or corrupted data.',
    negative_prompt: 'low quality, blurry, distorted, realistic, photorealistic, 3d render',
    strength: 0.8,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch'
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: 'Transform this image into a cyberpunk anime character. Use cel-shaded style, sharp neon outlines, and glitch effects. Background should look like a digital city with flickering lights or corrupted data. Add a transparent glitch visor over one eye.',
    negative_prompt: 'low quality, blurry, distorted, realistic, photorealistic, 3d render',
    strength: 0.8,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor']
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: 'Transform this image into a cyberpunk anime character. Use cel-shaded style, sharp neon outlines, and glitch effects. Background should look like a digital city with flickering lights or corrupted data. Include glowing tech tattoos on the face or neck.',
    negative_prompt: 'low quality, blurry, distorted, realistic, photorealistic, 3d render',
    strength: 0.8,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos']
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: 'Transform this image into a cyberpunk anime character. Use cel-shaded style, sharp neon outlines, and glitch effects. Background should look like a digital city with flickering lights or corrupted data. Overlay subtle scanlines for a retro digital effect.',
    negative_prompt: 'low quality, blurry, distorted, realistic, photorealistic, 3d render',
    strength: 0.8,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['scanlines']
  }
]

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId)
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId)
}
