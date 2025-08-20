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
    prompt: 'Transform the image into a cyberpunk anime portrait with neon overlays and glitch effects. Preserve the subject\'s original ethnicity, skin tone, and facial identity entirely. Do not alter race, age, gender, or features. Apply only stylized overlays such as neon light bloom, subtle cel-shading, and light tech artifacts. Background may include digital Tokyo ambiance.',
    negative_prompt: 'whitewashing, different race, different person, anime character face, facial replacement, skin tone change, distorted identity, cartoon, gender swap, hairstyle change, full transformation, doll face, beauty filter',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['cyberpunk_enhancement', 'identity_preservation', 'neon_effects', 'ethnic_preservation'],
    guidance_scale: 7,
    num_inference_steps: 20
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: 'Add a cyberpunk glitch visor effect and UI overlay to the subject while strictly preserving their identity, ethnicity, skin tone, and facial structure. Apply holographic HUD elements and digital lens artifacts without altering facial features or hair. The enhancement should feel layered and non-invasive.',
    negative_prompt: 'anime face, face replacement, identity change, whitewashing, different person, race change, distorted features, digital mask, plastic skin, new character, cartoonish rendering',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor', 'holographic_ui', 'identity_preservation', 'ethnic_preservation'],
    guidance_scale: 7,
    num_inference_steps: 20
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: 'Apply glowing cybernetic tattoo patterns across the skin, keeping the subject\'s identity, ethnicity, skin tone, and facial structure unchanged. Tattoos should blend naturally with the body, not override features. No stylization should transform the person\'s core appearance.',
    negative_prompt: 'anime transformation, different face, facial alteration, whitewashing, new identity, changed ethnicity, artificial face, overly stylized skin, cartoon look, digital face mask',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos', 'luminous_implants', 'identity_preservation', 'ethnic_preservation'],
    guidance_scale: 7,
    num_inference_steps: 20
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: 'Apply a subtle VHS-style scanline texture and retro noise to the image while preserving the subject\'s original facial identity, ethnicity, and natural appearance. The effect should sit on top like a texture, not interfere with facial realism or skin tone.',
    negative_prompt: 'new face, stylized identity, anime features, plastic skin, face filter, changed ethnicity, cartoon rendering, digital mask, race change',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['scanline_overlay', 'vhs_noise', 'identity_preservation', 'ethnic_preservation'],
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
