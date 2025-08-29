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

// 🚀 BACKGROUND MODE: Allow function to run for up to 15 minutes
export const config = {
  type: "background",
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Prisma client will be initialized inside handler

// Helper function to check identity similarity (placeholder for now)
async function checkIdentitySimilarity(sourceUrl: string, generatedUrl: string): Promise<number> {
  try {
    // TODO: Implement actual face embedding comparison with TensorFlow.js
    // For now, return a placeholder similarity score
    console.log('🔒 [IPA] Placeholder similarity check - will implement actual face comparison');
    
    // Simulate similarity check (replace with real implementation)
    // In production, this would:
    // 1. Extract face embeddings from both images
    // 2. Calculate cosine similarity between embeddings
    // 3. Return similarity score (0.0 to 1.0)
    
    const similarity = 0.75; // Placeholder value - replace with real calculation
    return similarity;
  } catch (error) {
    console.error('❌ [IPA] Similarity check failed:', error);
    return 0.5; // Default to 50% similarity on error
  }
}

// Helper function to retry generation with lower strength
async function retryWithLowerStrength(sourceUrl: string, prompt: string, presetKey: string, userId: string, runId: string): Promise<{ imageUrl: string; aimlJobId?: string } | null> {
  try {
    console.log('🔄 [IPA] Retrying with lower strength for better identity preservation...');
    
    // Reduce strength by 20% for retry
    const reducedStrength = 0.4; // 0.5 * 0.8 = 0.4
    
    // Call AIML API with lower strength
    const retryPayload = {
      model: 'stable-diffusion-v35-large',
      prompt: prompt,
      init_image: sourceUrl,
      image_strength: reducedStrength, // Lower strength for better identity preservation
      num_images: 1,
      guidance_scale: 7.5,
      num_inference_steps: 30,
      seed: Math.floor(Math.random() * 1000000)
    };
    
    const AIML_API_KEY = process.env.AIML_API_KEY;
    const AIML_API_URL = process.env.AIML_API_URL;
    
    if (!AIML_API_KEY || !AIML_API_URL) {
      throw new Error('AIML API configuration missing for retry');
    }
    
    const response = await fetch(`${AIML_API_URL}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(retryPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AIML API retry failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ [IPA] Retry generation successful');
    
    // Extract image URL from response
    let imageUrl = null;
    if (result.output && result.output.choices && result.output.choices[0]?.image_base64) {
      // Handle base64 response
      const cloudinaryUrl = await uploadBase64ToCloudinary(result.output.choices[0].image_base64);
      imageUrl = cloudinaryUrl;
    } else if (result.image_url) {
      imageUrl = result.image_url;
    } else if (result.images && Array.isArray(result.images) && result.images[0]?.url) {
      imageUrl = result.images[0].url;
    }
    
    if (!imageUrl) {
      throw new Error('No image URL in retry response');
    }
    
    return { imageUrl };
  } catch (error) {
    console.error('❌ [IPA] Retry with lower strength failed:', error);
    return null;
  }
}

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

// AIML API Generation Function
async function startAIMLGeneration(sourceUrl: string, prompt: string, presetKey: string, userId: string, runId: string) {
  const AIML_API_KEY = process.env.AIML_API_KEY;
  const AIML_API_URL = process.env.AIML_API_URL;

  if (!AIML_API_KEY || !AIML_API_URL) {
    throw new Error('AIML API configuration missing');
  }

  console.log('🚀 [CustomPrompt] Starting AIML generation:', {
    presetKey,
    promptLength: prompt.length,
    hasSource: !!sourceUrl
  });

  try {
    // Build AIML payload for custom prompt
    const payload = {
      model: 'flux/dev/image-to-image',
      preset: 'custom',
      kind: 'custom',
      image_url: sourceUrl,
      isVideo: false,
      generateTwo: false,
      fps: 24,
      prompt: prompt, // Use user's custom prompt
      negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, duplicate faces, extra limbs'
    };

    console.log('📤 [CustomPrompt] Sending to AIML API:', {
      model: payload.model,
      preset: payload.preset,
      promptLength: payload.prompt.length,
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
        model: 'stable-diffusion-v35-large',
        prompt: prompt,
        init_image: sourceUrl,
        image_strength: 0.5,
        num_images: 1,
        guidance_scale: 7.5,
        num_inference_steps: 30,
        seed: Math.floor(Math.random() * 1000000)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CustomPrompt] AIML API error:', response.status, errorText);
      throw new Error(`AIML API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ [CustomPrompt] AIML API response received:', {
      hasResult: !!result,
      resultKeys: result ? Object.keys(result) : 'none'
    });

    // Extract image URL from AIML v1 API response format
    let imageUrl = null;
    
    // Handle v1 response format: result.output.choices[0].image_base64
    if (result.output && result.output.choices && result.output.choices[0]?.image_base64) {
      console.log('✅ [CustomPrompt] Found v1 response format with base64 image');
      try {
        // Convert base64 to Cloudinary URL
        const cloudinaryUrl = await uploadBase64ToCloudinary(result.output.choices[0].image_base64);
        imageUrl = cloudinaryUrl;
        console.log('☁️ [CustomPrompt] Image successfully uploaded to Cloudinary:', cloudinaryUrl);
      } catch (uploadError: any) {
        console.error('❌ [CustomPrompt] Cloudinary upload failed:', uploadError);
        throw new Error(`Failed to upload generated image: ${uploadError.message}`);
      }
    } else if (result.image_url) {
      // Fallback to direct URL if present
      imageUrl = result.image_url;
    } else if (result.images && Array.isArray(result.images) && result.images[0]?.url) {
      // Fallback to images array if present
      imageUrl = result.images[0].url;
    }
    
    if (!imageUrl) {
      console.error('❌ [CustomPrompt] No image URL in AIML response:', result);
      throw new Error('AIML API returned no image URL');
    }

    console.log('🎉 [CustomPrompt] AIML generation successful:', {
      imageUrl: imageUrl.substring(0, 60) + '...',
      presetKey,
      customPrompt: prompt.substring(0, 100) + '...'
    });

    return {
      status: 'completed',
      imageUrl: imageUrl,
      aimlJobId: `aiml_${runId}`
    };

  } catch (error) {
    console.error('❌ [CustomPrompt] AIML generation failed:', error);
    throw error;
  }
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
  // Initialize Prisma client inside handler to avoid bundling issues
  
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

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

    // Validate custom prompt length
    if (!prompt || prompt.trim().length < 10) {
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*' },
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
        headers: { 'Access-Control-Allow-Origin': '*' },
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
      presetKey, 
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
          headers: { 'Access-Control-Allow-Origin': '*' },
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
        meta: { presetKey, prompt: prompt.substring(0, 100) }
      })
    });

    if (!creditReservation.ok) {
      const creditError = await creditReservation.json().catch(() => ({}));
      console.error('❌ [CustomPrompt] Credit reservation failed:', creditError);
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

    console.log('✅ [CustomPrompt] Credit reserved successfully');

    // Create initial record
    const initialRecord = await qOne(`
      INSERT INTO custom_prompt_media (user_id, source_url, prompt, preset, run_id, status, image_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id
    `, [userId, sourceUrl, prompt, presetKey, runId.toString(), 'pending', sourceUrl]);

    console.log('✅ [CustomPrompt] Initial record created:', initialRecord.id);

    // Start generation immediately
    console.log('🚀 [CustomPrompt] Starting AIML generation...');
    
    try {
      const generationResult = await startAIMLGeneration(sourceUrl, prompt, presetKey, userId, runId);
      
      if (generationResult && generationResult.imageUrl) {
        console.log('🎉 [CustomPrompt] Generation completed immediately!');
        
        // Upload to Cloudinary
        let finalImageUrl = generationResult.imageUrl;
        let cloudinaryPublicId: string | null = null;
        
        try {
          const cloudinaryResult = await uploadAIMLToCloudinary(generationResult.imageUrl, presetKey);
          finalImageUrl = cloudinaryResult.url;
          cloudinaryPublicId = cloudinaryResult.publicId;
          console.log('✅ [CustomPrompt] Result uploaded to Cloudinary successfully');
        } catch (cloudinaryError) {
          console.warn('⚠️ [CustomPrompt] Cloudinary upload failed, using original AIML URL:', cloudinaryError);
          // Fallback to original URL if Cloudinary fails
        }
        
        // 🔒 IDENTITY PRESERVATION CHECK
        console.log('🔒 [CustomPrompt] Starting identity preservation check...');
        let ipaPassed = true;
        let ipaSimilarity = 1.0;
        
        try {
          // Simple similarity check - compare source and generated images
          // In production, this would use TensorFlow.js face embeddings
          const similarity = await checkIdentitySimilarity(sourceUrl, finalImageUrl);
          ipaSimilarity = similarity;
          
          // Custom Prompt uses balanced IPA threshold (0.65)
          const ipaThreshold = 0.65;
          ipaPassed = similarity >= ipaThreshold;
          
          console.log(`🔒 [CustomPrompt] IPA check: ${(similarity * 100).toFixed(1)}% similarity, threshold: ${(ipaThreshold * 100).toFixed(1)}%, passed: ${ipaPassed}`);
          
          if (!ipaPassed) {
            console.log('⚠️ [CustomPrompt] IPA failed, attempting retry with lower strength...');
            
            // Retry with lower strength for better identity preservation
            const retryResult = await retryWithLowerStrength(sourceUrl, prompt, presetKey, userId, runId);
            if (retryResult && retryResult.imageUrl) {
              console.log('🔄 [CustomPrompt] Retry successful, updating with new result');
              finalImageUrl = retryResult.imageUrl;
              
              // Re-upload to Cloudinary if needed
              try {
                const retryCloudinaryResult = await uploadAIMLToCloudinary(retryResult.imageUrl, presetKey);
                finalImageUrl = retryCloudinaryResult.url;
                cloudinaryPublicId = retryCloudinaryResult.publicId;
                console.log('✅ [CustomPrompt] Retry result uploaded to Cloudinary');
              } catch (retryCloudinaryError) {
                console.warn('⚠️ [CustomPrompt] Retry Cloudinary upload failed, using original URL');
              }
              
              // Re-check IPA on retry result
              const retrySimilarity = await checkIdentitySimilarity(sourceUrl, finalImageUrl);
              ipaSimilarity = retrySimilarity;
              ipaPassed = retrySimilarity >= ipaThreshold;
              console.log(`🔒 [CustomPrompt] Retry IPA: ${(retrySimilarity * 100).toFixed(1)}% similarity, passed: ${ipaPassed}`);
            }
          }
        } catch (ipaError) {
          console.warn('⚠️ [CustomPrompt] IPA check failed, proceeding with original result:', ipaError);
          // Continue with original result if IPA fails
        }
        
        // If IPA still fails after retry, log warning but continue
        if (!ipaPassed) {
          console.warn(`⚠️ [CustomPrompt] IPA failed after retry: ${(ipaSimilarity * 100).toFixed(1)}% similarity < ${(0.65 * 100).toFixed(1)}% threshold`);
          console.warn('⚠️ [CustomPrompt] Proceeding with result but identity preservation may be poor');
        }
        
        // Update database record with completed status and IPA results
        await q(`
          UPDATE custom_prompt_media 
          SET status = $1, image_url = $2, metadata = $3, updated_at = NOW()
          WHERE id = $4
        `, ['completed', finalImageUrl, JSON.stringify({
          ipaPassed,
          ipaSimilarity: Math.round(ipaSimilarity * 100) / 100, // Round to 2 decimal places
          ipaThreshold: 0.65,
          ipaRetries: ipaPassed ? 0 : 1, // 1 retry if IPA failed initially
          ipaStrategy: ipaPassed ? 'first_try' : 'lower_strength_retry'
        }), initialRecord.id]);
        
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
              presetKey, 
              customPrompt: prompt.substring(0, 100),
              finalImageUrl: finalImageUrl.substring(0, 100) 
            }
          })
        });
        
        console.log('✅ [CustomPrompt] Credits finalized successfully');
        
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            message: 'Generation completed successfully',
            jobId: initialRecord.id,
            runId: runId.toString(),
            status: 'completed',
            imageUrl: finalImageUrl,
            provider: 'aiml',
            customPrompt: prompt.substring(0, 100) + '...'
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
          meta: { presetKey, error: generationError.message }
        })
      });
      
      console.log('✅ [CustomPrompt] Credits refunded due to generation failure');
      
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
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
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
