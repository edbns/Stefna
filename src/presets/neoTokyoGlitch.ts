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
    prompt: 'Transform the person into a cyberpunk anime character. Retain the real face and identity. Apply cel-shaded art style with neon cyber tattoos, flickering holographic UI overlays, and glowing reflections in the eyes. Use intense colors (magenta, cyan, blue, violet). Add scanlines, chromatic aberration, and digital distortion. Background should be a stylized Neo Tokyo with tall buildings, glowing ads, and flickering signs. The person should look like a futuristic protagonist inside a glitchy simulation.',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features, face distortion, identity change, gender change, ethnicity change, pose change',
    strength: 0.45, // Increased strength for more visual impact
    model: 'flux/dev/image-to-image', // Explicit model specification
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['identity_preserved', 'cyberpunk_intense', 'cel_shaded', 'neon_glow'],
    guidance_scale: 8.0, // Higher guidance for stronger style adherence
    num_inference_steps: 36
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: 'Transform the person into a cyberpunk anime character. Retain the real face and identity. Apply cel-shaded art style with glowing glitch visor over the eyes, neon cyber tattoos, flickering holographic UI overlays, and intense glowing reflections. Use intense colors (magenta, cyan, blue, violet). Add scanlines, chromatic aberration, and digital distortion. Background should be a stylized Neo Tokyo with tall buildings, glowing ads, and flickering signs. The person should look like a futuristic protagonist inside a glitchy simulation with a prominent glowing visor.',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features, face distortion, identity change, gender change, ethnicity change, pose change',
    strength: 0.50, // Higher strength for prominent visor effect
    model: 'flux/dev/image-to-image', // Explicit model specification
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor_intense', 'identity_preserved', 'holographic_ui', 'cel_shaded'],
    guidance_scale: 8.0, // Higher guidance for stronger style adherence
    num_inference_steps: 36
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: 'Transform the person into a cyberpunk anime character. Retain the real face and identity. Apply cel-shaded art style with prominent glowing tech tattoos on the face/neck, flickering holographic UI overlays, and intense glowing reflections in the eyes. Use intense colors (magenta, cyan, blue, violet). Add scanlines, chromatic aberration, and digital distortion. Background should be a stylized Neo Tokyo with tall buildings, glowing ads, and flickering signs. The person should look like a futuristic protagonist inside a glitchy simulation with prominent luminous tech tattoos.',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features, face distortion, identity change, gender change, ethnicity change, pose change',
    strength: 0.48, // Higher strength for prominent tattoo effects
    model: 'flux/dev/image-to-image', // Explicit model specification
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos_intense', 'identity_preserved', 'luminous_implants', 'cel_shaded'],
    guidance_scale: 8.0, // Higher guidance for stronger style adherence
    num_inference_steps: 36
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: 'Transform the person into a cyberpunk anime character. Retain the real face and identity. Apply cel-shaded art style with prominent scanlines, VHS noise, flickering holographic UI overlays, and intense glowing reflections in the eyes. Use intense colors (magenta, cyan, blue, violet). Add chromatic aberration and digital distortion. Background should be a stylized Neo Tokyo with tall buildings, glowing ads, and flickering signs. The person should look like a futuristic protagonist inside a glitchy simulation with prominent retro digital scanline effects.',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features, face distortion, identity change, gender change, ethnicity change, pose change',
    strength: 0.42, // Higher strength for prominent scanline effects
    model: 'flux/dev/image-to-image', // Explicit model specification
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['scanline_overlay_intense', 'identity_preserved', 'vhs_noise', 'cel_shaded'],
    guidance_scale: 8.0, // Higher guidance for stronger style adherence
    num_inference_steps: 36
  }
]

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId)
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId)
}
