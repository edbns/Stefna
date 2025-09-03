// src/presets/ghibliReact.ts
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
}

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_tears',
    label: 'Tears',
    prompt: `Enhance the human face with a subtle Studio Ghibli-inspired emotional expression. Add delicate glistening tears beneath the eyes, and a gentle trembling mouth. Focus on emotion — widened, watery eyes and a soft blush. Retain the person's face, ethnicity, and identity entirely. No outlines or cartoon effects. Use soft cinematic lighting, as if captured in a tender moment from a Ghibli film.`,
    negative_prompt: `anime outline, cartoon face, flat colors, 2D illustration, face distortion, manga style, fake tears, lineart, harsh light, plastic skin, face swap, bug eyes, gender flip, unrealistic anatomy`,
    strength: 0.45,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 8,
    num_inference_steps: 30,
    features: ['ghibli_style', 'emotional_reaction', 'tears', 'soft_lighting', 'identity_preserved']
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: `Capture a surprised Ghibli-style expression with widened eyes and parted lips. Sparkle in the eyes, gentle trembling, and subtle glow. Keep the original face fully intact — realistic skin, ethnicity, and bone structure. Avoid cartoon elements. Style should feel dreamy and cinematic, like a still from an emotional Ghibli moment.`,
    negative_prompt: `cartoonish proportions, anime face, 2D lineart, exaggerated bug eyes, fake texture, mask overlay, manga style, distorted features, photorealism overkill, plastic skin, identity replacement`,
    strength: 0.45,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 8,
    num_inference_steps: 30,
    features: ['ghibli_style', 'emotional_reaction', 'shock', 'soft_lighting', 'identity_preserved']
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: `Transform the human face with a soft, whimsical Ghibli-inspired sparkle effect. Add gentle shimmer around the eyes, warm blush on the cheeks, and dreamy lighting. Keep facial features, ethnicity, and skin tone exactly as in the original photo. No cartoon outlines. Aim for a magical realism vibe — subtle, not exaggerated.`,
    negative_prompt: `anime overlay, cartoon lineart, unrealistic sparkle, full anime render, gender morph, distorted face, manga texture, 2D style, glowing mask, harsh contrast, fake lighting`,
    strength: 0.45,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 8,
    num_inference_steps: 30,
    features: ['ghibli_style', 'emotional_reaction', 'sparkles', 'soft_lighting', 'identity_preserved']
  }
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId)
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId)
}
