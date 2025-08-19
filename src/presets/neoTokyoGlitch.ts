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
    prompt: 'portrait of a female cyberpunk anime character, cel-shaded, neon glow, glitch effects, cybernetic implants, glowing eyes, futuristic city background, pink and yellow light, sharp outline, dramatic lighting, synthwave color palette, retro scanlines',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features',
    strength: 0.65,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['base_cyberpunk', 'cel_shaded', 'neon_glow', 'glitch_effects'],
    guidance_scale: 8.5,
    num_inference_steps: 28
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: 'portrait of a female cyberpunk anime character, cel-shaded, neon glow, glitch effects, cybernetic implants, glowing eyes, futuristic city background, pink and yellow light, sharp outline, dramatic lighting, synthwave color palette, retro scanlines, cybernetic visor, glitching UI overlay, holographic displays',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features',
    strength: 0.65,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor', 'holographic_ui', 'cel_shaded', 'neon_glow'],
    guidance_scale: 8.5,
    num_inference_steps: 28
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: 'portrait of a female cyberpunk anime character, cel-shaded, neon glow, glitch effects, cybernetic implants, glowing eyes, futuristic city background, pink and yellow light, sharp outline, dramatic lighting, synthwave color palette, retro scanlines, detailed tech tattoos, luminous skin implants, glowing circuitry patterns',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features',
    strength: 0.65,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['enhanced_tech_tattoos', 'luminous_implants', 'cel_shaded', 'neon_glow'],
    guidance_scale: 8.5,
    num_inference_steps: 28
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: 'portrait of a female cyberpunk anime character, cel-shaded, neon glow, glitch effects, cybernetic implants, glowing eyes, futuristic city background, pink and yellow light, sharp outline, dramatic lighting, synthwave color palette, retro scanlines, scanline texture overlay, VHS noise, visual distortion effects',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features',
    strength: 0.65,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['scanline_overlay', 'vhs_noise', 'visual_distortion', 'cel_shaded'],
    guidance_scale: 8.5,
    num_inference_steps: 28
  }
]

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId)
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId)
}
