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
    prompt: 'Add a cyberpunk overlay with neon glow and glitch patterns. Strictly preserve identity, ethnicity, gender, and facial structure. Apply cel shading, pink/blue lighting, and digital overlays as a transparent layer over real face. No stylization of skin, eyes, or hair.',
    negative_prompt: 'cartoon face, new character, different race, altered identity, gender change, anime character, fake face, distortion, full transformation',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['cyberpunk_enhancement', 'identity_preservation', 'neon_overlay', 'ethnic_lock'],
    guidance_scale: 7,
    num_inference_steps: 20,
  },
  {
    id: 'neo_tokyo_visor',
    label: 'Glitch Visor',
    prompt: 'Add a transparent digital visor and glitch HUD to the face while preserving full identity and gender. Use neon colors and subtle screen artifacts. Ethnicity, facial features, and pose must remain fully intact.',
    negative_prompt: 'different identity, anime stylization, cartoon skin, fake face, changed gender, whitewashing',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['glitch_visor', 'hud_overlay', 'identity_lock'],
    guidance_scale: 7,
    num_inference_steps: 20,
  },
  {
    id: 'neo_tokyo_tattoos',
    label: 'Tech Tattoos',
    prompt: 'Overlay subtle cyber tattoos and circuitry patterns onto skin. Keep facial identity, skin tone, ethnicity, and hair exactly the same. Do not distort expression or geometry. Apply tattoos around jaw, neck, and temples only.',
    negative_prompt: 'different person, distorted face, skin tone change, identity loss, cartoon face, gender change, anime style',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['tech_tattoos', 'real_face_lock'],
    guidance_scale: 7,
    num_inference_steps: 20,
  },
  {
    id: 'neo_tokyo_scanlines',
    label: 'Scanline FX',
    prompt: 'Overlay retro scanlines and VHS noise while maintaining the exact original photo look. Preserve full identity, expression, and ethnic traits. Do not convert face to anime or cartoon. Only add stylized screen texture.',
    negative_prompt: 'cartoon, anime face, new character, skin change, altered ethnicity, distortion, gender change',
    strength: 0.3,
    model: 'stable-diffusion-v35-large',
    mode: 'i2i',
    input: 'image',
    requiresSource: true,
    source: 'neo_tokyo_glitch',
    features: ['vhs_scanline', 'identity_lock', 'subtle_noise'],
    guidance_scale: 7,
    num_inference_steps: 20,
  },
];

export function getNeoTokyoGlitchPreset(presetId: string): NeoTokyoGlitchPreset | undefined {
  return NEO_TOKYO_GLITCH_PRESETS.find(p => p.id === presetId);
}

export function isNeoTokyoGlitchPreset(presetId: string): boolean {
  return NEO_TOKYO_GLITCH_PRESETS.some(p => p.id === presetId);
}
