// src/features/styleclash/styles.ts
export type MiniStyle = {
  id: 'vivid' | 'noir' | 'pastel' | 'cyber';
  label: string;
  prompt: string;
  negative?: string;
  strength: number;
  seed?: number;
};

export const STYLES: Record<MiniStyle['id'], MiniStyle> = {
  vivid: {
    id: 'vivid',
    label: 'Vivid Pop',
    prompt: 'vibrant colors, punchy contrast, crisp micro-detail, lively mood',
    negative: 'desaturated, flat contrast, muddy blacks',
    strength: 0.65, 
    seed: 2001,
  },
  noir: {
    id: 'noir',
    label: 'Noir Classic',
    prompt: 'black and white, rich blacks, soft film grain, dramatic lighting',
    negative: 'color fringing, washed-out grayscale',
    strength: 0.7, 
    seed: 2002,
  },
  pastel: {
    id: 'pastel',
    label: 'Dreamy Pastels',
    prompt: 'soft pastel palette, gentle bloom, airy highlights, low contrast',
    negative: 'harsh shadows, oversaturated primary colors',
    strength: 0.6, 
    seed: 2003,
  },
  cyber: {
    id: 'cyber',
    label: 'Neon Cyber',
    prompt: 'neon accents, cool teal-magenta bias, clean contrast, subtle glow',
    negative: 'warm yellow cast, muddy mids',
    strength: 0.7, 
    seed: 2004,
  },
};
