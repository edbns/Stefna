// netlify/functions/custom-prompt-generate.ts
// Custom Prompt Generation Handler
// 
// 🎯 GENERATION STRATEGY:
// 1. PRIMARY: Use AIML API for all Custom Prompt generations
// 2. FALLBACK: None needed (AIML is reliable for this)
// 3. CREDITS: Charge 1 credit total
// 4. CUSTOM: User provides their own prompt for AI generation
// 
// ⚠️ IMPORTANT: This follows the exact NeoGlitch pattern that works perfectly
import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

// 🚀 SYNCHRONOUS MODE: Process generation immediately like NeoGlitch
// No more background processing or polling needed

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});





// Helper function to upload AIML results to Cloudinary
async function uploadAIMLToCloudinary(imageUrl: string, presetKey: string): Promise<{ url: string; publicId: string }> {
  try {
    console.log('☁️ [CustomPrompt] Uploading AIML result to Cloudinary:', imageUrl.substring(0, 60) + '...');
    
    const result = await cloudinary.uploader.upload(imageUrl, {
      resource_type: 'image',
      tags: ['custom-prompt', 'aiml', `preset:${presetKey}`],
      folder: 'custom-prompt',
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' },
        { width: 1024, height: 1024, crop: 'limit' }
      ]
    });
    
    console.log('✅ [CustomPrompt] Cloudinary upload successful:', {
      publicId: result.public_id,
      url: result.secure_url,
      size: result.bytes
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('❌ [CustomPrompt] Cloudinary upload failed:', error);
    throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// AIML API Generation Function with Fallback System
async function startFALGeneration(sourceUrl: string, prompt: string, presetKey: string, userId: string, runId: string) {
  console.log('🚀 [CustomPrompt] Starting FAL.ai generation with semantic fallback system:', {
    presetKey,
    promptLength: prompt.length,
    hasSource: !!sourceUrl,
    generationType: 'custom'
  });

  // Call centralized FAL.ai function with custom generation type
  // This will use PHOTO_MODELS: Hyper SDXL → Stable Diffusion XL → Realistic Vision V5
  const response = await fetch(`${process.env.URL}/.netlify/functions/fal-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sourceUrl,
      prompt,
      generationType: 'custom',
      userId,
      runId
    })
  });

  if (!response.ok) {
    throw new Error(`FAL.ai generation failed: ${response.statusText}`);
  }

  const falResult = await response.json();

  // Process the FAL.ai result and continue with the rest of the custom prompt logic
  console.log('✅ [CustomPrompt] FAL.ai generation successful:', {
    falModel: falResult.falModel,
    attemptCount: falResult.attemptCount,
    fallbackUsed: falResult.fallbackUsed
  });

  // Extract the image URL and continue with existing logic
  const imageUrl = falResult.imageUrl;

  if (!imageUrl) {
    throw new Error('No image URL returned from FAL.ai generation');
  }

  console.log(`🎉 [CustomPrompt] FAL.ai generation successful:`, {
    imageUrl: imageUrl.substring(0, 60) + '...',
    presetKey,
    falModel: falResult.falModel
  });

  return {
    status: 'completed',
    imageUrl: imageUrl,
    falJobId: `${falResult.falModel.toLowerCase().replace(/\s+/g, '_')}_${runId}`,
    model: falResult.falModel,
    modelName: falResult.falModel,
    attemptCount: falResult.attemptCount,
    fallbackUsed: falResult.fallbackUsed
  };
}

// Individual AIML generation attempt
async function attemptAIMLGeneration(
  sourceUrl: string, 
  prompt: string, 
  presetKey: string, 
  userId: string, 
  runId: string, 
  model: string,
  modelName: string
) {
  const AIML_API_KEY = process.env.AIML_API_KEY;
  const AIML_API_URL = process.env.AIML_API_URL;

  console.log(`📤 [CustomPrompt] Sending to ${modelName} API:`, {
    model,
    preset: 'custom',
    promptLength: prompt.length,
    customPrompt: prompt.substring(0, 100) + '...'
  });

  const response = await fetch(`${AIML_API_URL}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AIML_API_KEY}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      init_image: sourceUrl,
      image_strength: 0.5,
      num_images: 1,
      guidance_scale: 7.5,
      num_inference_steps: 30,
      seed: Math.floor(Math.random() * 1000000)
    }),
    // Add timeout to prevent stuck jobs (3 minutes max)
    signal: AbortSignal.timeout(3 * 60 * 1000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [CustomPrompt] ${modelName} API error:`, response.status, errorText);
    throw new Error(`${modelName} API failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ [CustomPrompt] ${modelName} API response received:`, {
    hasResult: !!result,
    resultKeys: result ? Object.keys(result) : 'none'
  });

  // Extract image URL from AIML v1 API response format
  let imageUrl = null;
  
  // Handle v1 response format: result.output.choices[0].image_base64
  if (result.output && result.output.choices && result.output.choices[0]?.image_base64) {
    console.log(`✅ [CustomPrompt] Found v1 response format with base64 image from ${modelName}`);
    try {
      // Convert base64 to Cloudinary URL
      const cloudinaryUrl = await uploadBase64ToCloudinary(result.output.choices[0].image_base64);
      imageUrl = cloudinaryUrl;
      console.log(`☁️ [CustomPrompt] Image successfully uploaded to Cloudinary from ${modelName}:`, cloudinaryUrl);
    } catch (uploadError: any) {
      console.error(`❌ [CustomPrompt] Cloudinary upload failed for ${modelName}:`, uploadError);
      throw new Error(`Failed to upload generated image from ${modelName}: ${uploadError.message}`);
    }
  } else if (result.image_url) {
    // Fallback to direct URL if present
    imageUrl = result.image_url;
  } else if (result.images && Array.isArray(result.images) && result.images[0]?.url) {
    // Fallback to images array if present
    imageUrl = result.images[0].url;
  }
  
  if (!imageUrl) {
    console.error(`❌ [CustomPrompt] No image URL in ${modelName} response:`, result);
    throw new Error(`${modelName} API returned no image URL`);
  }

  console.log(`🎉 [CustomPrompt] ${modelName} generation successful:`, {
    imageUrl: imageUrl.substring(0, 60) + '...',
    presetKey,
    customPrompt: prompt.substring(0, 100) + '...',
    model
  });

  return {
    status: 'completed',
    imageUrl: imageUrl,
    aimlJobId: `${modelName.toLowerCase().replace(/\s+/g, '_')}_${runId}`,
    model: model,
    modelName: modelName
  };
}

// Cloudinary Upload Function for base64 images
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
    formData.append('upload_preset', 'ml_default');
    
    // Upload to Cloudinary
    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Cloudinary upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    return uploadResult.secure_url;
  } catch (error: any) {
    console.error('❌ [CustomPrompt] Cloudinary upload error:', error);
    throw error;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle GET requests for status checking
  if (event.httpMethod === 'GET') {
    const jobId = event.queryStringParameters?.jobId;
    if (!jobId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'jobId parameter required' })
      };
    }

    try {
      const status = await qOne(`
        SELECT id, status, image_url, created_at, preset, prompt, aiml_job_id
        FROM custom_prompt_media
        WHERE id = $1
      `, [jobId]);

      if (!status) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Job not found' })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(status)
      };
    } catch (error) {
      console.error('❌ [CustomPrompt] Status check failed:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Status check failed' })
      };
    }
  }

  try {
    // Extract user's JWT token for internal credit calls
    const userToken = event.headers.authorization?.replace('Bearer ', '') || '';
    console.log('🔍 [CustomPrompt] User token extracted for credit calls');
    
    const body = JSON.parse(event.body || '{}');
    console.log('🔍 [CustomPrompt] RAW INCOMING PAYLOAD:', JSON.stringify(body, null, 2));

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

    // Normalize preset: always treat as 'custom', but accept aliases in generationMeta
    const metaPreset = (generationMeta.presetKey || generationMeta.preset || generationMeta.label || '').toString().toLowerCase();
    const effectivePresetKey = (metaPreset || presetKey || 'custom').toString();

    // Validation (do not require presetKey explicitly; we default to 'custom')
    const requiredFields = { prompt, userId, runId, sourceUrl };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return {
        statusCode: 422,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'VALIDATION_FAILED',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        })
      };
    }

    // Validate custom prompt length
    if (!prompt || prompt.trim().length < 10) {
      return {
        statusCode: 422,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'INVALID_PROMPT',
          message: 'Custom prompt must be at least 10 characters long',
          received: prompt,
          minLength: 10
        })
      };
    }

    // Validate prompt length (not too long)
    if (prompt.length > 1000) {
      return {
        statusCode: 422,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'PROMPT_TOO_LONG',
          message: 'Custom prompt must be less than 1000 characters',
          received: prompt.length,
          maxLength: 1000
        })
      };
    }

    console.log('✅ [CustomPrompt] Normalized fields:', { 
      prompt: prompt.substring(0, 100) + '...', 
      runId: runId.toString(), 
      runIdType: typeof runId,
      sourceUrl, 
      presetKey: effectivePresetKey, 
      userId 
    });

    console.log('🔍 [CustomPrompt] Checking for existing run with runId:', runId.toString());

    // Check for existing run
    const existingRun = await qOne(`
      SELECT id, status, image_url, created_at
      FROM custom_prompt_media
      WHERE run_id = $1
    `, [runId.toString()]);

    if (existingRun) {
      console.log('🔄 [CustomPrompt] Found existing run:', {
        id: existingRun.id,
        status: existingRun.status,
        hasImageUrl: !!existingRun.image_url,
        createdAt: existingRun.created_at
      });
      
      if (existingRun.status === 'completed' && existingRun.image_url) {
        console.log('🔄 [CustomPrompt] Run already completed, returning cached result');
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(existingRun)
        };
      } else {
        console.warn('⚠️ [CustomPrompt] Run exists but incomplete, cleaning up and retrying');
        // Delete old failed/incomplete record to retry clean
        await q(`DELETE FROM custom_prompt_media WHERE id = $1`, [existingRun.id]);
        console.log('🧹 [CustomPrompt] Cleaned up incomplete run, proceeding with new generation');
      }
    } else {
      console.log('✅ [CustomPrompt] No existing run found, proceeding with new generation');
    }

    // Validate preset key
    const validPresets = ['custom'];
    if (!validPresets.includes(effectivePresetKey)) {
      return {
        statusCode: 422,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'INVALID_PRESET',
          message: `Invalid preset key. Must be one of: ${validPresets.join(', ')}`,
          received: effectivePresetKey,
          valid: validPresets
        })
      };
    }

    // Validate image URL
    if (!sourceUrl.startsWith('http')) {
      return {
        statusCode: 422,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'INVALID_IMAGE_URL',
          message: 'Source URL must be a valid HTTP(S) URL',
          received: sourceUrl
        })
      };
    }

    // Reserve credits first
    console.log('💰 [CustomPrompt] Reserving 1 credit for generation...');
    const creditReservation = await fetch(`${process.env.URL}/.netlify/functions/credits-reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        userId,
        amount: 1,
        requestId: runId,
        action: 'custom_prompt_generation',
        meta: { presetKey: effectivePresetKey, prompt: prompt.substring(0, 100) }
      })
    });

    if (!creditReservation.ok) {
      const creditError = await creditReservation.json().catch(() => ({}));
      console.error('❌ [CustomPrompt] Credit reservation failed:', creditError);
      return {
        statusCode: 402,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'INSUFFICIENT_CREDITS',
          message: 'Not enough credits for generation',
          details: creditError
        })
      };
    }

    console.log('✅ [CustomPrompt] Credit reserved successfully');

    // Create initial record
    const initialRecord = await qOne(`
      INSERT INTO custom_prompt_media (id, user_id, source_url, prompt, preset, run_id, status, image_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id
    `, [uuidv4(), userId, sourceUrl, prompt, effectivePresetKey, runId.toString(), 'pending', sourceUrl]);

    console.log('✅ [CustomPrompt] Initial record created:', initialRecord.id);

    // Start generation immediately
    console.log('🚀 [CustomPrompt] Starting FAL.ai generation...');
    
    try {
      const generationResult = await startFALGeneration(sourceUrl, prompt, effectivePresetKey, userId, runId);

      if (generationResult?.imageUrl) {
        console.log('🎉 [CustomPrompt] Generation completed immediately!');
        
        // Upload to Cloudinary
        let finalImageUrl = generationResult.imageUrl;
        let cloudinaryPublicId: string | null = null;
        
        try {
          const cloudinaryResult = await uploadAIMLToCloudinary(generationResult.imageUrl, effectivePresetKey);
          finalImageUrl = cloudinaryResult.url;
          cloudinaryPublicId = cloudinaryResult.publicId;
          console.log('✅ [CustomPrompt] Result uploaded to Cloudinary successfully');
        } catch (cloudinaryError) {
          console.warn('⚠️ [CustomPrompt] Cloudinary upload failed, using original AIML URL:', cloudinaryError);
          // Fallback to original URL if Cloudinary fails
        }
        
                // Update database record with completed status
        await q(`
          UPDATE custom_prompt_media
          SET status = $1, image_url = $2, updated_at = NOW()
          WHERE id = $3
        `, ['completed', finalImageUrl, initialRecord.id]);
        
        console.log('✅ [CustomPrompt] Database updated with completed status');
        
        // Finalize credits
        await fetch(`${process.env.URL}/.netlify/functions/credits-finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            userId,
            requestId: runId,
            success: true,
            meta: { 
              presetKey: effectivePresetKey, 
              customPrompt: prompt.substring(0, 100),
              finalImageUrl: finalImageUrl.substring(0, 100) 
            }
          })
        });
        
        console.log('✅ [CustomPrompt] Credits finalized successfully');
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Generation completed successfully',
            jobId: initialRecord.id,
            runId: runId.toString(),
            status: 'completed',
            imageUrl: finalImageUrl,
            provider: 'fal',
            customPrompt: prompt.substring(0, 100) + '...'
          })
        };
      } else {
        // This should not happen based on startFALGeneration logic, but handle it just in case
        console.error('❌ [CustomPrompt] Generation completed but no image URL returned');
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: 'GENERATION_FAILED',
            message: 'Generation completed but no image was returned'
          })
        };
      }

    } catch (generationError: any) {
      console.error('❌ [CustomPrompt] Generation failed:', generationError);
      
      // Update database record with failed status
      await q(`
        UPDATE custom_prompt_media 
        SET status = $1, image_url = $2, updated_at = NOW()
        WHERE id = $3
      `, ['failed', sourceUrl, initialRecord.id]);
      
      // Refund credits since generation failed
      await fetch(`${process.env.URL}/.netlify/functions/credits-finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          userId,
          requestId: runId,
          success: false,
          meta: { presetKey: effectivePresetKey, error: generationError.message }
        })
      });
      
      console.log('✅ [CustomPrompt] Credits refunded due to generation failure');
      
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'GENERATION_FAILED',
          message: 'Custom prompt generation failed',
          details: generationError.message
        })
      };
    }

  } catch (error) {
    console.error('❌ [CustomPrompt] Unexpected error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
