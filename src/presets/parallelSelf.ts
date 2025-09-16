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
- The Untouchable: Grayscale fashion portrait with minimalist power
- Holiday Mirage: Golden-hour luxury fantasy with tropical blur
- The One That Got Away: Fleeting moment after gala with dramatic lighting
- Nightshade: Futuristic silhouette in glowing white minimalism
- Afterglow: Post-party shimmer with vintage dream texture

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
    prompt: 'Transform this person into the Rain Dancer: standing in a cinematic rainstorm, their minimal clothing soaked by water, fabric clinging naturally in motion. Wind lifts their hair as raindrops shimmer mid-air, illuminated by dramatic shafts of light. Their expression remains true but filled with emotion — resilient yet vulnerable. Surround them with atmosphere: rippling puddles, mist rising, droplets sparkling, and a surreal storm glow that makes the moment feel alive. In the distance, hints of a glowing city emerge through rain and haze — blurred lights, reflections on wet pavement, and an urban backdrop that feels alive but dreamlike.',
    negative_prompt: 'cartoon, anime, smiling, makeup-heavy, overexposed, colorful clothes, hats, wide angle',
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
  // 👑 The Untouchable
  {
    id: 'parallel_self_untouchable',
    label: 'The Untouchable',
    prompt: 'Transform this person into a powerful fashion icon captured mid-movement, walking calmly toward the camera from a short distance. Dressed fashionably in Celine look alike fashion, Their hair flows naturally or is styled with precision, makeup clean and confident. The lighting is cinematic, casting long shadows and warm highlights across the scene. The subject looks effortless and in control, surrounded by an upscale atmosphere — soft hints of reflective surfaces, glass, or city skyline blurred behind them. The overall feel is modern, strong, and untouchable — but nothing is forced.',
    negative_prompt: 'bright colors, cheerful tone, busy background, low contrast, cartoonish skin texture',
    strength: 0.57,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'parallel_self',
    guidance_scale: 7.1,
    num_inference_steps: 30,
    features: ['untouchable', 'grayscale_fashion', 'minimalist_power', 'arthouse_aesthetic', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.57,
    aspect_ratio: '1:1'
  },
  // 🌅 Holiday Mirage
  {
    id: 'parallel_self_holiday_mirage',
    label: 'Holiday Mirage',
    prompt: 'Transform this person into a cinematic swimwear icon on an unforgettable luxury escape. If female, they wear a refined two-piece bikini inspired by brands like La Perla or Eres — styled in vibrant or soft tones, with glowing skin and wind-swept hair. If male, they appear shirtless and sculpted, in sleek Vilebrequin-style swim shorts, confident and relaxed. Their posture is dynamic and natural — walking barefoot, turning mid-frame, resting on one arm, or stretching in motion. The lighting changes with the mood: golden hour shimmer, overcast glow, or moonlit reflections. The atmosphere draws inspiration from elite travel locations — places like the Maldives, Bora Bora, or similar dreamy destinations for the ultra-wealthy. The scene may include water platforms, wooden walkways, stone terraces, or soft panoramic horizons — always blurred and cinematic, never cliché. The feeling is warm, untouchable, and completely free.',
    negative_prompt: 'cold tones, artificial tan, makeup overload, cluttered composition, harsh lighting, cheesy travel vibes',
    strength: 0.59,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'parallel_self',
    guidance_scale: 7.3,
    num_inference_steps: 30,
    features: ['holiday_mirage', 'golden_hour', 'luxury_fantasy', 'tropical_blur', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.59,
    aspect_ratio: '4:5'
  },
  // 💫 The One That Got Away
  {
    id: 'parallel_self_one_that_got_away',
    label: 'The One That Got Away',
    prompt: 'Transform this person into the unforgettable main character of a high-fashion departure scene. They are dressed in striking luxury eveningwear — inspired by designers like Saint Laurent, Mugler, or Balmain — with bold cuts, flowing fabrics, or tailored structure that enhances their presence. Their expression is captivating, caught mid-glance or mid-step, confident and distant. Lighting is cinematic and dynamic: backlit silhouettes, paparazzi-like flares, golden glow from behind, or dramatic shadows playing across reflective surfaces. They appear in motion — walking down grand stairs, stepping out of a black car, or crossing a marble hallway — surrounded by blurred architectural lights and soft movement. Their face and posture are the focus: this is not someone who leaves quietly — this is someone you'll remember.',
    negative_prompt: 'red carpet, full body, happy expression, crowd, gaudy lighting, wide framing',
    strength: 0.58,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'parallel_self',
    guidance_scale: 7.2,
    num_inference_steps: 30,
    features: ['one_that_got_away', 'fleeting_moment', 'dramatic_lighting', 'unreadable_expression', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.58,
    aspect_ratio: '4:5'
  },
  // 🌙 Nightshade
  {
    id: 'parallel_self_nightshade',
    label: 'Nightshade',
    prompt: 'Transform this person into a street fashion icon styled in all-black, high-end urban wear — blending elements from brands like Rick Owens, Ader Error, and Fear of God. Their outfit is structured yet wearable: layered fabrics, oversized silhouettes, clean tailoring, or subtle asymmetry. No colors, only black, charcoal, or minimal white details. The atmosphere feels cinematic and stylish — a blurred underground tunnel, glowing crosswalk, fogged parking structure, or concrete gallery space lit by white or soft neon accents. Their posture is relaxed but powerful — mid-step, leaning against a wall, or walking directly into soft light. Their face is clearly visible, expression calm but unbothered. This is fashion that dominates the scene without shouting — modern, striking, and unforgettable.',
    negative_prompt: 'colors, smiling, busy background, clutter, low contrast, accessories, logos',
    strength: 0.56,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'parallel_self',
    guidance_scale: 7.0,
    num_inference_steps: 30,
    features: ['nightshade', 'futuristic_silhouette', 'sculptural_lighting', 'sci_fi_fashion', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.56,
    aspect_ratio: '1:1'
  },
  // ✨ Afterglow
  {
    id: 'parallel_self_afterglow',
    label: 'Afterglow',
    prompt: 'Transform this person into the star of a cinematic after-party moment. They are dressed in eye-catching designer eveningwear — inspired by brands like Mugler, Tom Ford, or Celine — with shimmering fabrics, sleek silhouettes, or minimal sheer details. Their skin glows softly under ambient golden or silver lighting, and their expression is calm, poised, and untouchable. The scene feels dreamy and intimate: soft reflections from disco lights, champagne-colored lens flares, mirrored walls, or blurred elevator interiors. Their pose is relaxed but magnetic — turning slightly, leaning back into a reflective surface, or frozen mid-step in dim golden haze. This is the quiet, final photo that becomes the most iconic.',
    negative_prompt: 'cartoon, neon chaos, crowds, smiling group shots, distorted anatomy, oversaturated colors, nightclub cliché',
    strength: 0.57,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'parallel_self',
    guidance_scale: 7.1,
    num_inference_steps: 30,
    features: ['afterglow', 'post_party_shimmer', 'soft_reflections', 'vintage_dream', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.57,
    aspect_ratio: '4:5'
  }
];

export function getParallelSelfPreset(presetId: string): ParallelSelfPreset | undefined {
  return PARALLEL_SELF_PRESETS.find(p => p.id === presetId)
}

export function isParallelSelfPreset(presetId: string): boolean {
  return PARALLEL_SELF_PRESETS.some(p => p.id === presetId)
}
