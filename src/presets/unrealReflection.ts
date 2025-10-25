// src/presets/unrealReflection.ts

import { generateChromaticSmokePrompt } from '../utils/chromaticSmokeRandomization';
import { generateCrystalFallPrompt } from '../utils/crystalFallRandomization';
import { generateButterflyMonarchPrompt } from '../utils/butterflyMonarchRandomization';
import { generateMoltenGlossPrompt } from '../utils/moltenGlossRandomization';
import { generatePaperPopPrompt } from '../utils/paperPopRandomization';

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
- Chromatic Smoke: Dynamic smoke fashion with rotating color injection

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
  // Randomization parameters (for presets like Paper Pop, Chromatic Smoke, etc.)
  isRandomized?: boolean
  basePrompt?: string
}

export const UNREAL_REFLECTION_PRESETS: UnrealReflectionPreset[] = [
  // 📄 Paper Pop (NEW - with theme-based randomization)
  {
    id: 'unreal_reflection_paper_pop',
    label: 'Paper Pop',
    prompt: 'Transform this exact woman into a fearless beauty portrait breaking through bright {{theme.color_name}} paper. Only her head and neck are visible, with her face {{theme.head_pose}}, {{theme.expression}}. Makeup: {{theme.makeup.blush}}, {{theme.makeup.lip}}, {{theme.makeup.liner}}, {{theme.makeup.extra}}. Hair: {{theme.hair.style}} in {{theme.hair.color}} with {{theme.hair.detail}}. Background: {{theme.color_name}} matte backdrop with {{theme.rip_style}}. Lighting: {{theme.lighting}}. Mood: {{theme.mood_line}}',
    negative_prompt: 'cartoon, face paint, cosplay, distortion, oversaturated, cluttered composition, full body, messy background, dark lighting',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['paper_pop', 'colorful_backdrop', 'playful_portrait', 'randomized_style', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16',
    isRandomized: true,
    basePrompt: 'Transform this exact woman into a fearless beauty portrait breaking through bright {{theme.color_name}} paper. Only her head and neck are visible, with her face {{theme.head_pose}}, {{theme.expression}}. Makeup: {{theme.makeup.blush}}, {{theme.makeup.lip}}, {{theme.makeup.liner}}, {{theme.makeup.extra}}. Hair: {{theme.hair.style}} in {{theme.hair.color}} with {{theme.hair.detail}}. Background: {{theme.color_name}} matte backdrop with {{theme.rip_style}}. Lighting: {{theme.lighting}}. Mood: {{theme.mood_line}}'
  },

  // 💄 Red Lipstick (NEW)
  {
    id: 'unreal_reflection_red_lipstick',
    label: 'Red Lipstick',
    prompt: 'Transform this exact woman or exact group of women in the photo into powerful fashion muses captured in a dramatic black-and-white world — where the only color is her red lipstick.\n\nOutfits are sharp and seductive: black sculpted bodysuits, corset tops, sheer black mesh, tailored black pants or skirts with bold cuts. No coats. No fantasy. Just confident, elevated fashion that reveals the shape of the body without being vulgar.\n\nPoses are strong and grounded: sitting on a stool with legs apart, leaning back with one arm over the chair, walking with head turned — like they were caught mid-movement by a film camera. No weak stances. Every posture tells a story.\n\nMakeup is grayscale-perfect: contoured skin, defined brows, soft shadow — and then the matte red lips pierce through, bold and center-stage.\n\nHair is natural but styled — a soft wave, slicked side part, or windswept volume. No futuristic edits. Just real beauty.\n\nBackground is textured but clean — a concrete wall, black curtain, studio backdrop, or old mirror reflecting blurred shapes. Lighting is harsh from one side, creating deep shadows across body curves and cheekbones. This isn\'t over-lit. This is cinematic tension.\n\nOnly one thing glows in color: the red lipstick. Everything else is just black, white, and legend.',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, distortion, oversaturated, cluttered composition, coats, jackets, fantasy elements, vulgar, weak poses',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['red_lipstick', 'black_white', 'color_accent', 'cinematic_fashion', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🕯️ Wax Bloom (NEW)
  {
    id: 'unreal_reflection_wax_bloom',
    label: 'Wax Bloom',
    prompt: 'Transform this exact woman or exact group of women in the photo into radiant fashion muses dressed in molten candle couture. Their outfit is formed from glossy, semi-melted wax, glowing from within with amber and ivory tones. The fashion appears fluid, dripping at the edges: bodices shaped like melting blooms, shoulder wraps that cascade like wax from a flame. Some areas glow gently, as if still hot. Thin wax trails appear down arms or legs, but never sticky or grotesque — sensual, sculptural, luxurious. Hair is swept up or loosely waved, subtly touched by wax accents. Skin is luminous and smooth. Makeup is dewy with glossy lips, soft candlelight blush. Lighting is warm and cinematic — candlelit glow from one side, casting dynamic shadows. Background is dark with subtle flames, blurred candles, or wax-streaked panels. Slow wax drips visible in motion, a trail of cooled wax beneath the body, or cracked wax textures like blooming scars.',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, distortion, oversaturated, cluttered composition, messy, unrefined',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['wax_bloom', 'candle_couture', 'molten_fashion', 'warm_glow', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🌬️ Wind Layer (NEW)
  {
    id: 'unreal_reflection_wind_layer',
    label: 'Wind Layer',
    prompt: 'Transform this exact woman (or group of women) into high-fashion muses wrapped in invisible wind. Their dresses are sculpted entirely from motion — sheer, flowing fabrics lifted and twisted by strong wind gusts, frozen in time.\n\nFabrics cling and lift mid-air: trailing sleeves, twisting skirts, chest wraps pulling off one shoulder — always caught in perfect motion. Outfits remain modest but sensual, revealing form through translucent movement. Skin is visible at the shoulders, legs, collarbone, and upper back — glowing, wind-kissed.\n\nMakeup: radiant glow, flushed cheeks, a subtle smudge around the eyes like windblown beauty. Hair: wild and free, suspended mid-motion — strands pulled upward, sideways, tangled by invisible air.\n\nThe background is an open landscape — minimalist coast, rooftop edge, or sky gradient. Lighting is golden hour or moody grey-blue, emphasizing the volume of wind-sculpted cloth.\n\nPose direction: dramatic, caught in action — head turned with hair flowing, fabric stretching behind them, legs mid-step, hands lifting to hold the flying dress.',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, distortion, static poses, stiff fabric, indoor studio, flat lighting, oversaturated, cluttered composition',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['wind_layer', 'motion_fashion', 'flowing_fabric', 'golden_hour', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🪞 Mirror Shatter (NEW)
  {
    id: 'unreal_reflection_mirror_shatter',
    label: 'Mirror Shatter',
    prompt: 'Transform this exact woman (or group of women) into sharp-edged icons of futuristic fashion wearing sculpted dresses made from broken mirror shards.\n\nEach outfit is composed of reflective glass pieces: jagged but carefully placed to form asymmetrical couture silhouettes — strapless bustiers, slitted skirts, backless wraps. Some shards float slightly off the body like armor fragments in motion.\n\nTheir skin is visible between the reflections — bare arms, shoulders, back, and legs. Skin is soft and glowing, contrasting the glass\'s sharpness.\n\nMakeup: glass-sheen highlighter, smoky metallic eyes. Hair: sleek ponytail, braided crown, or gelled-back wet look.\n\nThe background is black or smoky chrome, catching fragmented reflections. Lighting comes from high angles, bouncing off the mirrors, casting brilliant spark lines and geometric shadows.\n\nPoses are fierce but elegant: turned shoulders, legs crossed mid-step, chin high — like models ready for battle in a crystal dimension.',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, distortion, matte fabric, dim lighting, oversaturated, cluttered composition, soft edges',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['mirror_shatter', 'reflective_fashion', 'glass_armor', 'futuristic_couture', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 💫 Chemistry Check (NEW - Couples Preset)
  {
    id: 'unreal_reflection_chemistry_check',
    label: 'Chemistry Check',
    prompt: 'Transform this exact couple into an unforgettable fashion duo captured in a dramatic, cinematic moment.\n\nThey stand in a dimly lit space — close, but not touching — each styled in their own high-fashion outfit with contrasting silhouettes. Their chemistry is magnetic. Her hand may hover near his chest, or he leans slightly closer, but the moment feels frozen in charged intimacy.\n\nTheir outfits are bold, sculpted, and revealing with intention — think structured cut-outs, high slits, bare backs, or open jackets. All garments are elegant, sensual, and powerful — no nudity, just confident skin. She wears heels, he stands tall with a grounded presence. One leg bent, a jacket falling, tousled hair — everything tells a story.\n\nTheir faces are natural, eyes intense or half-lidded. Lighting wraps softly around them from one side, casting deep shadows and illuminating key details: collarbones, jawlines, bare shoulders. Background is minimal — a matte black void, foggy floor, or sleek industrial wall. Optional: soft breeze catching her hair or his jacket hem.\n\nThis isn\'t just fashion. It\'s tension, power, connection — a couple caught in their most iconic moment before the lights go down.',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, distortion, nudity, oversaturated, bright backgrounds, cluttered composition, flat lighting, poor chemistry, awkward poses',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['chemistry_check', 'couples_fashion', 'dramatic_lighting', 'cinematic', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🖤 Floral Noir
  {
    id: 'unreal_reflection_floral_noir',
    label: 'Floral Noir',
    prompt: 'Transform this image into a high drama black & white fashion portrait of this exact woman (or exact group) with floral artistry.\n\nShe wears sleek tight dress fashion, textured in form. Overlaid are soft floral elements — petals, blossoms, vines — that integrate with her body and garments (falling petals, floral lace overlays).\n\nThe lighting is high contrast: hard highlights, deep shadows. The flowers are monochrome, but exist as texture or accent — not full bouquets.\n\nHer pose and expression should be strong, seductive, emotionally weighty. Identity remains clearly realistic, high fashion.\n\nThe final image feels like a poetic fashion still, combining the timelessness of black & white with the softness and symbolic depth of florals.',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion, colorful flowers, bright colors, low contrast, flat lighting, oversaturated, cluttered composition',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['floral_noir', 'black_white', 'floral_artistry', 'high_contrast', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🔥 Molten Gloss
  {
    id: 'unreal_reflection_molten_gloss',
    label: 'Molten Gloss',
    prompt: generateMoltenGlossPrompt('Transform this exact woman into a cinematic fashion sculpture made from obsidian and molten gold. Her body is wrapped in a high-gloss black dress that flows like thick lava — smooth, sculpted, and reflective. The outfit clings to her silhouette like liquid glass, flaring slightly at the bottom with glowing amber seams as if still hot.\n\nShe stands confidently in a strong, grounded pose — one leg forward, hip tilted, back slightly arched, one arm resting gently on thigh or waist, the other falling naturally. Her head is turned with a slow, regal angle, like she\'s being sculpted in real time.\n\nVariations of the dress may include high slits, open-back designs, or one-shoulder structures — always sleek, minimal, and radiant. Additional molten-gold accessories can appear: a single sculptural earring, cuff bracelet, or thin belt that appears fused into the look.\n\nHer skin is real, clean, and illuminated with warm golden lighting. Makeup is glossy but natural — lips bare, skin glowing. Her hair is slicked back or wet-styled, shaped like molten strands.\n\nShe stands confidently on a glossy black floor that reflects the light. The background is deep charcoal or black, lit from below or behind with subtle orange-gold rim lighting to enhance the molten effect.\n\nA realistic {ANIMAL} stands beside her as a powerful companion.\n\nThe glow should look like it\'s coming from within the dress — not added. No fantasy sparks or smoke. Pure fashion energy. She doesn\'t pose — she radiates.'),
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion, fantasy sparks, smoke effects, oversaturated colors, bright backgrounds, cluttered design, multiple animals',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['molten_gloss', 'animal_companion', 'dynamic_animals', 'high_fashion', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

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
  },

  // 🌫️ Chromatic Smoke
  {
    id: 'unreal_reflection_chromatic_smoke',
    label: 'Chromatic Smoke',
    prompt: generateChromaticSmokePrompt('Transform this woman into a seductive, high-fashion portrait sculpted from rising black and {SMOKE_COLOR} smoke. She stands confidently, with a strong pose — one hand on hip or lifted, body slightly turned to emphasize her silhouette and power.\n\nHer "outfit" is made entirely from rich, dense smoke, rising from the ground: voluminous around the legs, then sculpted tight around the waist, wrapping the chest in elegant, directional formations. Think asymmetrical couture — strapless, off-shoulder, or halter shapes formed by smoke curves, not fabric.\n\nThis smoke must not float randomly — it should cling, wrap, and shape her body like a real fashion piece. Thicker and heaviest at the floor, with extra spirals at the base and hips — as if she emerged from the smoke itself. Tendrils can climb her back or swirl around the shoulders to suggest upward energy.\n\nHer skin is real and visible in the openings: smooth, untouched, no surreal effects. Her face has natural makeup only — flawless skin texture, no visible lipstick or gloss. Eyes calm and strong. Hair is clean and styled simply: bun, slicked back, or tucked.\n\nThe background is pure matte black. Lighting comes in at a diagonal angle, softly highlighting her face and accentuating the contours of the smoke. Optional: subtle fog on the floor or faint reflections under her feet — but no glows, no glitter, and absolutely no colored light.\n\nThe smoke must cover her completely from bottom to top, sculpting her form with fashion precision — yet suggesting something primal, commanding, and iconic. She\'s not fading into smoke — she owns the smoke.'),
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion, colorful light, glowing effects, glitter, surreal skin effects, visible lipstick, messy hair, bright backgrounds, studio lighting, chrome shine, fantasy filters, plastic effects',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['chromatic_smoke', 'smoke_fashion', 'dynamic_colors', 'high_fashion', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 💎 Crystal Fall
  {
    id: 'unreal_reflection_crystal_fall',
    label: 'Crystal Fall',
    prompt: generateCrystalFallPrompt('Transform this woman into a high-fashion goddess emerging from a rain of glowing crystal shards. She stands confidently, surrounded by mid-air fragments of broken glass or precious gemstones — captured mid-motion as if time froze during an explosion of elegance.\n\nHer outfit is formed from angular, translucent crystal shards: clustered tightly around the chest, waist, and hips to form a sculptural dress. These shards reflect light like cut diamonds — some smooth, some jagged — all positioned precisely to mimic a fashion-forward silhouette. The overall shape suggests an asymmetrical mini dress or a long structured gown, depending on how the crystal falls.\n\nHer pose is powerful and elevated — one leg slightly forward, hands relaxed or raised gracefully. Shards swirl around her arms and legs, but her skin remains visible through key openings — suggesting strength beneath the armor.\n\nHer face is calm, piercing, and elegant. Makeup is clean and sharp: luminous skin, defined cheekbones, a soft matte lip. Hair is pulled back or sleek — nothing distracts from the impact.\n\nThe lighting is dramatic: strong white beam from above, casting harsh shadows and brilliant highlights on the crystals. Tiny reflections scatter like glitter, but the effect remains grounded in realism — no magical glows or sci-fi effects.\n\nBackground: choose either a minimalist black void or a dark stormy scene with cracks on the floor or distant lightning. Optional: reflective puddle beneath her, echoing the sharpness of the crystals above.\n\nThe crystals must feel heavy and real, as if caught in an eternal downward motion — some frozen mid-fall, some shattering on the ground. No floating like magic — this is weighty, dangerous beauty turned to fashion.\n\nColor palette: {CRYSTAL_COLOR}.'),
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion, magical glows, sci-fi effects, floating crystals, bright backgrounds, oversaturated colors, fantasy filters, plastic effects',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['crystal_fall', 'crystal_fashion', 'dynamic_colors', 'high_fashion', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🦋 Butterfly Monarch
  {
    id: 'unreal_reflection_butterfly_monarch',
    label: 'Butterfly Monarch',
    prompt: generateButterflyMonarchPrompt('Transform this woman into a seductive, high-fashion portrait sculpted from hundreds of fluttering {PRIMARY_COLOR} butterflies. She stands confidently in a strong, elegant pose — one hand on her hip or gently lifted, her body turned to emphasize her silhouette with controlled grace.\n\nHer "outfit" forms a mini dress made entirely from dense clusters of {SECONDARY_COLOR} butterflies. The butterflies create a structured fashion piece: thickest at the lower body like a blooming skirt, tapering snugly around the waist and forming elegant halter necks, off-shoulder wraps, or strapless tops — all shaped naturally by the layered wings.\n\nEach butterfly is crisp, photorealistic, and immaculately placed. Their wings may bend slightly to hint at movement, but the overall form is frozen in time — a still sculpture of nature reimagined as couture.\n\nHer skin remains exposed in key areas — shoulders, collarbone, arms, upper chest, and legs — smooth and untouched by effects. Makeup is soft and sensual: luminous skin, subtle highlight, bare or glossy lips. Hair is sleek and pulled back: ponytail, low bun, or tucked behind the ear.\n\nThe background is matte black or a {BACKGROUND_GRADIENT}. Butterflies reflect a faint glow from ambient lighting, with shadows enhancing the structure of the dress — especially at the hips, waist, and neckline.\n\nOptional: A few butterflies can float slightly off the body near the shoulders or trailing the skirt, but no chaotic swarms — everything remains precise, elegant, and fashion-focused.'),
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion, chaotic swarms, messy composition, oversaturated colors, fantasy filters, plastic effects, bright backgrounds, cluttered design',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['butterfly_monarch', 'butterfly_fashion', 'dynamic_colors', 'high_fashion', 'identity_preserved'],
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