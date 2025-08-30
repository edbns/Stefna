import type { Handler } from '@netlify/functions';
import { requireAuth } from './_lib/auth';
import { q, qOne } from './_db';

export interface IdentitySafeGenerationRequest {
  prompt: string;
  imageUrl: string;
  strength?: number;
  guidance?: number;
  mode?: 'identity-safe' | 'neo-tokyo-glitch' | 'check-status';
  preset?: string;
  predictionId?: string;
}

export interface IdentitySafeGenerationResponse {
  success: boolean;
  id: string;
  status: string;
  created_at: string;
  urls?: {
    get: string;
    cancel: string;
  };
  output?: string[];
  message: string;
}

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { userId } = requireAuth(event.headers.authorization);
    const body: IdentitySafeGenerationRequest = JSON.parse(event.body || '{}');

    // Check if this is a status check request
    if (body.mode === 'check-status' && body.predictionId) {
      return await checkPredictionStatus(body.predictionId, userId);
    }

    // Start new identity-safe generation
    return await startIdentitySafeGeneration(body, userId);

  } catch (error: any) {
    console.error('💥 [Identity Safe Generation] Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};

async function startIdentitySafeGeneration(
  request: IdentitySafeGenerationRequest,
  userId: string
): Promise<any> {
  try {
    console.log('🚀 [Identity Safe Generation] Starting with Replicate fallback:', {
      mode: request.mode || 'identity-safe',
      preset: request.preset,
      strength: request.strength,
      guidance: request.guidance
    });

    // Check user credits first
    const userCredits = await qOne<{ credits: number; balance: number }>(
      'SELECT credits, balance FROM user_credits WHERE user_id = $1',
      [userId]
    );

    if (!userCredits || userCredits.credits < 1) {
      return {
        statusCode: 402,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Insufficient credits',
          required: 1,
          available: userCredits?.credits || 0
        })
      };
    }

    // Reserve credits for this generation
    const runId = crypto.randomUUID();
    const reserveResult = await q(`
      INSERT INTO video_jobs (user_id, run_id, status, created_at, metadata)
      VALUES ($1, $2, 'processing', NOW(), $3)
      RETURNING id
    `, [userId, runId, JSON.stringify({
      type: 'identity_safe_generation',
      mode: request.mode || 'identity-safe',
      preset: request.preset,
      strength: request.strength,
      guidance: request.guidance,
      sourceUrl: request.imageUrl,
      prompt: request.prompt
    })]);

    if (!reserveResult || reserveResult.length === 0) {
      throw new Error('Failed to reserve job');
    }

    const jobId = reserveResult[0].id;

    // Choose Replicate model based on mode
    let replicateModel: string;
    let modelInputs: any;

    if (request.mode === 'neo-tokyo-glitch') {
      // Use InstantID for Neo Tokyo Glitch with identity preservation
      replicateModel = 'lucataco/instantid:55479162c8c97be0b4d5c0c8c0c0c0c0c0c0c0c0';
      modelInputs = {
        input_image: request.imageUrl,
        prompt: `${request.prompt}, neo tokyo glitch style, preserve facial identity, maintain original face structure`,
        negative_prompt: "blurry, low quality, distorted face, multiple faces, deformed",
        num_steps: 30,
        guidance_scale: request.guidance || 7.5,
        strength: request.strength || 0.8
      };
    } else {
      // Use IP-Adapter for general identity-safe generation
      replicateModel = 'lucataco/ip-adapter:55479162c8c97be0b4d5c0c8c0c0c0c0c0c0c0c0';
      modelInputs = {
        input_image: request.imageUrl,
        prompt: `${request.prompt}, preserve facial identity, maintain original face structure`,
        negative_prompt: "blurry, low quality, distorted face, multiple faces, deformed",
        num_steps: 30,
        guidance_scale: request.guidance || 7.5,
        strength: request.strength || 0.6
      };
    }

    // Call Replicate API
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: replicateModel,
        input: modelInputs
      })
    });

    if (!replicateResponse.ok) {
      const errorData = await replicateResponse.json().catch(() => ({}));
      throw new Error(`Replicate API error: ${errorData.error || replicateResponse.statusText}`);
    }

    const replicateResult = await replicateResponse.json();
    console.log('✅ [Identity Safe Generation] Replicate prediction started:', replicateResult);

    // Update job with Replicate prediction ID
    await q(`
      UPDATE video_jobs 
      SET metadata = jsonb_set(metadata, '{replicatePredictionId}', $1, true),
          updated_at = NOW()
      WHERE id = $2
    `, [replicateResult.id, jobId]);

    // Return the prediction details
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        id: replicateResult.id,
        status: replicateResult.status,
        created_at: replicateResult.created_at,
        urls: replicateResult.urls,
        message: 'Identity-safe generation started with Replicate'
      })
    };

  } catch (error: any) {
    console.error('❌ [Identity Safe Generation] Failed:', error);
    throw error;
  }
}

async function checkPredictionStatus(
  predictionId: string,
  userId: string
): Promise<any> {
  try {
    console.log('🔍 [Identity Safe Generation] Checking status for:', predictionId);

    // Call Replicate API to check status
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to check prediction status: ${response.statusText}`);
    }

    const prediction = await response.json();
    console.log('✅ [Identity Safe Generation] Status check result:', prediction);

    // If completed, update the job and finalize credits
    if (prediction.status === 'succeeded' && prediction.output && prediction.output.length > 0) {
      const outputUrl = prediction.output[0];
      
      // Update job status
      await q(`
        UPDATE video_jobs 
        SET status = 'completed',
            image_url = $1,
            updated_at = NOW(),
            metadata = jsonb_set(metadata, '{replicateOutput}', $2, true)
        WHERE metadata->>'replicatePredictionId' = $3
      `, [outputUrl, JSON.stringify(prediction.output), predictionId]);

      // Finalize credits
      await q(`
        UPDATE user_credits 
        SET credits = credits - 1,
            balance = balance - 1,
            updated_at = NOW()
        WHERE user_id = $1
      `, [userId]);

      console.log('✅ [Identity Safe Generation] Job completed and credits finalized');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        id: prediction.id,
        status: prediction.status,
        created_at: prediction.created_at,
        output: prediction.output || [],
        message: `Prediction status: ${prediction.status}`
      })
    };

  } catch (error: any) {
    console.error('❌ [Identity Safe Generation] Status check failed:', error);
    throw error;
  }
}
