// src/presets/unrealReflection.ts

import { generateChromaticSmokePrompt } from '../utils/chromaticSmokeRandomization';
import { generateCrystalFallPrompt } from '../utils/crystalFallRandomization';
import { generateButterflyMonarchPrompt } from '../utils/butterflyMonarchRandomization';
import { generateMoltenGlossPrompt } from '../utils/moltenGlossRandomization';
import { generatePaperPopPrompt } from '../utils/paperPopRandomization';
import { generateReflectionPactPrompt } from '../utils/reflectionPactRandomization';
import { generateAirportFashionPrompt } from '../utils/airportFashionRandomization';

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
  // 🔥 Molten Halo (NEW)
  {
    id: 'unreal_reflection_molten_halo',
    label: 'Molten Halo',
    prompt: 'Transform this woman in the photo into a divine fashion icon walking through a scorched ceremonial ruin.\n\nShe is framed by a thin halo of fire — not glowing, but truly burning — suspended behind her head like a divine judgment ring. The flame flickers slowly, shedding embers that trail behind her as she walks. Her posture is upright, regal, unstoppable.\n\nBeneath her, a blackened marble path cracks with faint orange light, as if her footsteps awaken the coals beneath the earth. Her dress is matte black, sculpted with lava-line textures, tight through the torso and flowing behind her in a long, ember-dusted train. Embers scatter with each motion.\n\nThe ruins around her: half-melted stone statues, crumbling pillars scorched by time and flame. The air is heavy with heat shimmer. Her face is calm but untouchable, like a goddess who punishes without words.\n\n🎞 Scene:\n* Wide fire halo behind the head, slowly burning, not neon\n* Cracked black marble floor with glowing ember fissures\n* Melted statues, scorched pillars in background\n* Trail of embers following her steps\n* No other characters. Solo only.\n\n👗 Fashion Styling:\n* Matte-black corset gown with lava-vein textures\n* Long heavy train, ember-dusted\n* Sculptural silhouette, dramatic and form-fitted\n* Hair: sleek or updo, smoke-touched edges\n* Makeup: ember-red lips, fire-glow eyeshadow\n* No jewelry. Power comes from flame alone.\n\n💡 Lighting:\n* Backlit by soft orange flames and ambient glow from embers\n* Light flickers on floor and lower dress\n* Shadows are sharp, cinematic, and directional\n* Her face remains fully visible and untouched by grayscale',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, inappropriate content, group edits, multiple people, distorted faces, unrealistic proportions, casual clothing, modern elements, neon glow',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['molten_halo', 'fire_halo', 'ceremonial_ruin', 'ember_trail', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // ⚔️ Iron Bloom (NEW)
  {
    id: 'unreal_reflection_iron_bloom',
    label: 'Iron Bloom',
    prompt: 'Transform this woman in the photo into a divine fashion icon blooming from steel — a symbol of resilience shaped in fire and forged into grace.\n\nShe stands tall in the center of a war-torn field, surrounded by shattered soldier armor — broken chest plates, abandoned swords, fallen helmets half-buried in the cracked earth. These are not her enemies — they are the legacy she carries.\n\nHer sculpted metal corset is worn directly on her skin, forged to fit her form like second flesh — no fabric barrier, only steel and strength. It curves over her torso in overlapping petals, matte and burnished, like an armored rose refusing to wilt. Her skirt flows downward in heavy silk, laced with metal veining, trailing softly behind her.\n\nA war horse stands nearby, noble and silent, its armor scorched and hanging in fragments, echoing her resilience. Behind her, rusted iron vines rise from the rubble, their tips blooming into sharp metallic flowers. Red threads dance from her sleeves and waist — ritual markers of battles survived, bound with meaning, fluttering free in the wind.\n\nFog rolls in around her ankles and through the armor graveyard — softening the battlefield with silence. Her expression is unshaken. Like a myth reborn in armor.\n\n🎞 Scene:\n* Fog-covered battlefield, scattered soldier armor and weapons\n* Wind in skirt, hair, and red threads\n* War horse nearby, partially armored\n* Iron vines and sharp metal blooms behind her\n* Red silk threads trailing from her arms or waist\n* No shirt under armor — steel directly on skin\n* No other characters. Solo only.\n\n👗 Fashion Styling:\n* Steel corset with petal-like armor plates, worn directly on bare skin\n* Heavy matte silk skirt with metallic texture detailing\n* Red silk thread accents tied like ritual talismans\n* Hair: braided or pinned with metal pins\n* Makeup: burnished skin, metallic cheekbones, no glitter\n* No jewelry — strength is the only ornament\n\n💡 Lighting:\n* Overcast battlefield haze\n* Subtle glint on steel, soft diffusion through fog\n* Shadows sharp on armor but soft on fabric\n* Her face remains fully visible and warm-toned',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, inappropriate content, group edits, multiple people, distorted faces, unrealistic proportions, casual clothing, modern elements',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['iron_bloom', 'armor_fashion', 'battlefield_resilience', 'metallic_elegance', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🪞 Reflection Pact (NEW - Randomized)
  {
    id: 'unreal_reflection_reflection_pact',
    label: 'Reflection Pact',
    prompt: generateReflectionPactPrompt('Transform this woman in the photo into a cinematic black-and-white portrait standing alone in front of a tall cracked mirror.\n\nHer pose is grounded, simple — facing forward or slightly turned, her back partially shown. She wears a sharp, minimal outfit in matte black fabric: a backless dress, exposed shoulder, or structured top that reveals the spine. Her expression is neutral or intense — but never smiling.\n\nThe twist is in the mirror.\nIn the reflection behind her, a large wild animal {ANIMAL} is fully visible. It does not exist in the actual frame — only in the mirror. It looks directly at her back as if they share a silent bond. The animal must be cleanly centered in the reflection and photoreal:\n* For solo woman → one animal\n\nScene:\n* Indoor grayscale room, no modern furniture, stone or neutral background\n* Tall mirror behind or beside her, slightly cracked at the corner\n* Her back or side is shown, reflection clearly holds the animal\n* Lighting is directional: side or top-lit, shadow falls naturally\n* The reflection must be sharp, slightly brighter than real frame\n\nFashion:\n* Matte black open-back dress or top\n* Strong lines: halter, cross-strap, or deep-cut back\n* No jewelry, no heels, bare feet or floor-length gown\n* Hair: tied, sculpted, or short — clear view of neck/spine\n\nCritical Visual Logic:\n* The woman and the mirror must be in correct visual sync\n* No animal in the room, only in the reflection\n* Animal expression: calm, alert, watching her, not the viewer\n* No surreal effects — realistic, photoreal grayscale only'),
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, animal in real frame, surreal effects, fantasy costume, soft lighting, explicit nudity, aggressive animals, distorted reflections, color elements',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['reflection_pact', 'grayscale_fashion', 'mirror_twist', 'animal_bond', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16',
    isRandomized: true,
    basePrompt: 'Transform this woman in the photo into a cinematic black-and-white portrait standing alone in front of a tall cracked mirror.\n\nHer pose is grounded, simple — facing forward or slightly turned, her back partially shown. She wears a sharp, minimal outfit in matte black fabric: a backless dress, exposed shoulder, or structured top that reveals the spine. Her expression is neutral or intense — but never smiling.\n\nThe twist is in the mirror.\nIn the reflection behind her, a large wild animal {ANIMAL} is fully visible. It does not exist in the actual frame — only in the mirror. It looks directly at her back as if they share a silent bond. The animal must be cleanly centered in the reflection and photoreal:\n* For solo woman → one animal\n\nScene:\n* Indoor grayscale room, no modern furniture, stone or neutral background\n* Tall mirror behind or beside her, slightly cracked at the corner\n* Her back or side is shown, reflection clearly holds the animal\n* Lighting is directional: side or top-lit, shadow falls naturally\n* The reflection must be sharp, slightly brighter than real frame\n\nFashion:\n* Matte black open-back dress or top\n* Strong lines: halter, cross-strap, or deep-cut back\n* No jewelry, no heels, bare feet or floor-length gown\n* Hair: tied, sculpted, or short — clear view of neck/spine\n\nCritical Visual Logic:\n* The woman and the mirror must be in correct visual sync\n* No animal in the room, only in the reflection\n* Animal expression: calm, alert, watching her, not the viewer\n* No surreal effects — realistic, photoreal grayscale only'
  },

  // ✈️ Airport Fashion (NEW - Randomized)
  {
    id: 'unreal_reflection_airport_fashion',
    label: 'Airport Fashion',
    prompt: generateAirportFashionPrompt('Transform this exact woman in the uploaded photo into a South Korean celebrity caught by paparazzi outside Incheon Airport. She walks across the iconic crosswalk with the confidence of a trendsetter — calm expression, graceful posture, head slightly turned, hand near her face in a subtle celebrity pose. Fans linger behind barriers, but the focus is entirely on her.\n\nShe wears: {FASHION_INJECTION_HERE}\n\nScene: {SCENE_INJECTION_HERE}\n\nTime: {TIME_OF_DAY_INJECTION_HERE}\n\nThe image must be photorealistic, cinematic, and styled like a high-resolution paparazzi shot from fashion media. No surreal elements. No group edits. No fantasy. Just elegance, trend, and individuality — the perfect solo shot.'),
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, surreal elements, fantasy costume, group edits, multiple people, distorted faces, unrealistic proportions',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['airport_fashion', 'korean_celebrity', 'paparazzi_style', 'trendsetter', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16',
    isRandomized: true,
    basePrompt: 'Transform this exact woman in the uploaded photo into a South Korean celebrity caught by paparazzi outside Incheon Airport. She walks across the iconic crosswalk with the confidence of a trendsetter — calm expression, graceful posture, head slightly turned, hand near her face in a subtle celebrity pose. Fans linger behind barriers, but the focus is entirely on her.\n\nShe wears: {FASHION_INJECTION_HERE}\n\nScene: {SCENE_INJECTION_HERE}\n\nTime: {TIME_OF_DAY_INJECTION_HERE}\n\nThe image must be photorealistic, cinematic, and styled like a high-resolution paparazzi shot from fashion media. No surreal elements. No group edits. No fantasy. Just elegance, trend, and individuality — the perfect solo shot.'
  },

  // 🐍 Venom Ceremony (NEW)
  {
    id: 'unreal_reflection_venom_ceremony',
    label: 'Venom Ceremony',
    prompt: 'Transform this exact woman into the High Priestess of the Venom Ceremony.\n\nShe wears a sculpted black latex bodice with raised serpent patterns and sharp shoulder angles. The lower half of the outfit is a structured obsidian chiffon skirt, glossy and rigid at the edges. Black gloves extend to her elbows with golden claw tips. Her hair is slicked into a tight bun with a central gold spike.\n\nA single black snake is wrapped around her neck, alive, its tongue flicking toward the camera. A gold ceremonial dagger rests against her thigh, strapped with velvet. Across her collarbone, elegant venom drop tattoos shimmer faintly.\n\nShe stands in a candlelit golden hall, surrounded by pillars shaped like coiled serpents. The floor beneath her is cracked onyx, glowing faintly with molten gold. Smoke curls slowly upward like ritual incense.\n\nLighting is theatrical: a spotlight from above, gold underglow catching the latex shine, and soft firelight flickering in the background.\n\nShe stands alone, powerful and silent, as if the ritual has already begun. Her presence is mythic — untouchable. The camera captures her from below, emphasizing her dominance. The atmosphere is heavy with venomous beauty.',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, violent imagery, inappropriate content, group edits, multiple people, distorted faces, unrealistic proportions',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['venom_ceremony', 'high_priestess', 'ritual_fashion', 'mythic_beauty', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🔴 Velvet Trap (NEW)
  {
    id: 'unreal_reflection_velvet_trap',
    label: 'Velvet Trap',
    prompt: 'Transform this exact woman into a vision of silent domination, captured in a cinematic fashion moment known only as the Velvet Trap.\n\nShe wears a deep crimson velvet gown with a structured corset bodice and exaggerated hips. The fabric is rich and heavy, draping around her like liquid blood. One thigh is revealed through a high slit, balanced by long opera gloves and a sharp choker necklace made of sculpted gold. Her neckline is open, exposed — commanding. Her makeup is sensual but cold: wine-colored lips, glossy skin, and sharp brows.\n\nAround her finger coils a delicate gold chain that disappears out of frame — a symbol of control. In her hand: a cracked champagne flute, casually held like a relic of a finished game.\n\nThe background is a marble corridor bathed in red light and soft smoke. Behind her, heavy velvet curtains are slightly open — as if someone just exited, or is about to.\n\nLighting is soft but deliberate: warm golden-red underglow from the floor and one side, casting thick shadows behind her. The smoke picks up the light, making the air feel slow and dangerous.\n\nHer pose is relaxed, sculptural, and precise — one leg forward, weight shifted, chin slightly raised. She doesn\'t pose for the camera; the camera obeys her.\n\nThe atmosphere is thick with elegance, tension, and quiet power. She is not the guest — she is the one who ends the party.',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, inappropriate content, group edits, multiple people, distorted faces, unrealistic proportions, casual clothing',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['velvet_trap', 'cinematic_fashion', 'silent_domination', 'red_light', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🕸️ Tethered Grace (NEW)
  {
    id: 'unreal_reflection_tethered_grace',
    label: 'Tethered Grace',
    prompt: 'Transform this exact woman in the photo into a grayscale cinematic vision of sculpted restraint and surreal elegance.\n\nShe stands in a vast, minimal space — foggy or softly lit — her presence held together by strands of thick, silk-like cords that wrap around her upper arms and wrists, stretching out into the void as if pulled by invisible forces. Her posture is balanced, her limbs graceful but grounded — she is not in motion, but tension vibrates through the frame.\n\nShe wears a custom monochrome dress made of tightly folded fabric around the torso — origami-like, almost armor — contrasted by long flowing silk on the bottom, barely brushing the floor. The skirt is weighted, clean-lined, and moves with the soft wind, but never exposes the legs.\n\nFrom the back or sides: delicate tethering ropes or abstract fabric strands connect her body to geometric anchors in the space — not bondage, but an abstract fashion construction. A surreal tension exists: like the strings of a marionette, but elegant, not sinister.\n\nHer face is softly lit from one side — clean makeup, no surreal effects, just luminous grayscale skin, alive and flawless.\n\nScene:\n* Neutral, foggy or minimal architectural space — high ceiling or open void\n* Thin silk or rope tethers connect her wrists or upper arms to the environment\n* She is standing firmly — either arms lifted slightly, or held by tension\n* Mood is serene but filled with controlled energy — no chaos\n* Very visible large spider webs stretch across the space — faintly illuminated by the backlight, their delicate threads catching the light like silver tension lines\n\nFashion Styling:\n* Fitted upper body with structured monochrome folds (origami / wrapped fabric)\n* Lower body in soft, floor-length matte silk — not sheer, not open\n* Cords/fabrics emerge from sleeves or shoulderline, tethering her gently\n* Bare arms or partial wraps — no gloves, no jewelry\n* Hair pulled into a twisted low knot or tied up tightly — no loose strands\n\nLighting:\n* One strong cinematic light from the side or above\n* Soft volumetric shadows from the tether strands\n* Grayscale-only color palette — no surreal tones\n* Skin must remain luminous and photoreal — face cannot be desaturated or greywashed\n\nImportant Notes:\n* No surrealism. No floating dress parts. No ropes on legs. No skin exposure below the knees.\n* Scene must look like a high fashion photoshoot with impossible fashion mechanics.\n* Ropes must not look painful or sexual — only fashion-tethered, symmetrical, elegant.',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, painful ropes, bondage elements, surrealism, fantasy costume, floating parts, exposed legs, unrealistic proportions, sexual content',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['tethered_grace', 'grayscale_fashion', 'abstract_tethers', 'high_fashion', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🌙 Moonfall Ritual (NEW)
  {
    id: 'unreal_reflection_moonfall_ritual',
    label: 'Moonfall Ritual',
    prompt: 'Transform this exact woman into a grayscale cinematic fashion icon walking through a burnt stone pathway at night, under a full moon.\n\nShe wears a custom ash‑grey structured top made from twisted layered fabric resembling ancient ritual wraps — sculpted around her upper body like armor made of fog. Her lower half is covered in a fitted, floor‑length skirt made of matte silk, soft and heavy, trailing behind her like smoke. The skirt moves with the wind, not open, not revealing — powerful, contained.\n\nEven within the grayscale cinematic mood, her face must remain luminous and full of life — with realistic human skin tone, clear highlights on the cheekbones, natural lips, and defined eyes. The lighting must enhance her face, never wash it out.\n\nBehind her: two thin trails of glowing embers, one on each side of her path — soft orange light winding along the ground like her presence is marking the earth. Above her: a massive full moon, glowing cold. Near her shoulders or slightly overhead: groups of owls in flight, wings mid‑flap, blurred slightly by motion, their eyes glowing faintly in the dark.\n\nHer gaze is forward. Her walk is slow. Her face is half‑lit by firelight, half by moonlight.\n\nScene:\n* Cracked stone path or sacred ruins under her feet\n* Twin fire trails line the left and right edges of the walkway — glowing coals, no flames\n* Moon is directly behind her or high above\n* Groups of owls mid‑flight, wings spread in cinematic symmetry\n* No surreal colors — grayscale scene with soft warm glow from embers only\n\nFashion:\n* Ash grey structured wrap top, sculpted like layered fabric or folded wings\n* Full-length fitted matte silk skirt, no slits, no exposure, heavy and elegant\n* Arms uncovered or partially wrapped — strong shoulder silhouette\n* Hair pulled back clean, no accessories\n* Feet grounded or hidden under the skirt\n\nAnimal Element:\n* Groups of owls randomly flying around her\n* Wings wide, glowing eyes visible\n* Photoreal — must feel cinematic, not mystical\n* Even within the grayscale cinematic mood, the owls must appear natural and photorealistic — with clearly visible wings, feathers, and eyes. They must look like real animals in motion, not stylized or surreal. Their movement should feel cinematic and grounded in reality.\n\nLighting:\n* Moonlight above and behind, cold and silvery\n* Low glow from fire trails, casting amber on lower half of skirt\n* Embers catch light on the ground — subtle movement blur on coals',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, surreal owl designs, fantasy costume, soft lighting, explicit nudity, aggressive animals, colorful lights, mystical effects',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['moonfall_ritual', 'grayscale_fashion', 'owl_flight', 'moonlit_path', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🐍 Obsidian Curve
  {
    id: 'unreal_reflection_obsidian_curve',
    label: 'Obsidian Curve',
    prompt: 'Transform this woman in the photo into a grayscale fashion icon seated with dominance and precision. She sits backwards on a four-legged wooden chair, legs slightly open, arms draped over the top rail. Her body leans forward just enough to catch the light across her collarbone. She wears a skin-hugging black bodysuit or silk corset, revealing her bare back and arms with sculptural clarity. Her face tilts upward — expression cold, brows low, eyes locked into the camera. At her feet, a large serpent coils around the base of the chair. Its scales shimmer faintly. It does not move. It watches.\n\nComposition:\n* Chair reversed, backrest facing front\n* Arms placed firmly on the chair\'s top edge\n* Legs visible, confident and grounded\n* Spine arched slightly forward\n* Head centered, chin slightly lowered, eyes piercing\n\nStyling:\n* Black bodysuit or sculpted silk corset — sharp neckline, bare shoulders and arms\n* No jewelry\n* Hair parted sharply and slicked back or tied into a tight knot\n* Makeup is clean and sharp — deep shadows, matte skin, strong lashes\n* Feet bare on textured floor\n\nAnimal:\n* Large, dominant, coiled and present\n* Visible scale detail, light reflecting across body\n* Head positioned just above chair leg or rising near subject\'s foot\n* Realistic — not fantasy, not aggressive, just powerful\n* Must remain in frame and integrated into pose\n\nScene & Lighting:\n* Minimal background: smooth dark wall or seamless gradient\n* Studio setting, no props\n* Lighting from the left — strong directional shadows across jaw, chest, arms\n* Grayscale only — no color tones\n* Shadows must fall naturally, sculpting the body and the serpent\n\nVibe:\nShe\'s not performing. She\'s commanding. This is the photo they take before the world changes.',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, horror elements, fantasy costume, soft lighting, explicit nudity, aggressive animals, surreal elements',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['obsidian_curve', 'grayscale_fashion', 'serpent_companion', 'backwards_chair', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🤫 Untamed Silence
  {
    id: 'unreal_reflection_untamed_silence',
    label: 'Untamed Silence',
    prompt: 'Transform this woman in the photo into a seductive fashion icon seated in still tension, her back turned toward the camera, captured in sharp black and white.\n\nShe sits on a four-legged wooden chair, spine curved slightly, body composed, wearing only minimal structured clothing — barely enough to cover, but not explicit. Her head turns toward the camera with a cold, sideways stare that arrests the viewer. She is not alone.\n\n🪑 Scene Composition:\n\nShe is seated in the center of the frame, back to camera\n\nOne leg bent up on the chair, the other grounded\n\nBody glows in grayscale — highlights and shadows sculpt her form\n\nIn the corner or beside her: a dangerous animal (but not a black panther)\n• Suggestions:\n\nwhite arctic fox with piercing eyes\n\ntiger laying near her heels\n\ncoiled python on the chair leg\n\nsnow leopard calmly watching the lens\n\n🖤 Fashion & Styling:\n\nMinimal outfit:\n• Thin strap open-back top\n• Or lace-trimmed bodysuit, open from behind\n• Or structured lingerie with back clasps, black or white\n\nTextures: satin, mesh, or bare skin with soft shimmer\n\nJewelry optional: ankle bracelet, thin chain on spine, or ear cuff\n\nNo shoes. Barefoot.\n\n💄 Hair & Makeup:\n\nHair tied up into loose bun or short tousled cut\n\nMakeup bold even in B&W:\n• Cat-eye liner\n• Sculpted cheekbones\n• Matte lips visible in side glance\n\nExpression: she sees you — but she won\'t move for you\n\n🐅 Animal Presence:\n\nAnimal must be real, detailed, calm — never cartoon or surreal\n\nPositioned naturally:\n• Fox curled near the chair leg\n• Tiger laid at her side\n• Snake partially hidden beneath the chair\n• Leopard watching from behind her shoulder\n\nEyes must be visible. Calm. Wild.\n\n⚙️ Stefna Instructions:\n\nGrayscale only — no color\n\nFixed chair model: 4 legs, vintage or industrial, matte texture\n\nSubject must face away, turned halfway back\n\nCrop: vertical 4:5 or cinematic horizontal\n\nAnimal must appear in frame, in focus, without dominating the scene\n\nKeep background minimal: matte wall, subtle grain, no distractions',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, black panther, horror elements, fantasy costume, soft lighting, explicit nudity, surreal animals',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['untamed_silence', 'grayscale_fashion', 'animal_companion', 'back_turned', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🦅 Falcon Ceremony
  {
    id: 'unreal_reflection_falcon_ceremony',
    label: 'Falcon Ceremony',
    prompt: 'Transform this exact woman into a cinematic high-fashion vision sculpted from layered falcon feathers — built for movement, for sky, and for silence. She walks across cracked dark ground under storm-filled clouds, falcons circling above, their wings echoing in the sky. Around her feet, animal skulls lie untouched, as if they\'ve been waiting centuries for her to pass.\n\nHer outfit is crafted entirely from layered falcon feathers — in tones of ash-grey, smoke, ivory, slate brown, and bone-black. The feathers are sleek and sharp, sculpted to the body like armor but light as air. The silhouette is long and tapered, with asymmetric cuts that follow the flow of wind: shoulder blades framed by longer, darker feathers, hips marked by layered fans that shift while walking, a high slit allows movement, revealing powerful leg with every step.\n\nThe neckline varies (single-shoulder, clean halter, sculpted V), but always follows the direction of natural feather layering — aerodynamic, never bulky. Some feathers lift subtly with motion — as if the outfit is alive with the wind. It is wild couture, not costume. Unwearable in real life. Perfect in edit. She is barefoot, her steps quiet against the cracked earth. No heels. No trace. Only presence.\n\nHair is sleek, tied, or pulled back — no hair in the face. Windswept but styled. Makeup: clean matte skin, sharp eyeliner echoing falcon eye shape, pale lips, high cheekbone contrast. No jewelry. No face paint. No symbols. Her face is uncovered, proud, real — like she was cast from wind.\n\nSkies above are deep gray, full of motion — cloud layers racing each other. Falcons fly high, wide, sharp — some blurred, some frozen, none near her face. Ground is dry, cracked, matte black or cold brown. Animal skulls (ram, deer, goat) lie scattered naturally — never staged, never decorative.\n\nWide cinematic lens, tracking her mid-walk. One foot forward, fabric or feathers slightly lifting. Lighting from the side: soft rim light across feathers. Shadow behind her, light on her face. Background fades to storm mist.\n\nThis is predator couture. Wind-forged style. She\'s not wearing the feathers. She became the wind that pulled them from the falcons.',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, horror elements, fantasy costume, soft lighting, glossy makeup, messy hair, spirituality symbols',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['falcon_ceremony', 'feather_couture', 'predator_fashion', 'cinematic_storm', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🏺 Ceramic Bodice (NEW)
  {
    id: 'unreal_reflection_ceramic_bodice',
    label: 'Ceramic Bodice',
    prompt: 'Transform this exact woman into a cinematic fashion icon walking through the aftermath of someone else\'s show — a runway of smoke, silence, and slow collapse. She moves with calm power through a space full of tension: cracked stone or marble floor, light smoke lifting behind her, no crowd, no distractions. Camera tracks from behind, below, or side angle — wide, slow, grounded in cinematic realism. Her face is strong. Her posture deliberate. The world blurs. She stays sharp.\n\nShe wears a sculpted bodice made from cracked white ceramic — glossy, jagged at the edges, molded to her torso like it was fired directly on her skin. Floating fragments lift slightly from her shoulders and ribs, held by invisible tension. Below, she wears a structured skirt built from layered matte ivory fabric, wrapped tightly at the waist and flaring out in broken architectural shapes — folded like shattered stone, never sheer. The lower half is sculptural, protective, and grounded — built to walk, not drift. The full look feels unearthed, not designed.\n\n💄 Styling:\n* Hair: slicked back, twisted, or wind-stretched — always intentional\n* Makeup: matte skin, sculpted cheekbones, smudged eye or sharp liner\n* No jewelry. No accessories. The fashion is the statement.\n\n🕯️ Scene Rules:\n* Smoke may rise or fall, but never cover her\n* Lighting is directional, natural, contrast-heavy\n* No floating objects, no magic, no particles\n* No animals, no FX, no surreal edits\n* Barefoot by default unless boots are declared\n\n🔥 Mood:\nShe didn\'t walk in to steal the scene. She walked in because the scene was already hers.',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, magic effects, particles, animals, fantasy costume, soft lighting, glossy makeup, messy hair',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['ceramic_bodice', 'architectural_fashion', 'aftermath_runway', 'cracked_ceramic', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🎭 Red Seat (NEW)
  {
    id: 'unreal_reflection_red_seat',
    label: 'Red Seat',
    prompt: 'Transform this woman, couple, or group of women in the photo into cinematic icons caught mid-performance on a stormy rooftop stage. Each subject is seated or standing among rows of velvet red theater chairs, placed in artistic formation. Rain drips from the edge of the rooftop, lightning flickers in the distance.\n\nFashion:\n* Wet velvet mini dresses in deep red, plum, or ash gray\n* Transparent black tights or glossy knee-high boots\n* Long gloves or sheer arm veils\n* Accessories: bold hoop earrings, stage mic held loosely, chunky rings\n\nHair:\n* Slicked back by rain or styled into dramatic wind-swept waves\n* Optional hair ribbon in matching velvet tone\n\nMakeup:\n* Dewy skin with glossy cheeks and lips\n* Waterproof eyeliner with faint smudge under the eye\n* Soft glitter on eyelids, visible in the flash\n\nExpression & Posing:\n* One performer leans forward in spotlight, eyes closed mid-note\n* Another stares into camera — lips parted, wet lashes blinking\n* Final one (if trio) throws head back as if in a moment of release\n* Natural variations in posture: one sitting, one standing, one collapsed on chair\n\nScene & Lighting:\n* Rooftop stage during a light storm\n* Velvet red chairs glistening from rain\n* Neon sign glowing faintly behind them (blurred)\n* Thunderclouds with cinematic overhead lighting (one key light from the right)\n* Floor puddles reflect moody lighting and blurred silhouettes\n* Thin rain streaks, not heavy downpour — just enough to glisten\n\nTechnical Guidance:\n* Maintain subject faces and clothing shape\n* Preserve solo/group structure and avoid adding extra characters\n* Consistent perspective and camera angle: mid/low\n* Keep red chairs and rooftop visible — no indoor scenes',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, indoor scenes, horror elements, fantasy costume, dry weather, heavy rain',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['red_seat', 'rooftop_performance', 'velvet_chairs', 'stormy_aesthetic', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🤠 Desert Vixens (NEW)
  {
    id: 'unreal_reflection_desert_vixens',
    label: 'Desert Vixens',
    prompt: 'Transform this woman, couple, or group of women into high-fashion cowgirls caught in a cinematic desert moment. Each subject wears sultry western-inspired fashion: cropped leather vests, open denim shirts tied at the waist, ultra-high slit skirts or distressed shorts with fringe. Some wear suede bustiers or barely-buttoned jackets, highlighting curves and bold cleavage with unapologetic power.\n\nCowboy hats are tipped low or flying off mid-motion. Accessories: leather gloves, silver conchos, wide belts, boots to the thigh, smoking lasso loops. Skin glows under the sun — kissed by dust and heat.\n\nHair: wind-blown waves, long braids, or loose with bandanas. Makeup is bold: smoky eyes, bronzed cheeks, glossy lips.\n\n📸 Poses:\n* Solo: hips tilted, thumbs in belt loops, hat shadowing eyes\n* Group: walking forward like a runway posse, arms draped over shoulders, some looking back over their shoulder, others facing forward with attitude\n* Squatting or leaning on a hay bale, legs wide, hat in hand\n* Standing in a line with parted legs, wind blowing duster coats or skirts\n\nBackground: cracked desert floor, distant mountains, broken fences, saloon signs, dusty road trails. Golden hour sun or high noon spotlight. Horse nearby optional.\n\nMood: Sexy, dangerous, unstoppable — like they just robbed the bank and posed for Vogue.',
    negative_prompt: 'cartoon, face paint, cosplay, bright neon colors, oversaturated, cluttered composition, urban setting, indoor scenes, horror elements, fantasy costume',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['desert_vixens', 'western_fashion', 'cowgirl_aesthetic', 'desert_scene', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🚨 Disco Prisoner (NEW)
  {
    id: 'unreal_reflection_disco_prisoner',
    label: 'Disco Prisoner',
    prompt: 'Transform this woman into scandalous fashion icon caught in the aftermath of a wild party arrest. She is photographed in mugshot format, but instead of shame — she radiate power, glamour, and nightclub glitter. The police wall becomes her runway.\n\n👗 Fashion Styling:\n* Sequined or glittered halter mini dress, torn slightly at one shoulder\n* Oversized fur coat slipping down the arms or off one side\n* Flashy accessories: • Thin metallic choker • Silver cuffs (like handcuffs but glam) • Tiny handbag held like a mugshot placard\n* Bare shoulders, one earring missing, chaos chic\n\n💋 Hair & Makeup:\n* Hair: • Big volume, backcombed like she just left the dance floor • Strands falling into the face or slick from sweat\n* Makeup: • Glitter under eyes or smudged shadow • Mascara running slightly down one side • Glossy lips parted, like she\'s saying something sarcastic\n\n🧱 Scene & Setting:\n* Police mugshot wall with height chart behind them (but stylized)\n* Harsh flash lighting, overexposed edges\n* White or light gray background with soft shadow behind head\n* Optional: • Police placard in hands with random 6 digits • Broken heel in hand or thrown to the side\n* Lighting must mimic real booking photos, but with fashion flare\n\n🎭 Poses & Expressions:\n* smirking or rolling eyes\n* Slight slouch, like she\'s over it\n* Looking away from camera or side-eyeing\n* Hair messy, chin up, absolute diva\n* Optional: hand on hip holding the placard, or biting lip\n\n⚠️ AI Instructions:\n* Respect the mugshot format: one front-facing or slight angle shot\n* Only 1 — no extra characters\n* Don\'t make it fantasy or costume — it\'s realistic Y2K arrest glamour\n* Hand/face detail must be sharp: avoid floaty textures\n* Hair should fall naturally, not anime-like',
    negative_prompt: 'cartoon, face paint, cosplay, bright colorful background, cluttered composition, multiple people, fantasy costume, anime hair, outdoor scenes, soft lighting',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['disco_prisoner', 'mugshot_aesthetic', 'party_arrest', 'glitter_glamour', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🪨 Shattered Stone
  {
    id: 'unreal_reflection_shattered_stone',
    label: 'Shattered Stone',
    prompt: 'Transform this exact woman into a sculptural high-fashion vision, emerging from cracked and fractured stone. She wears a structured mini dress crafted entirely from marble, granite, or obsidian plates, layered and cut to fit her form like brutalist couture. The stone plates vary in size: some angular and geometric, others smooth and organic — always resting cleanly on her body with visible seams, cracks, and broken edges. The dress is thickest at the hips and chest, tapering sharply at the waist and collarbones, forming strapless, halter, or asymmetric cuts.\n\nFragments of stone float mid-air near her shoulders or behind her — suspended in motion, like pieces just shattered off her body. Some cracks glow faintly, not with light, but with depth — a sense of something ancient finally splitting open.\n\nHer skin remains exposed in intentional places — neck, arms, legs — flawless and untouched, contrasting the texture of the dress. Her pose is tall and poised, with one arm bent or relaxed, legs firmly planted, and her eyes looking straight at the camera with calm defiance — like a woman who was once a statue, now stepping out to judge the world.\n\nHair is slicked back, braided, or wrapped in a crown — minimal and structured. Makeup is grayscale glam: sculpted contour, matte lips, sharp shadow lines — no gloss, no softness.\n\nThe background is a surreal broken landscape: scattered marble slabs, overcast skies, and columns cracked in half. Light filters through dust in the air, casting diagonal shadows across her body and fractured dress.\n\nLighting is moody and sculptural: low from one side, with hard edge light on the shoulders and cheekbones. Shadows emphasize the depth of each stone layer — like she\'s both architecture and rebellion.',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, horror elements, fantasy costume, soft lighting, glossy makeup, messy hair',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['shattered_stone', 'brutalist_couture', 'sculptural_fashion', 'marble_aesthetic', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🧵 Threadbare Halo (NEW)
  {
    id: 'unreal_reflection_threadbare_halo',
    label: 'Threadbare Halo',
    prompt: 'Transform this exact woman into a poetic, high-fashion figure wrapped in flowing layers of fraying threads and soft silk strands — as if her outfit is being unspooled mid-motion, caught between creation and collapse. Her dress is made from torn fabric ribbons, knotted yarn, and delicate fibers that drape across her body like sculptural sashes. Some parts cling tightly around the torso or hips, others unravel freely off her shoulders or sleeves — always artistic, always intentional.\n\nLoose threads drift in the air around her, some still attached to her outfit, others fully airborne — curling gently like smoke or ribbon. Their movement adds softness, but also tension: she\'s being unraveled, and she doesn\'t care.\n\nHer pose is open and grounded: shoulders back, arms at her sides or slightly lifted, and her gaze is downward or directly to camera — not passive, but reflective. Skin is visible in areas where fabric gaps: arms, collarbones, legs — smooth and untouched.\n\nHer hair is soft but styled: long and waved, tucked low into a bun, or partially braided — but always with a few loose strands. Makeup is faded elegance: light blush, blurred lips, slightly glossy skin, under-eye shadow or liner that hints at softness and emotion.\n\nThe background is a pale dusk or surreal indoor space, like a forgotten textile studio or misty cathedral wall — faded fabrics and threads may float behind her, forming a circular thread "halo" if seen from the right angle. Light leaks softly through a torn curtain or broken window, casting long shadows and warm glow across the threads.',
    negative_prompt: 'cartoon, face paint, cosplay, bright colors, oversaturated, cluttered composition, horror elements, fantasy costume, harsh lighting, heavy makeup',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['threadbare_halo', 'fraying_threads', 'poetic_fashion', 'unraveling_aesthetic', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // ❄️ Frozen Bloom (NEW)
  {
    id: 'unreal_reflection_frozen_bloom',
    label: 'Frozen Bloom',
    prompt: 'Transform this exact woman into a sculptural high-fashion portrait wearing an outfit made entirely of semi-transparent ice petals — blooming upward like frozen armor. Her dress is formed from delicate but sharp ice-like floral layers, stacked in a couture silhouette that wraps the body: strapless or one-shoulder, cinched at the waist, blooming outward at the hips and skirt. The ice petals glisten subtly, some with cracks or frost edging, others smooth like carved crystal.\n\nHer face must not appear frozen or emotionless. Skin is softly lit, expressive, and alive — cheeks may glow faintly from the cold, lips show natural tone or a hint of chilled gloss, but the eyes remain human, engaged, and subtly powerful. She may gaze directly into the camera or slightly past it, with a quiet inner presence — not distant or artificial.\n\nHair is clean and sculpted: low bun, sleek braid, or tucked behind the ears. No heavy frost buildup — perhaps just a few delicate ice sparkles near the hairline or on the crown.\n\nShe stands in a cold, cinematic world — a snowy field, frozen lake, or icy plateau behind her. Soft frost drifts around her, and light mist rises from the ground. Her skin contrasts beautifully with the icy dress — a human flame wrapped in cold bloom.\n\nLighting is sharp and cold-toned: edge lighting from behind or a soft icy glow from above. Shadows fall in cool grays and frosted blues, highlighting the texture of the petals and the grace of her pose.\n\nPose is elegant and grounded — arms softly down or one hand lifted, standing with poise. The mood is controlled, cinematic, and untouchable.',
    negative_prompt: 'cartoon, face paint, cosplay, bright warm colors, oversaturated, cluttered composition, horror elements, fantasy costume, frozen face, emotionless expression, heavy frost on face',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['frozen_bloom', 'ice_petals', 'winter_couture', 'cold_elegance', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

  // 🪶 Feather Feral (NEW)
  {
    id: 'unreal_reflection_feather_feral',
    label: 'Feather Feral',
    prompt: 'Transform this exact woman into a seductive, high-fashion portrait sculpted from hundreds of layered, charcoal black feathers. She stands confidently in a powerful pose, her body facing forward, head tilted subtly, eyes locked onto the camera with a calm, haunting intensity — as if she\'s inviting the storm.\n\nHer outfit forms a sculptural black mini dress made entirely from overlapping feather clusters. The feathers are layered like scales, sharp at the edges, blooming outward from the waist to form a textured silhouette. The neckline may vary — strapless, halter, or one-shoulder — but always follows the shape of natural feather flow. The dress cinches at the waist, flares softly at the hips, and exposes smooth skin at the arms, collarbones, and legs. It\'s wild, but elegant — a fashion sculpture, not a costume.\n\nAround her, black crows spiral and slash through the air, some blurred by motion, others frozen mid-flight with wings wide. Floating feathers drift downward or curl in the wind, caught in the chaos. A few stray feathers lift from her shoulders and hips, blending her body into the storm.\n\nThe background is vast and cinematic — a dark sky torn open with wind and clouds, muted silver light leaking through, creating contrast against her skin. She stands in a field of dead grass, shadows and wind circling her like a prophecy.\n\nLighting is dramatic and otherworldly: rim-lit from behind and below, accentuating feather textures, cheekbones, and collarbones. Skin glows softly, untouched by shadow. Her silhouette is unmistakable: tall, elegant, mythic.\n\nHer hair is sleek and controlled — either pulled back into a low bun, twisted braid, or slicked behind the ears. Makeup is fierce but clean: smoky eyeliner, pale matte lips, feathered brows. No jewelry. No distraction. Just her, the feathers, and the storm.\n\nThe mood: not horror. Not fantasy. Ritual high fashion. She is not prey. She is the omen.',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, bright colors, oversaturated, cluttered composition, horror elements, gore, fantasy costume, tribal, messy hair, jewelry',
    strength: 0.55,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'unreal_reflection',
    guidance_scale: 7.5,
    num_inference_steps: 30,
    features: ['feather_feral', 'crow_aesthetic', 'dark_fashion', 'cinematic_drama', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 6,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.55,
    aspect_ratio: '9:16'
  },

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
    prompt: 'Transform this woman or group of women in the photo into Y2K-era fashion icons caught mid-exit from a black SUV outside a downtown club.\n\nThey are styled in flash-lit scandal-glam — like paparazzi shots from a deleted gossip blog in 2004.\n\n👠 Fashion Styling:\n\nMini dress in satin, latex, or sequin — bold Y2K cuts\n• Halter, low back, or off-shoulder\n• Popular colors: olive green, champagne gold, black, hot pink\n\nDior, Fendi, or Balenciaga handbag dangling from wrist\n\nStrappy designer heels (barefoot if needed for chaos effect)\n\nOptional: fur-lined shrug, oversized vintage sunglasses\n\n💋 Makeup & Hair:\n\nHair:\n• Loose blowout or slick ponytail with flyaways from heat\n• Optional clip holding back messy front strands\n\nMakeup:\n• Glossy lips, overlined\n• Smoky shadow, tightlined lashes\n• Highlighted cheekbones with club sweat glow\n\n📸 Pose & Expression:\n\nOne foot on the pavement, squatting slightly in open car door\n\nLooking over shoulder at the camera or caught mid-motion\n\nOne hand blocking flash with oversized sunglasses or a purse\n\nExpression: caught off guard, smug, too famous to care\n\nIf duo: one still inside the car, one already walking out — both flawless\n\n🚘 Scene & Lighting:\n\nBlack SUV or town car with open door\n\nPaparazzi-style camera flash with blown highlights\n\nReflections in car door, pavement glistening slightly\n\nBackground: downtown lights, blurry crowd, club signage\n\nLighting is harsh, vintage — flash overexposure on purpose\n\n⚠️ AI Instructions:\n\nDo not add new people\n\nRespect original pose but modify angle and depth to enhance realism\n\nKeep hands and legs well-formed — no duplication\n\nBag or heel details must stay elegant, not cartoonish\n\nThis is strictly retro glam — not futuristic, not modern',
    negative_prompt: 'cartoon, face paint, cosplay, casual clothing, tribal headdress, carnival costume, distortion, futuristic elements, sci-fi, modern fashion',
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