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
    prompt: `Stylized cyberpunk portrait inspired by Neo Tokyo aesthetics. 
Face should retain core features of the subject, but allow for glitch-induced distortion, color shifts, and futuristic exaggerations.
Let facial structure adapt to stylized overlays — ethnic identity may shift slightly as part of the transformation.

Use cel-shaded anime detail and high-fashion sci-fi energy. Add glowing holographic elements, glitch FX, particle trails, and neon shimmer.
Stylize with soft glitch effects, digital particles, and cyberpunk background. Keep lighting dramatic but not overpowering. Use ambient reflections and subtle neon shimmer.

Background: vertical city lights, violet haze, soft scanlines. 
Color palette: exaggerated and vivid — electric pink, cyan, sapphire blue, ultraviolet, black. 
Inspired by Akira, Ghost in the Shell, and glitch fashion photography.

This is your chaotic glitch-self in a surreal Neo Tokyo future.`,
    negative_prompt: `blurry, distorted face, ugly, deformed, bad anatomy, extra limbs, photorealism, dull style, low contrast, 
nudity, cleavage, merged face, artifacts, realistic texture, boring lighting`,
    strength: 0.45,
    model: 'replicate/stability-ai/stable-diffusion-img2img',
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
    prompt: `Stylized cyberpunk portrait with a PROMINENT glowing glitch visor covering the eyes.
Face should retain core features of the subject, but allow for glitch-induced distortion, color shifts, and futuristic exaggerations.
Add flickering holographic UI overlays and digital reflection in the visor.
Use neon glitch bloom, chromatic aberration, and techno-chaotic lighting.

Background: animated signs, deep contrast, vertical noise.
Color theme: exaggerated and vivid — magenta visor glow, cyan-blue reflections, violet haze, black backdrop.
Inspired by cyberpunk anime and digital fashion.

This is your chaotic glitch-self in a surreal Neo Tokyo future.`,
    negative_prompt: `small visor, invisible visor, blurry, distorted eyes, mutated face, 
nudity, dull colors, flat lighting, weak glitch effects, minimal transformation`,
    strength: 0.45,
    model: 'replicate/stability-ai/stable-diffusion-img2img',
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
    prompt: `Stylized cyberpunk portrait with glowing cyber tattoos.
Face should retain core features of the subject, but allow for glitch-induced distortion, color shifts, and futuristic exaggerations.
Add glowing cyan and magenta cyber tattoos over face and neck, designed as holographic circuits. Tattoos should be layered, not replace the face.
Enhance with glowing facial circuit patterns while keeping recognizable emotional expression.

Add glitch overlays, datamosh FX, and soft neon ambient lighting.
Background: chaotic digital Tokyo, broken signage, animated overlays.
Color theme: glowing tattoos with exaggerated and vivid blend — pink, blue, cyan, neon over dark backdrop.

This is your chaotic glitch-self in a surreal Neo Tokyo future.`,
    negative_prompt: `small tattoos, faint markings, weak glow, blurry face, merged features, 
nudity, boring style, unflattering, bad anatomy, pose change`,
    strength: 0.48,
    model: 'replicate/stability-ai/stable-diffusion-img2img',
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
    prompt: `Stylized cyberpunk portrait with CRT scanline effects.
Face should retain core features of the subject, but allow for glitch-induced distortion, color shifts, and futuristic exaggerations.
Overlay intense CRT scanlines and VHS noise. Simulate broken holographic monitor interface over the background.
Use high-contrast neon hues. Add cel-shaded highlights, neon reflections, and subtle chromatic aberration on skin edges.

Background: corrupted cityscape viewed through broken CRT monitor.
Color palette: exaggerated and vivid — pink, cyan, ultraviolet, blue, black.

This is your chaotic glitch-self in a surreal Neo Tokyo future.`,
    negative_prompt: `clean image, no scanlines, no distortion, realistic look, distorted face, 
photorealistic, minimal transformation, low noise, soft glitch, muted color, bad lighting`,
    strength: 0.45,
    model: 'replicate/stability-ai/stable-diffusion-img2img',
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
