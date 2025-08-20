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
    prompt: 'Transform the image into a cyberpunk portrait with subtle neon overlays and glitch accents. Strictly preserve ethnicity, facial structure, skin tone, and hairstyle. Apply only light cyberpunk overlays (like scanlines, HUD elements) without altering identity. Background may include Tokyo-style lights.',
    negative_prompt: 'anime face, altered identity, different person, changed race, cartoon, whitewashing, face swap, new character, Asian features unless already present',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['neon_lighting', 'identity_preservation', 'ethnic_integrity'],
    guidance_scale: 7,
    num_inference_steps: 20
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: 'Add cyberpunk visor UI and glitch overlays. Preserve full facial identity including ethnicity, tone, and shape. The visor should appear layered over the original face without modifying its structure.',
    negative_prompt: 'face change, race alteration, anime style, cartoon overlay, identity swap',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['visor_fx', 'cyber_overlay', 'identity_safe'],
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
