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
    prompt: "Exaggerate the emotional expression in the human face using anime-inspired style. Retain natural facial structure and realistic hair/skin, but add visual elements like big glassy tears, wide glistening eyes, and subtle sparkles. Inspired by Studio Ghibli characters reacting with strong emotions.",
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: "Exaggerate the emotional expression in the human face using anime-inspired style. Retain natural facial structure and realistic hair/skin, but add visual elements like wide shocked eyes, raised eyebrows, and open mouth. Inspired by Studio Ghibli characters reacting with strong emotions.",
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: "Exaggerate the emotional expression in the human face using anime-inspired style. Retain natural facial structure and realistic hair/skin, but add visual elements like sparkles around the face, big anime blush, and bright glistening eyes. Inspired by Studio Ghibli characters reacting with strong emotions.",
  }
]

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId)
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId)
}
