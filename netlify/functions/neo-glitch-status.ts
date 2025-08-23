// Neo Tokyo Glitch Status Function
// Checks the status of a Replicate generation using dedicated architecture
// Direct Replicate API polling - no intermediate table lookup needed

import type { Handler } from '@netlify/functions';
import { requireAuth } from './lib/auth';
import { json } from './_lib/http';

// Replicate API configuration
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

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
    console.log('🎭 [NeoGlitch] User authenticated for status check:', userId);

    const body = JSON.parse(event.body || '{}');
    const { replicateJobId } = body;

    // Validate required fields for new architecture
    if (!replicateJobId) {
      return json({ 
        error: 'Missing required field: replicateJobId is required' 
      }, { status: 400 });
    }

    // Validate Replicate API token
    if (!REPLICATE_API_TOKEN) {
      console.error('❌ [NeoGlitch] REPLICATE_API_TOKEN not configured');
      return json({ 
        error: 'REPLICATE_API_TOKEN not configured' 
      }, { status: 500 });
    }

    console.log('🔍 [NeoGlitch] Checking status for Replicate job:', replicateJobId);

    // Check Replicate API directly for job status
    const replicateResponse = await fetch(`${REPLICATE_API_URL}/${replicateJobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('❌ [NeoGlitch] Replicate API error:', replicateResponse.status, errorText);
      
      return json({
        error: 'Failed to check Replicate job status',
        details: errorText,
        status: 'failed'
      }, { status: replicateResponse.status });
    }

    const replicateResult = await replicateResponse.json();
    console.log('✅ [NeoGlitch] Replicate status retrieved:', {
      id: replicateResult.id,
      status: replicateResult.status,
      hasOutput: !!replicateResult.output
    });

    // Map Replicate status to our status
    let status: string;
    let replicateUrl: string | null = null;
    let sourceUrl: string | null = null;
    let generationMeta: any = {};

    switch (replicateResult.status) {
      case 'starting':
      case 'processing':
        status = 'processing';
        break;
      case 'succeeded':
        status = 'completed';
        // Extract the output URL (first image in array)
        if (replicateResult.output && Array.isArray(replicateResult.output) && replicateResult.output.length > 0) {
          replicateUrl = replicateResult.output[0];
        }
        // Extract input parameters for metadata
        if (replicateResult.input) {
          generationMeta = {
            prompt: replicateResult.input.prompt,
            strength: replicateResult.input.strength,
            guidance_scale: replicateResult.input.guidance_scale,
            num_inference_steps: replicateResult.input.num_inference_steps
          };
        }
        
        // Auto-save completed generation to database
        if (replicateUrl) {
          console.log('💾 [NeoGlitch] Auto-saving completed generation...');
          try {
            const saveResponse = await fetch(`${process.env.URL}/.netlify/functions/save-neo-glitch`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': event.headers.authorization || event.headers.Authorization || ''
              },
              body: JSON.stringify({
                userId,
                presetKey: 'neo-glitch', // Default preset key
                sourceUrl: '', // Will be provided by frontend
                replicateUrl,
                replicateJobId: replicateJobId,
                generationMeta
              })
            });
            
            if (saveResponse.ok) {
              const saveResult = await saveResponse.json();
              console.log('✅ [NeoGlitch] Auto-save successful:', saveResult.mediaId);
            } else {
              console.warn('⚠️ [NeoGlitch] Auto-save failed:', await saveResponse.text());
            }
          } catch (saveError) {
            console.error('❌ [NeoGlitch] Auto-save error:', saveError);
          }
        }
        break;
      case 'failed':
        status = 'failed';
        generationMeta = {
          error: replicateResult.error || 'Unknown error occurred'
        };
        break;
      case 'canceled':
        status = 'failed';
        generationMeta = {
          error: 'Generation was canceled'
        };
        break;
      default:
        status = 'processing';
    }

    return json({
      id: replicateResult.id,
      status,
      replicateUrl,
      sourceUrl,
      generationMeta,
      replicateStatus: replicateResult.status,
      createdAt: replicateResult.created_at,
      updatedAt: replicateResult.updated_at
    });

  } catch (error: any) {
    console.error('💥 [NeoGlitch] Status check error:', error);
    
    if (error.message === 'NO_BEARER') {
      return json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    return json({ 
      error: 'STATUS_CHECK_FAILED',
      message: error.message,
      status: 'failed'
    }, { status: 500 });
  }
};
