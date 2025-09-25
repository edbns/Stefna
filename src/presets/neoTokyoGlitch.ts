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
  // BFL-specific parameters
  prompt_upsampling?: boolean
  safety_tolerance?: number
  output_format?: string
  raw?: boolean
  image_prompt_strength?: number
  aspect_ratio?: string
}

export const NEO_TOKYO_GLITCH_PRESETS: NeoTokyoGlitchPreset[] = [
  {
    id: 'neo_tokyo_base',
    label: 'Base',
    prompt: `Photorealistic portrait of a stylish person mid-movement in a cinematic city scene. Face and body must match the original input with full identity preserved — same gender, facial structure, and skin tone. They are wearing high-end futuristic streetwear: layered black techwear pieces, cropped jackets, sleek accessories, minimal but bold styling. Background is urban and dynamic — neon signs, alley walls, wet pavement, or glowing city light. Lighting is dramatic and moody: golden hour haze or neon reflections. Hair is windblown, natural, unstyled. Expression is confident and unposed — as if caught mid-walk, glancing sideways, or adjusting their jacket. No unrealistic features, no gender change, no cartoon or anime look. This is a real person, transformed into a cinematic streetwear icon.`,
    negative_prompt: `anime, cartoon, illustration, 3D render, feminine face, long hair, makeup, lipstick, eyelashes, soft skin, exaggerated beauty, gender swap, gender change, unrealistic body, fake eyes, doll-like, bimbo, barbie, blurred details, over-stylized, low resolution, distorted hands, bad anatomy, incorrect face`,
    strength: 0.55,
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
    prompt: `Transform the human face into a cyberpunk glitch aesthetic with vivid neon tattoos and holographic overlays. Retain the subject's facial features, gender, and ethnicity. Apply stylized glowing tattoos on the cheeks, jawline, or neck. Add glitch patterns, chromatic distortion, and soft RGB splits. Use cinematic backlighting with a futuristic, dreamlike tone. The skin should retain texture, but colors can be surreal. Preserve facial integrity — no face swap or anime overlay.`,
    negative_prompt: `cartoon, anime, 2D, blurry, face merge, distorted anatomy, extra limbs, broken skin texture, glowing eyes, full character replacement, plastic look, mask overlay, 3D render, low quality, harsh shadows`,
    strength: 0.45,
    model: 'stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch', 'tattoos', 'neon', 'face_preservation', 'cyberpunk'],
    guidance_scale: 7.5,
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
