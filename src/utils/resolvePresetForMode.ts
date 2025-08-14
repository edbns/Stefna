// Utility to resolve preset for mode-based generation
import { STORY_TO_PRESET, ERA_TO_PRESET, RESTORE_TO_PRESET, Mode, StoryTheme, TimeEra, RestoreOp } from '../config/modes';
import { PROFESSIONAL_PRESETS } from '../config/professional-presets';

interface ResolvePresetInput {
  mode: Mode;
  theme?: StoryTheme;
  era?: TimeEra;
  op?: RestoreOp;
  activeRotation?: string[]; // 6 active preset slugs, for story: auto
}

/**
 * Resolves the preset slug to use for mode-based generation
 * For Story Mode "auto", randomly picks from all 25 available presets
 * For other modes, maps to specific presets based on configuration
 */
export function resolvePresetForMode(input: ResolvePresetInput): string {
  if (input.mode === 'story') {
    if (input.theme === 'auto') {
      // Pick randomly from all 25 presets
      const allPresetKeys = Object.keys(PROFESSIONAL_PRESETS);
      return allPresetKeys[Math.floor(Math.random() * allPresetKeys.length)];
    }
    return STORY_TO_PRESET[input.theme as StoryTheme] || 'crystal_clear';
  }

  if (input.mode === 'time_machine') {
    return ERA_TO_PRESET[input.era as TimeEra] || 'vintage_film_35mm';
  }

  // restore mode
  return RESTORE_TO_PRESET[input.op as RestoreOp] || 'crystal_clear';
}

/**
 * Gets the display name for the resolved preset
 */
export function getPresetDisplayName(presetSlug: string): string {
  const preset = PROFESSIONAL_PRESETS[presetSlug as keyof typeof PROFESSIONAL_PRESETS];
  return preset?.name || presetSlug;
}

/**
 * Creates mode metadata for tracking and display
 */
export function createModeMeta(input: ResolvePresetInput) {
  return {
    mode: input.mode,
    theme: input.theme,
    era: input.era,
    op: input.op,
    mapping_version: 'v1',
  };
}


