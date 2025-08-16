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

export const runMoodMorph = async (
  sourceFile: File,
  onProgress: (progress: number) => void,
  onComplete: (variations: MoodVariation[]) => void,
  onError: (error: string) => void
): Promise<void> => {
  try {
    console.log('🚀 MoodMorph: Starting generation...');
    
    // Step 1: Upload source to Cloudinary
    const sourcePublicId = await uploadSourceToCloudinary({ file: sourceFile });
    console.log('📤 MoodMorph: Source uploaded:', sourcePublicId);
    
    // Step 2: Generate variations via AIML
    const allVariations: MoodVariation[] = [];
    
    for (let i = 0; i < MOODS.length; i++) {
      const mood = MOODS[i];
      onProgress((i / MOODS.length) * 100);
      
      try {
        const response = await fetchWithAuth('/.netlify/functions/aimlApi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: mood.prompt,
            negative_prompt: mood.negative,
            strength: mood.strength,
            seed: mood.seed,
            source_image: sourcePublicId,
            num_variations: 1
          })
        });

        if (!response.ok) {
          throw new Error(`AIML API failed: ${response.status}`);
        }

        const result = await response.json();
        if (result.ok && result.images && result.images.length > 0) {
          allVariations.push({
            url: result.images[0],
            mood: mood.id,
            prompt: mood.prompt,
            negative_prompt: mood.negative || 'low quality, blurry, distorted',
            strength: mood.strength || 0.65,
            seed: mood.seed || 1000 + i,
            meta: {
              mood: mood.id,
              runId: `moodmorph_${Date.now()}`,
              presetId: 'moodmorph',
              group: `moodmorph_${Date.now()}`,
              variation_index: i,
              url_index: 0,
              fallback: false
            }
          });
          console.log(`✅ MoodMorph: Generated variation ${i + 1} (${mood.id})`);
        }
      } catch (error) {
        console.error(`❌ MoodMorph: Failed to generate variation ${i + 1}:`, error);
        // Continue with other variations
      }
    }

    if (allVariations.length === 0) {
      throw new Error('No variations were generated successfully');
    }

    onProgress(100);
    console.log(`🎉 MoodMorph: Generated ${allVariations.length} variations`);

    // Step 3: Deduct credits first
    const runId = `moodmorph_${Date.now()}`;
    const creditsNeeded = allVariations.length;
    
    console.log(`💰 MoodMorph: Deducting ${creditsNeeded} credits...`);
    const creditsResponse = await fetchWithAuth('/.netlify/functions/deduct-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: creditsNeeded,
        reason: `moodmorph_generation_${creditsNeeded}_variations`,
        requestId: runId
      })
    });

    if (!creditsResponse.ok) {
      if (creditsResponse.status === 402) {
        const errorData = await creditsResponse.json();
        throw new Error(`Insufficient credits: ${errorData.currentCredits} available, ${creditsNeeded} needed`);
      }
      throw new Error(`Credits deduction failed: ${creditsResponse.status}`);
    }

    const creditsResult = await creditsResponse.json();
    console.log(`✅ MoodMorph: Credits deducted successfully. New balance: ${creditsResult.newBalance}`);

    // Step 4: Save media using batch endpoint
    try {
      console.log(`💾 MoodMorph: Saving ${allVariations.length} variations...`);
      const batchResponse = await fetchWithAuth('/.netlify/functions/save-media-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': runId
        },
        body: JSON.stringify({
          variations: allVariations.map(v => ({
            ...v,
            runId,
            media_type: 'image'
          })),
          runId
        })
      });

      if (batchResponse.ok) {
        const batchResult = await batchResponse.json();
        console.log(`✅ MoodMorph: Batch save successful! Saved ${batchResult.count} variations`);
        
        // Trigger UI updates
        window.dispatchEvent(new CustomEvent('userMediaUpdated'));
        window.dispatchEvent(new CustomEvent('generation-success', { 
          detail: { count: batchResult.count, mode: 'moodmorph' } 
        }));
        
        onComplete(allVariations);
      } else {
        throw new Error(`Batch save failed: ${batchResponse.status}`);
      }
    } catch (batchError) {
      console.error('❌ MoodMorph: Batch save failed, trying fallback:', batchError);
      
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
            console.error(`❌ MoodMorph: Fallback failed for variation ${index + 1}:`, fallbackResponse.status);
          }

          // Small delay between saves to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        if (savedCount > 0) {
          console.log(`✅ MoodMorph: Fallback saved ${savedCount}/${allVariations.length} variations`);
          window.dispatchEvent(new CustomEvent('userMediaUpdated'));
          window.dispatchEvent(new CustomEvent('generation-success', { 
            detail: { count: savedCount, mode: 'moodmorph', fallback: true } 
          }));
          onComplete(allVariations.slice(0, savedCount));
        } else {
          throw new Error('All fallback saves failed');
        }
      } catch (fallbackError: any) {
        console.error('❌ MoodMorph: All fallback saves failed:', fallbackError);
        throw new Error(`Failed to save any variations: ${fallbackError.message || 'Unknown error'}`);
      }
    }

  } catch (error: any) {
    console.error('❌ MoodMorph: Generation failed:', error);
    onError(error.message || 'MoodMorph generation failed');
  } finally {
    // Always clear composer state
    clearComposerState();
  }
};




