// src/presets/neoTokyoGlitch.ts
export type NeoTokyoGlitchPreset = {
  id: string;
  label: string;
  prompt: string;
  negative_prompt: string;
  strength: number;
  model: string;
  mode: string;
  input: string;
  requiresSource: boolean;
  source: string;
  features?: string[];
  guidance_scale?: number;
  num_inference_steps?: number;
};

export const NEO_TOKYO_GLITCH_PRESETS: NeoTokyoGlitchPreset[] = [
  {
    id: 'neo_tokyo_base',
    label: 'Base',
    prompt: 'Apply a cyberpunk aesthetic with glowing neon overlays and subtle glitch lines. Do not alter identity, ethnicity, skin tone, or gender. Retain full realism. Focus on background and lighting. The subject\'s face must remain untouched structurally.',
    negative_prompt: 'anime face, different person, gender swap, Asian features, whitewashing, stylized face, identity change, facial reconstruction, race change, altered hair, cartoon, unrealistic',
    strength: 0.25,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['cyberpunk_overlay', 'neon_glow', 'identity_lock', 'ethnic_lock'],
    guidance_scale: 6.5,
    num_inference_steps: 20,
  },
  {
    id: 'neo_tokyo_mask',
    label: 'Tech Mask',
    prompt: 'Add a translucent tech HUD overlay (visor, AR interface) around the subject\'s face. Do not modify gender, race, skin tone, or identity. Preserve hair, expression, and structure. Style should be futuristic but respectful of input image.',
    negative_prompt: 'different person, anime-style, altered face, Asian features, unrealistic eyes, whitewashing, cartoon overlay, gender alteration, race change, hairstyle change',
    strength: 0.25,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['AR_overlay', 'identity_preservation', 'tech_visor'],
    guidance_scale: 6.5,
    num_inference_steps: 20,
  }
];

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId);
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId);
}
