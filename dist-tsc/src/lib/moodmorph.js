import { MOODMORPH_PRESETS } from '../presets/moodmorph';
function buildPrompt(base, add) {
    return `${base}, ${add}`.replace(/\s+,/g, ",").trim();
}
export async function runMoodMorph({ token, basePrompt, imageUrl, presetId, }) {
    const bundle = MOODMORPH_PRESETS.find(p => p.id === presetId);
    if (!bundle)
        throw new Error("Unknown MoodMorph preset");
    console.log('🎭 Starting MoodMorph generation:', {
        presetId,
        basePrompt,
        variants: bundle.variants.map(v => v.label)
    });
    // Each variant will be generated separately
    // For now, we'll use the existing dispatchGenerate system
    // but call it 3 times with different prompts
    const results = await Promise.allSettled(bundle.variants.map(async (variant, index) => {
        try {
            console.log(`🎭 Generating variant ${index + 1}: ${variant.label}`);
            // Build the combined prompt
            const fullPrompt = buildPrompt(basePrompt, variant.promptAdd);
            // For now, we'll return the prompt and variant info
            // The actual generation will be handled by the existing system
            return {
                variant,
                prompt: fullPrompt,
                status: 'ready',
                index
            };
        }
        catch (error) {
            console.error(`❌ Variant ${index + 1} failed:`, error);
            throw error;
        }
    }));
    // Format output for UI
    return results.map((r, i) => ({
        variant: bundle.variants[i],
        status: r.status,
        value: r.status === "fulfilled" ? r.value : null,
        reason: r.status === "rejected" ? r.reason?.message : null,
    }));
}
// Helper function to get MoodMorph preset by ID
export function getMoodMorphPreset(presetId) {
    return MOODMORPH_PRESETS.find(p => p.id === presetId);
}
// Helper function to check if an ID is a MoodMorph preset
export function isMoodMorphPreset(presetId) {
    return presetId.startsWith('mm_');
}
