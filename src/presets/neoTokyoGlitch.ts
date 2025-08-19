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
  guidance_scale?: number
  num_inference_steps?: number
}

export const NEO_TOKYO_GLITCH_PRESETS: NeoTokyoGlitchPreset[] = [
  {
    id: 'neo_tokyo_base',
    label: 'Base',
    prompt: 'Keep the original person exactly as they are. Add subtle cyberpunk enhancements: very gentle neon glow around the eyes, slight cybernetic implants on the face, soft pink and yellow lighting effects. Preserve the original face structure, hair, clothing, and background completely. The effect should be a subtle cyberpunk overlay that enhances without changing the person.',
    negative_prompt: 'different person, changed face, altered identity, new character, anime character, cartoon, distorted features, changed background, altered clothing, different hair, full transformation',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['cyberpunk_enhancement', 'identity_preservation', 'subtle_overlay', 'neon_effects'],
    guidance_scale: 7,
    num_inference_steps: 20
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: 'Keep the original person exactly as they are. Add subtle cyberpunk enhancements: very gentle glitch visor effect around the eyes, soft holographic UI overlay, slight cybernetic elements. Preserve the original face structure, hair, clothing, and background completely. The effect should be a subtle cyberpunk overlay that enhances without changing the person.',
    negative_prompt: 'different person, changed face, altered identity, new character, anime character, cartoon, distorted features, changed background, altered clothing, different hair, full transformation',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor', 'holographic_ui', 'identity_preservation', 'subtle_overlay'],
    guidance_scale: 7,
    num_inference_steps: 20
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: 'Keep the original person exactly as they are. Add subtle cyberpunk enhancements: very gentle tech tattoo patterns on the skin, soft luminous implants, slight glowing circuitry effects. Preserve the original face structure, hair, clothing, and background completely. The effect should be a subtle cyberpunk overlay that enhances without changing the person.',
    negative_prompt: 'different person, changed face, altered identity, new character, anime character, cartoon, distorted features, changed background, altered clothing, different hair, full transformation',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos', 'luminous_implants', 'identity_preservation', 'subtle_overlay'],
    guidance_scale: 7,
    num_inference_steps: 20
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: 'Keep the original person exactly as they are. Add subtle cyberpunk enhancements: very gentle scanline texture overlay, soft VHS noise effects, slight visual distortion. Preserve the original face structure, hair, clothing, and background completely. The effect should be a subtle cyberpunk overlay that enhances without changing the person.',
    negative_prompt: 'different person, changed face, altered identity, new character, anime character, cartoon, distorted features, changed background, altered clothing, different hair, full transformation',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['scanline_overlay', 'vhs_noise', 'identity_preservation', 'subtle_overlay'],
    guidance_scale: 7,
    num_inference_steps: 20
  }
]

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId)
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId)
}
