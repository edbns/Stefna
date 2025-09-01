// netlify/functions/neo-glitch-generate.ts
// Neo Tokyo Glitch Generation Handler
//
// 🎯 GENERATION STRATEGY:
// 1. PRIMARY: Use Stability.ai (3-tier fallback: Ultra → Core → SD3)
// 2. FALLBACK: Use Fal.ai photo models if Stability.ai fails completely
// 3. CREDITS: Charge 1 credit total (Stability.ai success OR Fal.ai fallback)
//
// ⚠️ IMPORTANT: Clean fallback chain - no more AIML dependency
import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

// 🚀 BACKGROUND MODE: Allow function to run for up to 15 minutes
export const config = {
  type: "background",
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



// Main NeoGlitch generation function
export async function startBackgroundGeneration(
  jobId: string,
  sourceUrl: string,
  prompt: string,
  presetKey: string,
  userId: string
) {
  console.log('[NeoGlitch] Starting background generation for job:', jobId);
  console.log('[NeoGlitch] Parameters:', { sourceUrl, prompt, presetKey, userId });

  try {
    // Start the generation process using the existing function
    const result = await processGenerationAsync(jobId, sourceUrl, prompt, presetKey, userId, jobId, 'background');
    
          // Update job status based on result
      if (result.status === 'completed') {
        await q(`
          UPDATE neo_glitch_media
          SET status = $1, image_url = $2, stability_job_id = $3, updated_at = NOW()
          WHERE id = $4
        `, ['completed', result.imageUrl, result.stabilityJobId, jobId]);
        console.log('[NeoGlitch] Background generation completed successfully for job:', jobId);
      } else {
        // Still processing
        await q(`
          UPDATE neo_glitch_media
          SET status = $1, stability_job_id = $2, updated_at = NOW()
          WHERE id = $3
        `, ['processing', result.stabilityJobId, jobId]);
        console.log('[NeoGlitch] Background generation started for job:', jobId);
      }

    return result;

  } catch (error: any) {
    console.error('[NeoGlitch] Background generation failed for job:', jobId, error);
    
    // Update job status to failed
    await q(`
      UPDATE neo_glitch_media
      SET status = 'failed', updated_at = NOW()
      WHERE id = $1
    `, [jobId]);

    throw error;
  }
}

// Helper function to check identity similarity (placeholder for now)
async function checkIdentitySimilarity(sourceUrl: string, generatedUrl: string): Promise<number> {
  try {
    // TODO: Implement actual face embedding comparison with TensorFlow.js
    // For now, return a placeholder similarity score
    console.log('🔒 [IPA] Placeholder similarity check - will implement actual face comparison');
    
    // Simulate similarity check (replace with real implementation)
    // In production, this would:
    // 1. Extract face embeddings from both images
    // 2. Calculate cosine similarity between embeddings
    // 3. Return similarity score (0.0 to 1.0)
    
    const similarity = 0.75; // Placeholder value - replace with real calculation
    return similarity;
  } catch (error) {
    console.error('❌ [IPA] Similarity check failed:', error);
    return 0.5; // Default to 50% similarity on error
  }
}

// Helper function to upload Fal.ai results to Cloudinary (replaces AIML function)
async function uploadFalToCloudinary(imageUrl: string, presetKey: string): Promise<{ url: string; publicId: string }> {
  try {
    console.log('☁️ [NeoGlitch] Uploading Fal.ai result to Cloudinary:', imageUrl.substring(0, 60) + '...');

    const result = await cloudinary.uploader.upload(imageUrl, {
      resource_type: 'image',
      tags: ['neo-glitch', 'fal-fallback', `preset:${presetKey}`],
      folder: 'neo-glitch',
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' },
        { width: 1024, height: 1024, crop: 'limit' }
      ]
    });

    console.log('✅ [NeoGlitch] Cloudinary upload successful:', {
      publicId: result.public_id,
      url: result.secure_url,
      size: result.bytes
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('❌ [NeoGlitch] Cloudinary upload failed:', error);
    throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Import shared token refresh utility
import { getFreshToken, isTokenExpiredError } from './utils/tokenRefresh';

export const handler: Handler = async (event) => {
  console.log('🚀 [NeoGlitch] Function started at:', new Date().toISOString());
  console.log('📊 Request details:', {
    method: event.httpMethod,
    path: event.path,
    hasBody: !!event.body,
    hasHeaders: !!event.headers,
    timestamp: new Date().toISOString()
  });

  try {
    // Parse body early to catch JSON parsing errors
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
        console.log('📦 Parsed payload successfully');
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
          },
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }
    }

    if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle GET requests for status checking
  if (event.httpMethod === 'GET') {
    const jobId = event.queryStringParameters?.jobId;
    if (!jobId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'jobId parameter required' })
      };
    }

    try {
      const status = await qOne(`
        SELECT id, status, image_url, created_at, preset, prompt, stability_job_id
        FROM neo_glitch_media
        WHERE id = $1
      `, [jobId]);

      if (!status) {
        return {
          statusCode: 404,
          headers: { 
            'Access-Control-Allow-Origin': '*', 
            'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
          },
          body: JSON.stringify({ error: 'Job not found' })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify(status)
      };
    } catch (error) {
      console.error('❌ [NeoGlitch] Status check failed:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Status check failed' })
      };
    }
  }

  // Continue with POST request handling...

  console.log('🔄 [NeoGlitch] Processing POST request...');

  try {
    // Extract user's JWT token for internal credit calls
    const userToken = event.headers.authorization?.replace('Bearer ', '') || '';
    console.log('🔑 [NeoGlitch] Token extracted:', !!userToken);
    
    if (!userToken) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({ 
          error: 'AUTH_REQUIRED',
          message: 'Authorization token required' 
        })
      };
    }
    
    console.log('🔍 [NeoGlitch] User token extracted for credit calls');
    
    // Validate token format (basic check)
    if (userToken.split('.').length !== 3) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({ 
          error: 'INVALID_TOKEN_FORMAT',
          message: 'Invalid JWT token format' 
        })
      };
    }
    
    const body = JSON.parse(event.body || '{}');
    console.log('🔍 [NeoGlitch] RAW INCOMING PAYLOAD:', JSON.stringify(body, null, 2));

    // Normalize fields (support both sourceAssetId and sourceUrl)
    const {
      prompt,
      userId,
      presetKey,
      runId = body.runId || uuidv4(),
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
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'VALIDATION_FAILED',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        })
      };
    }

    console.log('✅ [NeoGlitch] Normalized fields:', { 
      prompt: prompt.substring(0, 100) + '...', 
      runId: runId.toString(), 
      runIdType: typeof runId,
      sourceUrl, 
      presetKey, 
      userId 
    });

    console.log('🔍 [NeoGlitch] Checking for existing run with runId:', runId.toString());

    // Check for existing run
    let existingRun;
    try {
      existingRun = await qOne(`
        SELECT id, status, image_url, created_at
        FROM neo_glitch_media
        WHERE run_id = $1
      `, [runId.toString()]);
    } catch (dbError: any) {
      console.warn('⚠️ [NeoGlitch] Database check failed, proceeding with generation:', dbError.message);
      existingRun = null;
    }

    if (existingRun) {
      console.log('🔄 [NeoGlitch] Found existing run:', {
        id: existingRun.id,
        status: existingRun.status,
        hasImageUrl: !!existingRun.image_url,
        createdAt: existingRun.created_at
      });
      
      if (existingRun.status === 'completed' && existingRun.image_url) {
        console.log('🔄 [NeoGlitch] Run already completed, returning cached result');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify(existingRun)
      };
      } else {
        console.warn('⚠️ [NeoGlitch] Run exists but incomplete, cleaning up and retrying');
        // Delete old failed/incomplete record to retry clean
        await q(`DELETE FROM neo_glitch_media WHERE id = $1`, [existingRun.id]);
        console.log('🧹 [NeoGlitch] Cleaned up incomplete run, proceeding with new generation');
      }
    } else {
      console.log('✅ [NeoGlitch] No existing run found, proceeding with new generation');
    }

    // Create initial record
    const initialRows = await q(`
      INSERT INTO neo_glitch_media (
        id, run_id, user_id, source_url, prompt, preset, status, image_url, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'processing', $4, NOW(), NOW()
      )
      RETURNING id
    `, [uuidv4(), runId.toString(), userId, sourceUrl, prompt, presetKey]);

    const initialRecord = { id: initialRows[0].id } as any;

    console.log('✅ [NeoGlitch] Initial record created:', initialRecord.id);

    // 🔄 GENERATION PROCESSING: Start Stability.ai generation immediately
    // Stability.ai returns images synchronously, so we process in the same request
    console.log('🚀 [NeoGlitch] Starting Stability.ai generation process...');
    
    // Process the generation immediately (Stability.ai is synchronous)
    console.log('🚀 [NeoGlitch] About to call processGenerationAsync...');
    let generationResult;
    try {
      generationResult = await processGenerationAsync(initialRecord.id, sourceUrl, prompt, presetKey, userId, runId, userToken);
      console.log('✅ [NeoGlitch] processGenerationAsync completed:', !!generationResult);
    } catch (error) {
      console.error('❌ [NeoGlitch] processGenerationAsync failed:', error);
      // Update status to failed in database
      await q(`UPDATE neo_glitch_media SET status = 'failed' WHERE id = $1`, [initialRecord.id]);
      throw error;
    }

    // 🔍 CRITICAL FIX: Check if generation completed immediately
    if (generationResult && generationResult.status === 'completed' && generationResult.imageUrl) {
      console.log('🎉 [NeoGlitch] Generation completed immediately! Returning completed status');
      return {
        statusCode: 200, // OK - completed
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({
          message: 'Generation completed successfully',
          jobId: initialRecord.id,
          runId: runId.toString(),
          status: 'completed',
          imageUrl: generationResult.imageUrl,
          stabilityJobId: generationResult.stabilityJobId,
          provider: 'stability'
        })
      };
    }

    // Return processing status only if generation is still in progress
    console.log('🔄 [NeoGlitch] Generation in progress, returning processing status');
    return {
      statusCode: 202, // Accepted - processing
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        message: 'Generation started successfully',
        jobId: initialRecord.id,
        runId: runId.toString(),
        status: 'processing',
        pollUrl: '/.netlify/functions/neo-glitch-generate'
      })
    };

  } catch (error) {
    console.error('❌ [NeoGlitch] Unexpected error:', error);
    
    // Check if it's a token expiration error
    if (isTokenExpiredError(error.message)) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please refresh the page and try again.',
          details: 'Authentication token expired during generation',
          suggestion: 'Refresh your browser page to get a new session'
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
  finally {
    // Cleanup if needed
  }
};

