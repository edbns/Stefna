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
  // ⚫ Black Aura
  {
    id: 'parallel_self_black_aura',
    label: 'Black Aura',
      prompt: 'Transform this person, couple, or group of people in the photo into high-fashion editorial figures captured in dramatic black and white.\n\nFemale Styling She may appear in one of several looks — but only one outfit per image:\n* A form-fitting black string-lace dress — plunging neckline, high slit, or open back.\n* Only A sharp black blazer worn as a dress no pants — sculpted shoulders, deep neckline, strong silhouette.\nFabrics are matte and structured: satin, silk, or modern stretch that sculpts the body. Shoes are minimal but sharp: strappy black sandals or pointed heels. Makeup is bold but refined — smoky eyes, contoured lips, luminous skin. Her presence is calm, confident, statuesque.\n\nMale Styling He may appear in one of several grounded and masculine outfits — but only one look per image:\n* A fitted black crewneck or short-sleeve T-shirt tucked into tailored trousers.\n* A structured black shirt, buttoned or slightly open, with rolled sleeves and strong shoulders.\n* A clean-cut black jacket worn over a bare chest or a fitted base layer, paired with heavy trousers.\nFabrics are classic and weighty: cotton, canvas, denim, wool. The styling emphasizes sharp structure and presence, never soft or ornamental. Footwear is solid and minimal: black leather boots or square-toed dress shoes. No jewelry. No accessories. No fashion tricks. The overall look must feel masculine, confident, and quietly commanding.\n\n\nCouples When a male and female subject appear together, each keeps their distinct styling as above (one outfit each, not combined). Their poses may vary naturally: one seated, the other standing; standing close with contrast in silhouette; walking mid-frame in motion.\n\nGroups In group compositions, only one subject may sit — always on the old wooden chair with visible metal legs. The remaining subjects stand around them, each facing forward directly toward the camera with a calm, composed posture.\nThere is no overlapping or symmetry — each figure holds their own space clearly, standing with relaxed arms, feet slightly apart, and body fully visible. No turning, leaning, or motion poses.\nEach person wears only one outfit as defined above — no repetition or mixing. The arrangement should feel bold and grounded, like a high-fashion cast captured in a single, iconic frame. Every subject looks confident, strong, and still.\nleaning against a wall in profile, fabric draping around her curves, - walking mid-frame with the slit of the dress catching motion, - head tilted back, confident gaze or eyes half-closed in calm dominance. Her expression is magnetic and unapologetic — calm, powerful, and deeply sensual without exaggeration. The background is minimal and moody: a studio void in shadow, a faint stone texture, or a cinematic set in deep black tones. Lighting is sharp and professional: dramatic contrasts, high detail, every contour of their body \n\n\nChair A single old wooden chair with visible metal legs anchors the scene. It is worn, raw, and cinematic. Only one chair per frame.\n\nScene & Background The room is empty and raw: dark gray walls with paint stains and rough texture, subtle fog in the air. The chair is the only prop. The floor is cold, reflective stone or concrete.\nleaning against a wall in profile, fabric draping around her curves, - walking mid-frame with the slit of the dress catching motion, - head tilted back, confident gaze or eyes half-closed in calm dominance. Her expression is magnetic and unapologetic — calm, powerful, and deeply sensual without exaggeration. The background is minimal and moody: a studio void in shadow, a faint stone texture, or a cinematic set in deep black tones. Lighting is sharp and professional: dramatic contrasts, high detail, every contour of her body \n\nLighting A single white spotlight highlights the subject(s), creating high-contrast shadows across the floor and walls. The result is sharp, cinematic, and entirely black and white — every fabric fold, skin texture, and silhouette revealed in detail.\n\n⚡ Key Condition: Each generated image must show a single outfit and a single pose choice per subject. Never blend multiple outfits or poses into one frame.\nThe final result must feel photoreal, modern, and iconic — like a single timeless frame from a fashion campaign.',
    negative_prompt: 'cartoon, anime, smiling, makeup-heavy, overexposed, colorful clothes, hats, wide angle',
    strength: 0.58,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'parallel_self',
    guidance_scale: 7.2,
    num_inference_steps: 30,
    features: ['black_aura', 'high_fashion', 'editorial_bw', 'dramatic_lighting', 'identity_preserved'],
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
    prompt: 'Transform this person, couple, or group of people in the photo into high-fashion editorial icons captured in dramatic black and white.\n\nEach subject is styled in sensual, structured couture that emphasizes their presence and physique:\n\nIf female-presenting: a minimal couture dress — tight, body-embracing, with bold but tasteful cuts: plunging neckline, thigh-high slit, open back. The look radiates sexy confidence and a powerful body-positive aura.\n\nIf male-presenting: an unbuttoned black silk shirt or a structured sleeveless jacket, paired with tailored high-waisted pants or minimal fashion-forward layers. The silhouette is sharp, clean, and striking — exuding modern strength without exaggeration.\n\nIn group shots: each subject is uniquely styled to match their vibe, but always within the same monochrome fashion story — high fashion minimalism with editorial edge.\n\nBeside each person stands a black panther — sleek, graceful, and commanding. The panther feels like an extension of the subject\'s aura, never a prop. Only one panther per frame.\n\nCapture elegant, powerful moments:\n\nStanding tall, hand resting on the panther\n\nSeated on stone steps, legs extended, feline close by\n\nLeaning in shadow, fabric draping naturally\n\nWalking mid-frame, caught in motion\n\nHead tilted back, eyes closed or locked with the camera\n\nLighting is cinematic and precise — sharp contrast, deep shadows, clean highlights. Background is minimal and moody: a dark studio void, soft stone texture, or cinematic black set.\n\nThe final image must be photorealistic, iconic, and timeless — a monochrome fashion cover from another universe.',
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
    prompt: 'Transform this person, couple or group of people in the photo into the cinematic swimwear icon or icons on an unforgettable luxury escape. If female, they wear refined two-piece bikinis inspired by brands like La Perla or Eres — styled in vibrant or soft tones, with glowing skin and wind-swept hair. If male, they appear shirtless and sculpted, in sleek Vilebrequin-style swim shorts, confident and relaxed. Their posture is dynamic and natural — walking barefoot, turning mid-frame, resting on one arm, or stretching in motion. The lighting changes with the mood: golden hour shimmer, overcast glow, or moonlit reflections. The atmosphere draws inspiration from elite travel locations — places like the Maldives, Bora Bora, or similar dreamy destinations for the ultra-wealthy. The scene may include water platforms, wooden walkways, stone terraces, or soft panoramic horizons — always blurred and cinematic, never cliché. The feeling is warm, untouchable, and completely free.',
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
  // 💫 Who Got Away
  {
    id: 'parallel_self_one_that_got_away',
    label: 'Who Got Away',
    prompt: 'Transform this person, couple or group of people in the photo into the unforgettable main character or characters of a high-fashion departure scene. They are dressed in striking luxury eveningwear — inspired by designers like Saint Laurent, Mugler, or Balmain — with bold cuts, flowing fabrics, or tailored structure that enhances their presence. Their expression is captivating, caught mid-glance or mid-step, confident and distant. Lighting is cinematic and dynamic: backlit silhouettes, paparazzi-like flares, golden glow from behind, or dramatic shadows playing across reflective surfaces. They appear in motion — walking down grand stairs, stepping out of a black car, or crossing a marble hallway — surrounded by blurred architectural lights and soft movement. Their face(s) and posture are the focus: this is not someone who leaves quietly — this is someone you\'ll remember.',
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
    prompt: 'Transform this person, couple or group of people in the photo into the street fashion icon or icons styled in all-black, high-end urban wear — blending elements from brands like Rick Owens, Ader Error, and Fear of God. Their outfit(s) are structured yet wearable: layered fabrics, oversized silhouettes, clean tailoring, or subtle asymmetry. No colors, only black, charcoal, or minimal white details. The atmosphere feels cinematic and stylish — a blurred underground tunnel, glowing crosswalk, fogged parking structure, or concrete gallery space lit by white or soft neon accents. Their posture is relaxed but powerful — mid-step, leaning against a wall, or walking directly into soft light. Their face(s) are clearly visible, expression calm but unbothered. This is fashion that dominates the scene without shouting — modern, striking, and unforgettable.',
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
    prompt: 'Transform this person, couple or group of people in the photo into the star or stars of a cinematic after-party moment. They are dressed in eye-catching designer eveningwear — inspired by brands like Mugler, Tom Ford, or Celine — with shimmering fabrics, sleek silhouettes, or minimal sheer details. Their skin glows softly under ambient golden or silver lighting, and their expression is calm, poised, and untouchable. The scene feels dreamy and intimate: soft reflections from disco lights, champagne-colored lens flares, mirrored walls, or blurred elevator interiors. Their pose is relaxed but magnetic — turning slightly, leaning back into a reflective surface, or frozen mid-step in dim golden haze. This is the quiet, final photo that becomes the most iconic.',
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
