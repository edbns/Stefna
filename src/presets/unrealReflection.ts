// src/presets/unrealReflection.ts

/*

🧠 Unreal Reflection™ – Launch Pack (v1)

Unreal Reflection™
"Not who you are. Who you could've been."
A photoreal, alternate-identity remix powered by Nano Banana.
Think: a version of you from a mirror-dimension, dream-state, or forgotten past life.
Identity-adjacent, not fantasy. Stylized, not cosplay.
Built for scroll-stopping visuals that feel mysterious, ethereal, and beautiful.

*/

export type UnrealReflectionPreset = {
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
  // BFL-specific parameters
  prompt_upsampling?: boolean
  safety_tolerance?: number
  output_format?: string
  raw?: boolean
  image_prompt_strength?: number
  aspect_ratio?: string
}

export const UNREAL_REFLECTION_PRESETS: UnrealReflectionPreset[] = [
  // 🔮 Digital Monk
  {
    id: 'unreal_reflection_digital_monk',
    label: 'Digital Monk',
    prompt: 'Imagine an alternate version of this person as a futuristic monk with glowing cloth fragments, shaved head or close-cropped hair, and an aura of calm. Retain core facial identity, age, skin tone, and expression. Scene should feel timeless, with soft lighting and abstract fabric.',
    negative_prompt: 'anime, cartoon, fantasy armor, heavy makeup, distorted face, exaggerated lighting, comic style',
    strength: 0.5,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.0,
    num_inference_steps: 30,
    features: ['digital_monk', 'futuristic', 'glowing_fragments', 'calm_aura', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.5,
    aspect_ratio: '1:1'
  },
  // 🧿 Urban Oracle
  {
    id: 'unreal_reflection_urban_oracle',
    label: 'Urban Oracle',
    prompt: 'Transform the person into a parallel reality version of an urban oracle — with mirrored or glowing eyes, futuristic streetwear, and a strong, silent stare. Keep real facial structure, skin tone, gender and age. Scene should feel cinematic and grounded in a dystopian or spiritual urban aesthetic.',
    negative_prompt: 'anime, fantasy clothing, old age, child, gender swap, distortion, unrealistic colors',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['urban_oracle', 'mirrored_eyes', 'futuristic_streetwear', 'cinematic', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '4:5'
  },
  // 🏜️ Desert Mirror
  {
    id: 'unreal_reflection_desert_mirror',
    label: 'Desert Mirror',
    prompt: 'Create a desert-inspired reflection of this person — with cracked skin texture like dried earth, sun-scorched tones, and glowing eyes full of resilience. Retain base identity, facial structure, and expression. Make the output feel poetic and real, not fantasy.',
    negative_prompt: 'zombie, horror, cartoon, child, fantasy race, elf, extreme distortion',
    strength: 0.6,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 6.8,
    num_inference_steps: 30,
    features: ['desert_mirror', 'cracked_skin', 'sun_scorched', 'glowing_eyes', 'identity_preserved'],
    prompt_upsampling: false,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.6,
    aspect_ratio: '1:1'
  },
  // 👻 Future Ghost
  {
    id: 'unreal_reflection_future_ghost',
    label: 'Future Ghost',
    prompt: 'Render this person as a futuristic ghost-like version of themselves — with soft shadows around the body, white or silver irises, and a faint mist or light shimmer. Do not change the identity, age, gender, or face structure. Style should be photo-real with a surreal twist, not horror or fantasy.',
    negative_prompt: 'scary, horror, blood, cartoon, anime, glowing skeleton, fantasy monster, gender swap',
    strength: 0.52,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.3,
    num_inference_steps: 30,
    features: ['future_ghost', 'soft_shadows', 'silver_irises', 'mist_effect', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.52,
    aspect_ratio: '4:5'
  }
];

export function getUnrealReflectionPreset(presetId: string): UnrealReflectionPreset | undefined {
  return UNREAL_REFLECTION_PRESETS.find(p => p.id === presetId)
}

export function isUnrealReflectionPreset(presetId: string): boolean {
  return UNREAL_REFLECTION_PRESETS.some(p => p.id === presetId)
}
