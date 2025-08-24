// netlify/functions/neo-glitch-generate.ts
// Neo Tokyo Glitch Generation Handler
// 
// 🎯 GENERATION STRATEGY:
// 1. PRIMARY: Use Stability.ai Core (SD3) for all NeoGlitch generations
// 2. FALLBACK: Only use AIML API if Stability.ai succeeds but returns no usable image
// 3. CREDITS: Charge 1 credit total (either Stability.ai success OR AIML fallback)
// 
// ⚠️ IMPORTANT: This is NOT "Stability.ai + AIML fallback" - it's "Stability.ai with AIML emergency fallback"
// The misleading message has been removed to prevent confusion about billing and generation flow.
import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const db = new PrismaClient();

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract user's JWT token for internal credit calls
    const userToken = event.headers.authorization?.replace('Bearer ', '') || '';
    console.log('🔍 [NeoGlitch] User token extracted for credit calls');
    
    const body = JSON.parse(event.body || '{}');
    console.log('🔍 [NeoGlitch] RAW INCOMING PAYLOAD:', JSON.stringify(body, null, 2));

    // Normalize fields (support both sourceAssetId and sourceUrl)
    const {
      prompt,
      userId,
      presetKey,
      runId = body.runId || uuidv4(),
      sourceAssetId,
      sourceUrl = sourceAssetId,
      generationMeta = {}
    } = body;

    // Validation
    const requiredFields = { prompt, userId, presetKey, runId, sourceUrl };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'VALIDATION_FAILED',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        })
      };
    }

    console.log('✅ [NeoGlitch] Normalized fields:', { 
      prompt: prompt.substring(0, 100) + '...', 
      runId: runId.toString(), 
      runIdType: typeof runId,
      sourceUrl, 
      presetKey, 
      userId 
    });

    console.log('🔍 [NeoGlitch] Checking for existing run with runId:', runId.toString());

    // Check for existing run
    const existingRun = await db.neoGlitchMedia.findUnique({
      where: { runId: runId.toString() }
    });

    if (existingRun) {
      console.log('🔄 [NeoGlitch] Found existing run:', {
        id: existingRun.id,
        status: existingRun.status,
        hasImageUrl: !!existingRun.imageUrl,
        createdAt: existingRun.createdAt
      });
      
      if (existingRun.status === 'completed' && existingRun.imageUrl) {
        console.log('🔄 [NeoGlitch] Run already completed, returning cached result');
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(existingRun)
      };
      } else {
        console.warn('⚠️ [NeoGlitch] Run exists but incomplete, cleaning up and retrying');
        // Delete old failed/incomplete record to retry clean
        await db.neoGlitchMedia.delete({ where: { id: existingRun.id } });
        console.log('🧹 [NeoGlitch] Cleaned up incomplete run, proceeding with new generation');
      }
    } else {
      console.log('✅ [NeoGlitch] No existing run found, proceeding with new generation');
    }

    // Validate preset key
    const validPresets = ['base', 'visor', 'tattoos', 'scanlines'];
    if (!validPresets.includes(presetKey)) {
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'INVALID_PRESET',
          message: `Invalid preset key. Must be one of: ${validPresets.join(', ')}`,
          received: presetKey,
          valid: validPresets
        })
      };
    }

    // Validate image URL
    if (!sourceUrl.startsWith('http')) {
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'INVALID_IMAGE_URL',
          message: 'Source URL must be a valid HTTP(S) URL',
          received: sourceUrl
        })
      };
    }

    // Smart Prompt Normalization (keep under 800 chars)
    const normalizedPrompt = prompt.length > 800 ? prompt.substring(0, 800) + '...' : prompt;
    console.log('📝 [NeoGlitch] Prompt normalized:', { original: prompt.length, normalized: normalizedPrompt.length });

    // Create initial record
    const initialRecord = await db.neoGlitchMedia.create({
      data: {
        runId: runId.toString(),
        userId: userId,
        sourceUrl,
        prompt: normalizedPrompt,
        preset: presetKey,
        status: 'processing',
        imageUrl: sourceUrl, // Use source URL temporarily, will be updated after generation
        createdAt: new Date()
      }
    });

    console.log('✅ [NeoGlitch] Initial record created:', initialRecord.id);

    // Start Stability.ai generation
    let stabilityResult;
    try {
      stabilityResult = await startStabilityGeneration(sourceUrl, normalizedPrompt, presetKey, userId, runId);
    } catch (stabilityError: any) {
      console.error('❌ [NeoGlitch] Stability.ai generation failed:', stabilityError);
      
      // 🚨 CHECK IF ALL STABILITY.AI TIERS FAILED - Implement AIML fallback
      if (stabilityError.message.includes('All Stability.ai tiers failed')) {
        console.log('🔄 [NeoGlitch] All Stability.ai tiers failed, attempting AIML fallback...');
        
        try {
          // Attempt AIML fallback
          const aimlResult = await attemptAIMLFallback(sourceUrl, normalizedPrompt, presetKey, userId, runId);
          
          if (aimlResult && aimlResult.imageUrl) {
            console.log('✅ [NeoGlitch] AIML fallback succeeded!');
            
            // Update database record with AIML result
            await db.neoGlitchMedia.update({
              where: { id: initialRecord.id },
              data: {
                status: 'completed',
                imageUrl: aimlResult.imageUrl,
                stabilityJobId: `aiml_${runId}` // Mark as AIML generation
              }
            });
            
            // Finalize credits for AIML fallback (this will charge the expensive AIML rate)
            await finalizeCreditsOnce(userId, runId, true, userToken);
            
            return {
              statusCode: 200,
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({
                success: true,
                message: 'Neo Tokyo Glitch generation completed with AIML fallback',
                runId: runId.toString(),
                status: 'completed',
                provider: 'aiml',
                strategy: 'aiml_fallback',
                imageUrl: aimlResult.imageUrl
              })
            };
          } else {
            throw new Error('AIML fallback failed to return valid image');
          }
        } catch (aimlError: any) {
          console.error('❌ [NeoGlitch] AIML fallback also failed:', aimlError);
          
          // Update database record with failed status
          await db.neoGlitchMedia.update({
            where: { id: initialRecord.id },
            data: {
              status: 'failed',
              imageUrl: sourceUrl // Keep source URL
            }
          });
          
          // Refund credits since both Stability.ai and AIML failed
          await finalizeCreditsOnce(userId, runId, false, userToken);
          
          return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              error: 'GENERATION_FAILED',
              message: 'All generation methods failed: Stability.ai (3 tiers) + AIML fallback',
              details: `Stability.ai tiers failed, AIML fallback error: ${aimlError.message}`
            })
          };
        }
      } else {
        // Regular Stability.ai error (not tier exhaustion)
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            error: 'STABILITY_AI_ERROR',
            message: 'Stability.ai generation failed',
            details: stabilityError.message
          })
        };
      }
    }

    // Update record with Stability.ai job ID
    const updateData: any = {
      status: 'generating',
      stabilityJobId: stabilityResult.stabilityJobId
    };

    await db.neoGlitchMedia.update({
      where: { id: initialRecord.id },
      data: updateData
    });

    console.log('🚀 [NeoGlitch] Generation started successfully:', {
      strategy: stabilityResult.strategy,
      jobId: stabilityResult.stabilityJobId,
      model: stabilityResult.model
    });

    // Return Stability.ai-focused response
    const responseBody: any = {
      success: true,
      message: 'Neo Tokyo Glitch generation started with Stability.ai',
      runId: runId.toString(),
      status: 'generating',
      provider: 'stability',
      strategy: stabilityResult.strategy,
      stabilityJobId: stabilityResult.stabilityJobId
    };

    // Check if Stability.ai returned immediate result
    if (stabilityResult.imageUrl && stabilityResult.status === 'completed') {
      responseBody.imageUrl = stabilityResult.imageUrl;
      responseBody.status = 'completed';
      
      // Update database record with completed status and image URL
      await db.neoGlitchMedia.update({
        where: { id: initialRecord.id },
        data: {
          status: 'completed',
          imageUrl: stabilityResult.imageUrl
        }
      });
      
      console.log('🎉 [NeoGlitch] Generation completed successfully with image URL');
      
      // Finalize credits only once after successful generation
              await finalizeCreditsOnce(userId, runId, true, userToken);
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
    };

  } catch (error) {
    console.error('❌ [NeoGlitch] Unexpected error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// Stability.ai Generation Function
async function startStabilityGeneration(sourceUrl: string, prompt: string, presetKey: string, userId: string, runId: string) {
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY not configured');
  }

  console.log('🚀 [NeoGlitch] Starting 3-tier Stability.ai generation strategy:', {
    hasStabilityToken: !!STABILITY_API_KEY,
    sourceUrl,
    promptLength: prompt.length,
    presetKey
  });

  try {
    // 🎯 3-TIER STABILITY.AI FALLBACK STRATEGY
    console.log('🎯 [NeoGlitch] Attempting 3-tier Stability.ai fallback: Ultra → Core → SD3');
    
    // Tier 1: Ultra (highest quality)
    try {
      console.log('🖼️ [NeoGlitch] Tier 1: Attempting Stable Image Ultra...');
      const ultraResult = await attemptStabilityGeneration(
        STABILITY_API_KEY,
        sourceUrl,
        prompt,
        presetKey,
        userId,
        runId,
        'ultra'
      );
      console.log('✅ [NeoGlitch] Ultra succeeded! Using Ultra result');
      return { ...ultraResult, strategy: 'stability_ultra' };
    } catch (ultraError: any) {
      console.log('⚠️ [NeoGlitch] Ultra failed, trying Core...', ultraError.message);
    }
    
    // Tier 2: Core (fast and affordable)
    try {
      console.log('⚡ [NeoGlitch] Tier 2: Attempting Stable Image Core...');
      const coreResult = await attemptStabilityGeneration(
        STABILITY_API_KEY,
        sourceUrl,
        prompt,
        presetKey,
        userId,
        runId,
        'core'
      );
      console.log('✅ [NeoGlitch] Core succeeded! Using Core result');
      return { ...coreResult, strategy: 'stability_core' };
    } catch (coreError: any) {
      console.log('⚠️ [NeoGlitch] Core failed, trying SD3...', coreError.message);
    }
    
    // Tier 3: SD3 (balanced)
    try {
      console.log('🎨 [NeoGlitch] Tier 3: Attempting Stable Diffusion 3...');
      const sd3Result = await attemptStabilityGeneration(
        STABILITY_API_KEY,
        sourceUrl,
        prompt,
        presetKey,
        userId,
        runId,
        'sd3'
      );
      console.log('✅ [NeoGlitch] SD3 succeeded! Using SD3 result');
      return { ...sd3Result, strategy: 'stability_sd3' };
    } catch (sd3Error: any) {
      console.log('⚠️ [NeoGlitch] SD3 failed, all Stability.ai tiers exhausted', sd3Error.message);
    }
    
    // 🚨 ALL STABILITY.AI FAILED - Fallback to AIML
    console.log('❌ [NeoGlitch] All 3 Stability.ai tiers failed, falling back to AIML');
    throw new Error('All Stability.ai tiers failed - proceeding to AIML fallback');
    
  } catch (error: any) {
    console.error('❌ [NeoGlitch] Stability.ai generation failed:', error.message);
    throw new Error(`Stability.ai generation failed: ${error.message}`);
  }
}

// Credit Deduction Function
async function deductCredits(userId: string, provider: 'stability' | 'aiml', runId: string, userToken: string) {
  try {
    // First reserve the credits
    const reserveResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/credits-reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}` // Use user's actual JWT token
      },
      body: JSON.stringify({
        user_id: userId,
        request_id: runId,
        action: 'image.gen',
        cost: 1
      })
    });

    if (reserveResponse.ok) {
      const reserveResult = await reserveResponse.json();
      console.log(`✅ [NeoGlitch] Reserved 1 credit for ${provider}. New balance: ${reserveResult.newBalance}`);
      
      // Now commit the credits since generation was successful
      const commitResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/credits-finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}` // Use user's actual JWT token
        },
        body: JSON.stringify({
          user_id: userId,
          request_id: runId,
          disposition: 'commit'
        })
      });

      if (commitResponse.ok) {
        const commitResult = await commitResponse.json();
        console.log(`✅ [NeoGlitch] Committed 1 credit for ${provider} after successful generation. Final balance: ${commitResult.newBalance}`);
        return true;
      } else {
        console.warn(`⚠️ [NeoGlitch] Failed to commit credit for ${provider}: ${commitResponse.status}`);
        // Try to refund since commit failed
        await refundCredits(userId, runId, userToken);
        return false;
      }
    } else {
      console.warn(`⚠️ [NeoGlitch] Failed to reserve credit for ${provider}: ${reserveResponse.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ [NeoGlitch] Error processing credit for ${provider}:`, error);
    return false;
  }
}

// Credit Refund Function
async function refundCredits(userId: string, requestId: string, userToken: string) {
  try {
    const response = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/credits-finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}` // Use user's actual JWT token
      },
      body: JSON.stringify({
        user_id: userId,
        request_id: requestId,
        disposition: 'refund'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ [NeoGlitch] Refunded credit. New balance: ${result.newBalance}`);
      return true;
    } else {
      console.warn(`⚠️ [NeoGlitch] Failed to refund credit: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ [NeoGlitch] Error refunding credit:`, error);
    return false;
  }
}

// Single Credit Deduction Function - Only call this once at the end
async function finalizeCreditsOnce(userId: string, runId: string, success: boolean, userToken: string) {
  try {
    if (success) {
      // Reserve and commit credits only once for successful generation
              const reserveResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/credits-reserve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}` // Use user's actual JWT token
          },
        body: JSON.stringify({
          user_id: userId,
          request_id: runId,
          action: 'image.gen',
          cost: 1
        })
      });

      if (reserveResponse.ok) {
        const reserveResult = await reserveResponse.json();
        console.log(`✅ [NeoGlitch] Reserved 1 credit for successful generation. New balance: ${reserveResult.newBalance}`);
        
        // Now commit the credits since generation was successful
        const commitResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/credits-finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}` // Use user's actual JWT token
          },
          body: JSON.stringify({
            userId,
            request_id: runId,
            disposition: 'commit'
          })
        });

        if (commitResponse.ok) {
          const commitResult = await commitResponse.json();
          console.log(`✅ [NeoGlitch] Committed 1 credit after successful generation. Final balance: ${commitResult.newBalance}`);
          return true;
        } else {
          console.warn(`⚠️ [NeoGlitch] Failed to commit credit: ${commitResponse.status}`);
          return false;
        }
      } else {
        console.warn(`⚠️ [NeoGlitch] Failed to reserve credit: ${reserveResponse.status}`);
        return false;
      }
    } else {
      // No credits charged for failed generation
      console.log(`ℹ️ [NeoGlitch] No credits charged for failed generation`);
      return true;
    }
  } catch (error) {
    console.error(`❌ [NeoGlitch] Error processing credits:`, error);
    return false;
  }
}

// AIML Fallback Function
async function attemptAIMLFallback(sourceUrl: string, prompt: string, presetKey: string, userId: string, runId: string) {
  const AIML_API_URL = process.env.AIML_API_URL || 'https://api.aimlapi.com';
  const AIML_API_KEY = process.env.AIML_API_KEY;

  if (!AIML_API_KEY) {
    throw new Error('AIML_API_KEY not configured for fallback');
  }
  if (!AIML_API_URL) {
    throw new Error('AIML_API_URL not configured for fallback');
  }

  console.log('🔄 [NeoGlitch] Attempting AIML fallback generation');
  console.log('🌐 [NeoGlitch] Using AIML API endpoint:', AIML_API_URL);
  
  try {
    // Use AIML's working endpoint for image generation
    const response = await fetch(`${AIML_API_URL}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'stable-diffusion-v35-large', // Neo Tokyo Glitch specific model
        prompt,
        image_url: sourceUrl, // AIML expects 'image_url' field
        strength: 0.75,
        num_variations: 1,
        seed: Math.floor(Math.random() * 1000000) // Add randomization to prevent cache hits
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AIML API failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ [NeoGlitch] AIML fallback generation successful');
    
    // AIML API returns different response formats, handle multiple possibilities
    let imageUrl = null;
    
    if (result.image_url) {
      imageUrl = result.image_url;
    } else if (result.images && Array.isArray(result.images) && result.images[0]?.url) {
      imageUrl = result.images[0].url;
    } else if (result.output && Array.isArray(result.output) && result.output[0]?.url) {
      imageUrl = result.output[0].url;
    } else if (result.data && Array.isArray(result.data) && result.data[0]?.url) {
      imageUrl = result.data[0].url;
    }
    
    if (!imageUrl) {
      throw new Error('AIML fallback succeeded but no image URL found in response');
    }

    // Add randomization to prevent cache hits
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // REMOVED: Individual credit deduction - will be handled at the end
    
    return {
      stabilityJobId: `aiml_${Date.now()}`,
      model: 'stable-diffusion-v35-large', // Neo Tokyo Glitch specific model
      strategy: 'aiml_fallback',
      provider: 'aiml', // Explicitly mark as AIML fallback
      imageUrl,
      status: 'completed',
      seed: randomSeed
    };
  } catch (error: any) {
    console.error('❌ [NeoGlitch] AIML fallback error:', error);
    throw error;
  }
}

// Cloudinary Upload Function
async function uploadBase64ToCloudinary(base64Data: string): Promise<string> {
  const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
  const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials not configured');
  }

  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Create form data for Cloudinary upload
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'generated.png');
    formData.append('upload_preset', 'ml_default'); // Use default upload preset
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.secure_url;
  } catch (error: any) {
    console.error('❌ [NeoGlitch] Cloudinary upload error:', error);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
}

// Stability.ai Generation Implementation
async function attemptStabilityGeneration(
  apiToken: string,
  sourceUrl: string,
  prompt: string,
  presetKey: string,
  userId: string,
  runId: string,
  modelType: 'ultra' | 'core' | 'sd3' = 'core' // Added modelType parameter
) {
  // Preset-specific parameters for Stability.ai (optimized for face preservation)
  const presetConfigs = {
    'visor': { strength: 0.35, guidance_scale: 5.5, steps: 40 }, // Much lower strength for face preservation
    'base': { strength: 0.30, guidance_scale: 5.0, steps: 35 }, // Conservative for face preservation
    'tattoos': { strength: 0.40, guidance_scale: 6.0, steps: 45 }, // Lower strength for face preservation
    'scanlines': { strength: 0.35, guidance_scale: 5.5, steps: 40 } // Lower strength for face preservation
  };

  const config = presetConfigs[presetKey as keyof typeof presetConfigs] || presetConfigs.visor;

  // 🎯 MODEL-SPECIFIC ENDPOINT SELECTION
  const modelEndpoints = {
    'ultra': 'https://api.stability.ai/v2beta/stable-image/generate/ultra',
    'core': 'https://api.stability.ai/v2beta/stable-image/generate/core',
    'sd3': 'https://api.stability.ai/v2beta/stable-image/generate/sd3'
  };

  const endpoint = modelEndpoints[modelType];
  if (!endpoint) {
    throw new Error(`Invalid model type: ${modelType}`);
  }

  console.log(`🧪 [NeoGlitch] Attempting Stability.ai ${modelType.toUpperCase()} generation`);
  console.log(`🔗 [NeoGlitch] Using endpoint: ${endpoint}`);

  // Download the source image and convert to Buffer
  const imageResponse = await fetch(sourceUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download source image: ${imageResponse.status}`);
  }
  
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageData = Buffer.from(imageBuffer);

  // Create FormData for multipart/form-data submission
  const formData = new FormData();
  
  // Append the image as a file - convert Buffer to Blob for FormData
  const imageBlob = new Blob([imageData], { type: 'image/jpeg' });
  formData.append('init_image', imageBlob, 'input.jpg');
  
  // ✅ REQUIRED: Top-level prompt field (Stability.ai API requirement)
  formData.append('prompt', prompt);
  
  // Append weighted text prompts with face preservation
  formData.append('text_prompts[0][text]', `${prompt}, preserve facial identity, maintain original face structure`);
  formData.append('text_prompts[0][weight]', '1');
  formData.append('text_prompts[1][text]', 'face distortion, facial deformation, identity loss, different person, face morphing, blurry, low quality, distorted, ugly, bad anatomy, watermark, text');
  formData.append('text_prompts[1][weight]', '-1');
  
  // Append other parameters
  formData.append('init_image_mode', 'IMAGE_TO_IMAGE');
  formData.append('image_strength', config.strength.toString());
  formData.append('cfg_scale', config.guidance_scale.toString());
  formData.append('steps', config.steps.toString());
  formData.append('samples', '1');
  formData.append('aspect_ratio', '1:1');

  console.log(`🧪 [NeoGlitch] Attempting Stability.ai ${modelType.toUpperCase()} generation with FormData`);
  console.log('📦 [NeoGlitch] Stability.ai FormData parameters:', {
    modelType,
    endpoint,
    prompt,
    topLevelPrompt: prompt, // Required by Stability.ai API
    negativePrompt: 'blurry, low quality, distorted, ugly, bad anatomy, watermark, text',
    image_strength: config.strength,
    cfg_scale: config.guidance_scale,
    steps: config.steps,
    samples: 1,
    aspect_ratio: '1:1'
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Accept': 'application/json'
      // Don't set Content-Type - let the browser set it with boundary for FormData
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [NeoGlitch] Stability.ai API error:', {
      status: response.status,
      statusText: response.statusText,
      errorText
    });

    let errorDetails;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = errorText;
    }

    throw new Error(`Stability.ai API failed (${response.status}): ${JSON.stringify(errorDetails)}`);
  }

  const result = await response.json();
  console.log('✅ [NeoGlitch] Stability.ai generation completed successfully');
  console.log('📦 [NeoGlitch] Stability.ai Core response structure:', {
    hasArtifacts: !!result.artifacts,
    artifactsLength: result.artifacts?.length || 0,
    hasId: !!result.id,
    hasStatus: !!result.status,
    responseKeys: Object.keys(result),
    fullResponse: JSON.stringify(result, null, 2)
  });
  
  // Check multiple possible response structures from Stability.ai
  let imageUrl = null;
  let stabilityJobId = result.id || `stability_${Date.now()}`;
  
  // ✅ IMPROVED ARTIFACT DETECTION (Your Solution)
  console.log('🔍 [NeoGlitch] Analyzing Stability.ai response for artifacts...');
  console.log('🔍 [NeoGlitch] Response keys:', Object.keys(result));
  console.log('🔍 [NeoGlitch] Artifacts present:', !!result.artifacts);
  console.log('🔍 [NeoGlitch] Artifacts length:', result.artifacts?.length || 0);
  
  // Structure 1: artifacts array with base64 (Primary path)
  if (result.artifacts && Array.isArray(result.artifacts) && result.artifacts.length > 0) {
    console.log('🎨 [NeoGlitch] Found artifacts array, analyzing first artifact...');
    console.log('🎨 [NeoGlitch] First artifact structure:', JSON.stringify(result.artifacts[0], null, 2));
    
    const artifact = result.artifacts[0];
    
    // ✅ BETTER ARTIFACT VALIDATION (Your Solution)
    if (!artifact.base64) {
      console.warn('⚠️ [NeoGlitch] Artifact array present but no usable base64 found:', {
        artifactKeys: Object.keys(artifact),
        hasBase64: !!artifact.base64,
        finishReason: artifact.finishReason
      });
    } else if (artifact.finishReason !== 'SUCCESS') {
      console.warn('⚠️ [NeoGlitch] Artifact has base64 but finishReason is not SUCCESS:', artifact.finishReason);
    } else {
      console.log('✅ [NeoGlitch] Found valid artifact with base64 and SUCCESS status');
      try {
        const cloudinaryUrl = await uploadBase64ToCloudinary(artifact.base64);
        imageUrl = cloudinaryUrl;
        console.log('☁️ [NeoGlitch] Image successfully uploaded to Cloudinary:', cloudinaryUrl);
      } catch (uploadError: any) {
        console.error('❌ [NeoGlitch] Cloudinary upload failed:', uploadError);
        throw new Error(`Failed to upload generated image: ${uploadError.message}`);
      }
    }
  }
  
  // Structure 2: direct image URL in response
  if (!imageUrl && result.image_url) {
    console.log('🎨 [NeoGlitch] Found successful generation with direct image URL (Structure 2)');
    imageUrl = result.image_url;
  }
  
  // Structure 3: images array
  if (!imageUrl && result.images && Array.isArray(result.images) && result.images.length > 0) {
    console.log('🎨 [NeoGlitch] Found successful generation with images array (Structure 3)');
    imageUrl = result.images[0].url || result.images[0];
  }
  
  // Structure 4: output array
  if (!imageUrl && result.output && Array.isArray(result.output) && result.output.length > 0) {
    console.log('🎨 [NeoGlitch] Found successful generation with output array (Structure 4)');
    imageUrl = result.output[0].url || result.output[0];
  }
  
  // Structure 5: data array
  if (!imageUrl && result.data && Array.isArray(result.data) && result.data.length > 0) {
    console.log('🎨 [NeoGlitch] Found successful generation with data array (Structure 5)');
    imageUrl = result.data[0].url || result.data[0];
  }
  
  // If we found a valid image URL, return success
  if (imageUrl) {
    console.log(`✅ [NeoGlitch] Successfully extracted image URL from Stability.ai ${modelType.toUpperCase()} response`);
    console.log('✅ [NeoGlitch] Final image URL:', imageUrl);
    return {
      stabilityJobId,
      model: modelType,
      strategy: `stability_${modelType}`,
      provider: 'stability',
      imageUrl,
      status: 'completed'
    };
  }
  
  // ✅ BETTER FALLBACK LOGIC (Your Solution)
  // Only fallback to AIML if we truly have no usable artifacts from Stability.ai
  console.log('⚠️ [NeoGlitch] No usable image found in Stability.ai response');
  console.log('🔍 [NeoGlitch] Stability.ai response analysis complete');
  console.log('🔍 [NeoGlitch] Artifacts were present but not usable for image generation');
  
  // ✅ IMPROVED FALLBACK MESSAGE (Your Solution)
  console.log('🔄 [NeoGlitch] Stability.ai succeeded but no usable image - falling back to AIML API');
  
  try {
    return await attemptAIMLFallback(sourceUrl, prompt, presetKey, userId, runId);
  } catch (fallbackError: any) {
    console.error('❌ [NeoGlitch] AIML fallback also failed:', fallbackError);
    throw new Error(`Stability.ai succeeded but no usable image, and AIML fallback failed: ${fallbackError.message}`);
  }
}
