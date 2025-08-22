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
    prompt: 'Transform this person into a futuristic cyberpunk character inside a corrupted digital world. Retain realistic facial structure and identity. Apply cel-shaded anime-inspired glitch effects across the image. Overlay intense chromatic aberration, scanlines, datamosh artifacts, and static noise. Face should have glowing magenta or cyan cyber tattoos and one semi-transparent glitch visor. Eyes should reflect digital overlays or flickering UI. Background must be a chaotic Neo Tokyo skyline: vertical buildings with animated signage, distorted billboards, and dark violet haze. Use intense neon colors: magenta, cyan, blue, violet. Simulate a malfunctioning simulation: flicker, distortion, digital tearing, particle trails, and streaming code.',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features, face distortion, identity change, gender change, ethnicity change, pose change, subtle effects, minimal transformation, safe style',
    strength: 0.60, // Aggressive strength since identity is locked!
    model: 'flux/dev/image-to-image', // Explicit model specification
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['identity_preserved', 'full_glitch_takeover', 'corrupted_digital_world', 'chaotic_neo_tokyo'],
    guidance_scale: 9.5, // Maximum guidance for aggressive style enforcement
    num_inference_steps: 40
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: 'Transform this person into a futuristic cyberpunk character inside a corrupted digital world. Retain realistic facial structure and identity. Apply cel-shaded anime-inspired glitch effects across the image. Overlay intense chromatic aberration, scanlines, datamosh artifacts, and static noise. Face should have a PROMINENT glowing magenta or cyan glitch visor over the eyes with holographic UI elements. Eyes should reflect digital overlays or flickering UI through the visor. Background must be a chaotic Neo Tokyo skyline: vertical buildings with animated signage, distorted billboards, and dark violet haze. Use intense neon colors: magenta, cyan, blue, violet. Simulate a malfunctioning simulation: flicker, distortion, digital tearing, particle trails, and streaming code. The glitch visor should be the dominant visual element.',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features, face distortion, identity change, gender change, ethnicity change, pose change, subtle effects, minimal transformation, safe style, small visor',
    strength: 0.65, // Maximum visor strength since identity is locked!
    model: 'flux/dev/image-to-image', // Explicit model specification
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor_dominant', 'identity_preserved', 'full_glitch_takeover', 'corrupted_digital_world'],
    guidance_scale: 10.0, // Maximum guidance for aggressive style enforcement
    num_inference_steps: 40
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: 'Transform this person into a futuristic cyberpunk character inside a corrupted digital world. Retain realistic facial structure and identity. Apply cel-shaded anime-inspired glitch effects across the image. Overlay intense chromatic aberration, scanlines, datamosh artifacts, and static noise. Face should have PROMINENT glowing magenta or cyan cyber tattoos covering the face, neck, and shoulders with holographic UI elements. Eyes should reflect digital overlays or flickering UI. Background must be a chaotic Neo Tokyo skyline: vertical buildings with animated signage, distorted billboards, and dark violet haze. Use intense neon colors: magenta, cyan, blue, violet. Simulate a malfunctioning simulation: flicker, distortion, digital tearing, particle trails, and streaming code. The cyber tattoos should be the dominant visual element.',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features, face distortion, identity change, gender change, ethnicity change, pose change, subtle effects, minimal transformation, safe style, small tattoos',
    strength: 0.62, // Maximum tattoo strength since identity is locked!
    model: 'flux/dev/image-to-image', // Explicit model specification
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos_dominant', 'identity_preserved', 'full_glitch_takeover', 'corrupted_digital_world'],
    guidance_scale: 9.5, // Maximum guidance for aggressive style enforcement
    num_inference_steps: 40
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: 'Transform this person into a futuristic cyberpunk character inside a corrupted digital world. Retain realistic facial structure and identity. Apply cel-shaded anime-inspired glitch effects across the image. Overlay INTENSE scanlines, VHS noise, datamosh artifacts, and static noise. Face should have glowing magenta or cyan cyber tattoos and one semi-transparent glitch visor. Eyes should reflect digital overlays or flickering UI. Background must be a chaotic Neo Tokyo skyline: vertical buildings with animated signage, distorted billboards, and dark violet haze. Use intense neon colors: magenta, cyan, blue, violet. Simulate a malfunctioning simulation: flicker, distortion, digital tearing, particle trails, and streaming code. The scanlines and VHS noise should be the dominant visual element, as if viewed on a broken CRT monitor.',
    negative_prompt: 'realistic skin, lowres, bad anatomy, ugly, blurry, watermark, duplicate face, photorealistic, mutated hands, extra limbs, fused features, face distortion, identity change, gender change, ethnicity change, pose change, subtle effects, minimal transformation, safe style, clean image',
    strength: 0.58, // Maximum scanline strength since identity is locked!
    model: 'flux/dev/image-to-image', // Explicit model specification
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['scanlines_dominant', 'identity_preserved', 'full_glitch_takeover', 'corrupted_digital_world'],
    guidance_scale: 9.5, // Maximum guidance for aggressive style enforcement
    num_inference_steps: 40
  }
]

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId)
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId)
}
