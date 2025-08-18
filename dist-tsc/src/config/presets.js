import presetRotationService from '../services/presetRotationService';
// Get active presets from rotation service
export function getActivePresets() {
    return presetRotationService.getActivePresets();
}
// Get preset prompts for active presets
export const PRESET_PROMPTS = (() => {
    const activePresets = getActivePresets();
    const prompts = {};
    activePresets.forEach(preset => {
        prompts[preset.id] = preset.prompt;
    });
    return prompts;
})();
// V2V-specific prompts for video processing
export const V2V_PRESET_PROMPTS = (() => {
    const activePresets = getActivePresets();
    const prompts = {};
    activePresets.forEach(preset => {
        // Add video-specific enhancements to prompts
        prompts[preset.id] = `${preset.prompt}, smooth motion, cinematic timing, enhanced video quality`;
    });
    return prompts;
})();
// normalize any input to a slug
export function toSlug(sel) {
    const raw = typeof sel === 'string'
        ? sel
        : (sel?.slug || sel?.label || '');
    return raw.trim().toLowerCase().replace(/\s+/g, '_');
}
export function promptForPreset(sel, isVideo = false, fallback = 'stylize, preserve subject and composition') {
    const slug = toSlug(sel);
    const promptMap = isVideo ? V2V_PRESET_PROMPTS : PRESET_PROMPTS;
    const prompt = promptMap[slug];
    console.log('🎨 Preset lookup:', { input: sel, slug, isVideo, found: !!prompt, prompt: prompt || fallback });
    return prompt || fallback;
}
// Convert professional presets to the format expected by the UI
export const PRESETS = (() => {
    const activePresets = getActivePresets();
    const presets = {};
    activePresets.forEach(preset => {
        presets[preset.id] = {
            label: preset.name,
            prompt: preset.prompt,
            negative_prompt: preset.negative_prompt || 'blurry, low quality, distorted',
            strength: preset.strength,
            description: preset.description
        };
    });
    return presets;
})();
// Helper to build your I2I payload (Flux I2I)
export function buildI2IPayload(preset, image_url) {
    return {
        model: 'flux/dev/image-to-image',
        prompt: preset.prompt,
        image_url,
        strength: preset.strength,
        num_inference_steps: 36, // Default steps for all presets
        guidance_scale: 7.5, // Default guidance for all presets
    };
}
