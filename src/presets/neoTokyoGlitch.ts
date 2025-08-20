// src/presets/neoTokyoGlitch.ts
// Identity-Safe Presets (Emotion Mask, Ghibli Reaction, Neo Tokyo Glitch)
// For AIML API (image-to-image). Focus: preserve identity, gender, skin tone,
// ethnicity, age, and facial structure. Only subtle cyberpunk overlays that sit ON TOP of the photo (additive)

export type NeoTokyoGlitchPreset = {
  id: string;
  label: string;
  prompt: string;
  negative_prompt: string;
  strength: number;
  model: string;
  mode: 'i2i';
  input: 'image';
  requiresSource: boolean;
  source: string;
  features?: string[];
};

const NEO_IDENTITY_NEG = [
  'different person',
  'identity swap',
  'gender change',
  'ethnicity change',
  'race change',
  'skin tone change',
  'age change',
  'duplicate face',
  'two faces',
  'multiple faces',
  'double exposure',
  'twin face',
  'second person',
  'reflection face',
  'poster face',
  'extra eyes',
  'extra mouth',
  'anime face',
  'cell shaded skin',
  'toon face',
  'robot face',
  'cyborg face',
  'deformed',
  'lowres',
].join(', ');

const NEO_BASE =
  'Preserve the exact human face, gender, skin tone, ethnicity, age, and facial proportions. No changes to bone structure, nose, eyes, or jawline. '
  + 'Apply only subtle cyberpunk overlays that sit ON TOP of the photo (additive), never replacing skin detail.';

export const NEO_TOKYO_GLITCH_PRESETS: NeoTokyoGlitchPreset[] = [
  {
    id: 'neo_tokyo_base',
    label: 'Base',
    prompt:
      `${NEO_BASE} Add a faint neon ambience (magenta/teal rim glow) around the face edges and hair highlights; keep skin and features untouched.`,
    negative_prompt: NEO_IDENTITY_NEG,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i', // safer default to prevent identity drift
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['neon_overlay', 'identity_lock'],
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt:
      `${NEO_BASE} Add a barely-visible translucent HUD visor hovering 2–3 mm above the eyes; ultra-thin lines, soft scan text; no occlusion of eyebrows or eyelashes.`,
    negative_prompt: NEO_IDENTITY_NEG,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor', 'identity_lock'],
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt:
      `${NEO_BASE} Add ultra-faint cybernetic line-work along temples and cheekbones (silver micro-circuits). Lines must be hair-thin and semi-transparent. No color shift of skin.`,
    negative_prompt: NEO_IDENTITY_NEG,
    strength: 0.10,
    model: 'stable-diffusion-3.5-large-i2i',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos', 'identity_lock'],
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt:
      `${NEO_BASE} Add an extremely subtle VHS scanline pattern in the background and slight chromatic aberration at image edges. Do not place lines across the face skin.`,
    negative_prompt: NEO_IDENTITY_NEG,
    strength: 0.08, // lowest since it affects the full frame aesthetics
    model: 'stable-diffusion-3.5-large-i2i',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['vhs_scanline', 'identity_lock'],
  },
];

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find((p) => p.id === presetId);
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some((p) => p.id === presetId);
}
