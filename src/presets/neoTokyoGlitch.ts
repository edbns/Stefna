// src/presets/neoTokyoGlitch.ts
export type NeoTokyoGlitchPreset = {
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
  features?: string[]
  guidance_scale?: number
  num_inference_steps?: number
  // BFL-specific parameters
  prompt_upsampling?: boolean
  safety_tolerance?: number
  output_format?: string
  raw?: boolean
  image_prompt_strength?: number
  aspect_ratio?: string
}

export const NEO_TOKYO_GLITCH_PRESETS: NeoTokyoGlitchPreset[] = [
  {
    id: 'neo_tokyo_base',
    label: 'Cyber Siren™',
    prompt: `Photorealistic portrait of a stylish person mid-movement in a cinematic city scene. Face and body must match the original input with full identity preserved — same gender, facial structure, and skin tone. They are wearing high-end futuristic streetwear: layered black techwear pieces, cropped jackets, sleek accessories, minimal but bold styling. Background is urban and dynamic — neon signs, alley walls, wet pavement, or glowing city light. Lighting is dramatic and moody: golden hour haze or neon reflections. Hair is windblown, natural, unstyled. Expression is confident and unposed — as if caught mid-walk, glancing sideways, or adjusting their jacket. No unrealistic features, no gender change, no cartoon or anime look. This is a real person, transformed into a cinematic streetwear icon.`,
    negative_prompt: `anime, cartoon, illustration, 3D render, feminine face, long hair, makeup, lipstick, eyelashes, soft skin, exaggerated beauty, gender swap, gender change, unrealistic body, fake eyes, doll-like, bimbo, barbie, blurred details, over-stylized, low resolution, distorted hands, bad anatomy, incorrect face`,
    strength: 0.55,
    model: 'stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['identity_preserved', 'streetwear_fashion', 'urban_background', 'cinematic_lighting'],
    guidance_scale: 6.5,
    num_inference_steps: 40
  },
  {
    id: 'silver_proxy',
    label: 'Silver Proxy',
    prompt: `Photorealistic portrait of a stylish person caught in motion on a city rooftop. Identity is fully preserved — same face, skin tone, and features as the input. They wear futuristic silver-toned streetwear with holographic accents: metallic windbreaker, reflective tech pants, chrome sunglasses, and layered details. Hair is tousled by the wind, unstyled. The scene is lit with cinematic lighting — moonlight glow and scattered neon from surrounding buildings. Pose is candid: mid-stride, adjusting hair, or looking into the distance. Realistic anatomy, no gender drift, no stylized exaggeration.`,
    negative_prompt: `anime, cartoon, illustration, 3D render, feminine face, long hair, makeup, lipstick, eyelashes, soft skin, exaggerated beauty, gender swap, gender change, unrealistic body, fake eyes, doll-like, bimbo, barbie, blurred details, over-stylized, low resolution, distorted hands, bad anatomy, incorrect face`,
    strength: 0.55,
    model: 'stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['identity_preserved', 'silver_fashion', 'rooftop_background', 'holographic_accents'],
    guidance_scale: 6.5,
    num_inference_steps: 40
  },
  {
    id: 'serpent_line',
    label: 'Serpent Line',
    prompt: `Cinematic urban portrait of a stylish person mid-motion through a city night scene. Identity preserved — same facial structure and skin tone. Outfit blends cyberpunk with fashion animal influence: black leather jacket with snakeskin textures, gold accessory accents, techwear pants and bold silhouette. Hair is loose or wind-touched. Background shows moody Bangkok alley with hanging lanterns, puddles, and dim golden light. Expression is fierce and direct — like a digital-era serpent queen. High detail, photoreal, grounded in reality.`,
    negative_prompt: `anime, cartoon, illustration, 3D render, feminine face, long hair, makeup, lipstick, eyelashes, soft skin, exaggerated beauty, gender swap, gender change, unrealistic body, fake eyes, doll-like, bimbo, barbie, blurred details, over-stylized, low resolution, distorted hands, bad anatomy, incorrect face`,
    strength: 0.55,
    model: 'stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['identity_preserved', 'snakeskin_textures', 'gold_accents', 'bangkok_background'],
    guidance_scale: 6.5,
    num_inference_steps: 40
  },
  {
    id: 'smoke_signal',
    label: 'Smoke Signal',
    prompt: `Identity-locked photo of a person walking through a cinematic haze. Face, body, and features exactly match the input. Their fashion is layered grayscale: sheer fabrics, long flowing pieces, structured collars, futuristic streetwear blending soft and sharp. Thin mist or smoke swirls in the scene. The background: urban alley or tunnel lit by white neon or ambient city lights. Pose is side-glance, coat flowing, or stepping into shadow. Realistic human anatomy, photoreal texture, no surrealism.`,
    negative_prompt: `anime, cartoon, illustration, 3D render, feminine face, long hair, makeup, lipstick, eyelashes, soft skin, exaggerated beauty, gender swap, gender change, unrealistic body, fake eyes, doll-like, bimbo, barbie, blurred details, over-stylized, low resolution, distorted hands, bad anatomy, incorrect face`,
    strength: 0.55,
    model: 'stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['identity_preserved', 'grayscale_fashion', 'smoke_effects', 'urban_tunnel'],
    guidance_scale: 6.5,
    num_inference_steps: 40
  },
  {
    id: 'signal_loss',
    label: 'Signal Loss',
    prompt: `Realistic urban street portrait of a person mid-movement in front of a graffiti-covered wall. Identity fully preserved. Their outfit uses glitch-inspired prints: TV static, pixel blocks, or broken signal motifs — printed only on clothes, not face or body. Streetwear styling includes oversized jacket, shorts or ripped pants, heavy boots. Light source is flickering signs and electric haze. Pose feels dynamic and off-guard. Hair is messy, urban. The look blends chaos and control — fashionable but grounded.`,
    negative_prompt: `anime, cartoon, illustration, 3D render, feminine face, long hair, makeup, lipstick, eyelashes, soft skin, exaggerated beauty, gender swap, gender change, unrealistic body, fake eyes, doll-like, bimbo, barbie, blurred details, over-stylized, low resolution, distorted hands, bad anatomy, incorrect face`,
    strength: 0.55,
    model: 'stability-ai/stable-diffusion-img2img',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['identity_preserved', 'glitch_prints', 'graffiti_background', 'urban_chaos'],
    guidance_scale: 6.5,
    num_inference_steps: 40
  }
]

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId)
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId)
}
