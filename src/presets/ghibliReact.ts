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
    prompt: "On the **single face** in the image, add subtle, photorealistic tears welling in the eyes and a gentle blush. **The output must contain only one person.** Preserve original facial identity, proportions, and features. **Ensure tears are realistic water droplets with light refraction, not stylized lines or teardrops.** Avoid duplicates, twins, multiple faces, cel-shading, or cartoon exaggeration. Focus on hyper-realistic skin texture and structure.",
  },
  {
    id: 'ghibli_shock',
    label: 'Shock',
    prompt: "On the **single face** in the image, apply a light, naturalistic shock reaction. **Ensure the output contains only one person, avoiding any duplicates or additional faces.** Widen the eyes slightly, add subtle tension lines, and ensure the expression is a fleeting micro-expression, not a caricature. **Eliminate stylized visual effects like sparkles or tension lines.** Retain full facial identity, skin tone, and photorealistic features. The change should be a genuine, momentary reaction on the original subject.",
  },
  {
    id: 'ghibli_sparkle',
    label: 'Sparkle',
    prompt: "On the **single face** in the image, apply a subtle, naturalistic light effect that suggests a 'sparkle.' **The output must contain only one person.** This should not be a literal sparkle. Instead, add a gentle blush and **enhance the catchlight and reflection in the eyes to create a dreamy, focused effect.** Maintain 100% facial structure, identity, and photorealism. Avoid stylized effects like cel shading or glitter, and ensure no additional faces are generated.",
  }
];

export function getGhibliReactionPreset(presetId: string): GhibliReactionPreset | undefined {
  return GHIBLI_REACTION_PRESETS.find(p => p.id === presetId);
}

export function isGhibliReactionPreset(presetId: string): boolean {
  return GHIBLI_REACTION_PRESETS.some(p => p.id === presetId);
}
