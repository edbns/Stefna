// src/presets/parallelSelf.ts

/*

🧠 Parallel Self™ – Nano Banana Optimized (v1.0)

Parallel Self™
"Not who you are. Who you could've been."
A photoreal, alternate-identity remix powered by Nano Banana.
Think: a version of you from a mirror-dimension, dream-state, or forgotten past life.
Identity-adjacent, not fantasy. Stylized, not cosplay.
Built for scroll-stopping visuals that feel mysterious, ethereal, and beautiful.

Enhanced prompts optimized for Nano Banana's verbosity preferences:
- Rain Dancer: Cinematic rain scene with emotional depth and resilience
- The Scholar of Silence: Timeless wisdom with architectural backgrounds

All presets use optimized strength (0.54–0.6) and guidance (7.0–7.5) for Nano Banana.

*/

export type ParallelSelfPreset = {
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

export const PARALLEL_SELF_PRESETS: ParallelSelfPreset[] = [
  // 🌧️ Rain Dancer
  {
    id: 'parallel_self_rain_dancer',
    label: 'Rain Dancer',
    prompt: 'Depict the subject as if caught mid-motion in a summer rain. Their body is soaked but elegant, posture fluid — like a dancer caught between defiance and grace. Clothes are minimal and clinging, made from sheer or textured fabrics that respond dramatically to the water. Their hair — wet, expressive, swept by wind or sticking softly to skin. Surround them with blurred city lights or abstract reflections in water, raindrops visible on the skin and eyelashes. Emphasize emotional depth in the eyes: resilience, sorrow, or clarity. Lighting should be cinematic and cool, with high contrast and shimmer. Preserve identity with photoreal fidelity.',
    negative_prompt: 'cartoon, fantasy, overexposed lighting, horror, distorted face, armor, sci-fi costume, cosplay',
    strength: 0.58,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'parallel_self',
    guidance_scale: 7.2,
    num_inference_steps: 30,
    features: ['rain_dancer', 'cinematic_rain', 'emotional_depth', 'fluid_motion', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.58,
    aspect_ratio: '4:5'
  },
  // 📚 The Scholar of Silence
  {
    id: 'parallel_self_scholar_silence',
    label: 'The Scholar of Silence',
    prompt: 'Render the subject as a figure of deep inner thought — their clothing timeless but fashion-forward: neutral tones, layered textures, worn like armor made of silence. Eyes are calm, observant, almost unnerving in their awareness. Place them in a forgotten library, desert ruin, or soft modernist architecture — somewhere quiet, empty, holding history. Light falls softly across one side of the face, with shadows hinting at an untold story. Skin details are highly preserved. Focus on posture, gaze, and quiet symbolism. The mood is powerful but unspoken.',
    negative_prompt: 'distortion, anime, horror, military outfit, fantasy race, clown makeup, vibrant cartoon color schemes',
    strength: 0.56,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'parallel_self',
    guidance_scale: 7.0,
    num_inference_steps: 30,
    features: ['scholar_silence', 'timeless_wisdom', 'architectural_background', 'quiet_symbolism', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.56,
    aspect_ratio: '1:1'
  }
];

export function getParallelSelfPreset(presetId: string): ParallelSelfPreset | undefined {
  return PARALLEL_SELF_PRESETS.find(p => p.id === presetId)
}

export function isParallelSelfPreset(presetId: string): boolean {
  return PARALLEL_SELF_PRESETS.some(p => p.id === presetId)
}
