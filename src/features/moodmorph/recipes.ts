// src/features/moodmorph/recipes.ts
export type MoodRecipe = {
  id: 'happy' | 'sad' | 'cinematic'
  label: string
  prompt: string
  negative?: string
  strength: number
  seed?: number
}

export const MOODS: MoodRecipe[] = [
  {
    id: 'happy',
    label: 'Happy',
    prompt:
      'bright, warm color grade, subtle lift in exposure, gentle skin glow, lively ambiance, soft highlight rolloff, micro-contrast boost around eyes and lips, hint of sunshine',
    negative: 'harsh shadows, desaturated, green tint, muddy blacks',
    strength: 0.65,
    seed: 1001,
  },
  {
    id: 'sad',
    label: 'Sad',
    prompt:
      'cooler tones, desaturated palette, softer contrast, gentle vignette, moody ambient light, slight blue lift in shadows, calm cinematic tone',
    negative: 'oversaturated, warm color cast, cartoonish look',
    strength: 0.65,
    seed: 1002,
  },
  {
    id: 'cinematic',
    label: 'Cinematic Dramatic',
    prompt:
      'teal and amber grade, deep contrast, rich blacks, soft bloom on highlights, filmic halation, crisp detail in eyes, dramatic mood lighting',
    negative: 'flat contrast, color banding, plastic skin',
    strength: 0.7,
    seed: 1003,
  },
]
