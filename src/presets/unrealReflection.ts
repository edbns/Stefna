// src/presets/unrealReflection.ts

/*

🧠 Unreal Reflection™ – Nano Banana Optimized (v2.0)

Unreal Reflection™
"Not who you are. Who you could've been."
A photoreal, alternate-identity remix powered by Nano Banana.
Think: a version of you from a mirror-dimension, dream-state, or forgotten past life.
Identity-adjacent, not fantasy. Stylized, not cosplay.
Built for scroll-stopping visuals that feel mysterious, ethereal, and beautiful.

Enhanced prompts optimized for Nano Banana's verbosity preferences:
- The Syndicate: Feared inner circle of power, tailored suits, cinematic underworld
- Yakuza Heir: Raw power and style, irezumi tattoos, Osaka street scenes
- The Gothic Pact: Gothic royalty in timeless black fashion, candlelit scenes
- Y2K Paparazzi: Ultra-sexy fashion-forward icons, night scene, paparazzi flash
- Medusa's Mirror: Greek muse glam, flowing fabrics, marble ruins
- Chromatic Bloom: Dark magazine cover style with animal symbols

All presets use optimized strength (0.55) and guidance (7.5) for Nano Banana.

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
  // 🕴️ The Syndicate
  {
    id: 'unreal_reflection_the_syndicate',
    label: 'The Syndicate',
    prompt: 'Transform this person, couple or group of people in the photo into a member or members of The Syndicate — a feared and untouchable inner circle of power. If male, they wear tailored black suits, long coats, or sharp collared shirts — sometimes with gloves or dark sunglasses, always perfectly composed. If female, they appear in couture-style dresses, satin gowns, or sleek power suits — elegant, cold, and intimidating. Couples may stand together like a mafia heir and spouse, while groups may form a silent circle or hierarchy, one larger bodyguard figure half in shadow.\n\nTheir posture is natural and unstaged — leaning against a luxury car, seated at a dim table with half-finished drinks, adjusting a cufflink, standing half-turned in a doorway, or caught mid-stride in a quiet hallway. The lighting changes with the setting: golden light spilling through blinds in a smoky private room, the cold blue of a deserted garage lit by a single bulb, or warm streetlights reflecting off wet pavement at night.\n\nThe environment suggests wealth and secrecy — places like a hidden lounge with leather chairs and cigars, an abandoned luxury hotel lobby, a rain-soaked parking lot beside a black Mercedes, or a curtained backroom of a club.\n\nThe mood is tense and cinematic, but completely real — as if this was a leaked photo from the underworld, capturing their authority without posing. Always photorealistic, fashion-forward, and intimidating.',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['the_syndicate', 'power_suits', 'cinematic_lighting', 'authority', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '4:5'
  },
  // 🐉 Yakuza Heir
  {
    id: 'unreal_reflection_yakuza_heir',
    label: 'Yakuza Heir',
    prompt: 'Transform this person, couple or group of people in the photo into a Yakuza Heir or heirs — captured in a raw but cinematic moment of power and style. If male, they appear shirtless or in open silk robes or vests, revealing intricate irezumi tattoos across the chest, shoulders, or back. If female, they wear elegant but revealing dresses, kimonos, or robes that expose tattooed skin along the shoulders, arms, or legs — styled with confidence, never cliché. Couples may stand close together with matching ink visible, while groups may gather naturally, one larger bodyguard-like figure in the background.\n\nTheir posture is unposed and natural — leaning against a wall, adjusting clothing, walking mid-frame, sitting with one arm stretched, or glancing away. The lighting varies with the mood: neon glow bouncing from a quiet Osaka side street, soft golden dusk filtering through a paper window, or cold fluorescent light in a garage after rain. The environment reflects their hidden world — places like a tatami room with ashtrays, a private bathhouse entrance, a dim bar with cigarettes and glasses, or a deserted alley with rain on the pavement.\n\nThe feeling is real, cinematic, and intimidating — like a photo captured by accident, showing the intimacy and danger of their world. Always grounded, fashion-forward, and photorealistic.',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['yakuza_heir', 'irezumi_tattoos', 'cinematic_mood', 'power_style', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '4:5'
  },
  // 🖤 The Gothic Pact
  {
    id: 'unreal_reflection_gothic_pact',
    label: 'The Gothic Pact',
    prompt: 'Transform this person, couple or group of people in the photo into a member or members of The Gothic Pact — gothic royalty in timeless black high fashion. If male, they wear sharp dark suits, long coats, or high collars with velvet or satin detail. If female, they wear lace gowns, corseted dresses, veils, or dramatic jewelry with pearls and silver. Tattoos or jewelry may glint faintly, but nothing exaggerated. Couples may appear bound together in secrecy, while groups may gather like a silent court.\n\nTheir posture is natural, not staged — seated with calm intensity, leaning into shadow, walking mid-frame, or standing side by side. Their expressions remain regal and unreadable.\n\nThe scene changes with the moment:\n- a candlelit cathedral ruin with golden light spilling across broken stone,\n- a moonlit balcony with mist curling through the night air,\n- a decaying mansion hall lined with faded portraits,\n- a shadowy room filled with candles and heavy velvet curtains,\n- a Gothic garden at twilight with bare trees and wrought iron gates.\n\nThe lighting adapts to the place: flickering candlelight, pale silver moonlight, stained glass reflections, or soft dawn shadows.\n\nThe photo should always feel real, cinematic, and fashion-forward — like a leaked portrait of a Gothic dynasty, not a posed photoshoot.',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['gothic_pact', 'gothic_royalty', 'dark_fashion', 'cinematic_scenes', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '4:5'
  },
  // 📸 Y2K Paparazzi
  {
    id: 'unreal_reflection_y2k_paparazzi',
    label: 'Y2K Paparazzi',
    prompt: 'Transform this person, couple, or group of girls in the photo into ultra-sexy, fashion-forward Y2K icons squatting on a city sidewalk at night, dramatically lit by harsh paparazzi flash. Each subject is turned away, looking confidently over her shoulder while casually gathering her hair — glowing skin exposed under the flash, with curves and posture emphasized by the camera angle.\n👗 Female Styling\nShe wears one those style: \na Brown backless mini dress with thin straps, visible skin texture texture hugging waist and hipss\nBlack Micro-Dress – low scoop back texture hugging waist and hipss\nGloss Blackout: glossy latex black texture hugging waist and hipss\nCowl-Neck Backless Mini Dress in Olive Green\nMakeup is natural yet glamorous with sculpted brows, voluminous lashes, and brown lipgloss with brown lipliner\nShe has a small, stylish tattoo that is clearly visible — delicate and minimal, placed naturally on the arm, shoulder, or lower back, adding to her fashion-forward look.\n👠 Accessories\n* wearing tall, black, designer pointed-toe stiletto heeled over-the-knee boots,  a platform mid-calf boots or Shark Lock wide-fit leather knee-high boots\n* Designer-inspired handbags placed near her — small, luxurious, subtly detailed\n* small jewelry: gold hoops, anklets, or fine chain bracelets\n🎬 Scene\n* Sidewalk at night — minimal background\n* Captured like a candid post-party flash moment\n* Ground shows subtle textures, shadows, and reflections\n🎥 Camera Angle\n* Lower than eye-level\n* Emphasis on posture, outfit design, leg lines, handbag position\n💡 Lighting\n* Direct frontal flash (paparazzi style)\n* Creates dramatic contrast and glowing skin\n* Slight reflections on skin, dress, and ground\n⚙️ Technical Rules \n* Identity lock ON — face, body, features must match uploaded photo\n* No extra people — use only subject(s) from original photo\n* Each subject wears one complete outfit — don\'t mix styles\n* Photo-realistic with high detail and accuracy\n* No surrealism, no fantasy artifacts',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['y2k_paparazzi', 'fashion_forward', 'night_scene', 'flash_photography', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '4:5'
  },
  // 🏛️ Medusa\'s Mirror
  {
    id: 'unreal_reflection_medusa_mirror',
    label: 'Medusa\'s Mirror',
    prompt: 'Transform this person, couple or group of people in the photo into a member or members of Medusa\'s Mirror — a modern Greek muse styled as timeless glam. They wear flowing fabrics in ivory, white, bronze, or gold, draped like modern interpretations of ancient togas or gowns. Accessories may include gold cuffs, bronze jewelry, braided belts, or sculptural rings. Their style is regal, minimal, and elegant — never costume-like. Couples may appear as mirror-like figures in harmony, while groups may resemble a timeless chorus, each distinct but united in mood.\n\nTheir posture is unposed and natural — seated on stone steps with fabric draped across the body, walking mid-frame with wind catching the cloth, standing half-turned as if sculpted from marble, or gazing sideways with calm intensity. Their expressions are serene and commanding, filled with quiet authority.\n\nThe scene changes with the moment:\n- marble ruins under golden sunset light,\n- a rocky cliffside by the Aegean Sea with wind in the air,\n- an olive grove with long shadows and ancient stone walls,\n- a moonlit courtyard with columns casting sharp lines,\n- a weathered marble temple with sunlight reflecting off stone.\n\nThe lighting adapts naturally: strong golden hour warmth, silver moonlight, soft Mediterranean dawn, or harsh sunlight against pale stone.\n\nThe photo feels like an editorial portrait where fashion meets myth — timeless, cinematic, and photorealistic.',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['medusa_mirror', 'greek_muse', 'timeless_glam', 'marble_scenes', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '4:5'
  },
  // 🌺 Chromatic Bloom
  {
    id: 'unreal_reflection_chromatic_bloom',
    label: 'Chromatic Bloom',
    prompt: 'Transform this person, couple or group of people in the photo into high-fashion editorial icons styled for a dark magazine cover look (without text).\n\nIf male, they wear minimal dark couture clothing — tailored black or midnight blue suits, open shirts, or structured coats with strong silhouettes. No heavy makeup, only natural sharpness and intensity. Each male figure is accompanied by only one powerful animal symbol:\n- a black doberman seated or standing at their side,\n- or a coiled snake wrapped naturally around the arm, shoulder, or waist,\n- or a raven perched close, on stone or shoulder.\nOnly one animal should appear, never more than one per subject.\n\nIf female, they wear minimal but striking couture gowns or dresses — plunging necklines, bare shoulders, or sleek fitted silhouettes in dark tones such as black, storm grey, wine red, or deep emerald. Their makeup is minimal yet captivating: luminous skin, bold eyeliner, or strong lips. Each female figure may also be accompanied by only one powerful animal symbol: a black dog at their side, a snake coiled around the body, or a raven perched nearby. Never combine more than one animal per subject.\n\nFor couples, the balance is clear: each person styled distinctly with their own presence and possibly one animal each. For groups, they form a dark editorial tableau — each unique, animals appearing sparingly, never overlapping.\n\nTheir posture rotates naturally — men standing tall with a snake coiled along the arm, seated with a dog by their side, or turning in shadow with a raven perched near. Women leaning against stone with fabric flowing, seated with a snake draped across the shoulders, or walking mid-frame with a doberman at her side. Expressions remain calm, regal, and untouchable.\n\nThe scenery changes with the mood:\n- a cinematic studio set with dramatic spotlight and deep shadow,\n- an abandoned warehouse with broken windows and dust,\n- a stone courtyard at dusk with faint mist,\n- a rooftop at night with the skyline behind,\n- a candlelit interior with velvet curtains and cracked marble floors.\n\nLighting is professional and dramatic — sharp contrasts, golden dusk, pale moonlight, or a single spotlight cutting through shadow.\n\nThe result must feel photoreal, stylish, and unforgettable — a world where dark couture and symbolic animals define power and beauty.',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['chromatic_bloom', 'dark_couture', 'animal_symbols', 'editorial_style', 'identity_preserved'],
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