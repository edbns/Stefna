// Original Studio Ghibli Reaction Setup (Working & Clean)
export type GhibliReactionPreset = {
  id: string
  label: string
  prompt: string
}

// Refined Studio Ghibli Reaction prompts - Natural language, identity-preserving
// These were giving consistent viral/meme-worthy results without identity loss
export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_tears',
    label: 'Tears',
    prompt: "Apply an anime reaction style inspired by Studio Ghibli. Emphasize large expressive eyes, sparkles, and stylized emotion. Preserve facial identity and hair style. Maintain skin texture and lighting realism. Add tears of joy with sparkle effects. Keep natural skin tone and facial features intact. Use balanced strength for realistic anime transformation.",
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: "Apply an anime reaction style inspired by Studio Ghibli. Emphasize large expressive eyes, sparkles, and stylized emotion. Preserve facial identity and hair style. Maintain skin texture and lighting realism. Add wide-eyed shock expression with wonder elements. Keep natural skin tone and facial features intact. Use balanced strength for realistic anime transformation.",
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: "Apply an anime reaction style inspired by Studio Ghibli. Emphasize large expressive eyes, sparkles, and stylized emotion. Preserve facial identity and hair style. Maintain skin texture and lighting realism. Add magical sparkles and wonder expression. Keep natural skin tone and facial features intact. Use balanced strength for realistic anime transformation.",
  }
]

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId)
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId)
}
