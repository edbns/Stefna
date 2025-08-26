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
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const db = new PrismaClient();

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

// AIML API Generation Function
async function startAIMLGeneration(sourceUrl: string, prompt: string, presetKey: string, userId: string, runId: string) {
  const AIML_API_KEY = process.env.AIML_API_KEY;
  const AIML_API_URL = process.env.AIML_API_URL;

  if (!AIML_API_KEY || !AIML_API_URL) {
    throw new Error('AIML API configuration missing');
  }

  console.log('🚀 [EmotionMask] Starting AIML generation:', {
    presetKey,
    promptLength: prompt.length,
    hasSource: !!sourceUrl
  });

  try {
    // Build AIML payload
    const payload = {
      model: 'flux/dev/image-to-image',
      preset: 'emotion_mask',
      kind: 'emotion',
      image_url: sourceUrl,
      isVideo: false,
      generateTwo: false,
      fps: 24,
      prompt: prompt,
      negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs'
    };

    console.log('📤 [EmotionMask] Sending to AIML API:', {
      model: payload.model,
      preset: payload.preset,
      promptLength: payload.prompt.length
    });

    const response = await fetch(`${AIML_API_URL}/v2/generate/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIML_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [EmotionMask] AIML API error:', response.status, errorText);
      throw new Error(`AIML API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ [EmotionMask] AIML API response received:', {
      hasResult: !!result,
      resultKeys: result ? Object.keys(result) : 'none'
    });

    // Extract image URL from AIML response
    const imageUrl = result.image_url || result.url || result.result?.image_url;
    
    if (!imageUrl) {
      console.error('❌ [EmotionMask] No image URL in AIML response:', result);
      throw new Error('AIML API returned no image URL');
    }

    console.log('🎉 [EmotionMask] AIML generation successful:', {
      imageUrl: imageUrl.substring(0, 60) + '...',
      presetKey
    });

    return {
      status: 'completed',
      imageUrl: imageUrl,
      aimlJobId: `aiml_${runId}`
    };

  } catch (error) {
    console.error('❌ [EmotionMask] AIML generation failed:', error);
    throw error;
  }
}

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
        headers: { 'Access-Control-Allow-Origin': '*' },
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
    const existingRun = await db.emotionMaskMedia.findUnique({
      where: { runId: runId.toString() }
    });

    if (existingRun) {
      console.log('🔄 [EmotionMask] Found existing run:', {
        id: existingRun.id,
        status: existingRun.status,
        hasImageUrl: !!existingRun.imageUrl,
        createdAt: existingRun.createdAt
      });
      
      if (existingRun.status === 'completed' && existingRun.imageUrl) {
        console.log('🔄 [EmotionMask] Run already completed, returning cached result');
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(existingRun)
        };
      } else {
        console.warn('⚠️ [EmotionMask] Run exists but incomplete, cleaning up and retrying');
        // Delete old failed/incomplete record to retry clean
        await db.emotionMaskMedia.delete({ where: { id: existingRun.id } });
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

    // Reserve credits first
    console.log('💰 [EmotionMask] Reserving 1 credit for generation...');
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
        action: 'emotion_mask_generation',
        meta: { presetKey, prompt: prompt.substring(0, 100) }
      })
    });

    if (!creditReservation.ok) {
      const creditError = await creditReservation.json().catch(() => ({}));
      console.error('❌ [EmotionMask] Credit reservation failed:', creditError);
      return {
        statusCode: 402,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'INSUFFICIENT_CREDITS',
          message: 'Not enough credits for generation',
          details: creditError
        })
      };
    }

    console.log('✅ [EmotionMask] Credit reserved successfully');

    // Create initial record
    const initialRecord = await db.emotionMaskMedia.create({
      data: {
        userId,
        sourceUrl,
        prompt,
        preset: presetKey,
        runId: runId.toString(),
        status: 'pending',
        imageUrl: sourceUrl // Temporary, will be updated
      }
    });

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
        
        // Update database record with completed status
        await db.emotionMaskMedia.update({
          where: { id: initialRecord.id },
          data: {
            status: 'completed',
            imageUrl: finalImageUrl,
            aimlJobId: generationResult.aimlJobId
          }
        });
        
        console.log('✅ [EmotionMask] Database updated with completed status');
        
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
            meta: { presetKey, finalImageUrl: finalImageUrl.substring(0, 100) }
          })
        });
        
        console.log('✅ [EmotionMask] Credits finalized successfully');
        
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            message: 'Generation completed successfully',
            jobId: initialRecord.id,
            runId: runId.toString(),
            status: 'completed',
            imageUrl: finalImageUrl,
            aimlJobId: generationResult.aimlJobId,
            provider: 'aiml'
          })
        };
      }
      
    } catch (generationError: any) {
      console.error('❌ [EmotionMask] Generation failed:', generationError);
      
      // Update database record with failed status
      await db.emotionMaskMedia.update({
        where: { id: initialRecord.id },
        data: {
          status: 'failed',
          imageUrl: sourceUrl // Keep source URL
        }
      });
      
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
      
      console.log('✅ [EmotionMask] Credits refunded due to generation failure');
      
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'GENERATION_FAILED',
          message: 'Emotion Mask generation failed',
          details: generationError.message
        })
      };
    }

  } catch (error) {
    console.error('❌ [EmotionMask] Unexpected error:', error);
    
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
