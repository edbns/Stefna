// utils/presets/story.ts
// 3) Story Mode = 4-shot "sequence runner" (reuses your pipeline)

import type { Preset, PresetId } from './types';
import { PRESETS, ACTIVE_PRESET_IDS, resolvePreset } from './types';
import { buildAimlPayload } from './payload';

// A tiny descriptor for one story "beat"
type StoryBeat = { 
  label: string; 
  use: PresetId; 
  overrides?: Partial<Preset> 
};

// Theme → 4 beats. Uses your existing preset ids.
export const STORY_THEMES: Record<string, StoryBeat[] | { strategy: 'auto' }> = {
  // Auto: pick 4 from the *current 6 active* (distinct & shuffled)
  auto: { strategy: 'auto' },

  // Four Seasons
  four_seasons: [
    { label: 'Spring', use: 'dreamy_pastels' },
    { label: 'Summer', use: 'sun_kissed' },
    { label: 'Autumn', use: 'moody_forest' },
    { label: 'Winter', use: 'frost_light' },
  ],

  // Time of Day
  time_of_day: [
    { label: 'Sunrise', use: 'golden_hour_magic' },
    { label: 'Day', use: 'crystal_clear' },
    { label: 'Sunset', use: 'cinematic_glow' },
    { label: 'Night', use: 'neon_nights' },
  ],

  // Mood Shift
  mood_shift: [
    { label: 'Calm', use: 'bright_airy' },
    { label: 'Vibrant', use: 'vivid_pop' },
    { label: 'Dramatic', use: 'urban_grit' },
    { label: 'Dreamy', use: 'dreamy_pastels' },
  ],

  // Art Style Remix
  style_remix: [
    { label: 'Photorealistic', use: 'crystal_clear' },
    { label: 'Vintage Film', use: 'vintage_film_35mm' },
    { label: 'Pastels', use: 'dreamy_pastels' },
    { label: 'Neon Pop', use: 'neon_nights' },
  ],
} as const;

// Helper: pick 4 distinct from current active 6
function pickAutoFromActive(): StoryBeat[] {
  const pool = ACTIVE_PRESET_IDS.slice(0, 6);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4).map((id, i) => ({ 
    label: `Shot ${i + 1}`, 
    use: id 
  }));
}

// Helper to resolve source (will be integrated with existing source resolution)
function resolveSourceOrToast(): { id: string; url: string } | null {
  // This will be replaced by the actual source resolution logic from the UI
  // For now, return null to trigger the error toast
  return null;
}

// Integration with actual generation pipeline
import { runGeneration, GenerateJob } from '../../services/generationPipeline';
import { authFetch } from '../authFetch';

async function runStoryBeat(preset: Preset, source: { id: string; url: string }, metadata: { storyKey: string; storyLabel: string }): Promise<any> {
  // Create a generation job with story metadata
  const job: GenerateJob = {
    mode: 'story',
    presetId: preset.id,
    prompt: preset.prompt,
    params: {
      strength: preset.strength || 0.7,
      negative_prompt: preset.negative_prompt,
      model: preset.model || 'eagle'
    },
    source: { url: source.url },
    runId: crypto.randomUUID(),
    group: 'story',
    storyKey: metadata.storyKey,
    storyLabel: metadata.storyLabel,
    parentId: source.id // Track remix relationship
  };

  // Use the existing generation pipeline
  return await runGeneration(() => Promise.resolve(job));
}

function showToast(type: 'success' | 'error', message: string): void {
  window.dispatchEvent(new CustomEvent(`generation-${type}`, { 
    detail: { message, timestamp: Date.now() } 
  }));
}

// Runner: reuse one source, run 4 beats, prepend all to UI in order
export async function onStoryThemeClick(themeKey: keyof typeof STORY_THEMES, source?: { id: string; url: string }): Promise<void> {
  try {
    const theme = STORY_THEMES[themeKey];
    const src = source || resolveSourceOrToast(); // Allow passing source directly
    if (!src) {
      showToast('error', 'Pick a photo/video first, then select a story theme.');
      return;
    }

    const beats = ('strategy' in theme) ? pickAutoFromActive() : theme;

    console.log(`📖 Starting story sequence: ${String(themeKey)} (${beats.length} beats)`);

    // Show initial toast
    showToast('success', `Starting ${String(themeKey).replaceAll('_', ' ')} story...`);

    for (const [index, beat] of beats.entries()) {
      try {
        console.log(`🎬 Processing beat ${index + 1}/4: ${beat.label}`);
        
        const preset = resolvePreset(beat.use, beat.overrides);
        
        // Run the story beat using the generation pipeline
        const result = await runStoryBeat(preset, src, {
          storyKey: String(themeKey),
          storyLabel: beat.label
        });
        
        if (!result?.success) {
          console.warn(`Beat ${index + 1} failed, continuing with others`);
          continue;
        }
        
        console.log(`✅ Beat ${index + 1}/4 completed: ${beat.label}`);
        
      } catch (error) {
        console.warn(`Beat ${index + 1} (${beat.label}) failed:`, error);
        // Continue with other beats - don't fail the entire story
      }
    }
    
    const themeName = String(themeKey).replaceAll('_', ' ');
    showToast('success', `Story: ${themeName} completed!`);
    
  } catch (error) {
    console.error('Story sequence failed:', error);
    showToast('error', 'Story creation failed. Please try again.');
  }
}

// Export available story themes for UI
export function getStoryThemes(): Array<{ key: string; label: string; description: string }> {
  return [
    { key: 'auto', label: 'Auto Mix', description: '4 random styles from current rotation' },
    { key: 'four_seasons', label: 'Four Seasons', description: 'Spring, Summer, Autumn, Winter' },
    { key: 'time_of_day', label: 'Time of Day', description: 'Sunrise, Day, Sunset, Night' },
    { key: 'mood_shift', label: 'Mood Shift', description: 'Calm, Vibrant, Dramatic, Dreamy' },
    { key: 'style_remix', label: 'Style Remix', description: 'Photo, Vintage, Pastels, Neon' },
  ];
}

// Validation helper
export function validateStoryThemes(): string[] {
  const errors: string[] = [];
  const presetIds = new Set(Object.keys(PRESETS));
  
  Object.entries(STORY_THEMES).forEach(([themeKey, theme]) => {
    if ('strategy' in theme) return; // Skip auto strategy
    
    theme.forEach((beat, index) => {
      if (!presetIds.has(beat.use)) {
        errors.push(`Story theme "${themeKey}" beat ${index + 1} references missing preset "${beat.use}"`);
      }
    });
  });
  
  return errors;
}
