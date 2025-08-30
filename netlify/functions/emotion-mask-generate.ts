// netlify/functions/emotion-mask-generate.ts
// Emotion Mask Generation Handler
// 
// 🎯 GENERATION STRATEGY:
// 1. PRIMARY: Use AIML API for all Emotion Mask generations
// 2. FALLBACK: None needed (AIML is reliable for this)
// 3. CREDITS: Charge 1 credit total
// 
// ⚠️ IMPORTANT: This follows the exact NeoGlitch pattern that works perfectly
import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import { getFreshToken, isTokenExpiredError } from './utils/tokenRefresh';
import { checkIdentityPreservation, getIPAThreshold, meetsIPAQualityStandards } from './_lib/ipaUtils';

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
    console.log('☁️ [EmotionMask] Uploading AIML result to Cloudinary:', imageUrl.substring(0, 60) + '...');
    
    const result = await cloudinary.uploader.upload(imageUrl, {
      resource_type: 'image',
      tags: ['emotion-mask', 'aiml', `preset:${presetKey}`],
      folder: 'emotion-mask',
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' },
        { width: 1024, height: 1024, crop: 'limit' }
      ]
    });
    
    console.log('✅ [EmotionMask] Cloudinary upload successful:', {
      publicId: result.public_id,
      url: result.secure_url,
      size: result.bytes
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('❌ [EmotionMask] Cloudinary upload failed:', error);
    throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// AIML API Generation Function with Fallback System
async function startAIMLGeneration(sourceUrl: string, prompt: string, presetKey: string, userId: string, runId: string) {
  const AIML_API_KEY = process.env.AIML_API_KEY;
  const AIML_API_URL = process.env.AIML_API_URL;

  if (!AIML_API_KEY || !AIML_API_URL) {
    throw new Error('AIML API configuration missing');
  }

  console.log('🚀 [EmotionMask] Starting AIML generation with fallback system:', {
    presetKey,
    promptLength: prompt.length,
    hasSource: !!sourceUrl
  });

  // Define AIML models in order of preference (cheap → expensive → best quality)
  const aimlModels = [
    { model: 'flux/dev/image-to-image', name: 'Flux Dev', cost: 'low', priority: 1 },
    { model: 'flux/pro/image-to-image', name: 'Flux Pro', cost: 'medium', priority: 2 },
    { model: 'flux/realism/image-to-image', name: 'Flux Realism', cost: 'high', priority: 3 }
  ];

  let lastError: Error | null = null;
  let attemptCount = 0;

  // Try each AIML model until one succeeds
  for (const aimlModel of aimlModels) {
    attemptCount++;
    console.log(`🔄 [EmotionMask] Attempt ${attemptCount}/${aimlModels.length}: ${aimlModel.name} (${aimlModel.cost} cost)`);

    try {
      const result = await attemptAIMLGeneration(
        sourceUrl, 
        prompt, 
        presetKey, 
        userId, 
        runId, 
        aimlModel.model,
        aimlModel.name
      );

      console.log(`✅ [EmotionMask] ${aimlModel.name} generation successful on attempt ${attemptCount}`);
      return {
        ...result,
        aimlModel: aimlModel.name,
        attemptCount,
        fallbackUsed: attemptCount > 1
      };

    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ [EmotionMask] ${aimlModel.name} failed (attempt ${attemptCount}):`, error.message);
      
      // If this isn't the last attempt, continue to next model
      if (attemptCount < aimlModels.length) {
        console.log(`🔄 [EmotionMask] Trying next model: ${aimlModels[attemptCount].name}`);
        continue;
      }
    }
  }

  // All AIML models failed
  console.error('❌ [EmotionMask] All AIML models failed after', attemptCount, 'attempts');
  throw new Error(`All AIML models failed. Last error: ${lastError?.message || 'Unknown error'}`);
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

  console.log(`📤 [EmotionMask] Sending to ${modelName} API:`, {
    model,
    preset: 'emotion_mask',
    promptLength: prompt.length
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
      image_strength: 0.45,
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
    console.error(`❌ [EmotionMask] ${modelName} API error:`, response.status, errorText);
    throw new Error(`${modelName} API failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ [EmotionMask] ${modelName} API response received:`, {
    hasResult: !!result,
    resultKeys: result ? Object.keys(result) : 'none'
  });

  // Extract image URL from AIML v1 API response format
  let imageUrl = null;
  
  // Handle v1 response format: result.output.choices[0].image_base64
  if (result.output && result.output.choices && result.output.choices[0]?.image_base64) {
    console.log(`✅ [EmotionMask] Found v1 response format with base64 image from ${modelName}`);
    try {
      // Convert base64 to Cloudinary URL
      const cloudinaryUrl = await uploadBase64ToCloudinary(result.output.choices[0].image_base64);
      imageUrl = cloudinaryUrl;
      console.log(`☁️ [EmotionMask] Image successfully uploaded to Cloudinary from ${modelName}:`, cloudinaryUrl);
    } catch (uploadError: any) {
      console.error(`❌ [EmotionMask] Cloudinary upload failed for ${modelName}:`, uploadError);
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
    console.error(`❌ [EmotionMask] No image URL in ${modelName} response:`, result);
    throw new Error(`${modelName} API returned no image URL`);
  }

  console.log(`🎉 [EmotionMask] ${modelName} generation successful:`, {
    imageUrl: imageUrl.substring(0, 60) + '...',
    presetKey,
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
    console.error('❌ [EmotionMask] Cloudinary upload error:', error);
    throw error;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract user's JWT token for internal credit calls
    const userToken = event.headers.authorization?.replace('Bearer ', '') || '';
    console.log('🔍 [EmotionMask] User token extracted for credit calls');
    
    const body = JSON.parse(event.body || '{}');
    console.log('🔍 [EmotionMask] RAW INCOMING PAYLOAD:', JSON.stringify(body, null, 2));

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
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
        body: JSON.stringify({
          error: 'VALIDATION_FAILED',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        })
      };
    }

    console.log('✅ [EmotionMask] Normalized fields:', { 
      prompt: prompt.substring(0, 100) + '...', 
      runId: runId.toString(), 
      runIdType: typeof runId,
      sourceUrl, 
      presetKey, 
      userId 
    });

    console.log('🔍 [EmotionMask] Checking for existing run with runId:', runId.toString());

    // Check for existing run
    const existingRun = await qOne(`
      SELECT id, status, image_url, created_at
      FROM emotion_mask_media
      WHERE run_id = $1
    `, [runId.toString()]);

    if (existingRun) {
      console.log('🔄 [EmotionMask] Found existing run:', {
        id: existingRun.id,
        status: existingRun.status,
        hasImageUrl: !!existingRun.image_url,
        createdAt: existingRun.created_at
      });
      
      if (existingRun.status === 'completed' && existingRun.image_url) {
        console.log('🔄 [EmotionMask] Run already completed, returning cached result');
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
          body: JSON.stringify(existingRun)
        };
      } else {
        console.warn('⚠️ [EmotionMask] Run exists but incomplete, cleaning up and retrying');
        // Delete old failed/incomplete record to retry clean
        await q(`DELETE FROM emotion_mask_media WHERE id = $1`, [existingRun.id]);
        console.log('🧹 [EmotionMask] Cleaned up incomplete run, proceeding with new generation');
      }
    } else {
      console.log('✅ [EmotionMask] No existing run found, proceeding with new generation');
    }

    // Validate preset key
    const validPresets = ['happy', 'sad', 'angry', 'surprised', 'disgusted', 'fearful', 'neutral'];
    if (!validPresets.includes(presetKey)) {
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
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
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
        body: JSON.stringify({
          error: 'INVALID_IMAGE_URL',
          message: 'Source URL must be a valid HTTP(S) URL',
          received: sourceUrl
        })
      };
    }

    // Reserve credits first with token refresh
    console.log('💰 [EmotionMask] Reserving 1 credit for generation...');
    const freshToken = await getFreshToken(userToken);
    const creditReservation = await fetch(`${process.env.URL}/.netlify/functions/credits-reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`
      },
      body: JSON.stringify({
        userId,
        amount: 1,
        requestId: runId,
        action: 'emotion_mask_generation',
        meta: { presetKey, prompt: prompt.substring(0, 100) }
      })
    });

    if (!creditReservation.ok) {
      const creditError = await creditReservation.json().catch(() => ({}));
      console.error('❌ [EmotionMask] Credit reservation failed:', creditError);
      return {
        statusCode: 402,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
        body: JSON.stringify({
          error: 'INSUFFICIENT_CREDITS',
          message: 'Not enough credits for generation',
          details: creditError
        })
      };
    }

    console.log('✅ [EmotionMask] Credit reserved successfully');

    // Create initial record
    const initialRecord = await qOne(`
      INSERT INTO emotion_mask_media (id, user_id, source_url, prompt, preset, run_id, status, image_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id
    `, [uuidv4(), userId, sourceUrl, prompt, presetKey, runId.toString(), 'pending', sourceUrl]);

    console.log('✅ [EmotionMask] Initial record created:', initialRecord.id);

    // Start generation immediately
    console.log('🚀 [EmotionMask] Starting AIML generation...');
    
    try {
      const generationResult = await startAIMLGeneration(sourceUrl, prompt, presetKey, userId, runId);
      
      if (generationResult && generationResult.imageUrl) {
        console.log('🎉 [EmotionMask] Generation completed immediately!');
        
        // Upload to Cloudinary
        let finalImageUrl = generationResult.imageUrl;
        let cloudinaryPublicId: string | null = null;
        
        try {
          const cloudinaryResult = await uploadAIMLToCloudinary(generationResult.imageUrl, presetKey);
          finalImageUrl = cloudinaryResult.url;
          cloudinaryPublicId = cloudinaryResult.publicId;
          console.log('✅ [EmotionMask] Result uploaded to Cloudinary successfully');
        } catch (cloudinaryError) {
          console.warn('⚠️ [EmotionMask] Cloudinary upload failed, using original AIML URL:', cloudinaryError);
          // Fallback to original URL if Cloudinary fails
        }
        
        // 🔒 [IPA] Perform Identity Preservation Check
        console.log('🔒 [EmotionMask] Starting IPA check for generated image');
        let ipaResult = null;
        let ipaPassed = false;
        
        try {
          ipaResult = await checkIdentityPreservation(
            sourceUrl, // Original image
            finalImageUrl, // Generated image
            'emotion-mask', // Generation type
            { enableReplicate: true } // Enable Replicate fallback
          );
          
          ipaPassed = ipaResult.passed;
          console.log('✅ [EmotionMask] IPA check completed:', {
            passed: ipaPassed,
            similarity: ipaResult.similarity,
            method: ipaResult.method,
            fallbackUsed: ipaResult.fallbackUsed,
            qualityScore: ipaResult.qualityScore
          });
          
          // If IPA failed but we have a result, log warning
          if (!ipaPassed) {
            console.warn('⚠️ [EmotionMask] IPA check failed, but continuing with generation:', {
              similarity: ipaResult.similarity,
              threshold: ipaResult.threshold,
              method: ipaResult.method
            });
          }
          
        } catch (ipaError) {
          console.warn('⚠️ [EmotionMask] IPA check failed, continuing without IPA:', ipaError);
          // Continue generation even if IPA fails
        }
        
        // Update database record with completed status, fallback info, and IPA results
        await q(`
          UPDATE emotion_mask_media
          SET status = $1, image_url = $2, updated_at = NOW(), metadata = $3
          WHERE id = $4
        `, ['completed', finalImageUrl, JSON.stringify({
          aimlModel: generationResult.modelName,
          aimlModelId: generationResult.model,
          attemptCount: generationResult.attemptCount,
          fallbackUsed: generationResult.fallbackUsed,
          cloudinaryPublicId: cloudinaryPublicId,
          generationPath: 'aiml_fallback_system',
          // IPA Results
          ipa: ipaResult ? {
            passed: ipaResult.passed,
            similarity: ipaResult.similarity,
            threshold: ipaResult.threshold,
            method: ipaResult.method,
            fallbackUsed: ipaResult.fallbackUsed,
            qualityScore: ipaResult.qualityScore,
            animalPreservation: ipaResult.animalPreservation,
            groupPreservation: ipaResult.groupPreservation,
            genderPreservation: ipaResult.genderPreservation,
            facePreservation: ipaResult.facePreservation
          } : null
        }), initialRecord.id]);
        
        console.log('✅ [EmotionMask] Database updated with completed status');
        
        // Finalize credits with fresh token
        await fetch(`${process.env.URL}/.netlify/functions/credits-finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${freshToken}`
          },
          body: JSON.stringify({
            userId,
            requestId: runId,
            success: true,
            meta: { presetKey, finalImageUrl: finalImageUrl.substring(0, 100) }
          })
        });
        
        console.log('✅ [EmotionMask] Credits finalized successfully');
        
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
          body: JSON.stringify({
            message: 'Generation completed successfully',
            jobId: initialRecord.id,
            runId: runId.toString(),
            status: 'completed',
            imageUrl: finalImageUrl,
            provider: 'aiml',
            aimlModel: generationResult.modelName,
            fallbackUsed: generationResult.fallbackUsed,
            attemptCount: generationResult.attemptCount,
            // IPA Results
            ipa: ipaResult ? {
              passed: ipaResult.passed,
              similarity: ipaResult.similarity,
              threshold: ipaResult.threshold,
              method: ipaResult.method,
              fallbackUsed: ipaResult.fallbackUsed,
              qualityScore: ipaResult.qualityScore
            } : null
          })
        };
      }
      
    } catch (generationError: any) {
      console.error('❌ [EmotionMask] Generation failed:', generationError);
      
      // Update database record with failed status
      await q(`
        UPDATE emotion_mask_media
        SET status = 'failed', image_url = $1, updated_at = NOW()
        WHERE id = $2
      `, [sourceUrl, initialRecord.id]);
      
      // Refund credits since generation failed with fresh token
      await fetch(`${process.env.URL}/.netlify/functions/credits-finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshToken}`
        },
        body: JSON.stringify({
          userId,
          requestId: runId,
          success: false,
          meta: { presetKey, error: generationError.message }
        })
      });
      
      console.log('✅ [EmotionMask] Credits refunded due to generation failure');
      
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
        body: JSON.stringify({
          error: 'GENERATION_FAILED',
          message: 'Emotion Mask generation failed',
          details: generationError.message
        })
      };
    }

  } catch (error: any) {
    console.error('❌ [EmotionMask] Unexpected error:', error);
    
    // Check if it's a token expiration error
    if (isTokenExpiredError(error.message)) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
        body: JSON.stringify({
          error: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please refresh the page and try again.',
          details: 'Authentication token expired during generation',
          suggestion: 'Refresh your browser page to get a new session'
        })
      };
    }

    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }

  return {
    statusCode: 500,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
    body: JSON.stringify({ error: 'UNEXPECTED_FALLTHROUGH' })
  };
};
