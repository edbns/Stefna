// src/services/moodMorph.ts
import { MOODS } from '../features/moodmorph/recipes'
import { uploadSourceToCloudinary } from './uploadSource'
import { getSourceFileOrThrow } from './source'
import { callAimlApi } from './aiml'
import { saveMedia } from '../lib/api';
import authService from './authService';

// Simple AIML API call function
async function callAimlApiMini(payload: any) {
  try {
    console.log('🎨 MoodMorph: Calling AIML API with payload:', payload)
    const result = await callAimlApi(payload)
    console.log('✅ MoodMorph: AIML API call successful:', result)
    return result
  } catch (error) {
    console.error('❌ MoodMorph: AIML API call failed:', error)
    console.error('❌ MoodMorph: Payload was:', payload)
    throw error
  }
}

// Simple feed refresh
async function refreshFeed() {
  // Dispatch event to refresh UI
  window.dispatchEvent(new CustomEvent('moodmorph-complete'))
}

export async function runMoodMorph(opts?: { file?: File|Blob|string }) {
  const runId = crypto.randomUUID()
  
  try {
    console.log('🎭 MoodMorph: Starting generation with runId:', runId)
    
    // Use centralized file assertion
    const file = await getSourceFileOrThrow(opts?.file)

    // 1) Always upload the actual File (not blob:)
    console.log('☁️ MoodMorph: Uploading to Cloudinary...')
    const { secureUrl } = await uploadSourceToCloudinary({ file })
    console.log('✅ MoodMorph: Cloudinary upload successful:', secureUrl)

    // 2) Fire the three moods in parallel
    console.log('🚀 MoodMorph: Starting 3 parallel mood generations...')
    const results = await Promise.allSettled(
      MOODS.map((mood, index) => {
        console.log(`🎨 MoodMorph: Starting mood ${index + 1}/${MOODS.length}: ${mood.id}`)
        return callAimlApiMini({
          image_url: secureUrl,
          prompt: mood.prompt,
          negative_prompt: mood.negative,
          strength: mood.strength,
          seed: mood.seed,
          meta: { group: runId, tag: `mood:${mood.id}` }, // for grouping in UI
        })
      })
    )

    // 3) Process results and save locally
    console.log('📊 MoodMorph: Processing results...')
    const ok = []
    const failed = []
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const mood = MOODS[i]
      
      if (result.status === 'fulfilled') {
        console.log(`✅ MoodMorph: Mood ${i + 1} (${mood.id}) successful:`, result.value)
        ok.push(result.value)
        // Save the result
        await saveMedia({
          resultUrl: result.value,
          userId: authService.getCurrentUser()?.id || 'unknown',
          presetKey: 'moodmorph',
          allowRemix: true,
          shareNow: false,
          mediaTypeHint: 'image'
        });
      } else {
        console.error(`❌ MoodMorph: Mood ${i + 1} (${mood.id}) failed:`, result.reason)
        failed.push({ mood: mood.id, error: result.reason })
      }
    }

    if (!ok.length) {
      console.error('❌ MoodMorph: All mood generations failed!')
      console.error('❌ MoodMorph: Failed attempts:', failed)
      throw new Error(`All mood generations failed. Failed attempts: ${failed.map(f => f.mood).join(', ')}`)
    }
    
    console.log(`🎉 MoodMorph: ${ok.length}/3 variants generated successfully`)
    await refreshFeed()

  } catch (e: any) {
    console.error('💥 MoodMorph: Critical error:', e)
    console.error('💥 MoodMorph: Error message:', e?.message)
    console.error('💥 MoodMorph: Error stack:', e?.stack)
    
    // Re-throw with more context
    if (e.message.includes('All mood generations failed')) {
      throw e // Already has good context
    } else {
      throw new Error(`MoodMorph failed: ${e?.message || 'Unknown error'}`)
    }
  } finally {
    // make uploader reusable without page refresh
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) fileInput.value = ''
    
    // Clean up global state
    window.__lastSelectedFile = undefined
    
    console.log('🧹 MoodMorph: Cleanup completed')
  }
}
