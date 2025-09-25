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
    prompt: `Transform the subject into a cinematic sci-fi fashion muse posing in a minimalist brutalist courtyard under a bright blue sky. They wear a futuristic sleeveless white tech top with an open back and sculpted seams, paired with sleek high-waisted pants featuring metal buckles and subtle armor-style details. Their hands are adorned with chrome robotic gauntlets — elegant, fitted, and minimal.

The pose shifts across moments — looking over the shoulder with subtle sway in the hips, mid-turn with one arm lifted confidently, leaning back with one hand on the waist, or walking forward with jacket catching movement. Every frame feels alive — balanced between confident elegance and soft allure.

Hair flows naturally or in a stylized soft wave, catching the wind gently. Expression is calm but magnetic — a confident stare, half-smile, or eyes slightly closed in a moment of power.

Background is sharp and clean: angular shadows, concrete walls, and open space. Lighting is editorial and bright — no harsh contrast, just crisp detail.

The overall result must feel photoreal with soft anime undertones — perfect anatomy, flawless fabric draping, realistic lighting, and futuristic streetwear styling that feels like it belongs on the cover of a sci-fi fashion magazine from the future.`,
    negative_prompt: `cartoon, 3d, game character, nsfw, lowres, duplicate limbs, distorted hands, unrealistic outfit, overly bright colors, armor-heavy, messy background, illustration style`,
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
