// src/presets/ghibliReaction.ts
export type GhibliReactionPreset = {
  id: string
  label: string
  prompt: string
}

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_reaction_subtle',
    label: 'Subtle Reaction',
    prompt: "Portrait with subtle Studio Ghibli-style exaggeration. Maintain realistic facial features. Add emotional touch: sparkle in the eyes, slight blush, soft teardrop. Expression must look human, not cartoon. Preserve ethnicity, skin tone, hairstyle, and proportions. No anime face replacement.",
  },
  {
    id: 'ghibli_tearful',
    label: 'Tearful',
    prompt: "Portrait with a realistic but emotionally exaggerated Ghibli-style reaction. Big glassy eyes with visible tears, slightly open mouth in shock or sadness. Identity, race, and facial shape must remain untouched. Use soft cel shading and sketch-like background. Expression should feel relatable, not overly stylized.",
  },
  {
    id: 'ghibli_wonder',
    label: 'Wonder + Reaction',
    prompt: "Portrait with Ghibli-style wonder and emotional exaggeration. Keep face structure identical to original. Add sparkle eyes, blush, and stress lines. Preserve skin tone and ethnicity. Expression should feel cinematic, not anime-styled. Avoid cartoon or full redraw.",
  }
]

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId)
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId)
}
