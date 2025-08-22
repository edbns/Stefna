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
Retain facial identity and beauty. Face must match the subject image. Keep symmetry, skin tone, and gender. Subject must be clearly recognizable. Stylize only with overlays and lighting, not by changing facial structure.

Use cel-shaded anime detail and high-fashion sci-fi energy. Add glowing holographic elements, glitch FX, particle trails, and neon shimmer.
Stylize with soft glitch effects, digital particles, and cyberpunk background. Keep lighting dramatic but not overpowering. Use ambient reflections and subtle neon shimmer.

Background: vertical city lights, violet haze, soft scanlines. 
Color palette: electric pink, cyan, sapphire blue, ultraviolet, black. 
Inspired by Akira, Ghost in the Shell, and glitch fashion photography.`,
    negative_prompt: `blurry, distorted face, ugly, deformed, bad anatomy, extra limbs, photorealism, dull style, low contrast, 
nudity, cleavage, gender change, ethnicity change, identity change, merged face, artifacts, realistic texture, boring lighting`,
    strength: 0.45,
    model: 'replicate/stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['identity_preserved', 'stylized_cyberpunk', 'high_fashion_sci_fi', 'neo_tokyo_aesthetics'],
    guidance_scale: 7.5,
    num_inference_steps: 40
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: `Stylized cyberpunk portrait with a PROMINENT glowing glitch visor covering the eyes. 
Add flickering holographic UI overlays and digital reflection in the visor. 
Retain identity and beauty: symmetrical face, elegant structure, intense glowing eyes. 
Use neon glitch bloom, chromatic aberration, and techno-chaotic lighting.
Background: animated signs, deep contrast, vertical noise.
Color theme: magenta visor glow, cyan-blue reflections, violet haze, black backdrop.
Inspired by cyberpunk anime and digital fashion.`,
    negative_prompt: `small visor, invisible visor, blurry, distorted eyes, mutated face, gender change, identity change, 
nudity, dull colors, flat lighting, weak glitch effects, minimal transformation`,
    strength: 0.45,
    model: 'replicate/stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor_dominant', 'identity_preserved', 'stylized_cyberpunk', 'high_fashion_sci_fi'],
    guidance_scale: 8.0,
    num_inference_steps: 40
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: `Stylized cyberpunk portrait with glowing cyber tattoos. 
Retain facial identity and beauty. Face must match the subject image. Keep symmetry, skin tone, and gender. Subject must be clearly recognizable. Stylize only with overlays and lighting, not by changing facial structure.

Add glowing cyan and magenta cyber tattoos over face and neck, designed as holographic circuits. Tattoos should be layered, not replace the face. Face must remain unchanged - overlay tattoos while preserving natural facial features. Enhance with glowing facial circuit patterns while keeping core identity.

Add glitch overlays, datamosh FX, and soft neon ambient lighting. 
Background: chaotic digital Tokyo, broken signage, animated overlays.
Color theme: glowing tattoos, pink/blue/cyan/neon blend with dark backdrop.`,
    negative_prompt: `small tattoos, faint markings, weak glow, blurry face, identity distortion, merged features, 
nudity, photorealism, boring style, unflattering, bad anatomy, pose change, ethnicity change, gender change`,
    strength: 0.48,
    model: 'replicate/stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos_dominant', 'identity_preserved', 'stylized_cyberpunk', 'high_fashion_sci_fi'],
    guidance_scale: 8.5,
    num_inference_steps: 40
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: `Stylized cyberpunk portrait with CRT scanline effects. 
Retain facial identity and beauty. Face must match the subject image. Keep symmetry, skin tone, and gender. Subject must be clearly recognizable. Stylize only with overlays and lighting, not by changing facial structure.

Overlay intense CRT scanlines and VHS noise. Simulate broken holographic monitor interface over the background. Use high-contrast neon hues. Keep face sharp, expressive, symmetrical, and identity-locked. Add cel-shaded highlights, neon reflections, and subtle chromatic aberration on skin edges.

Background: corrupted cityscape viewed through broken CRT monitor. 
Color palette: high-contrast glitch colors — pink, cyan, ultraviolet, blue, black.`,
    negative_prompt: `clean image, no scanlines, no distortion, realistic look, gender/ethnicity change, distorted face, 
photorealistic, minimal transformation, low noise, soft glitch, muted color, bad lighting, face replacement, male features`,
    strength: 0.45,
    model: 'replicate/stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['scanlines_dominant', 'identity_preserved', 'stylized_cyberpunk', 'high_fashion_sci_fi'],
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
