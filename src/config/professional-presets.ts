// professional-presets.ts - Professional Preset Configuration
export type ProfessionalPresetKey =
  | 'cinematic'
  | 'vibrant'
  | 'minimalist'
  | 'vintage'
  | 'travel'
  | 'nature'
  | 'portrait'
  | 'urban'
  | 'black_white'
  | 'soft'
  | 'warm'
  | 'editorial'
  | 'clarity'
  | 'cool'
  | 'moody';

export interface ProfessionalPresetConfig {
  id: ProfessionalPresetKey;
  label: string;
  category: string;
  promptAdd: string;
  strength: number;
  model: string;
  features: string[];
  description: string;
  // BFL-specific parameters
  prompt_upsampling?: boolean;
  safety_tolerance?: number;
  output_format?: string;
  raw?: boolean;
  image_prompt_strength?: number;
  aspect_ratio?: string;
}

export const PROFESSIONAL_PRESETS: Record<ProfessionalPresetKey, ProfessionalPresetConfig> = {
  cinematic: {
    id: 'cinematic',
    label: 'Cinematic',
    category: 'Cinematic',
    promptAdd: 'cinematic lighting, dramatic shadows, film grain, professional cinematography',
    strength: 0.8,
    model: 'bfl/flux-pro-1.1',
    features: ['cinematic', 'professional', 'dramatic'],
    description: 'Hollywood-style cinematic transformation',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  vibrant: {
    id: 'vibrant',
    label: 'Vibrant',
    category: 'Vibrant',
    promptAdd: 'vibrant colors, high saturation, dynamic contrast, energetic composition',
    strength: 0.75,
    model: 'bfl/flux-pro-1.1',
    features: ['vibrant', 'colorful', 'dynamic'],
    description: 'Bold and vibrant color enhancement',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  minimalist: {
    id: 'minimalist',
    label: 'Minimalist',
    category: 'Minimalist',
    promptAdd: 'minimalist design, clean lines, simple composition, elegant restraint',
    strength: 0.7,
    model: 'bfl/flux-pro-1.1',
    features: ['minimal', 'clean', 'elegant'],
    description: 'Clean and simple aesthetic',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  vintage: {
    id: 'vintage',
    label: 'Vintage',
    category: 'Vintage',
    promptAdd: 'vintage aesthetic, retro style, aged film, nostalgic atmosphere',
    strength: 0.8,
    model: 'bfl/flux-pro-1.1',
    features: ['vintage', 'retro', 'nostalgic'],
    description: 'Classic vintage photography style',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  travel: {
    id: 'travel',
    label: 'Travel',
    category: 'Travel',
    promptAdd: 'travel photography, adventure, scenic beauty, exploration',
    strength: 0.75,
    model: 'bfl/flux-pro-1.1',
    features: ['travel', 'adventure', 'scenic'],
    description: 'Adventure and travel photography style',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  nature: {
    id: 'nature',
    label: 'Nature',
    category: 'Nature',
    promptAdd: 'natural beauty, organic textures, serene atmosphere, environmental harmony',
    strength: 0.7,
    model: 'bfl/flux-pro-1.1',
    features: ['nature', 'organic', 'serene'],
    description: 'Natural and organic aesthetic',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  portrait: {
    id: 'portrait',
    label: 'Portrait',
    category: 'Portrait',
    promptAdd: 'portrait photography, professional lighting, character depth, emotional connection',
    strength: 0.8,
    model: 'bfl/flux-pro-1.1',
    features: ['portrait', 'professional', 'emotional'],
    description: 'Professional portrait photography',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  urban: {
    id: 'urban',
    label: 'Urban',
    category: 'Urban',
    promptAdd: 'urban landscape, city atmosphere, modern architecture, metropolitan energy',
    strength: 0.75,
    model: 'bfl/flux-pro-1.1',
    features: ['urban', 'modern', 'metropolitan'],
    description: 'Urban and city photography style',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  black_white: {
    id: 'black_white',
    label: 'Black & White',
    category: 'Black & White',
    promptAdd: 'black and white photography, monochromatic, timeless elegance, classic composition',
    strength: 0.85,
    model: 'bfl/flux-pro-1.1',
    features: ['monochrome', 'timeless', 'classic'],
    description: 'Classic black and white photography',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  soft: {
    id: 'soft',
    label: 'Soft',
    category: 'Soft',
    promptAdd: 'soft lighting, gentle tones, delicate atmosphere, subtle beauty',
    strength: 0.7,
    model: 'bfl/flux-pro-1.1',
    features: ['soft', 'gentle', 'delicate'],
    description: 'Soft and gentle aesthetic',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  warm: {
    id: 'warm',
    label: 'Warm',
    category: 'Warm',
    promptAdd: 'warm tones, golden hour lighting, cozy atmosphere, comforting ambiance',
    strength: 0.75,
    model: 'bfl/flux-pro-1.1',
    features: ['warm', 'cozy', 'comforting'],
    description: 'Warm and inviting aesthetic',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    category: 'Editorial',
    promptAdd: 'editorial photography, fashion style, high fashion, magazine quality',
    strength: 0.8,
    model: 'bfl/flux-pro-1.1',
    features: ['editorial', 'fashion', 'magazine'],
    description: 'Professional editorial and fashion photography',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  clarity: {
    id: 'clarity',
    label: 'Clarity',
    category: 'Clarity',
    promptAdd: 'crystal clear, sharp focus, high definition, precise details',
    strength: 0.8,
    model: 'bfl/flux-pro-1.1',
    features: ['sharp', 'clear', 'detailed'],
    description: 'Crystal clear and highly detailed',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  cool: {
    id: 'cool',
    label: 'Cool',
    category: 'Cool',
    promptAdd: 'cool tones, blue lighting, fresh atmosphere, modern cool aesthetic',
    strength: 0.75,
    model: 'bfl/flux-pro-1.1',
    features: ['cool', 'fresh', 'modern'],
    description: 'Cool and modern aesthetic',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  },
  moody: {
    id: 'moody',
    label: 'Moody',
    category: 'Moody',
    promptAdd: 'moody atmosphere, dramatic lighting, atmospheric tension, emotional depth',
    strength: 0.8,
    model: 'bfl/flux-pro-1.1',
    features: ['moody', 'dramatic', 'atmospheric'],
    description: 'Moody and atmospheric aesthetic',
    // BFL-specific parameters
    raw: false,
    prompt_upsampling: true,
    safety_tolerance: 3,
    output_format: 'jpeg',
    image_prompt_strength: 0.45,
    aspect_ratio: '4:5'
  }
};
