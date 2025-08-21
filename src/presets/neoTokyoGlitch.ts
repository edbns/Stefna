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
    prompt: 'Transform this image into a cyberpunk anime character. Use cel-shaded style, sharp neon outlines, and glitch effects. Background should look like a digital city with flickering lights or corrupted data.',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features',
    strength: 0.65,
    model: 'flux/dev', // Working system ignored this and used flux/dev/image-to-image
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
    prompt: 'Transform this image into a cyberpunk anime character. Use cel-shaded style, sharp neon outlines, and glitch effects. Background should look like a digital city with flickering lights or corrupted data. Add a transparent glitch visor over one eye.',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features',
    strength: 0.65,
    model: 'flux/dev', // Working system ignored this and used flux/dev/image-to-image
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
    prompt: 'Transform this image into a cyberpunk anime character. Use cel-shaded style, sharp neon outlines, and glitch effects. Background should look like a digital city with flickering lights or corrupted data. Include glowing tech tattoos on the face or neck.',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features',
    strength: 0.65,
    model: 'flux/dev', // Working system ignored this and used flux/dev/image-to-image
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
    prompt: 'Transform this image into a cyberpunk anime character. Use cel-shaded style, sharp neon outlines, and glitch effects. Background should look like a digital city with flickering lights or corrupted data. Overlay subtle scanlines for a retro digital effect.',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features',
    strength: 0.65,
    model: 'flux/dev', // Working system ignored this and used flux/dev/image-to-image
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
