// src/services/moodMorph.ts
import { MOODS } from '../features/moodmorph/recipes'
import { uploadSourceToCloudinary } from './uploadSource'
import { getSourceFileOrThrow } from './source'
import { callAimlApi } from './aiml'
import { fetchWithAuth } from '../utils/fetchWithAuth';

// URL normalization function to ensure we always send strings to save-media
function normalizeVariationUrls(input: unknown): string[] {
  const pick = (v: any) =>
    typeof v === 'string' ? v
    : v?.url ?? v?.image_url ?? null;

  const flat = Array.isArray(input) ? input : [input];

  const urls = flat
    .flatMap((item: any) => {
      // Support both {image_url} and {variations:[...]}
      const base = pick(item);
      const vars = Array.isArray(item?.variations) ? item.variations.map(pick) : [];
      return [base, ...vars];
    })
    .filter(Boolean) as string[];

  return urls.filter(u => {
    try { return new URL(u).protocol === 'https:'; } catch { return false; }
  });
}

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
  window.dispatchEvent(new CustomEvent('refreshFeed'))
}

export async function runMoodMorph(opts?: { file?: File|Blob|string }) {
  const runId = crypto.randomUUID()
  
  try {
    console.log('🎭 MoodMorph: Starting generation with runId:', runId)
    console.log('🎭 MoodMorph: Input options:', opts)
    
    // Use centralized file assertion
    const file = await getSourceFileOrThrow(opts?.file)
    console.log('🎭 MoodMorph: File resolved:', file)

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
        // Normalize the result to ensure we get valid HTTPS URLs
        const normalizedUrls = normalizeVariationUrls(result.value);
        if (!normalizedUrls.length) {
          console.error(`❌ MoodMorph: No valid URLs in result for ${mood.id}:`, result.value);
          continue;
        }
        
        // Save each variation using the new fetchWithAuth utility
        for (const imageUrl of normalizedUrls) {
          try {
            const response = await fetchWithAuth('/.netlify/functions/save-media', {
              method: 'POST',
              body: JSON.stringify({
                variations: [{ 
                  url: imageUrl, 
                  type: 'image',
                  is_public: false,
                  meta: { mood: mood.id, group: runId }
                }],
                runId,
                presetId: 'moodmorph',
                allowPublish: false,
                tags: [`mood:${mood.id}`],
                extra: { mood: mood.id, group: runId }
              })
            });
            
            if (!response.ok) {
              throw new Error(`save-media failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log(`✅ MoodMorph: Saved ${mood.id} variation:`, result);
          } catch (error) {
            console.error(`❌ MoodMorph: Failed to save ${mood.id} variation:`, error);
            // Continue with other variations
          }
        }
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
    
    // Refresh both the public feed and the user's profile
    await refreshFeed()
    
    // Dispatch event to refresh user's profile/media list
    window.dispatchEvent(new CustomEvent('userMediaUpdated'))
    
    // Also refresh the public feed directly
    window.dispatchEvent(new CustomEvent('refreshFeed'))
    
    // Dispatch a specific event to refresh user's media list
    window.dispatchEvent(new CustomEvent('refreshUserMedia'))

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
