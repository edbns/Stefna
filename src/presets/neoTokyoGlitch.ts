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
    prompt: 'Keep the exact same face, only add very subtle neon lighting overlay, preserve identity 100%, same person, same features',
    negative_prompt: 'new face, different person, distorted features, skin change, identity loss, full transformation, cyborg, robot',
    strength: 0.01, // Extremely subtle - barely visible effect
    model: 'flux/dev/image-to-image',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['neon_overlay', 'identity_lock'],
    guidance_scale: 2, // Very low for minimal change
    num_inference_steps: 5, // Minimal steps for subtle effect
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: 'Keep the exact same face, only add transparent digital visor overlay, preserve identity 100%, same person, same features',
    negative_prompt: 'new face, different person, distorted features, skin change, identity loss, full transformation, cyborg, robot',
    strength: 0.01, // Extremely subtle - barely visible effect
    model: 'flux/dev/image-to-image',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor', 'identity_lock'],
    guidance_scale: 2, // Very low for minimal change
    num_inference_steps: 5, // Minimal steps for subtle effect
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: 'Keep the exact same face, only add very subtle cybernetic tattoo patterns, preserve identity 100%, same person, same features',
    negative_prompt: 'new face, different person, distorted features, skin change, identity loss, full transformation, cyborg, robot',
    strength: 0.01, // Extremely subtle - barely visible effect
    model: 'flux/dev/image-to-image',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos', 'identity_lock'],
    guidance_scale: 2, // Very low for minimal change
    num_inference_steps: 5, // Minimal steps for subtle effect
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: 'Keep the exact same face, only add very subtle VHS scanline effect overlay, preserve identity 100%, same person, same features',
    negative_prompt: 'new face, different person, distorted features, skin change, identity loss, full transformation, cyborg, robot',
    strength: 0.01, // Extremely subtle - barely visible effect
    model: 'flux/dev/image-to-image',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['vhs_scanline', 'identity_lock'],
    guidance_scale: 2, // Very low for minimal change
    num_inference_steps: 5, // Minimal steps for subtle effect
  },
];

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId);
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId);
}
