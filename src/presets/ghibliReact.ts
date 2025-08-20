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
    prompt: "Add subtle, **photorealistic tears welling in the eyes** and a gentle blush on the cheeks. Preserve original facial identity, proportions, and features. **Ensure tears are realistic water droplets with light refraction, not stylized lines or teardrops.** Avoid any form of cel-shading, cartoon exaggeration, or skin-smoothing. Focus on hyper-realistic skin texture and structure.",
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: "Apply a light, **naturalistic shock reaction**. Widen the eyes slightly, add subtle tension lines around the mouth and brow, and ensure the expression is a fleeting micro-expression, not a fixed caricature. **Eliminate sparkles, tension lines, or any other stylized visual effects.** Retain full facial identity, skin tone, and photorealistic features. The change should be so subtle it feels like a genuine, momentary reaction.",
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: "Apply a **subtle, naturalistic light effect** that suggests a 'sparkle.' **This should not be a literal sparkle effect.** Instead, add a gentle, warm blush and **enhance the catchlight and reflection in the eyes to create a dreamy, focused effect.** Use soft, ambient lighting and a shallow depth of field. Maintain 100% facial structure, identity, and photorealism. Avoid any stylized effects like cel shading or glitter.",
  }
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId);
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId);
}
