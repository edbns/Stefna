// netlify/functions/fal-generate.ts
// Fal.ai Image Generation Handler
// Replaces AIML API for all image generation needs
// 
// TIMEOUT HANDLING:
// - Netlify functions have 26s hard limit
// - fal.ai can be slow, so we use async mode
// - Function returns job ID immediately, frontend polls for results
// - Individual API calls timeout at 20s to prevent 504 errors
import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Fal.ai supported models in order of preference (cheap → expensive → best quality)
const FAL_MODELS = [
  { 
    model: 'fal:flux/ghibli', 
    name: 'Flux Ghibli', 
    cost: 'low', 
    priority: 1,
    endpoint: 'https://fal.run/fal-ai/flux/ghibli'
  },
  { 
    model: 'fal:flux/realism', 
    name: 'Flux Realism', 
    cost: 'medium', 
    priority: 2,
    endpoint: 'https://fal.run/fal-ai/flux/realism'
  },
  { 
    model: 'fal:pixart-alpha', 
    name: 'PixArt Alpha', 
    cost: 'high', 
    priority: 3,
    endpoint: 'https://fal.run/fal-ai/pixart-alpha'
  }
];

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

  // Try each fal.ai model until one succeeds
  for (const falModel of FAL_MODELS) {
    attemptCount++;
    console.log(`🔄 [Fal.ai] Attempt ${attemptCount}/${FAL_MODELS.length}: ${falModel.name} (${falModel.cost} cost)`);

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
      if (attemptCount < FAL_MODELS.length) {
        console.log(`🔄 [Fal.ai] Trying next model: ${FAL_MODELS[attemptCount].name}`);
        continue;
      }
    }
  }

  // All fal.ai models failed
  console.error('❌ [Fal.ai] All models failed after', attemptCount, 'attempts');
  throw new Error(`All fal.ai models failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Individual fal.ai generation attempt
async function attemptFalGeneration(
  sourceUrl: string, 
  prompt: string, 
  generationType: string, 
  userId: string, 
  runId: string, 
  falModel: any
) {
  const FAL_KEY = process.env.FAL_KEY;

  console.log(`📤 [Fal.ai] Sending to ${falModel.name} API:`, {
    model: falModel.model,
    generationType,
    promptLength: prompt.length
  });

  // Prepare fal.ai API payload
  const payload = {
    prompt: prompt,
    image_url: sourceUrl,
    sync_mode: false, // Asynchronous generation to avoid timeouts
    image_strength: 0.85,
    num_images: 1,
    guidance_scale: 7.5,
    num_inference_steps: 30,
    seed: Math.floor(Math.random() * 1000000)
  };

  const response = await fetch(falModel.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${FAL_KEY}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload),
    // Add timeout to prevent stuck jobs (20 seconds max - Netlify limit is 26s)
    signal: AbortSignal.timeout(20 * 1000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [Fal.ai] ${falModel.name} API error:`, response.status, errorText);
    throw new Error(`${falModel.name} API failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ [Fal.ai] ${falModel.name} API response received:`, {
    hasResult: !!result,
    resultKeys: result ? Object.keys(result) : 'none'
  });

  // Handle async mode response
  if (result.id) {
    // Async job started - return job ID for polling
    console.log(`🔄 [Fal.ai] ${falModel.name} async job started:`, result.id);
    return {
      status: 'processing',
      jobId: result.id,
      falJobId: `${falModel.name.toLowerCase().replace(/\s+/g, '_')}_${runId}`,
      model: falModel.model,
      modelName: falModel.name,
      message: 'Generation started, use job ID to poll for results'
    };
  }

  // Handle sync mode response (fallback)
  let imageUrl = null;
  
  // Handle fal.ai response format: result.images[0].url
  if (result.images && Array.isArray(result.images) && result.images[0]?.url) {
    console.log(`✅ [Fal.ai] Found fal.ai response format with image URL from ${falModel.name}`);
    imageUrl = result.images[0].url;
  } else if (result.image_url) {
    // Fallback to direct URL if present
    imageUrl = result.image_url;
  }
  
  if (!imageUrl) {
    console.error(`❌ [Fal.ai] No image URL in ${falModel.name} response:`, result);
    throw new Error(`${falModel.name} API returned no image URL`);
  }

  console.log(`🎉 [Fal.ai] ${falModel.name} generation successful:`, {
    imageUrl: imageUrl.substring(0, 100) + '...',
    generationType,
    model: falModel.model
  });

  return {
    status: 'completed',
    imageUrl: imageUrl,
    falJobId: `${falModel.name.toLowerCase().replace(/\s+/g, '_')}_${runId}`,
    model: falModel.model,
    modelName: falModel.name
  };
}
