// src/presets/neoTokyoGlitch.ts
// Stefna Presets — AIML-Safe (Minimal Params)
// Date: 2025-08-20
// Only uses parameters AIML supports: model, prompt, image_url, strength, num_variations
// No negative_prompt, no guidance/steps/sampler/adapters.

export type NeoTokyoGlitchPreset = {
  id: string;
  label: string;
  prompt: string;
  strength: number;
  model: string;
  num_variations?: number;
};

const NEO_GUARD =
  'Photorealistic single-subject portrait. Preserve the exact human face: same gender, skin tone, ethnicity, age, and facial proportions. Do not alter bone structure or features. Not anime, not cartoon. Do not duplicate faces or create reflections. Overlays must sit on top of the photo; skin detail remains intact.';

export const NEO_TOKYO_GLITCH_PRESETS: NeoTokyoGlitchPreset[] = [
  {
    id: 'neo_tokyo_base',
    label: 'Base',
    prompt:
      `${NEO_GUARD} Add faint neon ambience (soft magenta/teal rim glow) around hair edges and background. Keep skin tone and face unchanged.`,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt:
      `${NEO_GUARD} Add a barely visible translucent HUD visor hovering above the eyes with ultra-thin UI lines and micro text. Eyebrows and eyelashes remain visible and unchanged.`,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt:
      `${NEO_GUARD} Add ultra-faint silver micro-circuit lines along temples and cheekbones. Lines must be hair-thin, semi-transparent, and should not recolor the skin.`,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt:
      `${NEO_GUARD} Add extremely subtle VHS scanlines in the background and mild chromatic aberration at image edges only. Never draw scanlines over facial skin.`,
    strength: 0.08,
    model: 'stable-diffusion-3.5-large-i2i',
    num_variations: 1,
  },
];

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find((p) => p.id === presetId);
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some((p) => p.id === presetId);
}
