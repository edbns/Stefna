// Neo Tokyo Glitch Status Function
// Checks the status of a Replicate generation and updates the local record
// Handles status polling and result processing

import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
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
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Authenticate user
    const { sub: userId } = requireAuth(event);
    console.log('🎭 [NeoGlitch] User authenticated for status check:', userId);

    const body = JSON.parse(event.body || '{}');
    const { glitchId } = body;

    // Validate required fields
    if (!glitchId) {
      return json({ 
        error: 'Missing required field: glitchId is required' 
      }, { status: 400 });
    }

    // Validate Replicate API token
    if (!REPLICATE_API_TOKEN) {
      console.error('❌ [NeoGlitch] REPLICATE_API_TOKEN not configured');
      return json({ 
        error: 'Replicate API not configured' 
      }, { status: 500 });
    }

    console.log('🔍 [NeoGlitch] Checking status for glitch:', glitchId);

    const sql = neon(process.env.NETLIFY_DATABASE_URL!);

    // Get the glitch record
    const glitchRecord = await sql`
      SELECT id, user_id, status, prompt, preset_key, source_asset_id, meta
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
      hasReplicateId: !!(record.meta?.replicate_prediction_id)
    });

    // If already completed, return the current status
    if (record.status === 'completed') {
      const completedRecord = await sql`
        SELECT id, status, cloudinary_url, replicate_url, meta, created_at, updated_at
        FROM media_assets_glitch 
        WHERE id = ${glitchId}
      `;

      return json({
        id: completedRecord[0].id,
        status: 'completed',
        cloudinaryUrl: completedRecord[0].cloudinary_url,
        replicateUrl: completedRecord[0].replicate_url,
        meta: completedRecord[0].meta,
        createdAt: completedRecord[0].created_at,
        updatedAt: completedRecord[0].updated_at
      });
    }

    // If failed, return the current status
    if (record.status === 'failed') {
      const failedRecord = await sql`
        SELECT id, status, meta, created_at, updated_at
        FROM media_assets_glitch 
        WHERE id = ${glitchId}
      `;

      return json({
        id: failedRecord[0].id,
        status: 'failed',
        error: failedRecord[0].meta?.error || 'Generation failed',
        meta: failedRecord[0].meta,
        createdAt: failedRecord[0].created_at,
        updatedAt: failedRecord[0].updated_at
      });
    }

    // Check Replicate API for current status
    const replicatePredictionId = record.meta?.replicate_prediction_id;
    if (!replicatePredictionId) {
      console.error('❌ [NeoGlitch] No Replicate prediction ID found in meta');
      return json({ 
        error: 'No Replicate prediction ID found' 
      }, { status: 400 });
    }

    console.log('🔍 [NeoGlitch] Checking Replicate API for prediction:', replicatePredictionId);

    // Call Replicate API to get current status
    const replicateResponse = await fetch(`${REPLICATE_API_URL}/${replicatePredictionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('❌ [NeoGlitch] Replicate API error:', replicateResponse.status, errorText);
      
      // Mark as failed if we can't reach Replicate
      await sql`
        UPDATE media_assets_glitch 
        SET 
          status = 'failed',
          meta = jsonb_set(
            COALESCE(meta, '{}'::jsonb), 
            '{error}', 
            ${`Replicate API error: ${replicateResponse.status}`}::jsonb
          ),
          updated_at = NOW()
        WHERE id = ${glitchId}
      `;

      return json({ 
        error: 'Failed to check Replicate status',
        details: errorText
      }, { status: replicateResponse.status });
    }

    const replicateResult = await replicateResponse.json();
    console.log('🔍 [NeoGlitch] Replicate status:', {
      predictionId: replicateResult.id,
      status: replicateResult.status,
      hasOutput: !!replicateResult.output
    });

    // Update local status based on Replicate response
    let newStatus = record.status;
    let replicateUrl = null;
    let errorMessage = null;

    if (replicateResult.status === 'succeeded' && replicateResult.output) {
      newStatus = 'completed';
      replicateUrl = Array.isArray(replicateResult.output) ? replicateResult.output[0] : replicateResult.output;
      console.log('✅ [NeoGlitch] Generation completed, Replicate URL:', replicateUrl);
    } else if (replicateResult.status === 'failed') {
      newStatus = 'failed';
      errorMessage = replicateResult.error || 'Replicate generation failed';
      console.error('❌ [NeoGlitch] Generation failed:', errorMessage);
    } else if (replicateResult.status === 'processing') {
      newStatus = 'processing';
      console.log('🔄 [NeoGlitch] Still processing...');
    }

    // Update the local record if status changed
    if (newStatus !== record.status) {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date()
      };

      if (replicateUrl) {
        updateData.replicate_url = replicateUrl;
      }

      if (errorMessage) {
        updateData.meta = sql`jsonb_set(
          COALESCE(meta, '{}'::jsonb), 
          '{error}', 
          ${errorMessage}::jsonb
        )`;
      }

      await sql`
        UPDATE media_assets_glitch 
        SET ${sql(updateData)}
        WHERE id = ${glitchId}
      `;

      console.log('✅ [NeoGlitch] Status updated to:', newStatus);
    }

    // Return current status
    return json({
      id: record.id,
      status: newStatus,
      replicateUrl: replicateUrl,
      cloudinaryUrl: null, // Will be set by backup function
      error: errorMessage,
      meta: record.meta,
      createdAt: record.created_at,
      updatedAt: new Date()
    });

  } catch (error: any) {
    console.error('💥 [NeoGlitch] Status check error:', error);
    
    if (error.message === 'NO_BEARER') {
      return json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    return json({ 
      error: 'STATUS_CHECK_FAILED',
      message: error.message 
    }, { status: 500 });
  }
};
