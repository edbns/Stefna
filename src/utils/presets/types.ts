export interface Preset {
  id: string;
  name: string;
  label: string;
  description?: string;
  category: string;
  group: string;
  mode?: 'i2i' | 'txt2img';
  model?: 'eagle' | 'flux' | 'other';
  input?: 'image' | 'video';
  options: Record<string, any>;
  params?: Record<string, any>;
}

export type PresetId = string;

export interface PresetOption {
  key: string;
  value: any;
  label?: string;
  description?: string;
}

export interface PresetGroup {
  name: string;
  label: string;
  options: PresetOption[];
}

export const OPTION_GROUPS: Record<string, PresetGroup> = {
  // Define your option groups here
};

export function resolvePreset(presetId: PresetId, presets: Preset[]): Preset | null {
  return presets.find(p => p.id === presetId) || null;
}

export function isConfigured(preset: Preset): boolean {
  return preset.options && Object.keys(preset.options).length > 0;
}
