import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

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
    const body = JSON.parse(event.body || '{}');
    console.log('🔍 [NeoGlitch] RAW INCOMING PAYLOAD:', JSON.stringify(body, null, 2));

    // Normalize fields (support both sourceAssetId and sourceUrl)
    const {
      prompt,
      userId,
      presetKey,
      runId = Date.now().toString(),
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

    console.log('✅ [NeoGlitch] Normalized fields:', { prompt, runId, sourceUrl, presetKey, userId });

    // Check for existing run
    const existingRun = await db.neoGlitchMedia.findUnique({
      where: { runId: runId.toString() }
    });

    if (existingRun) {
      console.log('🔄 [NeoGlitch] Run already exists, returning existing result');
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(existingRun)
      };
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

    // Smart Replicate Generation with Retry Logic
    const replicateResult = await smartReplicateGeneration(sourceUrl, normalizedPrompt, presetKey);

    // Update record with Replicate job ID
    await db.neoGlitchMedia.update({
      where: { id: initialRecord.id },
      data: { 
        status: 'generating',
        replicateJobId: replicateResult.replicateJobId 
      }
    });

    console.log('🚀 [NeoGlitch] Generation started successfully:', replicateResult.replicateJobId);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Neo Tokyo Glitch generation started',
        runId: runId.toString(),
        replicateJobId: replicateResult.replicateJobId,
        status: 'generating'
      })
    };

  } catch (error) {
    console.error('❌ [NeoGlitch] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Failed to start generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// Smart Replicate Generation with Retry Logic
async function smartReplicateGeneration(sourceUrl: string, prompt: string, presetKey: string) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN not configured');
  }

  console.log('🚀 [NeoGlitch] Starting smart Replicate generation with:', {
    hasToken: !!REPLICATE_API_TOKEN,
    sourceUrl,
    promptLength: prompt.length,
    presetKey
  });

  // Strategy 1: Try with latest model (no version hash)
  try {
    console.log('🎯 [NeoGlitch] Strategy 1: Using latest model (no version hash)');
    const result = await attemptReplicateGeneration(
      REPLICATE_API_URL,
      REPLICATE_API_TOKEN,
      "stability-ai/stable-diffusion-img2img", // No version hash = latest
      sourceUrl,
      prompt,
      presetKey
    );
    return result;
  } catch (error: any) {
    console.log('⚠️ [NeoGlitch] Strategy 1 failed:', error.message);
    
    // Strategy 2: Retry with specific working version
    try {
      console.log('🎯 [NeoGlitch] Strategy 2: Retrying with specific working version');
      const result = await attemptReplicateGeneration(
        REPLICATE_API_URL,
        REPLICATE_API_TOKEN,
        "stability-ai/stable-diffusion-img2img:db21e45b8cdadcd9f6d809d11518b9c4d29c3a7c513d175f2a58f540c6d04ea3",
        sourceUrl,
        prompt,
        presetKey
      );
      return result;
    } catch (retryError: any) {
      console.log('⚠️ [NeoGlitch] Strategy 2 failed:', retryError.message);
      
      // Strategy 3: Fallback to SDXL if img2img fails
      try {
        console.log('🎯 [NeoGlitch] Strategy 3: Fallback to SDXL model');
        const result = await attemptReplicateGeneration(
          REPLICATE_API_URL,
          REPLICATE_API_TOKEN,
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08bf",
          sourceUrl,
          prompt,
          presetKey,
          true // isSDXL flag
        );
        return result;
      } catch (finalError: any) {
        console.error('❌ [NeoGlitch] All strategies failed:', finalError.message);
        throw new Error(`All Replicate generation strategies failed: ${finalError.message}`);
      }
    }
  }
}

// Attempt Replicate generation with specific model
async function attemptReplicateGeneration(
  apiUrl: string,
  apiToken: string,
  model: string,
  sourceUrl: string,
  prompt: string,
  presetKey: string,
  isSDXL: boolean = false
) {
  // Optimize payload based on model type
  const payload = isSDXL ? 
    createSDXLPayload(sourceUrl, prompt, presetKey) :
    createImg2ImgPayload(sourceUrl, prompt, presetKey);

  console.log('🧪 [NeoGlitch] Attempting generation with model:', model);
  console.log('📦 [NeoGlitch] Payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: model,
      input: payload
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [NeoGlitch] Replicate API error:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
      model,
      strategy: isSDXL ? 'SDXL Fallback' : 'Img2Img'
    });

    // Enhanced error parsing
    let errorDetails;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = errorText;
    }

    throw new Error(`Replicate API failed (${response.status}): ${JSON.stringify(errorDetails)}`);
  }

  const result = await response.json();
  console.log('✅ [NeoGlitch] Generation started successfully with model:', model);
  
  return {
    replicateJobId: result.id,
    model: model,
    strategy: isSDXL ? 'SDXL Fallback' : 'Img2Img'
  };
}

// Create optimized img2img payload
function createImg2ImgPayload(sourceUrl: string, prompt: string, presetKey: string) {
  // Preset-specific parameters
  const presetConfigs = {
    'visor': { strength: 0.75, guidance_scale: 7.5, steps: 50 },
    'base': { strength: 0.65, guidance_scale: 7.0, steps: 40 },
    'tattoos': { strength: 0.80, guidance_scale: 8.0, steps: 60 },
    'scanlines': { strength: 0.70, guidance_scale: 7.5, steps: 45 }
  };

  const config = presetConfigs[presetKey as keyof typeof presetConfigs] || presetConfigs.visor;

  return {
    prompt: prompt,
    image: sourceUrl, // Use direct URL (no base64 conversion)
    strength: config.strength,
    guidance_scale: config.guidance_scale,
    num_inference_steps: config.steps,
    negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy, watermark, text"
  };
}

// Create SDXL fallback payload
function createSDXLPayload(sourceUrl: string, prompt: string, presetKey: string) {
  const presetConfigs = {
    'visor': { guidance_scale: 7.5, steps: 50 },
    'base': { guidance_scale: 7.0, steps: 40 },
    'tattoos': { guidance_scale: 8.0, steps: 60 },
    'scanlines': { guidance_scale: 7.5, steps: 45 }
  };

  const config = presetConfigs[presetKey as keyof typeof presetConfigs] || presetConfigs.visor;

  return {
    prompt: prompt,
    image: sourceUrl,
    guidance_scale: config.guidance_scale,
    num_inference_steps: config.steps,
    negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy, watermark, text",
    width: 1024,
    height: 1024
  };
}
