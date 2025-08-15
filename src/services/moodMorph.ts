// src/services/moodMorph.ts
import { MOODS } from '../features/moodmorph/recipes'
import { uploadSourceToCloudinary } from './uploadSource'

// Simple AIML API call function
async function callAimlApi(payload: any) {
  const response = await fetch('/.netlify/functions/aimlApi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  
  if (!response.ok) {
    throw new Error(`AIML API failed: ${response.status}`)
  }
  
  const result = await response.json()
  return result
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
    if (!file) {
      // Try to get file from global state
      file = window.__lastSelectedFile as File | undefined
    }
    if (!file) throw new Error('Pick a photo to morph your moods 😊')

    // 1) Always upload the actual File (not blob:)
    const { secureUrl } = await uploadSourceToCloudinary({ file })

    // 2) Fire the three moods in parallel
    const results = await Promise.allSettled(
      MOODS.map((m) =>
        callAimlApi({
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

    // Use console.log for now since we don't have toast access
    console.log(`MoodMorph™ ready — ${ok.length}/3 variants generated`)

  } catch (e: any) {
    console.error('MoodMorph error:', e)
    console.error(e?.message ?? 'MoodMorph failed')
  } finally {
    // make uploader reusable without page refresh
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) fileInput.value = ''
    
    // Clean up global state
    window.__lastSelectedFile = undefined
  }
}
