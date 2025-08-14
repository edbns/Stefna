export type GenerateJob = {
  mode: 'i2i' | 't2i' | 'story' | 'time_machine' | 'restore'
  presetId: string
  prompt: string
  params: Record<string, unknown>
  source?: { url: string }
  runId?: string
}

export type GenerationResult = {
  success: boolean
  resultUrl?: string
  error?: string
  runId?: string
}
