import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';

// ============================================================================
// VERSION: 7.0 - COMPLETE VALIDATION OVERHAUL
// ============================================================================
// This function has been completely rewritten to fix 422 validation errors
// - Proper field normalization and validation
// - Clear debugging logs
// - Handles frontend payload structure correctly
// ============================================================================

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
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
    // Parse and log the raw incoming payload
    const body = JSON.parse(event.body || '{}');
    console.log('🔍 [NeoGlitch] RAW INCOMING PAYLOAD:', JSON.stringify(body, null, 2));

    // Normalize and extract all possible field names
    const prompt = body.prompt?.trim();
    const userId = body.userId;
    const presetKey = body.presetKey || body.preset;
    const runId = String(body.runId || crypto.randomUUID());
    const sourceUrl = body.sourceAssetId || body.sourceUrl || body.sourceAssetUrl;
    const generationMeta = body.generationMeta;

    // Log normalized fields for debugging
    console.log('🔍 [NeoGlitch] NORMALIZED FIELDS:', {
      prompt: prompt ? `${prompt.substring(0, 50)}...` : 'MISSING',
      userId: userId || 'MISSING',
      presetKey: presetKey || 'MISSING',
      runId: runId || 'MISSING',
      sourceUrl: sourceUrl || 'MISSING',
      hasGenerationMeta: !!generationMeta
    });

    // Validate required fields with clear error messages
    const missingFields = [];
    if (!prompt) missingFields.push('prompt');
    if (!userId) missingFields.push('userId');
    if (!presetKey) missingFields.push('presetKey');
    if (!runId) missingFields.push('runId');
    if (!sourceUrl) missingFields.push('sourceUrl (or sourceAssetId)');

    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
      console.error('❌ [NeoGlitch] Validation failed:', errorMessage);
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'VALIDATION_FAILED',
          message: errorMessage,
          missingFields,
          receivedPayload: body
        })
      };
    }

    // Validate prompt length
    if (prompt.length < 10) {
      const errorMessage = `Prompt too short: ${prompt.length} characters (minimum 10)`;
      console.error('❌ [NeoGlitch] Prompt validation failed:', errorMessage);
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'PROMPT_TOO_SHORT',
          message: errorMessage,
          promptLength: prompt.length,
          minimumRequired: 10
        })
      };
    }

    // Validate source URL format
    if (!sourceUrl.startsWith('http')) {
      const errorMessage = `Invalid source URL: must start with http/https`;
      console.error('❌ [NeoGlitch] URL validation failed:', errorMessage);
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'INVALID_SOURCE_URL',
          message: errorMessage,
          receivedUrl: sourceUrl
        })
      };
    }

    console.log('✅ [NeoGlitch] All validation passed successfully');

    // Check if we have Replicate API token
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      console.error('❌ [NeoGlitch] REPLICATE_API_TOKEN not configured');
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'REPLICATE_NOT_CONFIGURED',
          message: 'Replicate API token not configured'
        })
      };
    }

    // Start actual Replicate generation
    const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
    const NEO_TOKYO_GLITCH_MODEL = 'stability-ai/stable-diffusion-img2img:30c1d0b916a6f8efce20493f5d61ee27491ab2a6045c87d3d92bc3a208f1337d4';
    
    console.log('🚀 [NeoGlitch] Starting Replicate generation with:', {
      prompt: prompt.substring(0, 50) + '...',
      presetKey,
      runId,
      sourceUrl,
      hasToken: !!REPLICATE_API_TOKEN
    });

    // Create Replicate payload
    const replicatePayload = {
      version: NEO_TOKYO_GLITCH_MODEL,
      input: {
        prompt: prompt,
        negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy",
        strength: 0.75,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        image: sourceUrl
      }
    };

    console.log('📤 [NeoGlitch] Calling Replicate API with payload:', {
      model: NEO_TOKYO_GLITCH_MODEL,
      prompt: prompt.substring(0, 50) + '...',
      sourceUrl,
      hasToken: !!REPLICATE_API_TOKEN
    });

    // Call Replicate API
    const replicateResponse = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(replicatePayload)
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('❌ [NeoGlitch] Replicate API error:', {
        status: replicateResponse.status,
        statusText: replicateResponse.statusText,
        errorText: errorText
      });
      
      return {
        statusCode: replicateResponse.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'REPLICATE_API_FAILED',
          message: 'Failed to start Replicate generation',
          details: errorText,
          replicateStatus: replicateResponse.status
        })
      };
    }

    const replicateResult = await replicateResponse.json();
    console.log('✅ [NeoGlitch] Replicate generation started successfully:', {
      predictionId: replicateResult.id,
      status: replicateResult.status,
      urls: replicateResult.urls
    });

    // Return the replicateJobId for polling
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Neo Tokyo Glitch generation started successfully',
        replicateJobId: replicateResult.id, // This is what the frontend needs for polling
        status: 'processing',
        urls: replicateResult.urls
      })
    };

  } catch (error: any) {
    console.error('💥 [NeoGlitch] Fatal error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'INTERNAL_ERROR',
        message: error.message || 'Unknown error occurred',
        stack: error.stack
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};
