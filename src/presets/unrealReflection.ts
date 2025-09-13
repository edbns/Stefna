// src/presets/unrealReflection.ts

/*

🧠 Unreal Reflection™ – Nano Banana Optimized (v1.3)

Unreal Reflection™
"Not who you are. Who you could've been."
A photoreal, alternate-identity remix powered by Nano Banana.
Think: a version of you from a mirror-dimension, dream-state, or forgotten past life.
Identity-adjacent, not fantasy. Stylized, not cosplay.
Built for scroll-stopping visuals that feel mysterious, ethereal, and beautiful.

Enhanced prompts optimized for Nano Banana's verbosity preferences:
- Digital Monk: Golden/bronze temple with blue aura, meditative atmosphere
- Urban Oracle: Neon-lit alley with purple/cyan/magenta tones, rain reflections
- Desert Mirror: Cracked landscape with orange/gold sun flare, heat haze
- Lumin Void: Swirling violet/silver fractal void, transcendent energy
- Prism Break: Dark void with rainbow shards, high-fashion sci-fi
- Chromatic Bloom: Vibrant nature bursts with butterflies/feathers, surreal overlays

All presets use optimized strength (0.54-0.6) and guidance (7.0-7.5) for Nano Banana.

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
    prompt: 'Visualize an alternate version of this person as a futuristic monk. The head is clean-shaved or closely cropped, radiating calm wisdom. Fragments of glowing cloth float around their shoulders, shimmering with golden and bronze light. Place them in a minimalist futuristic temple, with faint blue aura and diffused golden rays filtering through. The atmosphere should feel timeless, meditative, and cinematic, with depth of field focusing on the face. Preserve the individual\'s true identity, age, gender, and facial features in photoreal clarity.',
    negative_prompt: 'anime, cartoon, fantasy armor, horror, zombie, distorted face, makeup',
    strength: 0.54,
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
    image_prompt_strength: 0.54,
    aspect_ratio: '1:1'
  },
  // 🧿 Urban Oracle
  {
    id: 'unreal_reflection_urban_oracle',
    label: 'Urban Oracle',
    prompt: 'Transform this person into an urban oracle from a parallel reality. Their eyes are mirrored or glowing, reflecting the neon city around them. They wear futuristic streetwear — a hood or jacket with subtle tech textures. Place them in a rain-soaked alley lit with neon signs, glowing reflections shimmering on the wet ground. The background should blur into cinematic depth, while sharp focus captures the subject\'s intense gaze. Infuse the scene with purple, cyan, and magenta neon tones. Preserve full identity, age, gender, and features in a photoreal style.',
    negative_prompt: 'anime, cartoon, medieval, fantasy armor, distorted face, horror',
    strength: 0.56,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.2,
    num_inference_steps: 30,
    features: ['urban_oracle', 'mirrored_eyes', 'futuristic_streetwear', 'cinematic', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.56,
    aspect_ratio: '4:5'
  },
  // 🏜️ Desert Mirror
  {
    id: 'unreal_reflection_desert_mirror',
    label: 'Desert Mirror',
    prompt: 'Capture the essence of a being sculpted by the desert. Subtle cracked textures mirror dried earth across the skin, with sun-scorched tones radiating resilience. Eyes glow faintly with determination. Place the subject against a vast cracked desert floor under a blazing sun, heat haze shimmering in the distance. Infuse warm orange and golden light for a cinematic atmosphere. Lighting should enhance the skin textures and emphasize the glowing resilience in the eyes. Preserve the individual\'s identity, age, gender, and features with photoreal precision.',
    negative_prompt: 'zombie, horror, cartoon, anime, fantasy race, distorted face',
    strength: 0.58,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.3,
    num_inference_steps: 30,
    features: ['desert_mirror', 'cracked_skin', 'sun_scorched', 'glowing_eyes', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.58,
    aspect_ratio: '1:1'
  },
  // 🌌 Lumin Void (refined Future Ghost)
  {
    id: 'unreal_reflection_lumin_void',
    label: 'Lumin Void',
    prompt: 'Depict this person dissolving into light and energy. Their body edges fragment into glowing fractal mist, blending silver, violet, and faint electric blue hues. Their eyes emit a soft metallic glow — alive, not blank. Surround them with a cosmic void swirling in fractal light, as if they exist halfway between matter and energy. Cinematic focus keeps the face sharp, while the edges fade into luminous abstraction. Atmosphere should feel transcendent and surreal yet photoreal. Preserve the individual\'s true face, age, and features.',
    negative_prompt: 'horror, zombie, corpse, cartoon, anime, fantasy monster, distortion',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.4,
    num_inference_steps: 30,
    features: ['lumin_void', 'fractal_light', 'dissolving_edges', 'glowing_eyes', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '4:5'
  },
  // 🌈 Prism Break
  {
    id: 'unreal_reflection_prism_break',
    label: 'Prism Break',
    prompt: 'Reimagine this person as if their reality fractured into light. Subtle cracks spread across their skin, glowing with refracted rainbow tones like shattered glass. Prism shards float around them in a dark void, scattering pink, cyan, and golden light. The face is illuminated by sharp cinematic lighting, emphasizing both the cracks and the vivid colors. The background glows faintly with rainbow refractions, blurred for depth. Style should feel like high-fashion sci-fi, photoreal and editorial. Preserve identity, age, gender, and facial structure.',
    negative_prompt: 'anime, cartoon, glitter makeup, horror, fantasy armor, distortion',
    strength: 0.6,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['prism_break', 'fractured_glass', 'rainbow_light', 'editorial', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.6,
    aspect_ratio: '1:1'
  },
        // 🌈 Chromatic Bloom
        {
          id: 'unreal_reflection_chromatic_bloom',
          label: 'Chromatic Bloom',
          prompt: 'Transform the subject in the photo to look like a high-end magazine cover model, but do not write or include any magazine name. Style them in minimal dark couture clothing. Add exactly 7 to 8 butterflies in black and blue, placed only on the hair and shoulders, never covering the face. The makeup should look amazing — minimal, elegant, and eye-catching. Use a cinematic dark background to emphasize the subject. Lighting should be dramatic and professional, with sharp focus and high detail. The overall result must feel photoreal, stylish, and desirable, making viewers want their own photo in this style.',
          negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion',
          strength: 0.55,
          model: 'fal-ai/nano-banana/edit',
          mode: 'i2i',
          input: 'image',
          requiresSource: true,
          source: 'unreal_reflection',
          guidance_scale: 7.5,
          num_inference_steps: 30,
          features: ['chromatic_bloom', 'vibrant_nature', 'butterflies_feathers', 'surreal_bloom', 'identity_preserved'],
          prompt_upsampling: true,
          safety_tolerance: 3,
          output_format: 'jpeg',
          raw: true,
          image_prompt_strength: 0.55,
          aspect_ratio: '4:5'
        }
];

export function getUnrealReflectionPreset(presetId: string): UnrealReflectionPreset | undefined {
  return UNREAL_REFLECTION_PRESETS.find(p => p.id === presetId)
}

export function isUnrealReflectionPreset(presetId: string): boolean {
  return UNREAL_REFLECTION_PRESETS.some(p => p.id === presetId)
}
