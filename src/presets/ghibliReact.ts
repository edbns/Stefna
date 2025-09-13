// src/presets/ghibliReact.ts

const BASE_PROMPT = `Transform the human face into a realistic Studio Ghibli-style reaction. Preserve full identity, age, gender, ethnicity, skin tone, and facial structure. Use soft lighting and pastel cinematic tones like a Ghibli animation frame. Subtle exaggeration only, never cartoonish.`

const EMOTION_INSERTS = {
  tears: `Add delicate tear trails under the eyes, shimmering softly with light reflection. Expression should show vulnerability without distortion. Lighting should be warm and cinematic, with pastel evening tones.`,
  shock: `Slightly widen the eyes and part the lips to show gentle surprise. Expression should look natural, not exaggerated. Lighting should be soft and cinematic with subtle warm glow, like a moment of awe in a Ghibli scene.`,
  sparkle: `Add medium sparkles concentrated around the cheeks only, paired with soft golden highlights in the eyes and gentle pink blush. Keep sparkles subtle, never overwhelming, complementing the face instead of covering it. Background should have gentle bokeh light flares.`,
  sadness: `Emphasize melancholic mood with glossy, teary eyes and a distant gaze. Expression should be softened but not distorted. Add a faint pastel evening background with warm shadows. Lighting should highlight emotional depth without exaggeration.`,
  love: `Add soft pink blush across the cheeks, warm shimmer in the eyes, and a faint gentle smile. Subtle floating light flares or faint hearts may appear around the face, never exaggerated. Use pastel tones with warm golden cinematic lighting for a dreamy Ghibli atmosphere.`
}

export type GhibliReactionPreset = {
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
  guidance_scale?: number
  num_inference_steps?: number
  features?: string[]
  prompt_upsampling?: boolean
  safety_tolerance?: number
  output_format?: string
  raw?: boolean
  image_prompt_strength?: number
  aspect_ratio?: string
}

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_tears',
    label: 'Tears',
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.tears}`,
    negative_prompt: `cartoonish, over-exaggerated features, overly large eyes, gender swap, multiple subjects, distortion, fake tears, anime lineart, plastic skin, harsh sparkles, unrealistic lighting`,
    strength: 0.45,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 8,
    num_inference_steps: 30,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.35,
    aspect_ratio: '3:4',
    features: ['ghibli_style', 'emotional_reaction', 'tears', 'soft_lighting', 'identity_preserved']
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.shock}`,
    negative_prompt: `cartoonish, bug eyes, overly large eyes, gender swap, multiple subjects, anime outline, manga, distortion, plastic skin, harsh light`,
    strength: 0.45,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 8,
    num_inference_steps: 30,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.35,
    aspect_ratio: '3:4',
    features: ['ghibli_style', 'emotional_reaction', 'shock', 'soft_lighting', 'identity_preserved']
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.sparkle}`,
    negative_prompt: `cartoonish, anime rendering, harsh sparkles, sparkles all over face, overexposed, lineart, glitter makeup, distortion, photorealism, plastic skin`,
    strength: 0.45,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 8,
    num_inference_steps: 30,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.35,
    aspect_ratio: '3:4',
    features: ['ghibli_style', 'emotional_reaction', 'sparkles', 'soft_lighting', 'identity_preserved']
  },
  {
    id: 'ghibli_sadness',
    label: 'Sadness',
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.sadness}`,
    negative_prompt: `cartoonish, anime outline, 2D crying face, exaggerated tears, manga style, gender swap, distortion, washed out skin, photorealism`,
    strength: 0.35,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 8,
    num_inference_steps: 28,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.35,
    aspect_ratio: '3:4',
    features: ['ghibli_style', 'emotional_reaction', 'sadness', 'soft_lighting', 'identity_preserved']
  },
  {
    id: 'ghibli_love',
    label: 'Love',
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.love}`,
    negative_prompt: `cartoonish, over-exaggerated hearts, anime lines, blur, distortion, extra accessories, unrealistic sparkles, washed out`,
    strength: 0.35,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 8,
    num_inference_steps: 28,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.35,
    aspect_ratio: '3:4',
    features: ['ghibli_style', 'emotional_reaction', 'love', 'soft_lighting', 'identity_preserved']
  }
]

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId)
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId)
}