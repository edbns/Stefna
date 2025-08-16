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

// Clear composer state function
function clearComposerState() {
  // Clear file input so same file can be chosen again
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
    // Force remount if needed
    fileInput.setAttribute('key', String(Date.now()))
  }
  
  // Clean up global state
  window.__lastSelectedFile = undefined
  
  // Dispatch event to clear composer state
  window.dispatchEvent(new CustomEvent('clear-composer-state'))
  
  console.log('🧹 MoodMorph: Composer state cleared')
}

// Define types for variations
interface MoodVariation {
  url: string;
  mood: string;
  prompt: string;
  negative_prompt: string;
  strength: number;
  seed: number;
  meta: {
    mood: string;
    runId: string;
    presetId: string;
    group: string;
    variation_index: number;
    url_index: number;
    fallback: boolean;
  };
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

    // 3) Process results and collect all variations
    console.log('📊 MoodMorph: Processing results...')
    const ok = []
    const failed = []
    const allVariations: MoodVariation[] = []
    
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

        // Add each variation with proper metadata
        normalizedUrls.forEach((url, urlIndex) => {
          allVariations.push({
            url,
            mood: mood.id,
            prompt: mood.prompt || '',
            negative_prompt: mood.negative || '',
            strength: mood.strength || 0.65,
            seed: mood.seed || 1000,
            meta: {
              mood: mood.id,
              runId,
              presetId: 'moodmorph',
              group: runId,
              variation_index: i,
              url_index: urlIndex,
              fallback: false
            }
          })
        })
      } else {
        console.error(`❌ MoodMorph: Mood ${i + 1} (${mood.id}) failed:`, result.reason)
        failed.push({ mood: mood.id, error: result.reason })
      }
    }

    if (ok.length === 0) {
      throw new Error('All mood generations failed')
    }

    console.log(`🎉 MoodMorph: ${ok.length}/${MOODS.length} variants generated successfully`)
    
    // 4) Save all variations in batch
    console.log('📦 MoodMorph: Saving variations in batch...')
    try {
      const batchResponse = await fetchWithAuth('/.netlify/functions/save-media-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': runId
        },
        body: JSON.stringify({
          runId,
          variations: allVariations.map(v => ({
            image_url: v.url,
            media_type: 'image',
            prompt: v.prompt,
            meta: v.meta
          })),
          source: {
            public_id: secureUrl.split('/').pop()?.split('.')[0] || 'unknown',
            url: secureUrl
          }
        })
      })

      if (batchResponse.ok) {
        const batchData = await batchResponse.json()
        console.log('✅ MoodMorph: Batch save successful:', batchData)
        
        // Only refresh feed AFTER successful save
        window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
          detail: { count: allVariations.length, runId, fallback: false } 
        }))
        
        // Show success toast
        window.dispatchEvent(new CustomEvent('generation-success', {
          detail: { message: `Saved ${allVariations.length} MoodMorph variations!`, timestamp: Date.now() }
        }))
      } else {
        // Log the actual error response content
        const errorText = await batchResponse.text();
        console.error('❌ MoodMorph: Batch save failed with status:', batchResponse.status);
        console.error('❌ MoodMorph: Error response:', errorText);
        throw new Error(`Batch save failed: ${batchResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.warn(`⚠️ MoodMorph: Batch save failed, falling back to individual saves:`, error);
      
      // Fallback: save each variation individually
      try {
        let savedCount = 0;
        for (const variation of allVariations) {
          const index = allVariations.indexOf(variation);
          const mood = MOODS[index]?.id || 'unknown';
          
          // Use individual save-media with idempotency key
          const fallbackResponse = await fetchWithAuth('/.netlify/functions/save-media', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Idempotency-Key': `${runId}:${mood}` // unique per variation
            },
            body: JSON.stringify({
              url: variation.url,
              media_type: 'image',
              prompt: MOODS[index]?.prompt || `MoodMorph ${mood}`,
              meta: {
                mood,
                runId,
                presetId: 'moodmorph',
                group: runId,
                variation_index: index,
                fallback: true
              },
              allowPublish: false
            })
          });

          if (fallbackResponse.ok) {
            savedCount++;
            console.log(`✅ MoodMorph: Fallback saved variation ${index + 1} (${mood})`);
          } else {
            // Log the actual error response content
            const errorText = await fallbackResponse.text();
            console.error(`❌ MoodMorph: Fallback failed for variation ${index + 1}:`, fallbackResponse.status);
            console.error(`❌ MoodMorph: Error response:`, errorText);
          }

          // Small delay between saves to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        if (savedCount > 0) {
          console.log(`✅ MoodMorph: Fallback saved ${savedCount}/${allVariations.length} variations`);
          
          // Only refresh UI AFTER successful save
          window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
            detail: { count: savedCount, runId, fallback: true } 
          }))
          
          // Show fallback success toast
          window.dispatchEvent(new CustomEvent('generation-success', {
            detail: { message: `Saved ${savedCount} variations (fallback mode)`, timestamp: Date.now() }
          }))
        } else {
          throw new Error('All fallback saves failed');
        }
      } catch (fallbackError) {
        console.error(`❌ MoodMorph: Fallback saves also failed:`, fallbackError);
        throw new Error(`Failed to save MoodMorph variations (batch and fallback failed): ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }

  } catch (e: any) {
    console.error('💥 MoodMorph: Critical error:', e)
    console.error('💥 MoodMorph: Error message:', e?.message)
    console.error('💥 MoodMorph: Error stack:', e?.stack)
    
    // Show error toast
    window.dispatchEvent(new CustomEvent('generation-error', {
      detail: { message: `MoodMorph failed: ${e?.message || 'Unknown error'}`, timestamp: Date.now() }
    }))
    
    // Re-throw with more context
    if (e.message.includes('All mood generations failed')) {
      throw e // Already has good context
    } else {
      throw new Error(`MoodMorph failed: ${e?.message || 'Unknown error'}`)
    }
  } finally {
    // ALWAYS clear composer state regardless of success/failure
    clearComposerState()
    console.log('🧹 MoodMorph: Cleanup completed')
  }
}
