// utils/presets/payload.ts
import type { Preset } from './types';

const DEFAULT_MODEL_FOR_MODE: Record<Preset['mode'], Preset['model']> = {
  i2i: 'eagle', 
  txt2img: 'flux', 
  restore: 'eagle', 
  story: 'eagle',
};

export function buildAimlPayload({ preset, src }: { preset: Preset; src: string | null }) {
  const model = preset.model ?? DEFAULT_MODEL_FOR_MODE[preset.mode];
  return {
    model,
    mode: preset.mode,
    inputType: preset.input,
    prompt: preset.prompt,
    negative: preset.negative_prompt,
    strength: preset.strength ?? 0.6,
    sourceUrl: src,
    post: preset.post, // downstream can translate: {upscale:'x2'} -> Cloudinary/effects
    meta: { presetId: preset.id, label: preset.label },
  };
}

// Helper to resolve source from UI state
export function resolveSourceOrToast(): string | null {
  // This will be implemented to check for available media sources
  // For now, return null to trigger proper error handling
  return null;
}
