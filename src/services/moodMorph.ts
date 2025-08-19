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
  // Declare requestId at function scope for error handling
  let requestId: string | null = null;
  
  try {
    console.log('🚀 MoodMorph: Starting generation...');
    
    // Step 1: Upload source to Cloudinary
    const sourcePublicId = await uploadSourceToCloudinary({ file: sourceFile });
    console.log('📤 MoodMorph: Source uploaded:', sourcePublicId);
    
    // Step 1.5: Create asset record for source image
    let sourceAssetId: string | null = null;
    try {
      const createAssetResponse = await fetchWithAuth('/.netlify/functions/create-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePublicId,
          mediaType: 'image',
          prompt: 'Source image for MoodMorph transformation',
          meta: {
            source: 'moodmorph',
            originalFile: sourceFile.name
          }
        })
      });
      
      if (createAssetResponse.ok) {
        const assetResult = await createAssetResponse.json();
        sourceAssetId = assetResult.asset?.id || null;
        console.log('📝 MoodMorph: Source asset created with ID:', sourceAssetId);
      } else {
        console.warn('⚠️ MoodMorph: Could not create source asset, continuing without source tracking');
      }
    } catch (error) {
      console.warn('⚠️ MoodMorph: Error creating source asset:', error);
      // Continue without source tracking
    }
    
    // Step 2: Reserve credits BEFORE generation (3 credits for 3 variations)
    const runId = `moodmorph_${Date.now()}`;
    const creditsNeeded = MOODS.length; // Always 3 for MoodMorph
    
    console.log(`💰 MoodMorph: Reserving ${creditsNeeded} credits BEFORE generation...`);
    const creditsResponse = await fetchWithAuth('/.netlify/functions/credits-reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'moodmorph',
        cost: creditsNeeded
      })
    });

    if (!creditsResponse.ok) {
      if (creditsResponse.status === 429) {
        const errorData = await creditsResponse.json();
        throw new Error(`Daily cap reached: ${errorData.error}`);
      }
      throw new Error(`Credits reservation failed: ${creditsResponse.status}`);
    }

    const creditsResult = await creditsResponse.json();
    console.log(`✅ MoodMorph: Credits reserved successfully. New balance: ${creditsResult.balance}`);
    
    // Store the request_id for finalization
    requestId = creditsResult.request_id;
    if (!requestId) {
      throw new Error('No request_id returned from credits reservation');
    }

    // Step 3: Generate variations via AIML (after credits reserved)
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
              runId: runId, // Use the same runId from credit reservation
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
            image_url: v.url, // Map url to image_url for save-media-batch
            source_public_id: sourceAssetId, // Use the UUID from the source asset
            runId,
            media_type: 'image'
          })),
          runId,
          credits_used: creditsNeeded // Add credit metadata for consistency
        })
      });

      if (batchResponse.ok) {
        const batchResult = await batchResponse.json();
        console.log(`✅ MoodMorph: Batch save successful! Saved ${batchResult.count} variations`);
        
        // 💰 Finalize credits (commit) after successful generation
        try {
          console.log('💰 MoodMorph: Finalizing credits (commit)...');
          const finalizeResponse = await fetchWithAuth('/.netlify/functions/credits-finalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              request_id: requestId,
              disposition: 'commit'
            })
          });
          
          if (finalizeResponse.ok) {
            const finalizeResult = await finalizeResponse.json();
            console.log('✅ MoodMorph: Credits finalized successfully:', finalizeResult);
          } else {
            console.error('❌ MoodMorph: Credits finalization failed:', finalizeResponse.status);
            // Don't throw here - generation succeeded, just log the credit issue
          }
        } catch (finalizeError) {
          console.error('❌ MoodMorph: Credits finalization error:', finalizeError);
          // Don't throw here - generation succeeded, just log the credit issue
        }
        
        // Trigger UI updates
        window.dispatchEvent(new CustomEvent('userMediaUpdated'));
        window.dispatchEvent(new CustomEvent('generation-success', { 
          detail: { count: batchResult.count, mode: 'moodmorph' } 
        }));
        
        // Refresh feed and user media after MoodMorph completion
        setTimeout(() => {
          console.log('🔄 Refreshing feed and user media after MoodMorph completion...');
          // Dispatch event to refresh user media
          window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
            detail: { count: batchResult.count, runId: runId } 
          }));
        }, 1000); // 1 second delay to let user see the result
        
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
          
          // 💰 Finalize credits (commit) after successful fallback generation
          try {
            console.log('💰 MoodMorph: Finalizing credits (commit) after fallback...');
            const finalizeResponse = await fetchWithAuth('/.netlify/functions/credits-finalize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                request_id: requestId,
                disposition: 'commit'
              })
            });
            
            if (finalizeResponse.ok) {
              const finalizeResult = await finalizeResponse.json();
              console.log('✅ MoodMorph: Credits finalized successfully after fallback:', finalizeResult);
            } else {
              console.error('❌ MoodMorph: Credits finalization failed after fallback:', finalizeResponse.status);
              // Don't throw here - generation succeeded, just log the credit issue
            }
          } catch (finalizeError) {
            console.error('❌ MoodMorph: Credits finalization error after fallback:', finalizeError);
            // Don't throw here - generation succeeded, just log the credit issue
          }
          
          window.dispatchEvent(new CustomEvent('userMediaUpdated'));
          window.dispatchEvent(new CustomEvent('generation-success', { 
            detail: { count: savedCount, mode: 'moodmorph', fallback: true } 
          }));
          
          // Refresh feed and user media after MoodMorph fallback completion
          setTimeout(() => {
            console.log('🔄 Refreshing feed and user media after MoodMorph fallback completion...');
            // Dispatch event to refresh user media
            window.dispatchEvent(new CustomEvent('userMediaUpdated', { 
              detail: { count: savedCount, runId: runId } 
            }));
          }, 1000); // 1 second delay to let user see the result
          
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
    
    // 💰 Refund credits if generation failed
    if (requestId) {
      try {
        console.log('💰 MoodMorph: Refunding credits due to generation failure...');
        const refundResponse = await fetchWithAuth('/.netlify/functions/credits-finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_id: requestId,
            disposition: 'refund'
          })
        });
        
        if (refundResponse.ok) {
          const refundResult = await refundResponse.json();
          console.log('✅ MoodMorph: Credits refunded successfully:', refundResult);
        } else {
          console.error('❌ MoodMorph: Credits refund failed:', refundResponse.status);
        }
      } catch (refundError) {
        console.error('❌ MoodMorph: Credits refund error:', refundError);
      }
    }
    
    onError(error.message || 'MoodMorph generation failed');
  } finally {
    // Always clear composer state
    clearComposerState();
  }
};




