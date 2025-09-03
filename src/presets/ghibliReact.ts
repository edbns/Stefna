// src/presets/ghibliReact.ts

// Base prompt template for consistent Ghibli style
const BASE_PROMPT = `Transform the human face into a realistic Ghibli-style reaction with soft lighting, identity preservation, and subtle emotional exaggeration. Use pastel cinematic tones like a Studio Ghibli frame.`;

// Emotion-specific inserts
const EMOTION_INSERTS = {
  tears: `Add delicate tears and a trembling expression.`,
  shock: `Widen the eyes and part the lips slightly to show surprise.`,
  sparkle: `Add gentle sparkles, shimmer in the eyes, and soft blush.`,
  sadness: `Add melancholic emotion with glossy eyes and distant gaze.`,
  love: `Add warm affection with soft smile and romantic sparkle.`,
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
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.tears} Transform the human face into a realistic Ghibli-style emotional moment. Add delicate tears under the eyes, a trembling mouth, and a soft pink blush. Keep the face fully intact with original skin tone, gender, and identity. Use soft, cinematic lighting and warm pastel tones like a Ghibli film.`,
    negative_prompt: `cartoon, manga, anime lines, big eyes, face swap, distorted face, fake tears, harsh lighting, gender change, shiny skin, photorealism, exaggerated expressions`,
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
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.shock} Transform the human face into a subtle Ghibli-style shocked reaction. Slightly widen the eyes, part the lips, and show light tension in the expression. Maintain identity, ethnicity, and facial realism. Add soft sparkles and cinematic warmth — like a frame from a Studio Ghibli film.`,
    negative_prompt: `anime mask, cartoon lines, bug eyes, exaggerated cartoon expression, unrealistic skin, face distortion, low-res details`,
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
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.sparkle} Transform the human face into a whimsical Studio Ghibli-style moment with gentle sparkles and blush. Add soft shimmer in the eyes, dreamy lighting, and subtle joy in the expression. Do not distort the face. Keep original features, texture, and lighting intact.`,
    negative_prompt: `overdone sparkle, cartoon overlay, anime rendering, lineart, plastic skin, overexposed, unnatural colors`,
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
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.sadness} Transform the human face into a realistic Studio Ghibli-style expression of gentle sadness. Emphasize melancholic emotion through glossy, teary eyes, a distant gaze, and softened facial features. Slight tear trails may appear but no crying mouth. Preserve full identity, ethnicity, skin, and structure. Lighting should be dim, cinematic, and pastel-toned like a Ghibli evening scene.`,
    negative_prompt: `cartoon, anime outline, 2D face, exaggerated crying, manga, flat colors, face replacement, photorealism, distorted features, gender change, stylized tears, harsh light, flat expression`,
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
    prompt: `${BASE_PROMPT} ${EMOTION_INSERTS.love} Transform the human face into a realistic Studio Ghibli-style expression of warm affection. Emphasize a soft smile, romantic eye sparkle, gentle blush, and glowing pastel lighting. Create a dreamy, cozy atmosphere with soft bokeh in the background. Maintain identity, skin tone, ethnicity, and facial structure fully intact.`,
    negative_prompt: `cartoon, anime outline, 2D face, manga, exaggerated hearts, stylized lipstick, face distortion, gender change, heavy makeup, artificial light, harsh shadows`,
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
