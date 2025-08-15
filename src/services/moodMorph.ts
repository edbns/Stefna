// src/services/moodMorph.ts
import { MOODS } from '../features/moodmorph/recipes'
import { uploadSourceToCloudinary } from './uploadSource'
import { assertFile } from './sourceFile'
import { callAimlApi } from './aiml'

// Simple AIML API call function
async function callAimlApiMini(payload: any) {
  return callAimlApi(payload)
}

// Simple save function (NO_DB_MODE friendly)
async function saveMediaNoDB(result: any, meta: any) {
  // For now, just return success - we can implement actual saving later
  console.log('MoodMorph: saving result', { result, meta })
  return { success: true }
}

// Simple feed refresh
async function refreshFeed() {
  // Dispatch event to refresh UI
  window.dispatchEvent(new CustomEvent('moodmorph-complete'))
}

export async function runMoodMorph(file?: File) {
  const runId = crypto.randomUUID()
  
  try {
    // Use centralized file assertion
    if (!file) {
      // Try to get file from global state
      file = window.__lastSelectedFile as File | undefined
    }
    file = assertFile(file)

    // 1) Always upload the actual File (not blob:)
    const { secureUrl } = await uploadSourceToCloudinary({ file })

    // 2) Fire the three moods in parallel
    const results = await Promise.allSettled(
      MOODS.map((m) =>
        callAimlApiMini({
          image_url: secureUrl,
          prompt: m.prompt,
          negative_prompt: m.negative,
          strength: m.strength,
          seed: m.seed,
          meta: { group: runId, tag: `mood:${m.id}` }, // for grouping in UI
        })
      )
    )

    // 3) Save locally (works in NO_DB_MODE)
    const ok = []
    for (const r of results) {
      if (r.status === 'fulfilled') {
        ok.push(r.value)
        await saveMediaNoDB(r.value, { groupId: runId })
      }
    }

    if (!ok.length) throw new Error('All mood generations failed. Try another image?')
    await refreshFeed()

    console.log(`MoodMorph™ ready — ${ok.length}/3 variants generated`) // Changed from toast.success

  } catch (e: any) {
    console.error('MoodMorph error:', e)
    console.error(e?.message ?? 'MoodMorph failed') // Changed from toast.error
  } finally {
    // make uploader reusable without page refresh
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) fileInput.value = ''
    
    // Clean up global state
    window.__lastSelectedFile = undefined
  }
}
