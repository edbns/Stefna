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

    // Start Stability.ai generation
    const stabilityResult = await startStabilityGeneration(sourceUrl, normalizedPrompt, presetKey);

    // Update record with Stability.ai job ID
    const updateData: any = {
      status: 'generating',
      stabilityJobId: stabilityResult.stabilityJobId
    };

    await db.neoGlitchMedia.update({
      where: { id: initialRecord.id },
      data: updateData
    });

    console.log('🚀 [NeoGlitch] Generation started successfully:', {
      strategy: stabilityResult.strategy,
      jobId: stabilityResult.stabilityJobId,
      model: stabilityResult.model
    });

    // Return Stability.ai-focused response
    const responseBody: any = {
      success: true,
      message: 'Neo Tokyo Glitch generation started with Stability.ai',
      runId: runId.toString(),
      status: 'generating',
      provider: 'stability',
      strategy: stabilityResult.strategy,
      stabilityJobId: stabilityResult.stabilityJobId
    };

    // Check if Stability.ai returned immediate result
    if (stabilityResult.imageUrl) {
      responseBody.imageUrl = stabilityResult.imageUrl;
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

// Stability.ai Generation Function
async function startStabilityGeneration(sourceUrl: string, prompt: string, presetKey: string) {
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY not configured');
  }

  console.log('🚀 [NeoGlitch] Starting Stability.ai generation:', {
    hasStabilityToken: !!STABILITY_API_KEY,
    sourceUrl,
    promptLength: prompt.length,
    presetKey
  });

  try {
    console.log('🎯 [NeoGlitch] Using Stability.ai SD3 model');
    const result = await attemptStabilityGeneration(
      STABILITY_API_KEY,
      sourceUrl,
      prompt,
      presetKey
    );
    return { ...result, strategy: 'stability_sd3' };
  } catch (error: any) {
    console.error('❌ [NeoGlitch] Stability.ai generation failed:', error.message);
    throw new Error(`Stability.ai generation failed: ${error.message}`);
  }
}

// Stability.ai Generation Implementation
async function attemptStabilityGeneration(
  apiToken: string,
  sourceUrl: string,
  prompt: string,
  presetKey: string
) {
  // Preset-specific parameters for Stability.ai
  const presetConfigs = {
    'visor': { strength: 0.75, guidance_scale: 7.5, steps: 50 },
    'base': { strength: 0.65, guidance_scale: 7.0, steps: 40 },
    'tattoos': { strength: 0.80, guidance_scale: 8.0, steps: 60 },
    'scanlines': { strength: 0.70, guidance_scale: 7.5, steps: 45 }
  };

  const config = presetConfigs[presetKey as keyof typeof presetConfigs] || presetConfigs.visor;

  // Download the source image and convert to Buffer
  const imageResponse = await fetch(sourceUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download source image: ${imageResponse.status}`);
  }
  
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageData = Buffer.from(imageBuffer);

  // Create FormData for multipart/form-data submission
  const formData = new FormData();
  
  // Append the image as a file - convert Buffer to Blob for FormData
  const imageBlob = new Blob([imageData], { type: 'image/jpeg' });
  formData.append('init_image', imageBlob, 'input.jpg');
  
  // Append text prompts
  formData.append('text_prompts[0][text]', prompt);
  formData.append('text_prompts[0][weight]', '1');
  formData.append('text_prompts[1][text]', 'blurry, low quality, distorted, ugly, bad anatomy, watermark, text');
  formData.append('text_prompts[1][weight]', '-1');
  
  // Append other parameters
  formData.append('init_image_mode', 'IMAGE_TO_IMAGE');
  formData.append('image_strength', config.strength.toString());
  formData.append('cfg_scale', config.guidance_scale.toString());
  formData.append('steps', config.steps.toString());
  formData.append('samples', '1');
  formData.append('aspect_ratio', '1:1');

  console.log('🧪 [NeoGlitch] Attempting Stability.ai generation with SD3 using FormData');
  console.log('📦 [NeoGlitch] Stability.ai FormData parameters:', {
    prompt,
    negativePrompt: 'blurry, low quality, distorted, ugly, bad anatomy, watermark, text',
    image_strength: config.strength,
    cfg_scale: config.guidance_scale,
    steps: config.steps,
    samples: 1,
    aspect_ratio: '1:1'
  });

  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Accept': 'application/json'
      // Don't set Content-Type - let the browser set it with boundary for FormData
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [NeoGlitch] Stability.ai API error:', {
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

    throw new Error(`Stability.ai API failed (${response.status}): ${JSON.stringify(errorDetails)}`);
  }

  const result = await response.json();
  console.log('✅ [NeoGlitch] Stability.ai generation started successfully');
  
  // For now, we'll return a job ID and handle async processing
  // Stability.ai might return immediate results for some requests
  const jobId = result.id || `stability_${Date.now()}`;
  
  return {
    stabilityJobId: jobId,
    model: 'sd3',
    strategy: 'stability_sd3',
    imageUrl: result.artifacts?.[0]?.base64 ? `data:image/png;base64,${result.artifacts[0].base64}` : undefined
  };
}
