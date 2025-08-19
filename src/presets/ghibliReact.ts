// src/presets/ghibliReact.ts
export type GhibliReactionPreset = {
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
}

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_tears',
    label: 'Tears',
    prompt: 'Transform the human face to resemble an anime reaction shot in the style of Studio Ghibli. Keep realistic skin and hair texture. Emphasize exaggerated emotion with stylized features like large glistening eyes. Add big glassy tears like Chihiro crying.',
    negative_prompt: 'low quality, blurry, distorted, unrealistic, cartoon, 3d render',
    strength: 0.75,
    model: 'flux/dev/image-to-image',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction'
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: 'Transform the human face to resemble an anime reaction shot in the style of Studio Ghibli. Keep realistic skin and hair texture. Emphasize exaggerated emotion with stylized features like large glistening eyes. Exaggerate shocked anime face like Sophie from Howl\'s Moving Castle.',
    negative_prompt: 'low quality, blurry, distorted, unrealistic, cartoon, 3d render',
    strength: 0.75,
    model: 'flux/dev/image-to-image',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction'
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: 'Transform the human face to resemble an anime reaction shot in the style of Studio Ghibli. Keep realistic skin and hair texture. Emphasize exaggerated emotion with stylized features like large glistening eyes. Add sparkles around face and big anime blush.',
    negative_prompt: 'low quality, blurry, distorted, unrealistic, cartoon, 3d render',
    strength: 0.75,
    model: 'flux/dev/image-to-image',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'ghibli_reaction'
  }
]

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId)
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId)
}
