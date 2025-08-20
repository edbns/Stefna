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
    prompt: 'Add subtle neon lighting overlay to the existing face. Keep the face exactly as is, only add soft pink/blue glow.',
    negative_prompt: 'new face, different person, distorted features, skin change, identity loss, full transformation',
    strength: 0.05, // Much more subtle
    model: 'flux/dev/image-to-image',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['neon_overlay', 'identity_lock'],
    guidance_scale: 4, // Lower for less aggressive generation
    num_inference_steps: 10, // Fewer steps for subtle effects
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: 'Add transparent digital visor overlay to the existing face. Keep the face exactly as is, only add see-through visor effect.',
    negative_prompt: 'new face, different person, distorted features, skin change, identity loss, full transformation',
    strength: 0.05, // Much more subtle
    model: 'flux/dev/image-to-image',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor', 'identity_lock'],
    guidance_scale: 4,
    num_inference_steps: 10,
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: 'Add subtle cybernetic tattoo patterns to the existing face. Keep the face exactly as is, only add small tech tattoos.',
    negative_prompt: 'new face, different person, distorted features, skin change, identity loss, full transformation',
    strength: 0.05, // Much more subtle
    model: 'flux/dev/image-to-image',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos', 'identity_lock'],
    guidance_scale: 4,
    num_inference_steps: 10,
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: 'Add subtle VHS scanline effect over the existing face. Keep the face exactly as is, only add scanline overlay.',
    negative_prompt: 'new face, different person, distorted features, skin change, identity loss, full transformation',
    strength: 0.05, // Much more subtle
    model: 'flux/dev/image-to-image',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['vhs_scanline', 'identity_lock'],
    guidance_scale: 4,
    num_inference_steps: 10,
  },
];

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId);
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId);
}
