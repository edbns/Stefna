import { presetsStore } from '../stores/presetsStore'
import { runGeneration } from '../services/generationPipeline'
import { RESTORE_MAP, RestoreOption } from '../config/restoreMap'

// Media interface for restore operations
interface Media {
  id: string
  sourceUrl?: string
  generationSnapshot?: {
    presetId: string
    prompt: string
    params: Record<string, unknown>
  }
}

export function onRestoreClick(media: Media, operation?: string) {
  return runGeneration(async () => {
    const snap = media.generationSnapshot
    if (!snap && !operation) {
      console.warn('No restore metadata or operation specified')
      return null
    }

    let presetId: string
    let prompt: string
    let params: Record<string, unknown>

    if (operation && RESTORE_MAP[operation as RestoreOption]) {
      // Use operation-specific preset and prompt
      const cfg = RESTORE_MAP[operation as RestoreOption]
      presetId = cfg.presetId
      const preset = presetsStore.getState().byId[presetId]
      if (!preset) {
        console.warn(`Restore operation "${operation}" → missing preset "${presetId}"`)
        return null
      }
      // Combine preset prompt with restore-specific prompt
      prompt = `${preset.prompt}, ${cfg.prompt}`
      params = { ...preset.params, restore_operation: operation }
    } else if (snap) {
      // Use original generation settings
      const preset = presetsStore.getState().byId[snap.presetId]
      presetId = preset?.id ?? snap.presetId
      prompt = preset?.prompt ?? snap.prompt
      params = { ...(preset?.params ?? snap.params), restoreOf: media.id }
    } else {
      console.warn('No valid restore configuration found')
      return null
    }

    return {
      mode: 'restore' as const,
      presetId,
      prompt,
      params,
      source: media.sourceUrl ? { url: media.sourceUrl } : undefined,
    }
  })
}
