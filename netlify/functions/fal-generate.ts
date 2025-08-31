// netlify/functions/fal-generate.ts
// Fal.ai Image Generation Handler using Official Client
// Replaces AIML API for all image generation needs
// 
// QUEUE HANDLING:
// - Uses fal.subscribe() for reliable queue management
// - No more 504 timeouts - fal.ai handles async processing
// - Real-time logs and status updates
// - Automatic retries and error handling
import { Handler } from '@netlify/functions';
import { fal } from '@fal-ai/client';
import { q, qOne, qCount } from './_db';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_KEY
});

// Mode-specific FAL.ai model configurations
// Each generation mode gets semantically appropriate models

// Photo-realistic models for presets, custom prompts, emotion masks
const PHOTO_MODELS = [
  {
    model: 'fal-ai/hyper-sdxl/image-to-image',
    name: 'Hyper SDXL I2I',
    cost: 'medium',
    priority: 1,
    description: 'High-quality photo-realistic image-to-image'
  },
  {
    model: 'fal-ai/stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    cost: 'high',
    priority: 2,
    description: 'Premium photo-realistic generation'
  },
  {
    model: 'fal-ai/realistic-vision-v5',
    name: 'Realistic Vision V5',
    cost: 'high',
    priority: 3,
    description: 'Ultra-realistic photo generation'
  }
];

// Anime/cartoon models for Ghibli reactions
const GHIBLI_MODELS = [
  {
    model: 'fal-ai/ghiblify',
    name: 'Ghiblify',
    cost: 'low',
    priority: 1,
    description: 'Studio Ghibli style transformations'
  },
  {
    model: 'fal-ai/hyper-sdxl/image-to-image',
    name: 'Hyper SDXL I2I',
    cost: 'medium',
    priority: 2,
    description: 'High-quality anime-style generation'
  },
  {
    model: 'fal-ai/stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    cost: 'high',
    priority: 3,
    description: 'Premium anime-style generation'
  }
];

// Video generation models for Story Time
const VIDEO_MODELS = [
  {
    model: 'fal-ai/stable-video-diffusion',
    name: 'Stable Video Diffusion',
    cost: 'medium',
    priority: 1,
    description: 'High-quality video generation from images'
  },
  {
    model: 'fal-ai/fast-sdxl',
    name: 'Fast SDXL Video',
    cost: 'low',
    priority: 2,
    description: 'Fast video generation from images'
  }
];

// Legacy universal models (for backward compatibility)
const FAL_MODELS = PHOTO_MODELS; // Default to photo models

/**
 * Get appropriate FAL.ai models for a specific generation type
 */
function getModelsForGenerationType(generationType: string) {
  switch (generationType) {
    case 'ghibli_reaction':
    case 'ghibli_reaction_moderate_ipa':
      return GHIBLI_MODELS;

    case 'neo_glitch':
    case 'neo_glitch_generation':
      return PHOTO_MODELS;

    case 'story_time':
    case 'story_time_moderate_ipa':
    case 'story_time_auto_ipa':
      return VIDEO_MODELS;

    case 'presets':
    case 'preset_moderate_ipa':
    case 'custom':
    case 'custom_balanced_ipa':
    case 'emotion_mask':
    case 'emotion_mask_strict_ipa':
    default:
      return PHOTO_MODELS;
  }
}

// Main handler
export const handler: Handler = async (event) => {
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
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'POST, OPTIONS' 
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { sourceUrl, prompt, generationType, userId, runId } = JSON.parse(event.body || '{}');

    if (!sourceUrl || !prompt || !generationType || !userId || !runId) {
      return {
        statusCode: 400,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'POST, OPTIONS' 
        },
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    console.log('🚀 [Fal.ai] Starting generation:', {
      generationType,
      promptLength: prompt.length,
      hasSource: !!sourceUrl
    });

    // Start fal.ai generation with fallback system
    const result = await startFalGeneration(sourceUrl, prompt, generationType, userId, runId);

    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'POST, OPTIONS' 
      },
      body: JSON.stringify(result)
    };

  } catch (error: any) {
    console.error('❌ [Fal.ai] Generation failed:', error);
    return {
      statusCode: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'POST, OPTIONS' 
      },
      body: JSON.stringify({ 
        error: 'Generation failed', 
        details: error.message 
      })
    };
  }
};

// Fal.ai generation with fallback system
async function startFalGeneration(
  sourceUrl: string, 
  prompt: string, 
  generationType: string, 
  userId: string, 
  runId: string
) {
  const FAL_KEY = process.env.FAL_KEY;

  if (!FAL_KEY) {
    throw new Error('FAL_KEY not configured');
  }

  console.log('🚀 [Fal.ai] Starting generation with fallback system:', {
    generationType,
    promptLength: prompt.length,
    hasSource: !!sourceUrl
  });

  let lastError: Error | null = null;
  let attemptCount = 0;

  // Get appropriate models for this generation type
  const modelsForType = getModelsForGenerationType(generationType);

  // Try each appropriate fal.ai model until one succeeds
  for (const falModel of modelsForType) {
    attemptCount++;
    console.log(`🔄 [Fal.ai] Attempt ${attemptCount}/${modelsForType.length}: ${falModel.name} (${falModel.cost} cost) for ${generationType}`);

    try {
      const result = await attemptFalGeneration(
        sourceUrl, 
        prompt, 
        generationType, 
        userId, 
        runId, 
        falModel
      );

      console.log(`✅ [Fal.ai] ${falModel.name} generation successful on attempt ${attemptCount}`);
      return {
        ...result,
        falModel: falModel.name,
        attemptCount,
        fallbackUsed: attemptCount > 1
      };

    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ [Fal.ai] ${falModel.name} failed (attempt ${attemptCount}):`, error.message);
      
      // If this isn't the last attempt, continue to next model
      if (attemptCount < modelsForType.length) {
        console.log(`🔄 [Fal.ai] Trying next model: ${modelsForType[attemptCount].name}`);
        continue;
      }
    }
  }

  // All fal.ai models failed
  console.error('❌ [Fal.ai] All models failed after', attemptCount, 'attempts');
  throw new Error(`All fal.ai models failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Individual fal.ai generation attempt using official client
async function attemptFalGeneration(
  sourceUrl: string, 
  prompt: string, 
  generationType: string, 
  userId: string, 
  runId: string, 
  falModel: any
) {
  console.log(`📤 [Fal.ai] Sending to ${falModel.name} API:`, {
    model: falModel.model,
    generationType,
    promptLength: prompt.length
  });

  try {
    // Use fal.subscribe() for reliable queue-based generation
    const result = await fal.subscribe(falModel.model, {
      input: {
        image_url: sourceUrl,
        prompt: prompt,
        image_strength: 0.85,
        num_images: 1,
        guidance_scale: 7.5,
        num_inference_steps: 30,
        seed: Math.floor(Math.random() * 1000000)
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`🔄 [Fal.ai] ${falModel.name} progress:`, update.status);
          update.logs?.map(log => log.message).forEach(message => {
            console.log(`📝 [Fal.ai] ${falModel.name}: ${message}`);
          });
        }
      }
    });

    console.log(`✅ [Fal.ai] ${falModel.name} generation completed:`, {
      hasData: !!result.data,
      requestId: result.requestId,
      generationType,
      model: falModel.model
    });

    // Extract image URL from result
    let imageUrl = null;
    
    if (result.data?.image?.url) {
      imageUrl = result.data.image.url;
    } else if (result.data?.images && Array.isArray(result.data.images) && result.data.images[0]?.url) {
      imageUrl = result.data.images[0].url;
    } else if (result.data?.image_url) {
      imageUrl = result.data.image_url;
    } else if (result.data?.url) {
      imageUrl = result.data.url;
    }
    
    if (!imageUrl) {
      console.error(`❌ [Fal.ai] No image URL in ${falModel.name} response:`, {
        resultData: result.data,
        resultDataKeys: result.data ? Object.keys(result.data) : 'none',
        resultDataImage: result.data?.image,
        resultDataImages: result.data?.images,
        resultDataImageUrl: result.data?.image_url,
        resultDataUrl: result.data?.url
      });
      throw new Error(`${falModel.name} API returned no image URL`);
    }

    console.log(`🎉 [Fal.ai] ${falModel.name} generation successful:`, {
      imageUrl: imageUrl.substring(0, 100) + '...',
      generationType,
      model: falModel.model,
      requestId: result.requestId
    });

    // 🔄 CRITICAL: Re-upload to Cloudinary for persistence
    console.log(`☁️ [Cloudinary] Re-uploading fal.ai result to Cloudinary...`);
    let cloudinaryUrl = imageUrl; // Fallback to original URL if re-upload fails
    
    try {
      // Download the image from fal.ai and upload to Cloudinary
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image from fal.ai: ${response.status}`);
      }
      
      const imageBuffer = await response.arrayBuffer();
      const imageBlob = new Blob([imageBuffer]);
      
      // Upload to Cloudinary using the existing cloudinary config
             const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
         const uploadStream = cloudinary.uploader.upload_stream(
           {
             folder: 'stefna/generated',
             public_id: `ghibli_${runId}`,
             resource_type: 'image',
             overwrite: true
           },
           (error, result) => {
             if (error) {
               console.error('❌ [Cloudinary] Upload failed:', error);
               reject(error);
             } else if (result) {
               console.log('✅ [Cloudinary] Re-upload successful:', result.secure_url);
               resolve(result);
             } else {
               reject(new Error('Cloudinary upload returned no result'));
             }
           }
         );
        
        // Convert blob to stream and pipe to upload
        const reader = new FileReader();
        reader.onload = () => {
          uploadStream.end(Buffer.from(reader.result as ArrayBuffer));
        };
        reader.readAsArrayBuffer(imageBlob);
      });
      
             cloudinaryUrl = uploadResult.secure_url;
      console.log(`✅ [Cloudinary] Final URL: ${cloudinaryUrl}`);
      
    } catch (uploadError) {
      console.error('❌ [Cloudinary] Re-upload failed, using original URL:', uploadError);
      // Continue with original fal.ai URL as fallback
    }

    return {
      status: 'completed',
      imageUrl: cloudinaryUrl, // Use Cloudinary URL for persistence
      originalFalUrl: imageUrl, // Keep original for reference
      falJobId: result.requestId || `${falModel.name.toLowerCase().replace(/\s+/g, '_')}_${runId}`,
      model: falModel.model,
      modelName: falModel.name,
      requestId: result.requestId
    };

  } catch (error: any) {
    console.error(`❌ [Fal.ai] ${falModel.name} API error:`, error);
    throw new Error(`${falModel.name} API failed: ${error.message}`);
  }
}
