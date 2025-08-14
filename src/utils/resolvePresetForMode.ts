import { StoryTheme, TimeEra, RestoreOp } from '../config/modes'
import { getPresetDef, MASTER_PRESET_CATALOG, type PresetDef } from '../services/presets'

export function resolvePresetForMode({ 
  mode, 
  option, 
  activePresets 
}: {
  mode: 'time_machine'|'story'|'restore',
  option?: string,
  activePresets: Record<string, PresetDef>
}) {
  // Define preset mappings
  const timeMachineMap: Record<string, string> = {
    '1920s_noir_glam': 'noir_classic',
    '1960s_kodachrome': 'vintage_film_35mm',
    '1980s_vhs_retro': 'retro_polaroid',
    '1990s_disposable': 'vintage_film_35mm',
    '2100_cyberpunk': 'neon_nights',
  };

  const restoreMap: Record<string, string> = {
    'colorize_bw': 'crystal_clear',
    'revive_faded': 'vivid_pop',
    'sharpen_enhance': 'crystal_clear',
    'remove_scratches': 'crystal_clear'
  };

  // Story mode theme pools (prefer active presets, fall back to master catalog)
  const storyThemePools: Record<string, string[]> = {
    auto: Object.keys(activePresets).length > 0 ? Object.keys(activePresets).slice(0, 6) : [
      'cinematic_glow', 'bright_airy', 'vivid_pop', 'vintage_film_35mm', 'urban_grit', 'dreamy_pastels'
    ],
    spring: ['bright_airy', 'dreamy_pastels'],
    summer: ['vivid_pop', 'cinematic_glow'],
    autumn: ['vintage_film_35mm', 'urban_grit'],
    winter: ['crystal_clear', 'noir_classic'],
    sunrise: ['cinematic_glow', 'bright_airy'],
    day: ['crystal_clear', 'vivid_pop'],
    sunset: ['cinematic_glow', 'vintage_film_35mm'],
    night: ['neon_nights', 'noir_classic'],
    calm: ['bright_airy', 'dreamy_pastels'],
    vibrant: ['vivid_pop', 'neon_nights'],
    dramatic: ['noir_classic', 'urban_grit'],
    dreamy: ['dreamy_pastels', 'cinematic_glow'],
    photorealistic: ['crystal_clear', 'bright_airy'],
    vintage_film: ['vintage_film_35mm', 'retro_polaroid'],
    pastels: ['dreamy_pastels', 'bright_airy'],
    neon_pop: ['neon_nights', 'vivid_pop']
  };

  let targetPreset: string | null = null;

  if (mode === 'time_machine') {
    targetPreset = timeMachineMap[option || ''] || 'noir_classic';
  } else if (mode === 'restore') {
    targetPreset = restoreMap[option || ''] || 'crystal_clear';
  } else if (mode === 'story') {
    const pool = storyThemePools[option || 'auto'] || storyThemePools.auto;
    // Filter pool to only include presets that exist (either in active or master catalog)
    const validPresets = pool.filter(preset => getPresetDef(preset, activePresets));
    if (validPresets.length > 0) {
      targetPreset = validPresets[Math.floor(Math.random() * validPresets.length)];
    } else {
      // Fallback to first available preset
      targetPreset = Object.keys(activePresets)[0] || 'crystal_clear';
    }
  }

  // Ensure the target preset exists (either in active rotation or master catalog)
  if (targetPreset && getPresetDef(targetPreset, activePresets)) {
    return targetPreset;
  }

  // Fallback mapping to prevent subject drift
  const fallbackMap: Record<string, string> = {
    retro_polaroid: "vivid_pop",
    neon_nights: "vivid_pop", 
    crystal_clear: "bright_airy",
    noir_classic: "urban_grit"
  };

  // Try fallback mapping first
  if (targetPreset && fallbackMap[targetPreset]) {
    const mappedPreset = fallbackMap[targetPreset];
    if (getPresetDef(mappedPreset, activePresets)) {
      console.log(`🔄 Mapped ${targetPreset} → ${mappedPreset}`);
      return mappedPreset;
    }
  }

  // Final fallback: pick first available active preset or vivid_pop
  const fallback = Object.keys(activePresets)[0] || 'vivid_pop';
  console.warn(`Preset ${targetPreset} not found, falling back to ${fallback}`);
  return fallback;
}