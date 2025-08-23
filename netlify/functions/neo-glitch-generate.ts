// Neo Tokyo Glitch Generation Function
// Starts the actual Replicate generation using dedicated architecture
// No intermediate table - direct Replicate → Cloudinary → neo_glitch_media flow

import type { Handler } from '@netlify/functions';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';

// Replicate API configuration
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

// Neo Tokyo Glitch model configuration - using more recent and reliable model
const NEO_TOKYO_GLITCH_MODEL = 'stability-ai/stable-diffusion-img2img:30c1d0b916a6f8efce20493f5d61ee27491ab2a6045c87d3d92bc3a208f1337d4';

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
    // Authenticate user
    const authResult = requireAuth(event.headers.authorization);
    const authenticatedUserId = authResult.userId;
    console.log('🎭 [NeoGlitch] User authenticated for generation:', authenticatedUserId);

    const body = JSON.parse(event.body || '{}');
    console.log('🔍 [NeoGlitch] Raw incoming payload:', body);
    
    const {
      prompt,
      presetKey,
      sourceUrl,
      sourceAssetId, // Also accept sourceAssetId for compatibility
      runId,
      generationMeta,
      userId
    } = body;
    
    // Normalize and sanitize input fields
    const finalPrompt = prompt?.trim();
    const finalSourceUrl = sourceUrl || sourceAssetId;
    const finalRunId = String(runId || crypto.randomUUID());
    const finalPresetKey = presetKey;
    
    console.log('🔍 [NeoGlitch] Normalized values:', {
      prompt: finalPrompt,
      sourceUrl: finalSourceUrl,
      runId: finalRunId,
      presetKey: finalPresetKey,
      userId
    });

    // Validate required fields using normalized values
    if (!finalPrompt || finalPrompt.length < 10) {
      return json({ 
        error: 'Missing or invalid prompt: must be at least 10 characters long' 
      }, { status: 400 });
    }

    if (!finalPresetKey) {
      return json({ 
        error: 'Missing presetKey field' 
      }, { status: 400 });
    }

    if (!finalSourceUrl) {
      return json({ 
        error: 'Missing source image URL (sourceUrl or sourceAssetId)' 
      }, { status: 400 });
    }

    if (!finalRunId) {
      return json({ 
        error: 'Missing runId field' 
      }, { status: 400 });
    }

    console.log('✅ [NeoGlitch] All required fields validated successfully');



    // Validate source image URL if provided
    if (finalSourceUrl) {
      // Log the URL for debugging
      console.log('🔍 [NeoGlitch] Validating source image URL:', finalSourceUrl);
      
      // Accept Cloudinary URLs (more flexible validation)
      const isCloudinary = finalSourceUrl.includes('res.cloudinary.com');
      const isReplicate = finalSourceUrl.includes('replicate.delivery');
      const isValidUrl = finalSourceUrl.startsWith('http');
      
      if (!isValidUrl) {
        console.warn('⚠️ [NeoGlitch] Rejected image URL - not HTTP:', finalSourceUrl);
        return json({ 
          error: 'Invalid source image URL: must be a valid HTTP URL' 
        }, { status: 400 });
      }
      
      if (!isCloudinary && !isReplicate) {
        console.warn('⚠️ [NeoGlitch] Rejected image URL - not Cloudinary or Replicate:', finalSourceUrl);
        return json({ 
          error: 'Invalid source image URL: must be Cloudinary or Replicate hosted' 
        }, { status: 400 });
      }
      
      console.log('✅ [NeoGlitch] Source image URL validation passed:', {
        url: finalSourceUrl,
        isCloudinary,
        isReplicate
      });
    }

    // Validate Replicate API token
    if (!REPLICATE_API_TOKEN) {
      console.error('❌ [NeoGlitch] REPLICATE_API_TOKEN not configured');
      return json({ 
        error: 'REPLICATE_API_TOKEN not configured' 
      }, { status: 500 });
    }

    console.log('🎭 [NeoGlitch] Starting Replicate generation:', {
      userId: authenticatedUserId,
      presetKey: finalPresetKey,
      runId: finalRunId,
      hasSource: !!finalSourceUrl,
      sourceUrl: finalSourceUrl || 'none'
    });

    // Start Replicate generation directly (no intermediate table needed)
    const replicatePayload = {
      version: NEO_TOKYO_GLITCH_MODEL,
      input: {
        prompt: finalPrompt,
        negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy",
        strength: 0.75,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        ...(finalSourceUrl && { image: finalSourceUrl }) // finalSourceUrl should already be the full Cloudinary URL
      }
    };

    console.log('🚀 [NeoGlitch] Calling Replicate API with payload:', {
      model: NEO_TOKYO_GLITCH_MODEL,
      prompt: finalPrompt.substring(0, 50) + '...',
      hasSourceImage: !!finalSourceUrl,
      sourceUrl: finalSourceUrl,
      fullPayload: replicatePayload,
      replicateUrl: REPLICATE_API_URL,
      hasToken: !!REPLICATE_API_TOKEN,
      tokenPreview: REPLICATE_API_TOKEN ? `${REPLICATE_API_TOKEN.substring(0, 10)}...` : 'none'
    });

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
        errorText: errorText,
        url: REPLICATE_API_URL,
        payload: replicatePayload,
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN ? '***' : 'missing'}`,
          'Content-Type': 'application/json'
        }
      });
      
      return json({
        error: 'Replicate API call failed',
        details: errorText,
        status: 'failed',
        replicateStatus: replicateResponse.status
      }, { status: replicateResponse.status });
    }

    const replicateResult = await replicateResponse.json();
    console.log('✅ [NeoGlitch] Replicate generation started:', {
      predictionId: replicateResult.id,
      status: replicateResult.status,
      urls: replicateResult.urls
    });

    return json({
      success: true,
      predictionId: replicateResult.id,
      status: 'processing',
      message: 'Neo Tokyo Glitch generation started successfully'
    });

  } catch (error: any) {
    console.error('💥 [NeoGlitch] Generation error:', error);
    
    if (error.message === 'NO_BEARER') {
      return json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    return json({ 
      error: 'GENERATION_FAILED',
      message: error.message,
      status: 'failed'
    }, { status: 500 });
  }
};
