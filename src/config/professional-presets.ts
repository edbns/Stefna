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
}

export const PROFESSIONAL_PRESETS: Record<ProfessionalPresetKey, ProfessionalPresetConfig> = {
  cinematic: {
    id: 'cinematic',
    label: 'Cinematic',
    category: 'Cinematic',
    promptAdd: 'cinematic lighting, dramatic shadows, film grain, professional cinematography',
    strength: 0.8,
    model: 'fal-ai/ghiblify',
    features: ['cinematic', 'professional', 'dramatic'],
    description: 'Hollywood-style cinematic transformation'
  },
  vibrant: {
    id: 'vibrant',
    label: 'Vibrant',
    category: 'Vibrant',
    promptAdd: 'vibrant colors, high saturation, dynamic contrast, energetic composition',
    strength: 0.75,
    model: 'fal-ai/ghiblify',
    features: ['vibrant', 'colorful', 'dynamic'],
    description: 'Bold and vibrant color enhancement'
  },
  minimalist: {
    id: 'minimalist',
    label: 'Minimalist',
    category: 'Minimalist',
    promptAdd: 'minimalist design, clean lines, simple composition, elegant restraint',
    strength: 0.7,
    model: 'fal-ai/ghiblify',
    features: ['minimal', 'clean', 'elegant'],
    description: 'Clean and simple aesthetic'
  },
  vintage: {
    id: 'vintage',
    label: 'Vintage',
    category: 'Vintage',
    promptAdd: 'vintage aesthetic, retro style, aged film, nostalgic atmosphere',
    strength: 0.8,
    model: 'fal-ai/ghiblify',
    features: ['vintage', 'retro', 'nostalgic'],
    description: 'Classic vintage photography style'
  },
  travel: {
    id: 'travel',
    label: 'Travel',
    category: 'Travel',
    promptAdd: 'travel photography, adventure, scenic beauty, exploration',
    strength: 0.75,
    model: 'fal-ai/ghiblify',
    features: ['travel', 'adventure', 'scenic'],
    description: 'Adventure and travel photography style'
  },
  nature: {
    id: 'nature',
    label: 'Nature',
    category: 'Nature',
    promptAdd: 'natural beauty, organic textures, serene atmosphere, environmental harmony',
    strength: 0.7,
    model: 'fal-ai/ghiblify',
    features: ['nature', 'organic', 'serene'],
    description: 'Natural and organic aesthetic'
  },
  portrait: {
    id: 'portrait',
    label: 'Portrait',
    category: 'Portrait',
    promptAdd: 'portrait photography, professional lighting, character depth, emotional connection',
    strength: 0.8,
    model: 'fal-ai/ghiblify',
    features: ['portrait', 'professional', 'emotional'],
    description: 'Professional portrait photography'
  },
  urban: {
    id: 'urban',
    label: 'Urban',
    category: 'Urban',
    promptAdd: 'urban landscape, city atmosphere, modern architecture, metropolitan energy',
    strength: 0.75,
    model: 'fal-ai/ghiblify',
    features: ['urban', 'modern', 'metropolitan'],
    description: 'Urban and city photography style'
  },
  black_white: {
    id: 'black_white',
    label: 'Black & White',
    category: 'Black & White',
    promptAdd: 'black and white photography, monochromatic, timeless elegance, classic composition',
    strength: 0.85,
    model: 'fal-ai/ghiblify',
    features: ['monochrome', 'timeless', 'classic'],
    description: 'Classic black and white photography'
  },
  soft: {
    id: 'soft',
    label: 'Soft',
    category: 'Soft',
    promptAdd: 'soft lighting, gentle tones, delicate atmosphere, subtle beauty',
    strength: 0.7,
    model: 'fal-ai/ghiblify',
    features: ['soft', 'gentle', 'delicate'],
    description: 'Soft and gentle aesthetic'
  },
  warm: {
    id: 'warm',
    label: 'Warm',
    category: 'Warm',
    promptAdd: 'warm tones, golden hour lighting, cozy atmosphere, comforting ambiance',
    strength: 0.75,
    model: 'fal-ai/ghiblify',
    features: ['warm', 'cozy', 'comforting'],
    description: 'Warm and inviting aesthetic'
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    category: 'Editorial',
    promptAdd: 'editorial photography, fashion style, high fashion, magazine quality',
    strength: 0.8,
    model: 'fal-ai/ghiblify',
    features: ['editorial', 'fashion', 'magazine'],
    description: 'Professional editorial and fashion photography'
  },
  clarity: {
    id: 'clarity',
    label: 'Clarity',
    category: 'Clarity',
    promptAdd: 'crystal clear, sharp focus, high definition, precise details',
    strength: 0.8,
    model: 'fal-ai/ghiblify',
    features: ['sharp', 'clear', 'detailed'],
    description: 'Crystal clear and highly detailed'
  },
  cool: {
    id: 'cool',
    label: 'Cool',
    category: 'Cool',
    promptAdd: 'cool tones, blue lighting, fresh atmosphere, modern cool aesthetic',
    strength: 0.75,
    model: 'fal-ai/ghiblify',
    features: ['cool', 'fresh', 'modern'],
    description: 'Cool and modern aesthetic'
  },
  moody: {
    id: 'moody',
    label: 'Moody',
    category: 'Moody',
    promptAdd: 'moody atmosphere, dramatic lighting, atmospheric tension, emotional depth',
    strength: 0.8,
    model: 'fal-ai/ghiblify',
    features: ['moody', 'dramatic', 'atmospheric'],
    description: 'Moody and atmospheric aesthetic'
  }
};
