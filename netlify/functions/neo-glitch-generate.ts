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
    const replicateResult = await smartGeneration(sourceUrl, normalizedPrompt, presetKey);

    // Update record with AIML prediction ID
    const updateData: any = {
      status: 'generating',
      aimlPredictionId: replicateResult.replicateJobId // Store AIML ID
    };

    await db.neoGlitchMedia.update({
      where: { id: initialRecord.id },
      data: updateData
    });

    console.log('🚀 [NeoGlitch] Generation started successfully:', {
      strategy: replicateResult.strategy,
      predictionId: replicateResult.replicateJobId,
      model: replicateResult.model
    });

    // Return AIML-focused response
    const responseBody: any = {
      success: true,
      message: 'Neo Tokyo Glitch generation started with AIML',
      runId: runId.toString(),
      status: 'generating',
      provider: 'aiml',
      strategy: replicateResult.strategy,
      aimlPredictionId: replicateResult.replicateJobId
    };

    // Check if AIML returned immediate result
    if (replicateResult.urls && replicateResult.urls.length > 0) {
      responseBody.imageUrl = replicateResult.urls[0];
      responseBody.status = 'completed';
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
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

// Smart Generation with AIML Only
async function smartGeneration(sourceUrl: string, prompt: string, presetKey: string) {
  const AIML_API_KEY = process.env.AIML_API_KEY;
  const AIML_API_URL = 'https://api.aimlapi.com/v1/predictions';

  if (!AIML_API_KEY) {
    throw new Error('AIML_API_KEY not configured');
  }

  console.log('🚀 [NeoGlitch] Starting AIML generation with stable diffusion:', {
    hasAIMLToken: !!AIML_API_KEY,
    sourceUrl,
    promptLength: prompt.length,
    presetKey
  });

  try {
    console.log('🎯 [NeoGlitch] Using AIML stable-diffusion-v35-large');
    const result = await attemptAIMLGeneration(
      AIML_API_URL,
      AIML_API_KEY,
      sourceUrl,
      prompt,
      presetKey
    );
    return { ...result, strategy: 'aiml_stable_diffusion' };
  } catch (error: any) {
    console.error('❌ [NeoGlitch] AIML generation failed:', error.message);
    throw new Error(`AIML generation failed: ${error.message}`);
  }
}

// AIML Generation Function
async function attemptAIMLGeneration(
  apiUrl: string,
  apiToken: string,
  sourceUrl: string,
  prompt: string,
  presetKey: string
) {
  // Preset-specific parameters for AIML
  const presetConfigs = {
    'visor': { strength: 0.75, guidance_scale: 7.5, steps: 50 },
    'base': { strength: 0.65, guidance_scale: 7.0, steps: 40 },
    'tattoos': { strength: 0.80, guidance_scale: 8.0, steps: 60 },
    'scanlines': { strength: 0.70, guidance_scale: 7.5, steps: 45 }
  };

  const config = presetConfigs[presetKey as keyof typeof presetConfigs] || presetConfigs.visor;

  const payload = {
    prompt: prompt,
    image: sourceUrl,
    strength: config.strength,
    guidance_scale: config.guidance_scale,
    num_inference_steps: config.steps,
    negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy, watermark, text"
  };

  console.log('🧪 [NeoGlitch] Attempting AIML generation with stable-diffusion-v35-large');
  console.log('📦 [NeoGlitch] AIML payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: 'stable-diffusion-v35-large',
      input: payload
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [NeoGlitch] AIML API error:', {
      status: response.status,
      statusText: response.statusText,
      errorText
    });

    let errorDetails;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = errorText;
    }

    throw new Error(`AIML API failed (${response.status}): ${JSON.stringify(errorDetails)}`);
  }

  const result = await response.json();
  console.log('✅ [NeoGlitch] AIML generation started successfully');
  
  return {
    replicateJobId: result.id, // Keep same field name for consistency
    model: 'stable-diffusion-v35-large',
    strategy: 'aiml_stable_diffusion',
    urls: result.urls
  };
}
