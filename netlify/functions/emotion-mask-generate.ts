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
// Main emotion mask processing logic using FAL.ai generated image
// The FAL.ai generation has already happened, now we continue with emotion mask overlay processing

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
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' },
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
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify({ error: 'jobId parameter required' })
      };
    }

    try {
      const status = await qOne(`
        SELECT id, status, image_url, created_at, preset, prompt, aiml_job_id
        FROM emotion_mask_media
        WHERE id = $1
      `, [jobId]);

      if (!status) {
        return {
          statusCode: 404,
          headers: { 
            'Access-Control-Allow-Origin': '*', 
            'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
          },
          body: JSON.stringify({ error: 'Job not found' })
        };
      }

      return {
        statusCode: 200,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify(status)
      };
    } catch (error) {
      console.error('❌ [EmotionMask] Status check failed:', error);
      return {
        statusCode: 500,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify({ error: 'Status check failed' })
      };
    }
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
    console.log('🚀 [EmotionMask] Starting FAL.ai generation...');

    try {
      // Call centralized FAL.ai function with emotion_mask generation type
      // This will use PHOTO_MODELS: Hyper SDXL → Stable Diffusion XL → Realistic Vision V5
      const response = await fetch(`${process.env.URL}/.netlify/functions/fal-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceUrl,
          prompt,
          generationType: 'emotion_mask',
          userId,
          runId
        })
      });

      if (!response.ok) {
        throw new Error(`FAL.ai generation failed: ${response.statusText}`);
      }

      const falResult = await response.json();

      // Process the FAL.ai result
      console.log('✅ [EmotionMask] FAL.ai generation successful:', {
        falModel: falResult.falModel,
        attemptCount: falResult.attemptCount,
        fallbackUsed: falResult.fallbackUsed
      });

      const generationResult = {
        imageUrl: falResult.imageUrl,
        status: 'completed',
        falModel: falResult.falModel,
        attemptCount: falResult.attemptCount,
        fallbackUsed: falResult.fallbackUsed
      };
      
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
          console.warn('⚠️ [EmotionMask] Cloudinary upload failed, using original FAL.ai URL:', cloudinaryError);
          // Fallback to original URL if Cloudinary fails
        }
        

        
        // Update database record with completed status and fallback info
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
          generationPath: 'aiml_fallback_system'
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
