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
    id: "ghibli_joy",
    label: "Ghibli Joy",
    prompt: "A close-up portrait of a single person expressing pure, innocent joy in Studio Ghibli animation style — soft, warm lighting, gentle expression, dreamy atmosphere, watercolor-like textures, magical sparkles around the face. Do not change facial features, ethnicity, or add other faces. Original person must remain intact.",
    negative_prompt: "dark, sad, scary, realistic, photorealistic, ugly, deformed",
    strength: 0.35,
    model: 'triposr', // Updated to use supported AIML model
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['ghibli_style', 'joy_emotion', 'soft_lighting', 'magical_atmosphere']
  },
  {
    id: "ghibli_wonder",
    label: "Ghibli Wonder",
    prompt: "A close-up portrait of a single person expressing childlike wonder and amazement in Studio Ghibli animation style — wide, curious eyes, soft pastel lighting, ethereal glow, gentle wind effects, nature-inspired colors. Do not change facial features, ethnicity, or add other faces. Original person must remain intact.",
    negative_prompt: "fear, sadness, anger, realistic, dark, scary, ugly",
    strength: 0.35,
    model: 'triposr', // Updated to use supported AIML model
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['ghibli_style', 'wonder_emotion', 'soft_lighting', 'ethereal_atmosphere']
  },
  {
    id: "ghibli_peace",
    label: "Ghibli Peace",
    prompt: "A close-up portrait of a single person expressing serene tranquility and inner peace in Studio Ghibli animation style — soft, diffused lighting, calm expression, gentle breeze effects, peaceful color palette, meditative atmosphere. Do not change facial features, ethnicity, or add other faces. Original person must remain intact.",
    negative_prompt: "tension, stress, anger, fear, dark, realistic, ugly",
    strength: 0.35,
    model: 'triposr', // Updated to use supported AIML model
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['ghibli_style', 'peace_emotion', 'soft_lighting', 'tranquil_atmosphere']
  }
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId)
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId)
}
