// netlify/functions/presets-generate.ts
// Professional Presets Generation Handler (25 presets, 6 per week rotation)
// 
// 🎯 GENERATION STRATEGY:
// 1. PRIMARY: Use AIML API for all Professional Preset generations
// 2. FALLBACK: None needed (AIML is reliable for this)
// 3. CREDITS: Charge 1 credit total
// 4. ROTATION: 25 presets, 6 rotate per week automatically
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
    console.log('☁️ [Presets] Uploading AIML result to Cloudinary:', imageUrl.substring(0, 60) + '...');
    
    const result = await cloudinary.uploader.upload(imageUrl, {
      resource_type: 'image',
      tags: ['presets', 'aiml', `preset:${presetKey}`],
      folder: 'presets',
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' },
        { width: 1024, height: 1024, crop: 'limit' }
      ]
    });
    
    console.log('✅ [Presets] Cloudinary upload successful:', {
      publicId: result.public_id,
      url: result.secure_url,
      size: result.bytes
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('❌ [Presets] Cloudinary upload failed:', error);
    throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get preset configuration from database
async function getPresetConfig(presetKey: string) {
  try {
    const presetConfigRows = await q(`
      SELECT * FROM presets_config 
      WHERE preset_key = $1 
      AND is_active = true
      LIMIT 1
    `, [presetKey]);
    
    if (!presetConfigRows || presetConfigRows.length === 0) {
      throw new Error(`Preset ${presetKey} not found or inactive`);
    }
    
    return presetConfigRows[0];
  } catch (error) {
    console.error('❌ [Presets] Failed to get preset config:', error);
    throw error;
  }
}

// Check if preset is currently available (current week)
async function isPresetCurrentlyAvailable(presetKey: string): Promise<boolean> {
  try {
    const presetConfig = await getPresetConfig(presetKey);
    const currentWeek = Math.floor((new Date().getMonth() * 5) / 12) + 1;
    const currentWeekAdjusted = Math.max(1, Math.min(5, currentWeek));
    
    return presetConfig.preset_week === currentWeekAdjusted;
  } catch (error) {
    console.error('❌ [Presets] Failed to check preset availability:', error);
    return false;
  }
}

// AIML API Generation Function with Fallback System
async function startAIMLGeneration(sourceUrl: string, prompt: string, presetKey: string, userId: string, runId: string) {
  const AIML_API_KEY = process.env.AIML_API_KEY;
  const AIML_API_URL = process.env.AIML_API_URL;

  if (!AIML_API_KEY || !AIML_API_URL) {
    throw new Error('AIML API configuration missing');
  }

  console.log('🚀 [Presets] Starting AIML generation with fallback system:', {
    presetKey,
    promptLength: prompt.length,
    hasSource: !!sourceUrl
  });

  // Define AIML models in order of preference (cheap → expensive → best quality)
  const aimlModels = [
    { model: 'triposr', name: 'Triposr', cost: 'low', priority: 1 },
    { model: 'recraft-v3', name: 'Recraft V3', cost: 'medium', priority: 2 },
    { model: 'google/imagen4/preview', name: 'Google Imagen 4', cost: 'high', priority: 3 }
  ];

  let lastError: Error | null = null;
  let attemptCount = 0;

  // Try each AIML model until one succeeds
  for (const aimlModel of aimlModels) {
    attemptCount++;
    console.log(`🔄 [Presets] Attempt ${attemptCount}/${aimlModels.length}: ${aimlModel.name} (${aimlModel.cost} cost)`);

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

      console.log(`✅ [Presets] ${aimlModel.name} generation successful on attempt ${attemptCount}`);
      return {
        ...result,
        aimlModel: aimlModel.name,
        attemptCount,
        fallbackUsed: attemptCount > 1
      };

    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ [Presets] ${aimlModel.name} failed (attempt ${attemptCount}):`, error.message);
      
      // If this isn't the last attempt, continue to next model
      if (attemptCount < aimlModels.length) {
        console.log(`🔄 [Presets] Trying next model: ${aimlModels[attemptCount].name}`);
        continue;
      }
    }
  }

  // All AIML models failed
  console.error('❌ [Presets] All AIML models failed after', attemptCount, 'attempts');
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

  // Get preset configuration
  const presetConfig = await getPresetConfig(presetKey);

  console.log(`📤 [Presets] Sending to ${modelName} API:`, {
    model,
    preset: presetKey,
    promptLength: prompt.length,
    presetWeek: presetConfig.preset_week,
    presetRotationIndex: presetConfig.preset_rotation_index
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
      image_strength: 0.85,
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
    console.error(`❌ [Presets] ${modelName} API error:`, response.status, errorText);
    throw new Error(`${modelName} API failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ [Presets] ${modelName} API response received:`, {
    hasResult: !!result,
    resultKeys: result ? Object.keys(result) : 'none'
  });

  // Extract image URL from AIML v1 API response format
  let imageUrl = null;
  
  // Handle v1 response format: result.output.choices[0].image_base64
  if (result.output && result.output.choices && result.output.choices[0]?.image_base64) {
    console.log(`✅ [Presets] Found v1 response format with base64 image from ${modelName}`);
    try {
      // Convert base64 to Cloudinary URL
      const cloudinaryUrl = await uploadBase64ToCloudinary(result.output.choices[0].image_base64);
      imageUrl = cloudinaryUrl;
      console.log(`☁️ [Presets] Image successfully uploaded to Cloudinary from ${modelName}:`, cloudinaryUrl);
    } catch (uploadError: any) {
      console.error(`❌ [Presets] Cloudinary upload failed for ${modelName}:`, uploadError);
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
    console.error(`❌ [Presets] No image URL in ${modelName} response:`, result);
    throw new Error(`${modelName} API returned no image URL`);
  }

  console.log(`🎉 [Presets] ${modelName} generation successful:`, {
    imageUrl: imageUrl.substring(0, 60) + '...',
    presetKey,
    presetWeek: presetConfig.preset_week,
    model
  });

  return {
    status: 'completed',
    imageUrl: imageUrl,
    aimlJobId: `${modelName.toLowerCase().replace(/\s+/g, '_')}_${runId}`,
    presetConfig,
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
    console.error('❌ [Presets] Cloudinary upload error:', error);
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
    console.log('🔍 [Presets] User token extracted for credit calls');
    
    const body = JSON.parse(event.body || '{}');
    console.log('🔍 [Presets] RAW INCOMING PAYLOAD:', JSON.stringify(body, null, 2));

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

    console.log('✅ [Presets] Normalized fields:', { 
      prompt: prompt.substring(0, 100) + '...', 
      runId: runId.toString(), 
      runIdType: typeof runId,
      sourceUrl, 
      presetKey, 
      userId 
    });

    // Check if preset is currently available
    const isAvailable = await isPresetCurrentlyAvailable(presetKey);
    if (!isAvailable) {
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
        body: JSON.stringify({
          error: 'PRESET_NOT_AVAILABLE',
          message: `Preset ${presetKey} is not available this week. Check back next week for new presets!`,
          presetKey,
          suggestion: 'Try a different preset or wait for next week\'s rotation'
        })
      };
    }

    console.log('🔍 [Presets] Checking for existing run with runId:', runId.toString());

    // Check for existing run
    const existingRun = await qOne(`
      SELECT id, status, image_url, created_at
      FROM presets_media
      WHERE run_id = $1
    `, [runId.toString()]);

    if (existingRun) {
      console.log('🔄 [Presets] Found existing run:', {
        id: existingRun.id,
        status: existingRun.status,
        hasImageUrl: !!existingRun.image_url,
        createdAt: existingRun.created_at
      });
      
      if (existingRun.status === 'completed' && existingRun.image_url) {
        console.log('🔄 [Presets] Run already completed, returning cached result');
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
          body: JSON.stringify(existingRun)
        };
      } else {
        console.warn('⚠️ [Presets] Run exists but incomplete, cleaning up and retrying');
        // Delete old failed/incomplete record to retry clean
        await q(`DELETE FROM presets_media WHERE id = $1`, [existingRun.id]);
        console.log('🧹 [Presets] Cleaned up incomplete run, proceeding with new generation');
      }
    } else {
      console.log('✅ [Presets] No existing run found, proceeding with new generation');
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

    // Reserve credits first
    console.log('💰 [Presets] Reserving 1 credit for generation...');
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
        action: 'presets_generation',
        meta: { presetKey, prompt: prompt.substring(0, 100) }
      })
    });

    if (!creditReservation.ok) {
      const creditError = await creditReservation.json().catch(() => ({}));
      console.error('❌ [Presets] Credit reservation failed:', creditError);
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

    console.log('✅ [Presets] Credit reserved successfully');

    // Get preset configuration for database record
    const presetConfig = await getPresetConfig(presetKey);

    // Create initial record
    const initialRecord = await qOne(`
      INSERT INTO presets_media (id, user_id, source_url, prompt, preset, run_id, status, image_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id
    `, [uuidv4(), userId, sourceUrl, prompt, presetKey, runId.toString(), 'pending', sourceUrl]);

    console.log('✅ [Presets] Initial record created:', initialRecord.id);

    // Start generation immediately
    console.log('🚀 [Presets] Starting AIML generation...');
    
    try {
      const generationResult = await startAIMLGeneration(sourceUrl, prompt, presetKey, userId, runId);
      
      if (generationResult && generationResult.imageUrl) {
        console.log('🎉 [Presets] Generation completed immediately!');
        
        // Upload to Cloudinary
        let finalImageUrl = generationResult.imageUrl;
        let cloudinaryPublicId: string | null = null;
        
        try {
          const cloudinaryResult = await uploadAIMLToCloudinary(generationResult.imageUrl, presetKey);
          finalImageUrl = cloudinaryResult.url;
          cloudinaryPublicId = cloudinaryResult.publicId;
          console.log('✅ [Presets] Result uploaded to Cloudinary successfully');
        } catch (cloudinaryError) {
          console.warn('⚠️ [Presets] Cloudinary upload failed, using original AIML URL:', cloudinaryError);
          // Fallback to original URL if Cloudinary fails
        }
        
                // Update database record with completed status and fallback info
        await q(`
          UPDATE presets_media
          SET status = $1, image_url = $2, updated_at = NOW(), metadata = $3
          WHERE id = $4
        `, ['completed', finalImageUrl, JSON.stringify({
          aimlModel: generationResult.modelName,
          aimlModelId: generationResult.model,
          attemptCount: generationResult.attemptCount,
          fallbackUsed: generationResult.fallbackUsed,
          cloudinaryPublicId: cloudinaryPublicId,
          generationPath: 'aiml_fallback_system'
        }), initialRecord.id]);
        
        console.log('✅ [Presets] Database updated with completed status');
        
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
              presetKey, 
              presetName: presetConfig.preset_name,
              presetWeek: presetConfig.preset_week,
              finalImageUrl: finalImageUrl.substring(0, 100) 
            }
          })
        });
        
        console.log('✅ [Presets] Credits finalized successfully');
        
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
          body: JSON.stringify({
            message: 'Generation completed successfully',
            jobId: initialRecord.id,
            runId: runId.toString(),
            status: 'completed',
            imageUrl: finalImageUrl,
            aimlJobId: generationResult.aimlJobId,
            provider: 'aiml',
            aimlModel: generationResult.modelName,
            fallbackUsed: generationResult.fallbackUsed,
            attemptCount: generationResult.attemptCount,
            presetInfo: {
              name: presetConfig.preset_name,
              description: presetConfig.preset_description,
              category: presetConfig.preset_category,
              week: presetConfig.preset_week,
              rotationIndex: presetConfig.preset_rotation_index
            }
          })
        };
      }
      
    } catch (generationError: any) {
      console.error('❌ [Presets] Generation failed:', generationError);
      
      // Update database record with failed status
      await q(`
        UPDATE presets_media
        SET status = 'failed', image_url = $1, updated_at = NOW()
        WHERE id = $2
      `, [sourceUrl, initialRecord.id]);
      
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
          meta: { presetKey, error: generationError.message }
        })
      });
      
      console.log('✅ [Presets] Credits refunded due to generation failure');
      
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
        body: JSON.stringify({
          error: 'GENERATION_FAILED',
          message: 'Professional preset generation failed',
          details: generationError.message
        })
      };
    }

  } catch (error) {
    console.error('❌ [Presets] Unexpected error:', error);
    
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
