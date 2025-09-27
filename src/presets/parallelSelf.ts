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
- Neon Proof: Nighttime streetwear with neon accents and low-angle cinematography
- The Mechanic: Raw street mechanics with designer workwear and cinematic garage scenes
- Nightshade: Futuristic silhouette in glowing white minimalism
- Getaway Lookbook: Cinematic fashion fugitives in nighttime getaway aftermath

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
  // 🌅 Neon Proof
  {
    id: 'parallel_self_neon_proof',
    label: 'Neon Proof',
    prompt: 'Transform this person, couple, or group of people in the photo into fashion-forward streetwear icons styled in bold black and neon, captured at night in a cinematic low-angle editorial photo.\n\n🎨 Accent Color Rules\nEach image must use only one dominant neon accent color with a rotating color:\n* Neon Pink\n* Neon Purple\n* Neon Yellow\n* Neon White 🛑 Never mix colors. Stick to one per image — visible in clothing, lighting, and background signage.\n\n👩‍🎤 Female Styling\nShe wears bold pieces from brands like Off-White, Acne Studios, Rick Owens, and Ambush:\n* Cropped bomber or oversized windbreaker with neon-accent lining\n* Wide-leg cargo pants or long matte coat with glow-trimmed pockets\n* Ribbed tank, asymmetric wrap top, or black blazer worn with nothing under\n* Footwear: chunky sneakers — Nike Dunks, adidas Ozweego, or Balenciaga Runners\n* Accessories: chunky silver chains and  sharp earrings\n* Hair: high ponytail, wet-look back slick, or a single tucked braid\n\n👨‍💼 Male Styling\nWears grounded, structured streetwear using brands like Acronym, A-COLD-WALL*, or Kiko Asics:\n* Techwear jacket over fitted neon tee\n* Corduroy trousers or tactical joggers with neon trim\n* Footwear: Salomon XT-6 or Asics Kiko collab in matching accent color\n* Clean styling: short necklace or visible ink, no flashy accessories\n\n👥 Couples & Groups\nEach person has their own distinct full outfit — no matching. Styling is coordinated through layering and accent color only.\n* One may hold a mini designer tote (Telfar, Diesel, Jacquemus)\n* Others pose casually: hands in pockets, jacket slung over shoulder, leaning\n\n🎥 Camera Angle\nDramatic low-angle shot from ground level, looking upward — the entire body is visible from sneakers to head, with shoes and lower garments dominating the foreground.\n\n🏙️ Scene & Background (Nighttime Only)\nUrban location, no historical buildings. Must include:\n* Neon-lit concrete walls, dark alleys, or metro station entrances\n* Pink/purple/yellow/white neon reflections based on accent color\n* Graffiti details, mist rising from sewer grates\n* smoke catching light across shoes and pants\n* One matte black streetlamp or wall light for scene anchoring\n\n💬 Neon Sign Clue (in same accent color)\nBehind the subject, include one neon sign with a rotating phrase:\n* "NO RULES"\n* "DRESS CODE: CHAOS"\n* "WALK IT OFF"\n* "LOW ANGLE ONLY"\n* "NOT A MODEL"\n* "WEARING POWER"\nSigns appear on the wall or background glass, never blocking the subject.\n\n🔒 Key Technical Rules (Nano Banana)\n* Only one outfit per person\n* Only one pose per subject — no blending or collage\n* No surrealism or fantasy elements\n* Strict facial identity lock\n* Must be nighttime scene\n* Neon accents + smoke must look photoreal, editorial, and cinematic',
    negative_prompt: 'daylight, historical buildings, matching outfits, fantasy elements, surrealism, bright lighting, cluttered composition, harsh shadows, gaudy accessories',
    strength: 0.59,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'parallel_self',
    guidance_scale: 7.3,
    num_inference_steps: 30,
    features: ['neon_proof', 'streetwear_fashion', 'low_angle', 'nighttime', 'neon_accent', 'identity_preserved'],
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    raw: true,
    image_prompt_strength: 0.59,
    aspect_ratio: '4:5'
  },
  // 🔧 The Mechanic
  {
    id: 'parallel_self_the_mechanic',
    label: 'The Mechanic',
    prompt: 'Transform this person, couple, or group of people in the photo into raw, stylish street mechanics caught mid-repair — photorealistic, greasy, and fashion-forward. Shot at night with an open car hood, oil stains, cinematic shadows, and elevated streetwear details.\n\n🧯 Female Styling\nShe wears a designer work jumpsuit — from brands like Y/Project, Dion Lee, Diesel, or Balenciaga — distressed, baggy, or half-zipped.\nBeneath: a sheer asymmetric bralette or cropped stretch top (e.g. Mugler, KNWLS).\nBottoms: torn Rick Owens cargos, oversized Diesel utility jeans, or faded jumpsuit half down and tied around the waist.\nFootwear: dirty but high-end — Maison Margiela Tabi boots, Balenciaga Bulldozer boots, or Off-White high-tops.\nHair is messy-chic: slicked back, low bun, or falling strands with sweat and oil streaks.\nShe leans against the open hood like it\'s her studio — presence calm, dominant, no posing.\n\n🔧 Male Styling\nHe wears a dark jumpsuit or vest from A-COLD-WALL, Martine Rose, or Alyx* — structured, zipped or open over bare chest.\nPants: tactical trousers by Acronym or Givenchy, maybe with dirt-worn logo taping.\nFootwear: Rick Owens sneakers, Kiko Asics, or Diesel boots — stained but recognizable in design.\nGrease smudges on neck, jawline, or wrists. Visible tattoo, chain, or cuff peeking out.\nOne hand on the hood, another holding a wrench — caught in work, not a fashion pose.\n\n👥 Couples & Groups\nEach subject has their own outfit — Each subject wears ONE outfit, based on their gender\nNo mixing of styles — men wear male looks, women wear female looks\nFashion coordination comes from tone, not exact styling.\nThey move in the scene:\n– one crouched by the wheel,\n– one under the hood,\n– one standing with a foot on the jack.\nBaggy silhouettes, dropped layers, and tucked sleeves give a relaxed, gritty elegance.\nAt least one designer detail per person must show — a tag, signature silhouette, or shoe logo (worn naturally).\n\n🚗 Car & Scene\nOpen-hood vehicle takes center — smoke and tools spilling from inside.\nCar: matte black BMW E30, Mustang, or Japanese import — street-tuned and worn.\nScene: cracked pavement, rusty metal gates, smeared workshop walls, oil spills on concrete.\nScattered tools, used gloves, and a ripped racing sticker or old fashion mag page taped on the wall.\n\n🎥 Camera Angle\nLow, wide, cinematic — shot from the sidewalk or garage floor, looking upward.\nForeground: designer shoes and dirty hems.\nMidground: torsos, tools, movement.\nBackground: open hood, grit, rising smoke.\n\n💡 Lighting & Mood\nNo neon.\nLight source: overhead garage bulb, side lamp, or car headlights.\nShadows cast deep and long — silhouettes sharp, grease shines on cheekbones and knuckles.\nMist and smoke subtly catch the light — never exaggerated.\n\n🔧 Tech Notes for Nano Banana\nNo surrealism, no fantasy.\nOutfits must include at least one designer element — boots, pants, jacket, etc.\nOne subject = one outfit. No mixing.\nFacial identity and anatomy must match input.\nCar must be open. Scene must feel raw, real, and cinematic.',
    negative_prompt: 'clean clothes, fantasy elements, surrealism, bright lighting, matching outfits, formal wear, red carpet, gaudy lighting, wide framing, happy expression, crowd',
    strength: 0.58,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'parallel_self',
    guidance_scale: 7.2,
    num_inference_steps: 30,
    features: ['the_mechanic', 'street_mechanics', 'fashion_forward', 'greasy_elegance', 'identity_preserved'],
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
  // 🚗 Getaway Lookbook
  {
    id: 'parallel_self_getaway_lookbook',
    label: 'Getaway Lookbook',
    prompt: 'Transform this person, couple, or group of people in the photo into cinematic fashion fugitives caught in the tense aftermath of a nighttime getaway.\n\n👠 Female Styling\nShe appears in one of:\n* A black leather trench coat over a short mesh dress or bodysuit, paired with Balenciaga Knife boots\n* A cropped bomber and leather mini skirt, with thigh holster strap and pointed heels\n* A fitted zip-front jacket with a sculpted silhouette, dark shades, and slicked-back hair in a low bun\nAccessories: gloves, sunglasses at night, clutch or phone casually held Expression: alert but composed\n\n🖤 Male Styling\nHe appears in one of:\n* A matte black bomber with hidden zippers, black cargos, and Rick Owens boots\n* A black turtleneck + trench coat combo with a duffel bag slung over one shoulder\n* A tactical zip-up jacket, dark jeans, dirty gloves in hand, standing near an open trunk\nFootwear: Always grounded and masculine — Rick Owens boots, combat-style Prada Monoliths, or black Salomon XT-6s Accessories: clean chain, black wristwatch, or subtle tattoos Vibe: silent operator — strong presence, no noise\n\n👫 Couples\nEach partner keeps their distinct styling based on gender:\n* No outfit swapping\n* One may be leaning on the car or the motorbike while the other looks over shoulder\n* Natural interaction encouraged (walking past each other, one holding the keys, etc.)\n\n👥 Groups\n* Each subject wears ONE outfit, based on their gender\n* No mixing of styles — men wear male looks, women wear female looks\n* At least one person leans casually against the vehicle — hand on hood or bike.\n* Others may be walking, standing confidently but all looking forward\n\n🎬 Scene\n* Matte black getaway car and motorbike behind them\n* Trunk ajar, faint red tail light glow, light smoke or mist\n* Urban tunnel or alley setting, graffiti and flickering red/white lights\n\n🎥 Camera Angle\n* Low, wide-angle shot from the sidewalk — looking slightly upward\n* Shoes and vehicle dominate the foreground\n* Full-body styling visible, no crops or blending\n\n💡 Lighting\n* Spotlight from above or behind car\n* Red/white reflections on leather, metal, and glass\n* Street shadows, graffiti, mist, and ambient bounce light\n\n⚙️ Technical Rules (for Nano Banana)\n* No surrealism\n* Identity lock ON — faces, body, and features must match input\n* One full outfit per person — no mix-and-match\n* Gender-specific fashion clarity for solo, couples, and groups\n* One leaning subject in groups or couple\n* Cinematic framing — think Vogue x John Wick',
    negative_prompt: 'daylight, happy expression, crowd, gaudy lighting, wide framing, matching outfits, formal wear, bright colors, fantasy elements, surrealism',
    strength: 0.57,
    model: 'fal-ai/nano-banana/edit',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'parallel_self',
    guidance_scale: 7.1,
    num_inference_steps: 30,
    features: ['getaway_lookbook', 'fashion_fugitives', 'nighttime_getaway', 'cinematic_aftermath', 'identity_preserved'],
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
