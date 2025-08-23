// Neo Tokyo Glitch Generation Function
// Starts the actual Replicate generation and updates the glitch record
// Handles Replicate API integration and status tracking

import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from './lib/auth';
import { json } from './_lib/http';

// Replicate API configuration
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

// Neo Tokyo Glitch model configuration
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
    const { sub: userId } = requireAuth(event);
    console.log('🎭 [NeoGlitch] User authenticated for generation:', userId);

    const body = JSON.parse(event.body || '{}');
    const {
      glitchId,
      prompt,
      presetKey,
      sourceAssetId,
      runId
    } = body;

    // Validate required fields
    if (!glitchId || !prompt || !presetKey || !runId) {
      return json({ 
        error: 'Missing required fields: glitchId, prompt, presetKey, and runId are required' 
      }, { status: 400 });
    }

    // Validate prompt content
    if (!prompt.trim() || prompt.trim().length < 10) {
      return json({ 
        error: 'Prompt must be at least 10 characters long' 
      }, { status: 400 });
    }

    // Validate source image URL if provided
    if (sourceAssetId && !sourceAssetId.startsWith('http')) {
      return json({ 
        error: 'Invalid source image URL format' 
      }, { status: 400 });
    }

    // Validate Replicate API token
    if (!REPLICATE_API_TOKEN) {
      console.error('❌ [NeoGlitch] REPLICATE_API_TOKEN not configured');
      return json({ 
        error: 'Replicate API not configured' 
      }, { status: 500 });
    }

    console.log('🎭 [NeoGlitch] Starting Replicate generation:', {
      glitchId,
      presetKey,
      runId,
      hasSource: !!sourceAssetId
    });

    const sql = neon(process.env.NETLIFY_DATABASE_URL!);

    // Verify the glitch record exists and belongs to the user
    const glitchRecord = await sql`
      SELECT id, user_id, status, prompt, preset_key, source_asset_id
      FROM media_assets_glitch 
      WHERE id = ${glitchId} AND user_id = ${userId}
      LIMIT 1
    `;

    if (!glitchRecord || glitchRecord.length === 0) {
      return json({ 
        error: 'Glitch record not found or access denied' 
      }, { status: 404 });
    }

    const record = glitchRecord[0];
    console.log('🎭 [NeoGlitch] Found glitch record:', {
      id: record.id,
      status: record.status,
      prompt: record.prompt.substring(0, 50) + '...'
    });

    // Check if already processing or completed
    if (record.status === 'processing' || record.status === 'completed') {
      return json({
        error: `Generation already ${record.status}`,
        status: record.status
      }, { status: 400 });
    }

    // Update status to processing
    await sql`
      UPDATE media_assets_glitch 
      SET status = 'processing', updated_at = NOW()
      WHERE id = ${glitchId}
    `;

    console.log('✅ [NeoGlitch] Status updated to processing');

    // Prepare Replicate API request
    const replicatePayload = {
      version: NEO_TOKYO_GLITCH_MODEL,
      input: {
        prompt: prompt,
        negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy",
        strength: 0.75,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        ...(sourceAssetId && { image: sourceAssetId }) // sourceAssetId should already be the full Cloudinary URL
      }
    };

    console.log('🚀 [NeoGlitch] Calling Replicate API with payload:', {
      model: NEO_TOKYO_GLITCH_MODEL,
      prompt: prompt.substring(0, 50) + '...',
      hasSourceImage: !!sourceAssetId,
      sourceAssetId: sourceAssetId,
      fullPayload: replicatePayload,
      replicateUrl: REPLICATE_API_URL,
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
      console.error('❌ [NeoGlitch] Replicate API error:', replicateResponse.status, errorText);
      
      // Log failure reason in database with proper error handling
      await sql`
        UPDATE media_assets_glitch 
        SET 
          status = 'failed',
          error_message = ${errorText},
          updated_at = NOW()
        WHERE id = ${glitchId}
      `;

      return json({ 
        error: 'Replicate API call failed',
        details: errorText,
        status: 'failed'
      }, { status: replicateResponse.status });
    }

    const replicateResult = await replicateResponse.json();
    console.log('✅ [NeoGlitch] Replicate generation started:', {
      predictionId: replicateResult.id,
      status: replicateResult.status
    });

    // Store Replicate prediction ID in meta
    await sql`
      UPDATE media_assets_glitch 
      SET 
        meta = jsonb_set(
          COALESCE(meta, '{}'::jsonb), 
          '{replicate_prediction_id}', 
          ${replicateResult.id}::jsonb
        ),
        updated_at = NOW()
      WHERE id = ${glitchId}
    `;

    console.log('✅ [NeoGlitch] Replicate prediction ID stored in meta');

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

    // Log any other errors to database if we have a glitchId
    try {
      if (event.body) {
        const body = JSON.parse(event.body);
        if (body.glitchId) {
          const sql = neon(process.env.NETLIFY_DATABASE_URL!);
          await sql`
            UPDATE media_assets_glitch 
            SET 
              status = 'failed',
              error_message = ${error.message || 'Unknown error occurred'},
              updated_at = NOW()
            WHERE id = ${body.glitchId}
          `;
        }
      }
    } catch (dbError) {
      console.error('❌ [NeoGlitch] Failed to log error to database:', dbError);
    }
    
    return json({ 
      error: 'GENERATION_FAILED',
      message: error.message,
      status: 'failed'
    }, { status: 500 });
  }
};
