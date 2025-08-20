// src/utils/presets/aimlUtils.ts
// Stefna — AIML Minimal (No‑Grid, No‑Anime, Two‑Pass)
// Only uses AIML-supported params: model, prompt, image_url, strength, num_variations
// Purpose: eliminate "double face" and anime drift without adapters.

export type AIMLModel = 'stable-diffusion-3.5-large-i2i' | 'flux/dev/image-to-image' | string;

// Always send num_variations: 1 to prevent servers that auto-grid outputs.
export type MinimalPreset = {
  id: string;
  label: string;
  prompt: string; // includes all guardrails inline
  strength: number; // keep 0.06–0.10 for identity safety
  model: AIMLModel;
  num_variations: 1; // locked
};

// --- Hard guardrails injected into every prompt ---
const SINGLE_SUBJECT_GUARD =
  'Photorealistic single-subject portrait. Preserve the exact same person: gender, skin tone, ethnicity, age, bone structure, nose, eyes, jawline, hair texture, freckles, moles. Keep natural skin texture; do not smooth. Do not change makeup. SINGLE SUBJECT ONLY; do not add, mirror, split or duplicate a subject. No grid, no collage, no split-screen, no diptych, no reflection faces, no posters with faces, no double exposure, no extra eyes or mouth. Not anime, not cartoon, no cel shading, no outline lines, no vector/illustration look.';

// --- Helper: clamp strength ---
const clampStrength = (s: number) => Math.max(0.06, Math.min(0.10, s));

// --- Helper: build exact AIML payload ---
export function buildAIMLRequest(preset: MinimalPreset, image_url: string) {
  return {
    model: preset.model,
    prompt: preset.prompt,
    image_url,
    strength: clampStrength(preset.strength),
    num_variations: 1 as const,
  };
}

// --- Optional: Two-pass strategy (adapter-free)
// Pass 1 anchors identity with a near-zero-change duplicate to reduce drift.
// Pass 2 applies the actual overlay at low strength.
export function makeTwoPassRequests(preset: MinimalPreset, image_url: string) {
  const pass1 = {
    model: preset.model,
    prompt:
      'Photorealistic copy of the input portrait. Reproduce the exact same person and facial features. Do NOT stylize, do NOT add overlays, do NOT change expression. ' +
      'SINGLE SUBJECT ONLY; no grid, no collage, no mirror. Keep background intact.',
    image_url,
    strength: 0.06 as const,
    num_variations: 1 as const,
  };
  const pass2 = buildAIMLRequest(preset, image_url);
  return { pass1, pass2 };
}
