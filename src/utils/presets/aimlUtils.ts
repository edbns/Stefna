// src/utils/presets/aimlUtils.ts
// Stefna Presets — AIML-Safe (Minimal Params)
// Date: 2025-08-20
// Only uses parameters AIML supports: model, prompt, image_url, strength, num_variations
// No negative_prompt, no guidance/steps/sampler/adapters.

export type AIMLModel = 'stable-diffusion-3.5-large-i2i' | 'flux/dev/image-to-image' | string;

// Shared helper: build the exact payload AIML expects
export function buildAIMLRequest(
  preset: { model: AIMLModel; prompt: string; strength: number; num_variations?: number },
  image_url: string
) {
  return {
    model: preset.model,
    prompt: preset.prompt,
    image_url,
    strength: preset.strength,
    num_variations: preset.num_variations ?? 1,
  } as const;
}

// Example usage:
// import { buildAIMLRequest, getEmotionMaskPreset } from './presets';
// const p = getEmotionMaskPreset('joy_sadness');
// const body = buildAIMLRequest(p!, userImageUrl);
// fetch(AIML_ENDPOINT, { method: 'POST', headers, body: JSON.stringify(body) });
