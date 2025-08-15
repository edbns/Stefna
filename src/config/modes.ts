// Mode configuration for Presets and MoodMorph only
export type Mode = 'presets' | 'moodmorph';

// Mode labels for display
export const MODE_LABELS: Record<Mode, string> = {
  presets: 'Presets',
  moodmorph: 'MoodMorph™',
};

// Mode descriptions
export const MODE_DESCRIPTIONS: Record<Mode, string> = {
  presets: 'Apply AI style presets with custom prompts',
  moodmorph: 'Generate 3 mood variations (Happy, Sad, Cinematic)',
};


