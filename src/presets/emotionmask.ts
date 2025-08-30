// src/presets/emotionmask.ts
export type EmotionMaskPreset = {
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

export const EMOTION_MASK_PRESETS: EmotionMaskPreset[] = [
  {
    id: 'emotion_mask_love',
    label: 'Love',
    prompt: `Transform the human face into a loving, affectionate expression while preserving realistic skin, hair, and facial structure. Add soft, warm lighting that enhances the emotional depth. Eyes should convey warmth and tenderness. Preserve skin tone, gender, and facial integrity. Lighting should be soft and romantic, like candlelight or sunset. Keep hairstyle and identity intact.`,
    negative_prompt: `distorted features, overexaggerated proportions, fake texture, plastic skin, full anime rendering, gender swap, photorealism, 3D look, harsh shadows`,
    strength: 0.35,
    model: "fal-ai/ghiblify", // Updated to use fal.ai model
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'emotion_mask',
    guidance_scale: 9,
    num_inference_steps: 28,
    features: ['emotional_reaction', 'love', 'soft_lighting', 'identity_preserved']
  },
  {
    id: 'emotion_mask_joy',
    label: 'Joy',
    prompt: `Transform the human face into a joyful, happy expression while preserving realistic skin, hair, and facial structure. Add bright, cheerful lighting that enhances the positive emotion. Eyes should sparkle with happiness and laughter. Preserve skin tone, gender, and facial integrity. Lighting should be bright and uplifting, like morning sunlight. Keep hairstyle and identity intact.`,
    negative_prompt: `distorted features, overexaggerated proportions, fake texture, plastic skin, full anime rendering, gender swap, photorealism, 3D look, harsh shadows`,
    strength: 0.35,
    model: "fal-ai/ghiblify", // Updated to use fal.ai model
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'emotion_mask',
    guidance_scale: 9,
    num_inference_steps: 28,
    features: ['emotional_reaction', 'joy', 'bright_lighting', 'identity_preserved']
  },
  {
    id: 'emotion_mask_sadness',
    label: 'Sadness',
    prompt: `Transform the human face into a sad, melancholic expression while preserving realistic skin, hair, and facial structure. Add soft, muted lighting that enhances the emotional depth. Eyes should convey sorrow and vulnerability. Preserve skin tone, gender, and facial integrity. Lighting should be gentle and subdued, like overcast daylight. Keep hairstyle and identity intact.`,
    negative_prompt: `distorted features, overexaggerated proportions, fake texture, plastic skin, full anime rendering, gender swap, photorealism, 3D look, harsh shadows`,
    strength: 0.35,
    model: "fal-ai/ghiblify", // Updated to use fal.ai model
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'emotion_mask',
    guidance_scale: 9,
    num_inference_steps: 28,
    features: ['emotional_reaction', 'sadness', 'soft_lighting', 'identity_preserved']
  },
  {
    id: 'emotion_mask_conf_loneliness',
    label: 'Confusion/Loneliness',
    prompt: `Transform the human face into a confused, lonely expression while preserving realistic skin, hair, and facial structure. Add soft, uncertain lighting that enhances the emotional complexity. Eyes should convey confusion and isolation. Preserve skin tone, gender, and facial integrity. Lighting should be dim and contemplative, like evening shadows. Keep hairstyle and identity intact.`,
    negative_prompt: `distorted features, overexaggerated proportions, fake texture, plastic skin, full anime rendering, gender swap, photorealism, 3D look, harsh shadows`,
    strength: 0.35,
    model: "fal-ai/ghiblify", // Updated to use fal.ai model
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'emotion_mask',
    guidance_scale: 9,
    num_inference_steps: 28,
    features: ['emotional_reaction', 'confusion', 'loneliness', 'soft_lighting', 'identity_preserved']
  }
];

export function getEmotionMaskPreset(presetId: string): EmotionMaskPreset | undefined {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId)
}

export function isEmotionMaskPreset(presetId: string): boolean {
  return EMOTION_MASK_PRESETS.some(p => p.id === presetId)
}
