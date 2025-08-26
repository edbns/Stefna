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
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Prisma client will be initialized inside handler

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
    const presetConfig = await db.$queryRaw`
      SELECT * FROM presets_config 
      WHERE preset_key = ${presetKey} 
      AND is_active = true
    `;
    
    if (!presetConfig || Array.isArray(presetConfig) && presetConfig.length === 0) {
      throw new Error(`Preset ${presetKey} not found or inactive`);
    }
    
    return Array.isArray(presetConfig) ? presetConfig[0] : presetConfig;
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

// AIML API Generation Function
async function startAIMLGeneration(sourceUrl: string, prompt: string, presetKey: string, userId: string, runId: string) {
  const AIML_API_KEY = process.env.AIML_API_KEY;
  const AIML_API_URL = process.env.AIML_API_URL;

  if (!AIML_API_KEY || !AIML_API_URL) {
    throw new Error('AIML API configuration missing');
  }

  console.log('🚀 [Presets] Starting AIML generation:', {
    presetKey,
    promptLength: prompt.length,
    hasSource: !!sourceUrl
  });

  try {
    // Get preset configuration
    const presetConfig = await getPresetConfig(presetKey);
    
    // Build AIML payload using preset configuration
    const payload = {
      model: 'flux/dev/image-to-image',
      preset: presetKey,
      kind: 'professional',
      image_url: sourceUrl,
      isVideo: false,
      generateTwo: false,
      fps: 24,
      prompt: presetConfig.preset_prompt,
      negative_prompt: presetConfig.preset_negative_prompt || 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs'
    };

    console.log('📤 [Presets] Sending to AIML API:', {
      model: payload.model,
      preset: payload.preset,
      promptLength: payload.prompt.length,
      presetWeek: presetConfig.preset_week,
      presetRotationIndex: presetConfig.preset_rotation_index
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
      console.error('❌ [Presets] AIML API error:', response.status, errorText);
      throw new Error(`AIML API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ [Presets] AIML API response received:', {
      hasResult: !!result,
      resultKeys: result ? Object.keys(result) : 'none'
    });

    // Extract image URL from AIML response
    const imageUrl = result.image_url || result.url || result.result?.image_url;
    
    if (!imageUrl) {
      console.error('❌ [Presets] No image URL in AIML response:', result);
      throw new Error('AIML API returned no image URL');
    }

    console.log('🎉 [Presets] AIML generation successful:', {
      imageUrl: imageUrl.substring(0, 60) + '...',
      presetKey,
      presetWeek: presetConfig.preset_week
    });

    return {
      status: 'completed',
      imageUrl: imageUrl,
      aimlJobId: `aiml_${runId}`,
      presetConfig
    };

  } catch (error) {
    console.error('❌ [Presets] AIML generation failed:', error);
    throw error;
  }
}

export const handler: Handler = async (event) => {
  // Initialize Prisma client inside handler to avoid bundling issues
  const db = new PrismaClient();
  
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
        headers: { 'Access-Control-Allow-Origin': '*' },
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
        headers: { 'Access-Control-Allow-Origin': '*' },
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
    const existingRun = await db.presetsMedia.findUnique({
      where: { runId: runId.toString() }
    });

    if (existingRun) {
      console.log('🔄 [Presets] Found existing run:', {
        id: existingRun.id,
        status: existingRun.status,
        hasImageUrl: !!existingRun.imageUrl,
        createdAt: existingRun.createdAt
      });
      
      if (existingRun.status === 'completed' && existingRun.imageUrl) {
        console.log('🔄 [Presets] Run already completed, returning cached result');
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(existingRun)
        };
      } else {
        console.warn('⚠️ [Presets] Run exists but incomplete, cleaning up and retrying');
        // Delete old failed/incomplete record to retry clean
        await db.presetsMedia.delete({ where: { id: existingRun.id } });
        console.log('🧹 [Presets] Cleaned up incomplete run, proceeding with new generation');
      }
    } else {
      console.log('✅ [Presets] No existing run found, proceeding with new generation');
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
        headers: { 'Access-Control-Allow-Origin': '*' },
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
    const initialRecord = await db.presetsMedia.create({
      data: {
        userId,
        sourceUrl,
        prompt,
        preset: presetKey,
        runId: runId.toString(),
        status: 'pending',
        imageUrl: sourceUrl, // Temporary, will be updated
        presetWeek: presetConfig.preset_week,
        presetRotationIndex: presetConfig.preset_rotation_index,
        isCurrentlyAvailable: true
      }
    });

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
        
        // Update database record with completed status
        await db.presetsMedia.update({
          where: { id: initialRecord.id },
          data: {
            status: 'completed',
            imageUrl: finalImageUrl,
            aimlJobId: generationResult.aimlJobId
          }
        });
        
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
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            message: 'Generation completed successfully',
            jobId: initialRecord.id,
            runId: runId.toString(),
            status: 'completed',
            imageUrl: finalImageUrl,
            aimlJobId: generationResult.aimlJobId,
            provider: 'aiml',
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
      await db.presetsMedia.update({
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
      
      console.log('✅ [Presets] Credits refunded due to generation failure');
      
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
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
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
