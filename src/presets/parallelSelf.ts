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
    prompt: 'Capture a lone figure mid-storm, drenched in cinematic rainfall. Their minimal dark clothing clings to their body, revealing the contours of strength and vulnerability. Wind tosses their hair as droplets streak across glistening skin. A shaft of moody light cuts through the downpour, casting dramatic highlights across their profile. Their expression is quiet but resilient — caught between sorrow and power. The backdrop: a blurred urban nightscape lost in rain and wind.',
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
  },
  // 👑 The Untouchable
  {
    id: 'parallel_self_untouchable',
    label: 'The Untouchable',
    prompt: 'Render a grayscale fashion portrait of a distant icon — their gaze unwavering, jawline sharp, wrapped in minimalist high fashion. The setting is stark: soft shadows and controlled contrast sculpt their silhouette like stone. Their clothing is monochrome and architectural, hinting at power without extravagance. The image feels like a frame from an arthouse film — stylized, cold, and unreachable, yet undeniably human.',
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
    prompt: 'Portray a golden-hour fantasy on the edge of luxury — the subject framed against cliffs or yacht railings, kissed by sunlight. Their resort-chic outfit is minimal: a flowing wrap or loose silk shirt, effortlessly elegant, revealing sunlit skin. Hair dances in the breeze, eyes half-closed in calm contentment. The background glows with tropical blur: turquoise sea, distant palm silhouettes, warm haze. The mood is rich, serene, untouchable.',
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
    prompt: 'Freeze a fleeting moment after the gala. A figure walks alone through marble corridors or descending a dark stairwell, caught mid-step in dramatic lighting. They wear a silk gown or tux that flows subtly with movement — minimal but expensive. Paparazzi flashes sparkle like ghost memories behind them. Their expression is unreadable: proud, distant, unforgettable. A soft lens flare echoes behind, as if time is slowing down.',
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
    prompt: 'Visualize a futuristic silhouette immersed in glowing white minimalism. Dressed in all black — smooth fabrics, high collars, tailored lines — they stand like a monument. The lighting is sculptural: soft rimlights outlining their body, long shadows stretching behind them. Their face is calm and distant, as if from another time. The aesthetic is near-monochrome, hyper-stylized, like a sci-fi fashion editorial lost in silence.',
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
    prompt: 'Frame a frozen moment of post-party shimmer. The subject stands beneath soft disco reflections, skin glowing in soft gold and silver tones. Their minimal clubwear — a shimmering slip dress or sheer shirt — catches cinematic lens flares. Their eyes are unfocused, like they\'re reliving the night in memory. The scene glows softly: dreamlike, nostalgic, intimate. Grain and blur give the image the texture of a vintage dream.',
    negative_prompt: 'hard flash, sharp detail, neon chaos, crowds, dancing pose, vibrant clothing, full-body',
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
