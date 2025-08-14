export type GenerateJob = {
  mode: 'i2i' | 't2i' | 'story' | 'time_machine' | 'restore'
  presetId: string
  prompt: string
  params: Record<string, unknown>
  source?: { url: string }
  runId?: string
  // New metadata fields for tracking generation context
  group?: 'story'|'time_machine'|'restore'|null;
  optionKey?: string | null;     // e.g. 'vhs_1980s', 'four_seasons/spring', 'colorize_bw'
  storyKey?: string | null;      // e.g. 'four_seasons'
  storyLabel?: string | null;    // e.g. 'Spring'
  parentId?: string | null;      // if this is a remix, points to original media
}

export type GenerationResult = {
  success: boolean
  resultUrl?: string
  error?: string
  runId?: string
}
