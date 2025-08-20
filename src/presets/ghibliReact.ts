// Original Studio Ghibli Reaction Setup (Working & Clean)
export type GhibliReactionPreset = {
  id: string
  label: string
  prompt: string
}

// Base prompt for Ghibli style facial emotion enhancement
const GHIBLI_BASE_PROMPT = "Transform the human face to resemble an anime reaction shot in the style of Studio Ghibli. Keep realistic skin and hair texture. Emphasize exaggerated emotion with stylized features like large glistening eyes, sparkles, tears, or shocked expressions."

// Emotion-specific additions
const GHIBLI_MOOD_ADDONS = {
  tears: "Add big glassy tears like Chihiro crying.",
  shock: "Exaggerate shocked anime face like Sophie from Howl's Moving Castle.",
  sparkle: "Add sparkles around face and big anime blush."
}

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_tears',
    label: 'Tears',
    prompt: `${GHIBLI_BASE_PROMPT} ${GHIBLI_MOOD_ADDONS.tears}`,
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: `${GHIBLI_BASE_PROMPT} ${GHIBLI_MOOD_ADDONS.shock}`,
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: `${GHIBLI_BASE_PROMPT} ${GHIBLI_MOOD_ADDONS.sparkle}`,
  }
]

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId)
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId)
}
