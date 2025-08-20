// src/presets/ghibliReaction.ts

export type GhibliReactionPreset = {
  id: string;
  label: string;
  prompt: string;
};

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_tears',
    label: 'Tears',
    prompt: "Add subtle Studio Ghibli-style tears and blush while preserving facial identity and realism. Keep original proportions, ethnicity, and hairstyle. Use cel-shading lightly on cheeks and around eyes. Maintain skin texture and structure. Avoid cartoon exaggeration.",
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: "Apply a light Ghibli-style shock reaction: widen the eyes slightly, add sparkles or tension lines. Retain full facial identity, skin tone, and expression structure. Keep hair and features unchanged. Avoid full anime transformation.",
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: "Apply a subtle Ghibli-inspired sparkle effect. Keep facial structure and identity 100% intact. Add light blush, soft light overlays, and dreamy eye reflection. Do not alter ethnicity, facial shape, or realism. Use minimal cel shading and soft background blur.",
  }
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId);
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId);
}
