const DEFAULT_MODEL_FOR_MODE = {
    i2i: 'eagle',
    txt2img: 'flux',
};
export function buildAimlPayload({ preset, src }) {
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
export function resolveSourceOrToast() {
    // This will be implemented to check for available media sources
    // For now, return null to trigger proper error handling
    return null;
}
