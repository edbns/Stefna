// GhibliReaction.ts
export type GhibliReactionPreset = {
  id: string;
  label: string;
  prompt: string;
};

export const GHIBLI_REACTION_PRESETS: GhibliReactionPreset[] = [
  {
    id: 'ghibli_tears',
    label: 'Tears',
    prompt: "Dramatically exaggerate eyes and emotional expression in a Studio Ghibli-inspired style. Add big glassy tears and sparkle effects. Preserve facial identity, hair, and lighting. Cel-shading optional. Keep skin natural.",
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: "Show a dramatic anime-style shock reaction inspired by Ghibli. Add wide-open eyes, spark effects, small sweat or stress marks. Preserve original face, lighting, and skin texture. Emphasis on expression only.",
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: "Transform the subject into a dreamy sparkle reaction moment. Use light anime-style overlays like stars or shimmer around the eyes. Identity must remain intact. Balanced tone, subtle glow okay.",
  },
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId);
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId);
}
