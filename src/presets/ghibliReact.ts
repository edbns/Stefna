// src/presets/ghibliReact.ts

// Base prompt template for consistent Ghibli style
const BASE_PROMPT = `Transform the human face into a realistic Ghibli-style reaction with soft lighting, identity preservation, and subtle emotional exaggeration. Use pastel cinematic tones like a Studio Ghibli frame.`;

// Emotion-specific inserts
const EMOTION_INSERTS = {
  tears: `Add delicate tears and a trembling expression.`,
  shock: `Widen the eyes and part the lips slightly to show surprise.`,
  sparkle: `Add medium sparkles around the cheeks only, shimmering eyes with golden highlights, and soft pink blush. Keep sparkles focused on cheek area.`,
  sadness: `Add melancholic emotion with glossy eyes and distant gaze.`,
  love: `Add warm sparkle in the eyes, gentle blush, and glowing pastel lighting. Create a dreamy, cozy atmosphere with soft bokeh in the background.`,
};

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
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.tears} Add delicate tears under the eyes, a trembling mouth, and a soft pink blush. Keep the face fully intact with original skin tone, gender, and identity. Use soft, cinematic lighting and warm pastel tones like a Ghibli film.`,
    negative_prompt: `cartoonish, exaggerated features, overly large eyes, gender swap, multiple subjects, low quality, mutated hands, poorly drawn face, anime lines, face swap, fake tears, harsh lighting, shiny skin, photorealism`,
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
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.shock} Slightly widen the eyes, part the lips, and show light tension in the expression. Maintain identity, ethnicity, and facial realism. Add soft sparkles and cinematic warmth — like a frame from a Studio Ghibli film.`,
    negative_prompt: `cartoonish, exaggerated features, overly large eyes, gender swap, multiple subjects, low quality, mutated hands, poorly drawn face, anime mask, bug eyes, unrealistic skin, face distortion`,
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
    prompt: `Transform the human face into a magical Ghibli-style sparkle reaction while preserving full identity, ethnicity, skin tone, and facial structure. Add medium sparkles around the cheeks only, shimmering golden highlights in the eyes, and soft pink blush on the cheeks. Keep sparkles focused on the cheek area to complement the blush without overwhelming it. Use pastel cinematic tones with gentle sparkle effects and dreamy lighting. Background should have gentle bokeh with soft light flares. Maintain original composition and realism with subtle magical sparkle effects on cheeks.`,
    negative_prompt: `cartoonish, exaggerated features, overly large eyes, gender swap, multiple subjects, low quality, mutated hands, poorly drawn face, cartoon overlay, anime rendering, lineart, plastic skin, overexposed, unnatural colors, harsh sparkles, excessive sparkles, sparkles all over face, overwhelming sparkles`,
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
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.sadness} Emphasize melancholic emotion through glossy, teary eyes, a distant gaze, and softened facial features. Slight tear trails may appear but no crying mouth. Preserve full identity, ethnicity, skin, and structure. Lighting should be dim, cinematic, and pastel-toned like a Ghibli evening scene.`,
    negative_prompt: `cartoonish, exaggerated features, overly large eyes, gender swap, multiple subjects, low quality, mutated hands, poorly drawn face, anime outline, 2D face, exaggerated crying, manga, flat colors, face replacement, photorealism, harsh light, flat expression`,
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
    prompt: `Transform the human face into a romantic Ghibli-style love reaction while preserving full identity, ethnicity, skin tone, and facial structure. Add soft pink blush on the cheeks, warm sparkle in the eyes, and a gentle, shy smile. Include subtle floating hearts or sparkles around the face to enhance emotional expression. Use pastel cinematic tones and soft golden lighting to create a dreamy, cozy atmosphere. Background should have gentle bokeh with subtle Ghibli-style light flares. Maintain original composition and realism with only slight anime influence.`,
    negative_prompt: `over-exaggerated anime features, distortion, harsh shadows, washed out, identity loss, extra accessories, cartoonish eyes, blur`,
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
    features: ['ghibli_style', 'emotional_reaction', 'love', 'bokeh_glow', 'soft_lighting', 'identity_preserved']
  }
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId)
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId)
}
