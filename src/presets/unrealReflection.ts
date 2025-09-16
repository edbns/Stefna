// src/presets/unrealReflection.ts

/*

🧠 Unreal Reflection™ – Nano Banana Optimized (v1.4)

Unreal Reflection™
"Not who you are. Who you could've been."
A photoreal, alternate-identity remix powered by Nano Banana.
Think: a version of you from a mirror-dimension, dream-state, or forgotten past life.
Identity-adjacent, not fantasy. Stylized, not cosplay.
Built for scroll-stopping visuals that feel mysterious, ethereal, and beautiful.

Enhanced prompts optimized for Nano Banana's verbosity preferences:
- Digital Monk: Golden/bronze temple with blue aura, meditative atmosphere
- Urban Oracle: Neon-lit alley with purple/cyan/magenta tones, rain reflections
- Desert Mirror: Layered desert robes, cracked terrain, golden light
- Lumin Void: Iridescent surreal fashion dissolving into fractal light
- Prism Break: High-fashion sci-fi, reflective materials, shattered reality
- Chromatic Bloom: Editorial with butterflies/feathers, couture styling

All presets use optimized strength (0.54–0.6) and guidance (7.0–7.5) for Nano Banana.

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
    prompt: 'Transform this person into a powerful fashion icon captured mid-movement, walking calmly toward the camera from a short distance. Dressed fashionably in Celine look alike fashion, Their hair flows naturally or is styled with precision, makeup clean and confident. The lighting is cinematic, casting long shadows and warm highlights across the scene. The subject looks effortless and in control, surrounded by an upscale atmosphere — soft hints of reflective surfaces, glass, or city skyline blurred behind them. The overall feel is modern, strong, and untouchable — but nothing is forced.',
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
    prompt: 'Transform this person into a cinematic swimwear icon on an unforgettable luxury escape. If female, they wear a refined two-piece bikini inspired by brands like La Perla or Eres — styled in vibrant or soft tones, with glowing skin and wind-swept hair. If male, they appear shirtless and sculpted, in sleek Vilebrequin-style swim shorts, confident and relaxed. Their posture is dynamic and natural — walking barefoot, turning mid-frame, resting on one arm, or stretching in motion. The lighting changes with the mood: golden hour shimmer, overcast glow, or moonlit reflections. The atmosphere draws inspiration from elite travel locations — places like the Maldives, Bora Bora, or similar dreamy destinations for the ultra-wealthy. The scene may include water platforms, wooden walkways, stone terraces, or soft panoramic horizons — always blurred and cinematic, never cliché. The feeling is warm, untouchable, and completely free.',
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
  // 🌌 Lumin Void
  {
    id: 'unreal_reflection_lumin_void',
    label: 'Lumin Void',
    prompt: 'Transform this person into the unforgettable main character of a high-fashion departure scene. They are dressed in striking luxury eveningwear — inspired by designers like Saint Laurent, Mugler, or Balmain — with bold cuts, flowing fabrics, or tailored structure that enhances their presence. Their expression is captivating, caught mid-glance or mid-step, confident and distant. Lighting is cinematic and dynamic: backlit silhouettes, paparazzi-like flares, golden glow from behind, or dramatic shadows playing across reflective surfaces. They appear in motion — walking down grand stairs, stepping out of a black car, or crossing a marble hallway — surrounded by blurred architectural lights and soft movement. Their face and posture are the focus: this is not someone who leaves quietly — this is someone you\'ll remember.',
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
    prompt: 'Transform this person into a street fashion icon styled in all-black, high-end urban wear — blending elements from brands like Rick Owens, Ader Error, and Fear of God. Their outfit is structured yet wearable: layered fabrics, oversized silhouettes, clean tailoring, or subtle asymmetry. No colors, only black, charcoal, or minimal white details. The atmosphere feels cinematic and stylish — a blurred underground tunnel, glowing crosswalk, fogged parking structure, or concrete gallery space lit by white or soft neon accents. Their posture is relaxed but powerful — mid-step, leaning against a wall, or walking directly into soft light. Their face is clearly visible, expression calm but unbothered. This is fashion that dominates the scene without shouting — modern, striking, and unforgettable.',
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
  // 🌺 Chromatic Bloom
  {
    id: 'unreal_reflection_chromatic_bloom',
    label: 'Chromatic Bloom',
    prompt: 'Transform this person into a high-fashion editorial icon surrounded by vibrant butterflies and delicate feathers. They wear couture styling with flowing fabrics that seem to bloom and dissolve into nature — think Alexander McQueen meets botanical fantasy. Their pose is ethereal and editorial, with butterflies landing on their fingertips and feathers cascading around them like living accessories. The lighting is soft and dreamy, with golden hour warmth creating a magical atmosphere. Their expression remains serene and otherworldly, as if they exist between reality and fantasy. This is fashion photography meets nature\'s most beautiful elements.',
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