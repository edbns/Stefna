// src/presets/emotionmask.ts
export type EmotionMaskPreset = {
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

export const EMOTION_MASK_PRESETS: EmotionMaskPreset[] = [
  {
    id: 'emotion_mask_nostalgia_distance',
    label: 'Nostalgia + Distance',
    prompt: 'Portrait reflecting longing and emotional distance. Subject gazing away as if lost in memory, with a soft, contemplative expression. Retain the subject\'s gender expression, ethnicity, facial structure, and skin texture exactly as in the original image. Emotion should be conveyed through facial micro-expressions, especially the eyes and mouth. Scene should feel grounded in real-world lighting and atmosphere, not stylized or fantasy.',
    negative_prompt: 'chaotic, blurry subject, busy background, stylized, fantasy lighting, exaggerated features',
    strength: 0.35,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'emotion_mask',
    guidance_scale: 8,
    num_inference_steps: 30,
    features: ['emotional_reaction', 'nostalgia', 'distance', 'contemplative', 'identity_preserved'],
    // BFL-specific parameters
    raw: true,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.35,
    aspect_ratio: '4:5'
  },
  {
    id: 'emotion_mask_joy_sadness',
    label: 'Joy + Sadness',
    prompt: 'Portrait capturing bittersweet emotions, smiling through tears, hopeful eyes with a melancholic undertone. Retain the subject\'s gender expression, ethnicity, facial structure, and skin texture exactly as in the original image. Emotion should be conveyed through facial micro-expressions, especially the eyes and mouth. Scene should feel grounded in real-world lighting and atmosphere, not stylized or fantasy.',
    negative_prompt: 'flat emotion, robotic expression, blurry, extra limbs, stylized, fantasy lighting, exaggerated features',
    strength: 0.35,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'emotion_mask',
    guidance_scale: 8,
    num_inference_steps: 30,
    features: ['emotional_reaction', 'joy', 'sadness', 'bittersweet', 'hopeful', 'identity_preserved'],
    // BFL-specific parameters
    raw: true,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.35,
    aspect_ratio: '4:5'
  },
  {
    id: 'emotion_mask_conf_loneliness',
    label: 'Confidence + Loneliness',
    prompt: 'Powerful pose with solitary atmosphere. Strong gaze, isolated composition, contrast between inner resilience and quiet sadness. Retain the subject\'s gender expression, ethnicity, facial structure, and skin texture exactly as in the original image. Emotion should be conveyed through facial micro-expressions, especially the eyes and mouth. Scene should feel grounded in real-world lighting and atmosphere, not stylized or fantasy.',
    negative_prompt: 'crowded scene, blurry face, expressionless, stylized, fantasy lighting, exaggerated features',
    strength: 0.35,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'emotion_mask',
    guidance_scale: 8,
    num_inference_steps: 30,
    features: ['emotional_reaction', 'confidence', 'loneliness', 'strong_gaze', 'resilient', 'identity_preserved'],
    // BFL-specific parameters
    raw: true,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.35,
    aspect_ratio: '4:5'
  },
  {
    id: 'emotion_mask_peace_fear',
    label: 'Peace + Fear',
    prompt: 'Emotive portrait with calm expression under tense atmosphere. Soft smile with flickers of anxiety in the eyes, dual-toned lighting (cool and warm). Retain the subject\'s gender expression, ethnicity, facial structure, and skin texture exactly as in the original image. Emotion should be conveyed through facial micro-expressions, especially the eyes and mouth. Scene should feel grounded in real-world lighting and atmosphere, not stylized or fantasy.',
    negative_prompt: 'expressionless, poorly lit, chaotic background, stylized, fantasy lighting, exaggerated features',
    strength: 0.35,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'emotion_mask',
    guidance_scale: 8,
    num_inference_steps: 30,
    features: ['emotional_reaction', 'peace', 'fear', 'dual_lighting', 'tension', 'identity_preserved'],
    // BFL-specific parameters
    raw: true,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.35,
    aspect_ratio: '4:5'
  },
  {
    id: 'emotion_mask_strength_vuln',
    label: 'Strength + Vulnerability',
    prompt: 'A cinematic portrait showing inner strength with a subtle vulnerability. Intense eyes, guarded posture, but soft facial micro-expressions. Retain the subject\'s gender expression, ethnicity, facial structure, and skin texture exactly as in the original image. Emotion should be conveyed through facial micro-expressions, especially the eyes and mouth. Scene should feel grounded in real-world lighting and atmosphere, not stylized or fantasy.',
    negative_prompt: 'cartoonish, distorted anatomy, flat lighting, stylized, fantasy lighting, exaggerated features',
    strength: 0.35,
    model: 'bfl/flux-pro-1.1-ultra',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'emotion_mask',
    guidance_scale: 8,
    num_inference_steps: 30,
    features: ['emotional_reaction', 'strength', 'vulnerability', 'cinematic', 'intense', 'identity_preserved'],
    // BFL-specific parameters
    raw: true,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.35,
    aspect_ratio: '4:5'
  }
];

export function getEmotionMaskPreset(presetId: string): EmotionMaskPreset | undefined {
  return EMOTION_MASK_PRESETS.find(p => p.id === presetId)
}

export function isEmotionMaskPreset(presetId: string): boolean {
  return EMOTION_MASK_PRESETS.some(p => p.id === presetId)
}
