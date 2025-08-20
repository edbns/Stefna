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
    prompt: 'Generate a **photorealistic image** with a cyberpunk overlay, neon glow, and **subtle, non-distorting** glitch patterns. **Strictly preserve the original facial identity, ethnicity, gender, and every detail of the facial structure.** Apply pink/blue lighting and digital overlays as a **transparent, high-fidelity** layer. **Crucially, do not apply cel shading or any other artistic stylization to the skin, eyes, or hair.** The subject should look like a person wearing or experiencing a digital projection, not a digital person.',
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
    prompt: 'Overlay a **hyper-realistic, transparent digital visor and HUD (Heads-Up Display)** onto the face. The visor should have **realistic reflections of ambient light.** Use neon colors and **subtle, screen-accurate** artifacts. Preserve the full, **photographic** identity, ethnicity, and gender. Facial features and pose must remain **100% intact, with no change to the original image\'s integrity**.',
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
    prompt: 'Overlay **subtle, realistic-looking** cybernetic tattoos and circuitry patterns onto the skin. The patterns should follow the natural contours of the face, appearing as if they are a real-world tattoo or a temporary transfer. Preserve **photorealistic facial identity, skin texture, skin tone, ethnicity, and hair with no changes.** Do not distort the subject\'s expression or facial geometry. Apply tattoos only to the jaw, neck, and temples. **Ensure the tattoos are not glowing or overly stylized.**',
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
    prompt: 'Overlay **realistic, retro scanlines and VHS grain** with **photorealistic image noise**, emulating a degraded video signal. Maintain the **exact original photo\'s appearance, including all details and textures.** Preserve the full, **photographic** identity, expression, and ethnic traits. **Do not alter the face itself in any way; only apply the screen filter effect on top.**',
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
