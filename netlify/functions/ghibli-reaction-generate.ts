// netlify/functions/ghibli-reaction-generate.ts
// Ghibli Reaction Generation Handler - Now using Fal.ai via centralized fal-generate function
// 
// 🎯 GENERATION STRATEGY:
// 1. PRIMARY: Use Fal.ai API for all Ghibli Reaction generations via fal-generate
// 2. FALLBACK: Handled by fal-generate function (3 models with fallbacks)
// 3. CREDITS: Charge 1 credit total
// 
// ⚠️ IMPORTANT: This now calls the centralized fal-generate function instead of direct API calls
import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Main handler for direct calls
export const handler: Handler = async (event) => {
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
        SELECT id, status, image_url, created_at, preset, prompt, fal_job_id
        FROM ghibli_reaction_media
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
      console.error('❌ [GhibliReaction] Status check failed:', error);
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

  try {
    // Extract user's JWT token for internal credit calls
    const userToken = event.headers.authorization?.replace('Bearer ', '') || '';
    console.log('🔍 [GhibliReaction] User token extracted for credit calls');
    
    const body = JSON.parse(event.body || '{}');
    console.log('🔍 [GhibliReaction] RAW INCOMING PAYLOAD:', JSON.stringify(body, null, 2));

    // Normalize fields (support both sourceAssetId and sourceUrl)
    const {
      prompt,
      userId,
      presetKey,
      runId = (body.runId || uuidv4()).toString(),
      sourceAssetId,
      sourceUrl,
      generationMeta = {}
    } = body;

    // Handle sourceUrl field (frontend sends it directly)
    const finalSourceUrl = sourceUrl || sourceAssetId;

    // Derive effective preset from generationMeta aliases if present
    const metaPreset: string = (generationMeta.ghibliReactionPresetId || generationMeta.ghibliReactionLabel || generationMeta.presetKey || '').toString();
    const normalizedMetaPreset = (metaPreset || '').toLowerCase();
    const presetAliasMap: Record<string, string> = {
      sparkle: 'ghibli_sparkle',
      shock: 'ghibli_shock',
      tears: 'ghibli_tears'
    };
    const aliasResolved = presetAliasMap[normalizedMetaPreset] || normalizedMetaPreset;
    const effectivePresetKey = (aliasResolved || presetKey || '').toString();

    // Validation (excluding preset here; we validate effectivePresetKey below)
    const requiredFields = { prompt, userId, runId, sourceUrl: finalSourceUrl };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return {
        statusCode: 422,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'POST, OPTIONS' 
        },
        body: JSON.stringify({
          error: 'VALIDATION_FAILED',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        })
      };
    }

    console.log('✅ [GhibliReaction] Normalized fields:', {
      prompt: prompt.substring(0, 100) + '...',
      runId: runId,
      sourceUrl: finalSourceUrl,
      presetKey,
      userId
    });

    console.log('🔍 [GhibliReaction] Checking for existing run with runId:', runId);

    // Check for existing run
    const existingRun = await qOne(`
      SELECT id, status, image_url, created_at
      FROM ghibli_reaction_media
      WHERE run_id = $1
    `, [runId]);

    // Validate image URL
    if (!finalSourceUrl.startsWith('http')) {
      return {
        statusCode: 422,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'INVALID_IMAGE_URL',
          message: 'Source URL must be a valid HTTP(S) URL',
          received: finalSourceUrl
        })
      };
    }

    if (existingRun) {
      console.log('🔄 [GhibliReaction] Found existing run:', {
        id: existingRun.id,
        status: existingRun.status,
        hasImageUrl: !!existingRun.image_url,
        createdAt: existingRun.created_at
      });
      
      if (existingRun.status === 'completed' && existingRun.image_url) {
        console.log('🔄 [GhibliReaction] Run already completed, returning cached result');
        return {
          statusCode: 200,
          headers: { 
            'Access-Control-Allow-Origin': '*', 
            'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
            'Access-Control-Allow-Methods': 'POST, OPTIONS' 
          },
          body: JSON.stringify(existingRun)
        };
      } else {
        console.warn('⚠️ [GhibliReaction] Run exists but incomplete, cleaning up and retrying');
        // Delete old failed/incomplete record to retry clean
        await q(`DELETE FROM ghibli_reaction_media WHERE id = $1`, [existingRun.id]);
        console.log('🧹 [GhibliReaction] Cleaned up incomplete run, proceeding with new generation');
      }
    } else {
      console.log('✅ [GhibliReaction] No existing run found, proceeding with new generation');
    }

    // Validate preset key - accept all Ghibli Reaction preset values
    const validPresets = [
      'ghibli_tears', 'ghibli_shock', 'ghibli_sparkle'
    ];
    if (!validPresets.includes(effectivePresetKey)) {
      return {
        statusCode: 422,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'POST, OPTIONS' 
        },
        body: JSON.stringify({
          error: 'INVALID_PRESET',
          message: `Invalid preset key. Must be one of: ${validPresets.join(', ')}`,
          received: effectivePresetKey,
          valid: validPresets
        })
      };
    }



    // Reserve credits first
    console.log('💰 [GhibliReaction] Reserving 2 credits for generation...');
    const creditReservation = await fetch(`${process.env.URL}/.netlify/functions/credits-reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        userId,
        amount: 2,
        requestId: runId,
        action: 'ghibli_reaction_generation',
        meta: { presetKey, prompt: prompt.substring(0, 100) }
      })
    });

    if (!creditReservation.ok) {
      const creditError = await creditReservation.json().catch(() => ({}));
      console.error('❌ [GhibliReaction] Credit reservation failed:', creditError);
      return {
        statusCode: 402,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'POST, OPTIONS' 
        },
        body: JSON.stringify({
          error: 'INSUFFICIENT_CREDITS',
          message: 'Insufficient credits for generation',
          details: creditError.message || 'Credit reservation failed'
        })
      };
    }

    console.log('✅ [GhibliReaction] Credits reserved successfully');

    // Create initial database record
    const initialRecord = await qOne(`
               INSERT INTO ghibli_reaction_media (
           user_id, run_id, preset, prompt, source_url, status, fal_job_id, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id
       `, [userId, runId, effectivePresetKey, prompt, finalSourceUrl, 'processing', null]);

    console.log('✅ [GhibliReaction] Database record created:', initialRecord.id);

    try {
      // Start Fal.ai generation via centralized function
      const generationResult = await startFalGeneration(finalSourceUrl, prompt, effectivePresetKey, userId, runId);
      
      if (generationResult && generationResult.imageUrl) {
        console.log('🎉 [GhibliReaction] Generation successful, processing result...');
        
        const finalImageUrl = generationResult.imageUrl;
        const falJobId = generationResult.falJobId || generationResult.jobId || null;
        
        // Update database record with fal.ai job ID
        if (falJobId) {
          await q(`
            UPDATE ghibli_reaction_media
            SET fal_job_id = $1, updated_at = NOW()
            WHERE id = $2
          `, [falJobId, initialRecord.id]);
          console.log('✅ [GhibliReaction] Fal.ai job ID stored:', falJobId);
        }
        

        
        // Update database record with completed status
        await q(`
          UPDATE ghibli_reaction_media
          SET status = $1, image_url = $2, metadata = $3, updated_at = NOW()
          WHERE id = $4
        `, [
          'completed', 
          finalImageUrl, 
          JSON.stringify({
            falJobId: falJobId,
            falModel: generationResult.falModel || 'unknown'
          }),
          initialRecord.id
        ]);
        
        console.log('✅ [GhibliReaction] Database updated with completed status');
        
        // Finalize credits
        await fetch(`${process.env.URL}/.netlify/functions/credits-finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            userId,
            requestId: runId,
            success: true,
            meta: { presetKey: effectivePresetKey, finalImageUrl: finalImageUrl.substring(0, 100) }
          })
        });
        
        console.log('✅ [GhibliReaction] Credits finalized successfully');
        
        return {
          statusCode: 200,
          headers: { 
            'Access-Control-Allow-Origin': '*', 
            'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
            'Access-Control-Allow-Methods': 'POST, OPTIONS' 
          },
                  body: JSON.stringify({
          message: 'Generation completed successfully',
          jobId: initialRecord.id,
          runId: runId.toString(),
          status: 'completed',
          imageUrl: finalImageUrl,
          provider: 'fal'
        })
        };
      }
      
    } catch (generationError: any) {
      console.error('❌ [GhibliReaction] Generation failed:', generationError);
      
      // Update database record with failed status
      await q(`
        UPDATE ghibli_reaction_media
        SET status = 'failed', image_url = $1, updated_at = NOW()
        WHERE id = $2
      `, [finalSourceUrl, initialRecord.id]);
      
      // Refund credits since generation failed
      await fetch(`${process.env.URL}/.netlify/functions/credits-finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          userId,
          requestId: runId,
          success: false,
          meta: { presetKey, error: generationError.message }
        })
      });
      
      console.log('✅ [GhibliReaction] Credits refunded due to generation failure');
      
      return {
        statusCode: 500,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'POST, OPTIONS' 
        },
        body: JSON.stringify({
          error: 'GENERATION_FAILED',
          message: 'Ghibli Reaction generation failed',
          details: generationError.message
        })
      };
    }

  } catch (error) {
    console.error('❌ [GhibliReaction] Unexpected error:', error);
    
    return {
      statusCode: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'POST, OPTIONS' 
      },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }

  return {
    statusCode: 500,
    headers: { 
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
      'Access-Control-Allow-Methods': 'POST, OPTIONS' 
    },
    body: JSON.stringify({ error: 'UNEXPECTED_FALLTHROUGH' })
  };
};

// Fal.ai API Generation Function - calls the centralized fal-generate function
async function startFalGeneration(finalSourceUrl: string, prompt: string, presetKey: string, userId: string, runId: string) {
  console.log('🚀 [GhibliReaction] Starting Fal.ai generation via centralized function:', {
    presetKey,
    promptLength: prompt.length,
    hasSource: !!finalSourceUrl
  });

  try {
    // Call the centralized fal-generate function
    const response = await fetch(`${process.env.URL}/.netlify/functions/fal-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceUrl: finalSourceUrl,
        prompt,
        generationType: 'ghibli_reaction',
        userId,
        runId
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Fal.ai generation failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [GhibliReaction] Fal.ai generation successful:', {
      status: result.status,
      model: result.falModel,
      imageUrl: result.imageUrl ? result.imageUrl.substring(0, 60) + '...' : 'none'
    });

    return result;

  } catch (error: any) {
    console.error('❌ [GhibliReaction] Fal.ai generation failed:', error);
    throw error;
  }
}
