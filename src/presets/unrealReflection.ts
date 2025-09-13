// src/presets/unrealReflection.ts

/*

🧠 Unreal Reflection™ – Refined Lineup (v1.1)

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
  // 🔮 Lumin Void (refined Future Ghost)
  {
    id: 'unreal_reflection_lumin_void',
    label: 'Lumin Void',
    prompt: 'Depict this person as a luminous void version of themselves, where their body edges dissolve into fractal light and soft shadows. Their eyes glow faintly with silver or golden light, not blank, but alive. The overall effect should be surreal, cinematic, and powerful — like a person halfway between the physical and energy state. Retain their identity, age, gender, ethnicity, and facial features.',
    negative_prompt: 'horror, zombie, corpse, skull, cartoon, anime, fantasy monster, distortion, blur',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.2,
    num_inference_steps: 30,
    features: ['lumin_void', 'fractal_light', 'dissolving_edges', 'glowing_eyes', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '4:5'
  },
  // ✨ Prism Break
  {
    id: 'unreal_reflection_prism_break',
    label: 'Prism Break',
    prompt: 'Transform this person into a fractured prism reflection of themselves. Subtle cracks or fractures run across the skin, glowing with refracted rainbow light like broken glass. The effect should be cinematic, high-fashion, and photorealistic. Do not alter facial identity, age, or gender. Style should be mysterious and editorial, not fantasy or cartoon.',
    negative_prompt: 'anime, cartoon, rainbow filter, glitter makeup, distortion, fantasy armor, horror',
    strength: 0.58,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.0,
    num_inference_steps: 30,
    features: ['prism_break', 'fractured_glass', 'rainbow_light', 'editorial', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.58,
    aspect_ratio: '1:1'
  },
  // 🌑 Eclipse Veil
  {
    id: 'unreal_reflection_eclipse_veil',
    label: 'Eclipse Veil',
    prompt: 'Render this person as if they are standing inside an eclipse. One side of the face is bathed in warm glow, the other side in deep cosmic shadow, with a faint rim of light outlining their silhouette like a solar eclipse. Maintain original identity, age, gender, and facial structure. Make it look cinematic and surreal, but photoreal, not fantasy.',
    negative_prompt: 'horror, zombie, fantasy warrior, cartoon, anime, distorted face, blur',
    strength: 0.54,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.4,
    num_inference_steps: 30,
    features: ['eclipse_veil', 'cosmic_shadow', 'rim_light', 'cinematic', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.54,
    aspect_ratio: '4:5'
  }
];

export function getUnrealReflectionPreset(presetId: string): UnrealReflectionPreset | undefined {
  return UNREAL_REFLECTION_PRESETS.find(p => p.id === presetId)
}

export function isUnrealReflectionPreset(presetId: string): boolean {
  return UNREAL_REFLECTION_PRESETS.some(p => p.id === presetId)
}
