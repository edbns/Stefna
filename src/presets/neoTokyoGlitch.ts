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
    prompt: 'Subtle cyberpunk lighting overlay. Preserve exact facial identity.',
    negative_prompt: 'cartoon, anime, distorted face, different person, skin change',
    strength: 0.2,
    model: 'flux/dev/image-to-image', // Default AIML model for complex effects
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['cyberpunk_enhancement', 'identity_preservation'],
    guidance_scale: 6,
    num_inference_steps: 15,
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: 'Subtle digital visor overlay. Preserve exact facial identity.',
    negative_prompt: 'cartoon, anime, distorted face, different person, skin change',
    strength: 0.2,
    model: 'flux/dev/image-to-image', // Default AIML model for complex effects
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor', 'identity_lock'],
    guidance_scale: 6,
    num_inference_steps: 15,
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: 'Subtle cybernetic tattoo patterns. Preserve exact facial identity.',
    negative_prompt: 'cartoon, anime, distorted face, different person, skin change',
    strength: 0.2,
    model: 'flux/dev/image-to-image', // Default AIML model for complex effects
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos', 'real_face_lock'],
    guidance_scale: 6,
    num_inference_steps: 15,
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: 'Subtle VHS scanline effect. Preserve exact facial identity.',
    negative_prompt: 'cartoon, anime, distorted face, different person, skin change',
    strength: 0.2,
    model: 'flux/dev/image-to-image', // Default AIML model for complex effects
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['vhs_scanline', 'identity_lock'],
    guidance_scale: 6,
    num_inference_steps: 15,
  },
];

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId);
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId);
}
