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
- Black Bloom: Botanical portrait with black flowers, mystical midnight garden
- Yakuza Heir: Raw power and style, irezumi tattoos, Osaka street scenes
- Blueberry Bliss: Futuristic latex fashion in deep blue and lilac palette
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
  // 🖤 Black Bloom
  {
    id: 'unreal_reflection_the_syndicate',
    label: 'Black Bloom',
    prompt: 'Transform this exact woman (or group of women) into a botanical portrait styled with high-fashion elegance. Her outfit, accessories, and scene are crafted entirely from a curated selection of soft-textured black flowers, designed to evoke sensuality, mystery, and ethereal power.\n\n🌺 Approved Flowers Only\nUse only the following flower types — no others:\n* Black Peonies – for fullness and drape\n* Black Orchids – elegance and focal points\n* Black Hibiscus – sculptural shapes, shoulder accents\n* Black Cherry Blossoms – scattered delicately in hair or on skin\n* Black Baby\'s Breath – soft halo, filler detail\n* Black Roses – depth and romance\n❌ No colorful or fantasy hybrid flowers ✅ All flowers must be realistic, soft-textured, and match the black palette\n\n🎨 Color Direction: Black Edition Only\nEverything — dress, accessories, flowers, background — is rendered in shades of black:\n* Matte black, satin black, deep charcoal\n* Occasional highlights in silver or deep graphite for contour and depth\n* No visible bright colors, no green stems, no color contrast\n* Scene feels moody, elegant, and sculptural\n✅ Black-on-black layering must remain readable through light, shadow, and texture contrast ❌ No neon, no blue tint, no gothic blood red\n\n💄 Makeup & Face\nShe wears dramatic soft-glam makeup with bold details:\n* Eyes: charcoal shimmer, winged eyeliner, defined lashes\n* Skin: radiant matte or semi-matte finish, golden or neutral undertone\n* Lips: deep rosewood or soft blackened plum\n* Cheeks: muted mauve or dusty rose, lightly contoured\n* ✅ Eyebrows shaped, lashes bold — editorial ready\n* ❌ No bare face, no zombie effects\n\n👗 Floral Fashion Design\n* Dress sculpted entirely from black petals and blooms\n* Petals form cups, sleeves, corset folds, thigh-high petal splits\n* Strategic openings show natural skin — elegant, not vulgar\n* Petal layering mimics couture draping\n* Optional: black rose neckline, orchid cuff, or peony cascade from waist\n\n💇‍♀️ Hair Styling\n* Long styled waves, sleek braids, or low chignon with black cherry blossoms or orchids\n* Hair is elegant, polished, with clear shape — not messy\n* Optional: matte black flower crown or petal-studded pins\n\n🧍‍♀️ Posing (Solo or Group)\n* Side or ¾ angle poses, soft lean, hand gently touching lips or lifting hair\n* Legs crossed or tucked elegantly\n* Expressions: powerful, hypnotic, soft — never stiff\nGroup logic:\n* Each woman has unique floral placement\n* Composition forms soft arc or triangle\n* No clones, no duplicates, natural chemistry\n\n🌿 Background & Scene\n* A mystical midnight garden or dark floral clearing\n* Ground is black moss, or soft layered petals in deep shades\n* Glowing pollen or dew particles floating\n* Soft mist + faint silver light beams from moonlight or hidden source\n✅ Scene must feel natural and cinematic, not artificial ❌ No walls, beds, greenhouses, or studio lighting\n\n✅ Technical Lock\n* 100% identity preservation\n* Shadows and petal light interplay must feel real\n* No chrome shine, fantasy filters, or plastic effects',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion, colorful flowers, green stems, bright colors, neon, blue tint, gothic blood red, bare face, zombie effects, messy hair, walls, beds, greenhouses, studio lighting, chrome shine, fantasy filters, plastic effects',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['black_bloom', 'botanical_fashion', 'black_flowers', 'mystical_garden', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
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
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },
  // 🫐 Blueberry Bliss
  {
    id: 'unreal_reflection_gothic_pact',
    label: 'Blueberry Bliss',
    prompt: 'Transform this person, couple, trio, or group (1–4 total) into fierce futuristic fashion models in a glossy, hyper-stylized editorial scene. The entire world — from clothes to backdrop — is immersed in a high-contrast deep blue and lilac color palette. Full-body latex is mandatory. No other materials.\n\n👯 Group Format\n* 1 to 4 subjects\n* Each subject strikes a bold pose: kneeling, crouching, hands on hips, looking over shoulder, or chin tilted\n* No soft or passive stances. Power + posture.\n\n👗 LATEX-ONLY FASHION STYLING\nEach subject wears 1 full latex look in either deep blue or glowing lilac — no color mixing inside outfits. Examples:\n1. Deep blue latex catsuit — full body, zipped high collar, gloss finish\n2. Lilac latex corset mini dress — tight, high hem, exaggerated curves\n3. Glossy indigo latex trench coat — open, with matching thigh-high boots\n4. Lilac latex jumpsuit with cutouts — sculpted hips, long sleeves\n5. One-shoulder blue latex bodysuit — paired with latex gloves and platform boots\n6. Matching latex masks or visors (optional — for 1 subject only)\n⚠️ Strict latex rule: No silk, chiffon, mesh, or mixed materials. No jewelry unless latex.\n\n💇 Hair & Makeup\n* Hair is tightly styled — slicked back, sharp bob, or sculptural shapes\n* Makeup pops with contrast:\n    * Blue eyeliner wings + lilac glossy lips\n    * Violet chrome highlight + cold-toned contour\n    * Eyes fully open, lashes defined — do not obscure makeup\n* Optional: tiny chrome blue face sticker accents (only 1–2 subjects max)\n\n🫐 Signature Prop: Melted Blueberry Latex Orb\n* A surreal glossy latex orb sits on the floor, cracked open like a giant blueberry\n* Inside: gooey purple light spills out — hyper-detailed, glowing latex goo\n* Other options:\n    * Subject places heel on the orb, squishing it\n    * One crouches beside it with hand dipped into the "berry latex"\n\n🪩 Background & Set Design\n* Set is fully color-coded in latex textures — lilac and deep blue ONLY\n* Glossy reflective floor\n* Curved latex wall panels with sharp blue-to-lilac lighting\n* Optional: futuristic latex-draped chair, podium, or steps for posing\n\n💡 Lighting\n* Studio-grade direct lighting, from low angles\n* Creates sharply defined shadows and latex shine pop\n* Use blue-toned key light and lilac rim lighting — high drama\n\n📸 Photography Style\n* High-gloss magazine cover energy\n* Subjects look sculpted, untouchable\n* No realism. Full fashion fantasy.\n\n⚙️ Technical Rules\n* Identity lock ON — match facial and body features\n* All subjects from original photo only\n* No background clutter, no fruit realism\n* Props, latex, and environment must be deep blue or lilac ONLY\n* No mixed materials — 100% latex universe',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion, silk, chiffon, mesh, mixed materials, jewelry, soft poses, passive stances, realistic fruit, background clutter, green, red, yellow, orange, warm colors',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['blueberry_bliss', 'latex_fashion', 'futuristic_editorial', 'blue_lilac_palette', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
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
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
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
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
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
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  }
];

export function getUnrealReflectionPreset(presetId: string): UnrealReflectionPreset | undefined {
  return UNREAL_REFLECTION_PRESETS.find(p => p.id === presetId)
}

export function isUnrealReflectionPreset(presetId: string): boolean {
  return UNREAL_REFLECTION_PRESETS.some(p => p.id === presetId)
}