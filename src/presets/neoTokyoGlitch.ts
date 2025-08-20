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
    prompt: 'On the **single subject in the photo**, generate a photorealistic image with a cyberpunk overlay, neon glow, and subtle glitch patterns. **The output must contain only one person.** Strictly preserve the original facial identity, ethnicity, and gender. Apply pink/blue lighting and digital overlays as a transparent, high-fidelity layer. Do not apply cel shading or artistic stylization to the skin, eyes, or hair. The subject should look like a person experiencing a digital projection, not a digital person.',
    negative_prompt: 'two faces, multiple people, duplicate, twins, cartoon face, new character, different race, altered identity, gender change, anime character, fake face, distortion, full transformation',
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
    prompt: 'On the **single face in the image**, overlay a hyper-realistic, transparent digital visor and HUD. **Crucially, the output must contain only one person.** The visor should have realistic reflections of ambient light. Use neon colors and subtle, screen-accurate artifacts. Preserve the full, photographic identity, ethnicity, and gender. Facial features and pose must remain 100% intact.',
    negative_prompt: 'two faces, multiple people, duplicate, twins, different identity, anime stylization, cartoon skin, fake face, changed gender, whitewashing',
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
    prompt: 'On the **single subject in the photo**, overlay subtle, realistic-looking cybernetic tattoos and circuitry patterns onto the skin. **The final image must contain only one person.** The patterns should follow the natural contours of the face. Preserve photorealistic facial identity, skin texture, skin tone, ethnicity, and hair with no changes. Apply tattoos only to the jaw, neck, and temples. Ensure the tattoos are not glowing or overly stylized.',
    negative_prompt: 'two faces, multiple people, duplicate, twins, different person, distorted face, skin tone change, identity loss, cartoon face, gender change, anime style',
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
    prompt: 'On the **single person in the image**, overlay realistic, retro scanlines and VHS grain with photorealistic image noise. **The output must contain only one person.** Maintain the exact original photo\'s appearance, including all details and textures. Preserve the full photographic identity, expression, and ethnic traits. Do not alter the face itself; only apply the screen filter effect on top.',
    negative_prompt: 'two faces, multiple people, duplicate, twins, cartoon, anime face, new character, skin change, altered ethnicity, distortion, gender change',
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
