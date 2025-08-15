// src/services/styleClash.ts
import { STYLES } from '../features/styleclash/styles'
import { uploadSourceToCloudinary } from './uploadSource'
import { uploadBlobToCloudinary } from './uploadBlobToCloudinary'
import { composeSplit } from '../features/styleclash/compose'
import { assertFile } from './sourceFile'
import { callAimlApi } from './aiml'

type StyleId = keyof typeof STYLES;

// Simple save function (NO_DB_MODE friendly)
async function saveMediaNoDB(result: any, meta: any) {
  // For now, just return success - we can implement actual saving later
  console.log('StyleClash: saving result', { result, meta })
  return { success: true }
}

// Simple feed refresh
async function refreshFeed() {
  // Dispatch event to refresh UI
  window.dispatchEvent(new CustomEvent('styleclash-complete'))
}

export async function runStyleClash(params?: {
  left?: StyleId, right?: StyleId, orientation?: 'vertical' | 'horizontal', file?: File
}) {
  const runId = crypto.randomUUID()

  const left  = params?.left  ?? 'noir'
  const right = params?.right ?? 'vivid'
  const orient = params?.orientation ?? 'vertical'

  try {
    // Use centralized file assertion
    let file = params?.file ?? window.__lastSelectedFile as File | undefined
    file = assertFile(file)

    // 1) Always start from the original File
    const { secureUrl } = await uploadSourceToCloudinary({ file })

    // 2) Render A + B (parallel, no preset IDs)
    const [A, B] = await Promise.all([
      callAimlMini(secureUrl, STYLES[left]),
      callAimlMini(secureUrl, STYLES[right]),
    ])

    // 3) Compose locally
    const blob = await composeSplit(A, B, orient)

    // 4) Upload composite (so the feed has a durable https)
    const up = await uploadBlobToCloudinary({ blob, folder: 'stefna/outputs' })

    // 5) Save to local feed (NO_DB_MODE friendly)
    await saveMediaNoDB({ url: up.secureUrl, type: 'image', meta: {
      kind: 'styleclash', group: runId, left, right, orientation: orient,
    }})
    await refreshFeed()
    
    // Use console.log for now since we don't have toast access
    console.log('Style Clash created ✨')

  } catch (e: any) {
    console.error('StyleClash error:', e)
    console.error(e?.message ?? 'Style Clash failed')
  } finally {
    // 🧹 make upload reusable without refresh
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) fileInput.value = ''
    
    // Clean up global state
    window.__lastSelectedFile = undefined
  }
}

async function callAimlMini(imageUrl: string, style: (typeof STYLES)[keyof typeof STYLES]) {
  const res = await callAimlApi({
    image_url: imageUrl,
    prompt: style.prompt,
    negative_prompt: style.negative,
    strength: style.strength,
    seed: style.seed,
  })
  
  // normalize URL out of whatever your AIML returns
  const url =
    res?.outputs?.[0]?.url ||
    res?.data?.[0]?.url ||
    res?.image_url ||
    res?.result?.url

  if (!url) throw new Error('AIML response missing image URL')
  return url as string
}
