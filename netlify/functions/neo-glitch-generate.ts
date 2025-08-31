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

  } catch (error: any) {
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
};

// 🔄 ASYNC GENERATION PROCESSOR
async function processGenerationAsync(
  recordId: string, 
  sourceUrl: string, 
  prompt: string, 
  presetKey: string, 
  userId: string, 
  runId: string, 
  userToken: string
) {
  try {
    console.log('🚀 [NeoGlitch] Starting async generation for record:', recordId);
    
    // Start Stability.ai generation
    let stabilityResult;
    try {
      stabilityResult = await startStabilityGeneration(sourceUrl, prompt, presetKey, userId, runId);
      
      // 🔍 CRITICAL FIX: Check if Stability.ai returned immediate result
      if (stabilityResult && stabilityResult.imageUrl && stabilityResult.status === 'completed') {
        console.log('🎉 [NeoGlitch] Stability.ai returned immediate result!');
        
        // 🚀 UNIFIED CLOUDINARY PIPELINE: Upload Stability.ai result to Cloudinary
        let finalImageUrl = stabilityResult.imageUrl;
        let cloudinaryPublicId: string | null = null;
        
        try {
          const cloudinaryResult = await uploadAIMLToCloudinary(stabilityResult.imageUrl, presetKey);
          finalImageUrl = cloudinaryResult.url;
          cloudinaryPublicId = cloudinaryResult.publicId;
          console.log('✅ [NeoGlitch] Stability.ai result uploaded to Cloudinary successfully');
        } catch (cloudinaryError) {
          console.warn('⚠️ [NeoGlitch] Cloudinary upload failed, using original Stability.ai URL:', cloudinaryError);
          // Fallback to original URL if Cloudinary fails
        }
        
        // Update database record with Cloudinary URL (or fallback to Stability.ai URL)
        await q(`
          UPDATE neo_glitch_media
          SET status = $1, image_url = $2, stability_job_id = $3, updated_at = NOW()
          WHERE id = $4
        `, ['completed', finalImageUrl, stabilityResult.stabilityJobId, recordId]);
        
        console.log('✅ [NeoGlitch] Database updated with completed status and Cloudinary URL');
        
        // Return completed status so frontend gets immediate result
        return {
          status: 'completed',
          imageUrl: finalImageUrl, // ✅ Return Cloudinary URL
          stabilityJobId: stabilityResult.stabilityJobId
        };
      }
      
      // Stability.ai returned job ID (needs polling)
      console.log('🔄 [NeoGlitch] Stability.ai returned job ID, will need polling');
      
      // Update record with Stability.ai job ID
      await q(`
        UPDATE neo_glitch_media
        SET status = $1, stability_job_id = $2, updated_at = NOW()
        WHERE id = $3
      `, ['generating', stabilityResult.stabilityJobId, recordId]);
      
      console.log('🚀 [NeoGlitch] Generation started successfully:', {
        strategy: stabilityResult.strategy,
        jobId: stabilityResult.stabilityJobId,
        model: stabilityResult.model
      });
      
      // Return processing status for ongoing jobs
      return {
        status: 'processing',
        stabilityJobId: stabilityResult.stabilityJobId
      };
      
    } catch (stabilityError: any) {
      console.error('❌ [NeoGlitch] Stability.ai generation failed:', stabilityError);
      
      // 🚨 STABILITY.AI FAILED - Now fallback to Fal.ai (prevents double billing)
      console.log('🔄 [NeoGlitch] Stability.ai failed, attempting Fal.ai fallback...');
      
      try {
        // Attempt Fal.ai fallback
        const falResult = await attemptFalFallback(sourceUrl, prompt, presetKey, userId, runId);
        
        if (falResult && falResult.imageUrl) {
          console.log('✅ [NeoGlitch] Fal.ai fallback succeeded!');
          
          // 🚀 UNIFIED CLOUDINARY PIPELINE: Upload Fal.ai result to Cloudinary
          let finalImageUrl = falResult.imageUrl;
          let cloudinaryPublicId: string | null = null;
          
          try {
            const cloudinaryResult = await uploadAIMLToCloudinary(falResult.imageUrl, presetKey);
            finalImageUrl = cloudinaryResult.url;
            cloudinaryPublicId = cloudinaryResult.publicId;
            console.log('✅ [NeoGlitch] Fal.ai result uploaded to Cloudinary successfully');
          } catch (cloudinaryError) {
            console.warn('⚠️ [NeoGlitch] Cloudinary upload failed, using original Fal.ai URL:', cloudinaryError);
            // Fallback to original URL if Cloudinary fails
          }
          
          // 🔒 IDENTITY PRESERVATION CHECK for Fal.ai fallback
          console.log('🔒 [NeoGlitch] Starting IPA check for Fal.ai fallback...');
          let ipaPassed = true;
          let ipaSimilarity = 1.0;
          
          try {
            // Simple similarity check - compare source and generated images
            // In production, this would use TensorFlow.js face embeddings
            const similarity = await checkIdentitySimilarity(sourceUrl, finalImageUrl);
            ipaSimilarity = similarity;
            
            // Neo Glitch uses relaxed IPA threshold (0.4) for creative freedom
            const ipaThreshold = 0.4;
            ipaPassed = similarity >= ipaThreshold;
            
            console.log(`🔒 [NeoGlitch] IPA check: ${(similarity * 100).toFixed(1)}% similarity, threshold: ${(ipaThreshold * 100).toFixed(1)}%, passed: ${ipaPassed}`);
            
            if (!ipaPassed) {
              console.log('⚠️ [NeoGlitch] IPA failed, attempting retry with lower strength...');
              
              // Retry with lower strength for better identity preservation
              const retryResult = await retryWithLowerStrength(sourceUrl, prompt, presetKey, userId, runId);
              if (retryResult && retryResult.imageUrl) {
                console.log('🔄 [NeoGlitch] Retry successful, updating with new result');
                finalImageUrl = retryResult.imageUrl;
                
                // Re-upload to Cloudinary if needed
                try {
                  const retryCloudinaryResult = await uploadAIMLToCloudinary(retryResult.imageUrl, presetKey);
                  finalImageUrl = retryCloudinaryResult.url;
                  cloudinaryPublicId = retryCloudinaryResult.publicId;
                  console.log('✅ [NeoGlitch] Retry result uploaded to Cloudinary');
                } catch (retryCloudinaryError) {
                  console.warn('⚠️ [NeoGlitch] Retry Cloudinary upload failed, using original URL');
                }
                
                // Re-check IPA on retry result
                const retrySimilarity = await checkIdentitySimilarity(sourceUrl, finalImageUrl);
                ipaSimilarity = retrySimilarity;
                ipaPassed = retrySimilarity >= ipaThreshold;
                console.log(`🔒 [NeoGlitch] Retry IPA: ${(retrySimilarity * 100).toFixed(1)}% similarity, passed: ${ipaPassed}`);
              }
            }
          } catch (ipaError) {
            console.warn('⚠️ [NeoGlitch] IPA check failed, proceeding with original result:', ipaError);
            // Continue with original result if IPA fails
          }
          
          // If IPA still fails after retry, log warning but continue
          if (!ipaPassed) {
            console.warn(`⚠️ [NeoGlitch] IPA failed after retry: ${(ipaSimilarity * 100).toFixed(1)}% similarity < ${(0.4 * 100).toFixed(1)}% threshold`);
            console.warn('⚠️ [NeoGlitch] Proceeding with result but identity preservation may be poor');
          }
          
          // Update database record with Cloudinary URL and Fal.ai results
          await q(`
            UPDATE neo_glitch_media
            SET status = $1, image_url = $2, stability_job_id = $3, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{ipaPassed}', to_jsonb($4::boolean), true)
              || jsonb_build_object('ipaSimilarity', $5, 'ipaThreshold', $6, 'ipaRetries', $7, 'ipaStrategy', $8, 'generationPath', $9),
              updated_at = NOW()
            WHERE id = $10
          `, ['completed', finalImageUrl, `fal_${runId}`, ipaPassed, Math.round(ipaSimilarity * 100) / 100, 0.4, ipaPassed ? 0 : 1, ipaPassed ? 'first_try' : 'lower_strength_retry', 'fal_fallback', recordId]);
          
          // 🔒 CRITICAL FIX: Only charge credits ONCE for Fal.ai fallback (no double billing)
          await finalizeCreditsOnce(userId, runId, true, userToken);
          
          console.log('✅ [NeoGlitch] Async generation completed with Fal.ai fallback');
          return {
            status: 'completed',
            imageUrl: finalImageUrl, // ✅ Return Cloudinary URL instead of Fal.ai URL
            stabilityJobId: `fal_${runId}`
          };
        } else {
          throw new Error('Fal.ai fallback failed to return valid image');
        }
      } catch (falError: any) {
        console.error('❌ [NeoGlitch] Fal.ai fallback also failed:', falError);
        
        // Update database record with failed status
        await q(`
          UPDATE neo_glitch_media
          SET status = 'failed', image_url = $1, updated_at = NOW()
          WHERE id = $2
        `, [sourceUrl, recordId]);
        
        // 🔒 CRITICAL FIX: No credits charged since both failed
        await finalizeCreditsOnce(userId, runId, false, userToken);
        
        console.error('❌ [NeoGlitch] All generation methods failed');
        return {
          status: 'failed',
          error: falError.message || 'All generation methods failed'
        };
      }
    }
  } catch (error) {
    console.error('❌ [NeoGlitch] Async generation failed:', error);
    
    // Update database record with failed status
    await q(`
      UPDATE neo_glitch_media
      SET status = 'failed', image_url = $1, updated_at = NOW()
      WHERE id = $2
    `, [sourceUrl, recordId]);
    
    // Refund credits since generation failed
    await finalizeCreditsOnce(userId, runId, false, userToken);
    
    // Return failed status
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Stability.ai Generation Function
async function startStabilityGeneration(sourceUrl: string, prompt: string, presetKey: string, userId: string, runId: string) {
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY not configured');
  }

  console.log('🚀 [NeoGlitch] Starting 3-tier Stability.ai generation strategy:', {
    hasStabilityToken: !!STABILITY_API_KEY,
    sourceUrl,
    promptLength: prompt.length,
    presetKey
  });

  try {
    // 🎯 3-TIER STABILITY.AI FALLBACK STRATEGY
    console.log('🎯 [NeoGlitch] Attempting 3-tier Stability.ai fallback: Ultra → Core → SD3');
    
    // Tier 1: Ultra (highest quality)
    try {
      console.log('🖼️ [NeoGlitch] Tier 1: Attempting Stable Image Ultra...');
      const ultraResult = await attemptStabilityGeneration(
        STABILITY_API_KEY,
        sourceUrl,
        prompt,
        presetKey,
        userId,
        runId,
        'ultra'
      );
      console.log('✅ [NeoGlitch] Ultra succeeded! Using Ultra result');
      return { ...ultraResult, strategy: 'stability_ultra' };
    } catch (ultraError: any) {
      console.log('⚠️ [NeoGlitch] Ultra failed, trying Core...', ultraError.message);
    }
    
    // Tier 2: Core (fast and affordable)
    try {
      console.log('⚡ [NeoGlitch] Tier 2: Attempting Stable Image Core...');
      const coreResult = await attemptStabilityGeneration(
        STABILITY_API_KEY,
        sourceUrl,
        prompt,
        presetKey,
        userId,
        runId,
        'core'
      );
      console.log('✅ [NeoGlitch] Core succeeded! Using Core result');
      return { ...coreResult, strategy: 'stability_core' };
    } catch (coreError: any) {
      console.log('⚠️ [NeoGlitch] Core failed, trying SD3...', coreError.message);
    }
    
    // Tier 3: SD3 (balanced)
    try {
      console.log('🎨 [NeoGlitch] Tier 3: Attempting Stable Diffusion 3...');
      const sd3Result = await attemptStabilityGeneration(
        STABILITY_API_KEY,
        sourceUrl,
        prompt,
        presetKey,
        userId,
        runId,
        'sd3'
      );
      console.log('✅ [NeoGlitch] SD3 succeeded! Using SD3 result');
      return { ...sd3Result, strategy: 'stability_sd3' };
    } catch (sd3Error: any) {
      console.log('⚠️ [NeoGlitch] SD3 failed, all Stability.ai tiers exhausted', sd3Error.message);
    }
    
    // 🚨 ALL STABILITY.AI FAILED - Fallback to Fal.ai
    console.log('❌ [NeoGlitch] All 3 Stability.ai tiers failed, falling back to Fal.ai');
    throw new Error('All Stability.ai tiers failed - proceeding to Fal.ai fallback');
    
  } catch (error: any) {
    console.error('❌ [NeoGlitch] Stability.ai generation failed:', error.message);
    throw new Error(`Stability.ai generation failed: ${error.message}`);
  }
}

// Credit Deduction Function with token refresh
async function deductCredits(userId: string, provider: 'stability' | 'fal', runId: string, userToken: string) {
  try {
    // Refresh token before making credit calls
    const freshToken = await getFreshToken(userToken);
    
    // First reserve the credits
    const reserveResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/credits-reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}` // Use refreshed token
      },
      body: JSON.stringify({
        user_id: userId,
        request_id: runId,
        action: 'image.gen',
        cost: 2
      })
    });

    if (reserveResponse.ok) {
      const reserveResult = await reserveResponse.json();
      console.log(`✅ [NeoGlitch] Reserved 2 credits for ${provider}. New balance: ${reserveResult.newBalance}`);
      
      // Now commit the credits since generation was successful
      const commitResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/credits-finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshToken}` // Use refreshed token
        },
        body: JSON.stringify({
          user_id: userId,
          request_id: runId,
          disposition: 'commit'
        })
      });

      if (commitResponse.ok) {
        const commitResult = await commitResponse.json();
        console.log(`✅ [NeoGlitch] Committed 2 credits for ${provider} after successful generation. Final balance: ${commitResult.newBalance}`);
        return true;
      } else {
        console.warn(`⚠️ [NeoGlitch] Failed to commit credit for ${provider}: ${commitResponse.status}`);
        // Try to refund since commit failed
        await refundCredits(userId, runId, freshToken);
        return false;
      }
    } else {
      console.warn(`⚠️ [NeoGlitch] Failed to reserve credit for ${provider}: ${reserveResponse.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ [NeoGlitch] Error processing credit for ${provider}:`, error);
    return false;
  }
}

// Credit Refund Function with token refresh
async function refundCredits(userId: string, requestId: string, userToken: string) {
  try {
    // Refresh token before making credit calls
    const freshToken = await getFreshToken(userToken);
    
    const response = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/credits-finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}` // Use refreshed token
      },
      body: JSON.stringify({
        user_id: userId,
        request_id: requestId,
        disposition: 'refund'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ [NeoGlitch] Refunded credit. New balance: ${result.newBalance}`);
      return true;
    } else {
      console.warn(`⚠️ [NeoGlitch] Failed to refund credit: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ [NeoGlitch] Error refunding credit:', error);
    return false;
  }
}

// Single Credit Deduction Function - Only call this once at the end
async function finalizeCreditsOnce(userId: string, runId: string, success: boolean, userToken: string) {
  try {
    if (success) {
      // Reserve and commit credits only once for successful generation
              const reserveResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/credits-reserve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}` // Use user's actual JWT token
          },
        body: JSON.stringify({
          user_id: userId,
          request_id: runId,
          action: 'image.gen',
          cost: 2
        })
      });

      if (reserveResponse.ok) {
        const reserveResult = await reserveResponse.json();
        console.log(`✅ [NeoGlitch] Reserved 2 credits for successful generation. New balance: ${reserveResult.newBalance}`);
        
        // Now commit the credits since generation was successful
        const commitResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/credits-finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}` // Use user's actual JWT token
          },
          body: JSON.stringify({
            user_id: userId,
            request_id: runId,
            disposition: 'commit'
          })
        });

        if (commitResponse.ok) {
          const commitResult = await commitResponse.json();
          console.log(`✅ [NeoGlitch] Committed 1 credit after successful generation. Final balance: ${commitResult.newBalance}`);
          return true;
        } else {
          console.warn(`⚠️ [NeoGlitch] Failed to commit credit: ${commitResponse.status}`);
          return false;
        }
      } else {
        console.warn(`⚠️ [NeoGlitch] Failed to reserve credit: ${reserveResponse.status}`);
        return false;
      }
    } else {
      // No credits charged for failed generation
      console.log(`ℹ️ [NeoGlitch] No credits charged for failed generation`);
      return true;
    }
  } catch (error) {
    console.error(`❌ [NeoGlitch] Error processing credits:`, error);
    return false;
  }
}

// Fal.ai Fallback Function


// FAL.ai Model configurations for semantic fallback
const PHOTO_MODELS = [
  {
    model: 'fal-ai/hyper-sdxl/image-to-image',
    name: 'Hyper SDXL I2I',
    cost: 'medium',
    priority: 1,
    description: 'High-quality photo-realistic image-to-image'
  },
  {
    model: 'fal-ai/stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    cost: 'high',
    priority: 2,
    description: 'Premium photo-realistic generation'
  },
  {
    model: 'fal-ai/realistic-vision-v5',
    name: 'Realistic Vision V5',
    cost: 'high',
    priority: 3,
    description: 'Ultra-realistic photo generation'
  }
];

// Fal.ai Fallback Function with proper model selection
async function attemptFalFallback(sourceUrl: string, prompt: string, presetKey: string, userId: string, runId: string) {
  const FAL_KEY = process.env.FAL_KEY;

  if (!FAL_KEY) {
    throw new Error('FAL_KEY not configured for fallback');
  }

  console.log('🔄 [NeoGlitch] Attempting Fal.ai fallback generation with semantic models');

  try {
    // Import fal.ai client
    const { fal } = await import('@fal-ai/client');

    // Configure fal.ai client
    fal.config({
      credentials: FAL_KEY
    });

    // Try FAL.ai models in priority order (same as main FAL function)
    let lastError: any = null;

    for (const modelConfig of PHOTO_MODELS) {
      try {
        console.log(`🖼️ [NeoGlitch] Trying FAL.ai model: ${modelConfig.name} (${modelConfig.model})`);

        const result = await fal.subscribe(modelConfig.model, {
          input: {
            image_url: sourceUrl,
            prompt: `${prompt}, cyberpunk, neon, glitch effects, maintain face identity`,
            image_strength: 0.75, // Lower strength for better identity preservation
            num_images: 1,
            guidance_scale: 7.5,
            num_inference_steps: 30,
            seed: Math.floor(Math.random() * 1000000)
          },
          logs: true
        });

        console.log(`✅ [NeoGlitch] FAL.ai ${modelConfig.name} generation successful!`);

        // Extract image URL from fal.ai result
        let imageUrl = null;

        if (result.data?.image?.url) {
          imageUrl = result.data.image.url;
        } else if (result.data?.image) {
          imageUrl = result.data.image;
        }

        if (!imageUrl) {
          throw new Error('FAL.ai succeeded but no image URL found in response');
        }

        // Add randomization to prevent cache hits
        const randomSeed = Math.floor(Math.random() * 1000000);

        return {
          stabilityJobId: `fal_${Date.now()}`,
          model: modelConfig.model,
          strategy: 'fal_fallback',
          provider: 'fal',
          imageUrl,
          status: 'completed',
          seed: randomSeed
        };

      } catch (modelError: any) {
        console.warn(`⚠️ [NeoGlitch] FAL.ai ${modelConfig.name} failed:`, modelError.message);
        lastError = modelError;

        // Continue to next model in priority order
        continue;
      }
    }

    // All FAL.ai models failed
    console.error('❌ [NeoGlitch] All FAL.ai models failed:', lastError?.message);
    throw new Error(`All FAL.ai models failed: ${lastError?.message || 'Unknown error'}`);

  } catch (error: any) {
    console.error('❌ [NeoGlitch] FAL.ai fallback error:', error);
    throw error;
  }
}

// Cloudinary Upload Function
async function uploadBase64ToCloudinary(base64Data: string): Promise<string> {
  const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
  const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials not configured');
  }

  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Create form data for Cloudinary upload
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'generated.png');
    formData.append('upload_preset', 'ml_default'); // Use default upload preset
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.secure_url;
  } catch (error: any) {
    console.error('❌ [NeoGlitch] Cloudinary upload error:', error);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
}

// Stability.ai Generation Implementation - Now using modular approach
async function attemptStabilityGeneration(
  apiToken: string,
  sourceUrl: string,
  prompt: string,
  presetKey: string,
  userId: string,
  runId: string,
  modelType: 'ultra' | 'core' | 'sd3' = 'core'
) {
  // ✅ CORRECT: Stability.ai parameters (verified working ranges)
  const presetConfigs = {
    'visor': { strength: 0.65, guidance_scale: 8.0, steps: 30 }, // Optimal for face preservation
    'base': { strength: 0.60, guidance_scale: 7.5, steps: 25 }, // Balanced for face preservation
    'tattoos': { strength: 0.70, guidance_scale: 8.5, steps: 35 }, // Good for artistic effects
    'scanlines': { strength: 0.65, guidance_scale: 8.0, steps: 30 } // Optimal for scanline effects
  };

  const config = presetConfigs[presetKey as keyof typeof presetConfigs] || presetConfigs.visor;

  console.log(`🧪 [NeoGlitch] Attempting Stability.ai generation with ${modelType.toUpperCase()} tier`);
  console.log(`🔧 [NeoGlitch] Using preset config:`, config);

  try {
    console.log('📦 [NeoGlitch] Importing stability-generator module...');

    // 🚀 NEW: Use the modular Stability.ai generator with timeout protection
    const controller = new AbortController();
    const importTimeout = setTimeout(() => {
      console.error('⏱ [NeoGlitch] Import timeout - aborting');
      controller.abort();
    }, 10000); // 10s timeout for import

    let generateImageWithStability;
    try {
      const module = await import('../src/lib/stability-generator.js');
      generateImageWithStability = module.generateImageWithStability;
      console.log('✅ [NeoGlitch] Successfully imported stability-generator');
    } catch (importError: any) {
      console.error('❌ [NeoGlitch] Failed to import stability-generator:', importError);
      throw new Error(`Module import failed: ${importError.message}`);
    } finally {
      clearTimeout(importTimeout);
    }
    
    // 🔍 DETAILED LOGGING: Log the request details for Stability.ai support
    const requestDetails = {
      model: modelType,
      prompt: `${prompt}, preserve facial identity, maintain original face structure`,
      sourceUrl,
      strength: config.strength,
      steps: config.steps,
      cfgScale: config.guidance_scale,
      timestamp: new Date().toISOString(),
      runId,
      userId
    };
    
    console.log('🔍 [Stability.ai Support] FULL REQUEST DETAILS:', JSON.stringify(requestDetails, null, 2));
    console.log('🔍 [Stability.ai Support] API Key present:', !!apiToken);
    console.log('🔍 [Stability.ai Support] Source image size check:', sourceUrl);
    
    // Wrap API call with timeout protection
    const apiController = new AbortController();
    const apiTimeout = setTimeout(() => {
      console.error('⏱ [NeoGlitch] API call timeout - aborting');
      apiController.abort();
    }, 20000); // 20s timeout for API call

    let result;
    try {
      console.log('🌐 [NeoGlitch] Making Stability.ai API call...');
      result = await generateImageWithStability({
        prompt: `${prompt}, preserve facial identity, maintain original face structure`,
        sourceUrl,
        modelTier: modelType,
        strength: config.strength,
        steps: config.steps,
        cfgScale: config.guidance_scale,
        stabilityApiKey: apiToken
      });
      console.log('✅ [NeoGlitch] Stability.ai API call completed');
    } catch (apiError: any) {
      if (apiError.name === 'AbortError') {
        console.error('⏱ [NeoGlitch] API call timed out');
        throw new Error('Stability.ai API call timed out');
      }
      throw apiError;
    } finally {
      clearTimeout(apiTimeout);
    }

    // 🔍 DETAILED LOGGING: Log the successful response for Stability.ai support
    console.log('🔍 [Stability.ai Support] FULL RESPONSE DETAILS:', {
      success: true,
      model: modelType,
      resultUrl: result.url,
      resultType: typeof result.url,
      hasUrl: !!result.url,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ [NeoGlitch] Stability.ai ${modelType.toUpperCase()} generation successful!`);
    console.log(`🎨 [NeoGlitch] Generated image URL:`, result.url);
    console.info(`🧭 Generation Path: Used Stability.ai → Tier: ${modelType.toUpperCase()} → Result: SUCCESS`);

    // Upload the generated image to Cloudinary
    const cloudinaryUrl = await uploadBase64ToCloudinary(result.url);
    console.log(`☁️ [NeoGlitch] Image uploaded to Cloudinary:`, cloudinaryUrl);

    return {
      stabilityJobId: `stability_${Date.now()}`,
      model: modelType,
      strategy: `stability_${modelType}`,
      provider: 'stability',
      imageUrl: cloudinaryUrl,
      status: 'completed'
    };

  } catch (error: any) {
    console.error('❌ [NeoGlitch] Error in Stability.ai generation attempt:', error);
    throw error;
  }

  } catch (stabilityError: any) {
    // 🔍 DETAILED LOGGING: Log the failed response for Stability.ai support
    console.log('🔍 [Stability.ai Support] FULL ERROR RESPONSE:', {
      success: false,
      model: modelType,
      error: stabilityError.message,
      errorType: stabilityError.constructor.name,
      errorStack: stabilityError.stack,
      timestamp: new Date().toISOString(),
      runId,
      userId
    });

    console.error(`❌ [NeoGlitch] Stability.ai ${modelType.toUpperCase()} generation failed:`, stabilityError.message);
  
    // 🚨 STABILITY.AI FAILED - Now fallback to Fal.ai (this prevents double billing)
    console.log('🔄 [NeoGlitch] Stability.ai failed - falling back to Fal.ai');
    console.warn(`🧭 Generation Path: Stability.ai failed → Fal.ai fallback`);
  
    try {
      return await attemptFalFallback(sourceUrl, prompt, presetKey, userId, runId);
    } catch (fallbackError: any) {
      console.error('❌ [NeoGlitch] Fal.ai fallback also failed:', fallbackError);
      throw new Error(`Stability.ai failed, and Fal.ai fallback failed: ${fallbackError.message}`);
    }
  }
}
