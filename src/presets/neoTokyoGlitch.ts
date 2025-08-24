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
    prompt: `Cyberpunk portrait with Neo Tokyo aesthetics. Face retains core features with glitch distortion and color shifts. Cel-shaded anime style with holographic elements, glitch effects, and neon shimmer. Background: vertical city lights, violet haze, soft scanlines. Colors: electric pink, cyan, sapphire blue, ultraviolet, black. Inspired by Akira and Ghost in the Shell.`,
    negative_prompt: `blurry, distorted face, ugly, deformed, bad anatomy, extra limbs, photorealism, dull style, low contrast, 
nudity, cleavage, merged face, artifacts, realistic texture, boring lighting`,
    strength: 0.45,
    model: 'stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['identity_softened', 'stylized_cyberpunk', 'high_fashion_sci_fi', 'neo_tokyo_aesthetics'],
    guidance_scale: 7.5,
    num_inference_steps: 40
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: `Cyberpunk portrait with a glowing glitch visor covering the eyes. Face retains core features with glitch distortion and color shifts. Add flickering holographic overlays, visor reflections, and neon lighting. Background: animated signs, deep contrast, vertical noise. Colors: vivid magenta visor, cyan-blue reflections, violet haze, black backdrop.`,
    negative_prompt: `small visor, invisible visor, blurry, distorted eyes, mutated face, 
nudity, dull colors, flat lighting, weak glitch effects, minimal transformation`,
    strength: 0.45,
    model: 'stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor_dominant', 'identity_softened', 'stylized_cyberpunk', 'high_fashion_sci_fi'],
    guidance_scale: 8.0,
    num_inference_steps: 40
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: `Cyberpunk portrait with glowing cyber tattoos. Face retains core features with glitch distortion and color shifts. Add glowing cyan and magenta cyber tattoos over face and neck as holographic circuits. Tattoos are layered, not replacing the face. Add glitch overlays, datamosh effects, and neon lighting. Background: chaotic digital Tokyo, broken signage, animated overlays. Colors: glowing pink, blue, cyan neon over dark backdrop.`,
    negative_prompt: `small tattoos, faint markings, weak glow, blurry face, merged features, 
nudity, boring style, unflattering, bad anatomy, pose change`,
    strength: 0.48,
    model: 'stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos_dominant', 'identity_softened', 'stylized_cyberpunk', 'high_fashion_sci_fi'],
    guidance_scale: 8.5,
    num_inference_steps: 40
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: `Cyberpunk portrait with CRT scanline effects. Face retains core features with glitch distortion and color shifts. Overlay intense CRT scanlines and VHS noise. Simulate broken holographic monitor interface. Use high-contrast neon hues with cel-shaded highlights and neon reflections. Background: corrupted cityscape through broken CRT monitor. Colors: vivid pink, cyan, ultraviolet, blue, black.`,
    negative_prompt: `clean image, no scanlines, no distortion, realistic look, distorted face, 
photorealistic, minimal transformation, low noise, soft glitch, muted color, bad lighting`,
    strength: 0.45,
    model: 'stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['scanlines_dominant', 'identity_softened', 'stylized_cyberpunk', 'high_fashion_sci_fi'],
    guidance_scale: 8.5,
    num_inference_steps: 40
  }
]

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId)
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId)
}
