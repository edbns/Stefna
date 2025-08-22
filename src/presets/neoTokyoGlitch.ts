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
    prompt: `Transform this person into a stylized cyberpunk portrait inspired by Neo Tokyo aesthetics. Use cel-shaded anime detail and high-fashion sci-fi energy. 
Add glowing holographic elements, reflective materials, glitch FX, neon particle trails, and digital shimmer. 

Face must retain full identity — hyperrealistic facial structure, perfect skin symmetry, vivid emotion in the eyes. 
Background should be dark with bright glitch overlays, vertical city lights, and soft violet haze. 
Color palette: electric pink, cyan, sapphire blue, ultraviolet, and glossy black.

Style inspired by Akira, Ghost in the Shell, and sci-fi fashion photography. Prioritize beauty, symmetry, elegance, and chaos.`,
    negative_prompt: `blurry, distorted face, ugly, deformed, bad anatomy, extra limbs, realistic texture, photorealism, boring style, low contrast, weak lighting, 
nudity, cleavage, sexualized content, unflattering expression, duplicate face, mutated, face merge, distortion, identity loss, gender change, ethnicity change`,
    strength: 0.4, // Balanced strength for identity lock + style takeover
    model: 'replicate/stability-ai/stable-diffusion-img2img', // Updated to Replicate model
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['identity_preserved', 'stylized_cyberpunk', 'high_fashion_sci_fi', 'neo_tokyo_aesthetics'],
    guidance_scale: 7.5, // Balanced guidance for style enforcement
    num_inference_steps: 40
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: `Transform this person into a stylized cyberpunk portrait inspired by Neo Tokyo aesthetics. Use cel-shaded anime detail and high-fashion sci-fi energy. 
Add a PROMINENT glowing magenta or cyan glitch visor over the eyes with holographic UI elements and reflective materials. 
Add glowing holographic elements, glitch FX, neon particle trails, and digital shimmer. 

Face must retain full identity — hyperrealistic facial structure, perfect skin symmetry, vivid emotion in the eyes. 
Background should be dark with bright glitch overlays, vertical city lights, and soft violet haze. 
Color palette: electric pink, cyan, sapphire blue, ultraviolet, and glossy black.

Style inspired by Akira, Ghost in the Shell, and sci-fi fashion photography. The glitch visor should be the dominant visual element.`,
    negative_prompt: `blurry, distorted face, ugly, deformed, bad anatomy, extra limbs, realistic texture, photorealism, boring style, low contrast, weak lighting, 
nudity, cleavage, sexualized content, unflattering expression, duplicate face, mutated, face merge, distortion, identity loss, gender change, ethnicity change, small visor`,
    strength: 0.45, // Slightly higher for visor effect
    model: 'replicate/stability-ai/stable-diffusion-img2img', // Updated to Replicate model
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor_dominant', 'identity_preserved', 'stylized_cyberpunk', 'high_fashion_sci_fi'],
    guidance_scale: 8.0, // Higher guidance for visor emphasis
    num_inference_steps: 40
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: `Transform this person into a stylized cyberpunk portrait inspired by Neo Tokyo aesthetics. Use cel-shaded anime detail and high-fashion sci-fi energy. 
Add PROMINENT glowing magenta or cyan cyber tattoos covering the face, neck, and shoulders with holographic UI elements. 
Add glowing holographic elements, reflective materials, glitch FX, neon particle trails, and digital shimmer. 

Face must retain full identity — hyperrealistic facial structure, perfect skin symmetry, vivid emotion in the eyes. 
Background should be dark with bright glitch overlays, vertical city lights, and soft violet haze. 
Color palette: electric pink, cyan, sapphire blue, ultraviolet, and glossy black.

Style inspired by Akira, Ghost in the Shell, and sci-fi fashion photography. The cyber tattoos should be the dominant visual element.`,
    negative_prompt: `blurry, distorted face, ugly, deformed, bad anatomy, extra limbs, realistic texture, photorealism, boring style, low contrast, weak lighting, 
nudity, cleavage, sexualized content, unflattering expression, duplicate face, mutated, face merge, distortion, identity loss, gender change, ethnicity change, small tattoos`,
    strength: 0.5, // Higher strength for tattoo coverage
    model: 'replicate/stability-ai/stable-diffusion-img2img', // Updated to Replicate model
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos_dominant', 'identity_preserved', 'stylized_cyberpunk', 'high_fashion_sci_fi'],
    guidance_scale: 8.5, // Higher guidance for tattoo emphasis
    num_inference_steps: 40
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: `Transform this person into a stylized cyberpunk portrait inspired by Neo Tokyo aesthetics. Use cel-shaded anime detail and high-fashion sci-fi energy. 
Overlay INTENSE scanlines, VHS noise, datamosh artifacts, and static noise across the entire frame. 
Add glowing holographic elements, reflective materials, glitch FX, neon particle trails, and digital shimmer. 

Face must retain full identity — hyperrealistic facial structure, perfect skin symmetry, vivid emotion in the eyes. 
Background should be dark with bright glitch overlays, vertical city lights, and soft violet haze. 
Color palette: electric pink, cyan, sapphire blue, ultraviolet, and glossy black.

Style inspired by Akira, Ghost in the Shell, and sci-fi fashion photography. The scanlines and VHS noise should be the dominant visual element, as if viewed on a broken CRT monitor.`,
    negative_prompt: `blurry, distorted face, ugly, deformed, bad anatomy, extra limbs, realistic texture, photorealism, boring style, low contrast, weak lighting, 
nudity, cleavage, sexualized content, unflattering expression, duplicate face, mutated, face merge, distortion, identity loss, gender change, ethnicity change, clean image`,
    strength: 0.48, // Balanced for scanline effect
    model: 'replicate/stability-ai/stable-diffusion-img2img', // Updated to Replicate model
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['scanlines_dominant', 'identity_preserved', 'stylized_cyberpunk', 'high_fashion_sci_fi'],
    guidance_scale: 9.0, // Maximum guidance for scanline emphasis
    num_inference_steps: 40
  }
]

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId)
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId)
}
