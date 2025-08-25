// Neo Tokyo Glitch Creation Function
// Creates the initial record in media_assets_glitch table
// Handles deduplication and user validation

import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';

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
    console.log('🎭 [NeoGlitch] User authenticated:', userId);

    const body = JSON.parse(event.body || '{}');
    const {
      prompt,
      presetKey,
      sourceAssetId,
      runId,
      inputHash,
      meta = {}
    } = body;

    // Validate required fields
    if (!prompt || !presetKey || !runId || !inputHash) {
      return json({ 
        error: 'Missing required fields: prompt, presetKey, runId, and inputHash are required' 
      }, { status: 400 });
    }

    console.log('🎭 [NeoGlitch] Creating record:', {
      userId,
      presetKey,
      runId,
      inputHash: inputHash.substring(0, 16) + '...',
      hasSource: !!sourceAssetId
    });

    const sql = neon(process.env.NETLIFY_DATABASE_URL!);

    // Check for existing record with same input hash (deduplication)
    const existingRecord = await sql`
      SELECT id, status, cloudinary_url 
      FROM media_assets_glitch 
      WHERE user_id = ${userId} AND input_hash = ${inputHash}
      LIMIT 1
    `;

    if (existingRecord && existingRecord.length > 0) {
      const existing = existingRecord[0];
      console.log('🎭 [NeoGlitch] Duplicate detected:', {
        existingId: existing.id,
        status: existing.status,
        hasCloudinary: !!existing.cloudinary_url
      });

      // If already completed, return the existing record
      if (existing.status === 'completed' && existing.cloudinary_url) {
        return json({
          id: existing.id,
          status: 'completed',
          duplicate: true,
          message: 'Generation already completed with same input'
        });
      }

      // If pending/processing, return the existing record
      if (existing.status === 'pending' || existing.status === 'processing') {
        return json({
          id: existing.id,
          status: existing.status,
          duplicate: true,
          message: 'Generation already in progress with same input'
        });
      }

      // If failed, allow retry by creating new record
      console.log('🎭 [NeoGlitch] Previous generation failed, allowing retry');
    }

    // Create new glitch record
    const result = await sql`
      INSERT INTO media_assets_glitch (
        user_id,
        run_id,
        preset_key,
        prompt,
        source_asset_id,
        status,
        meta,
        input_hash,
        created_at,
        updated_at
      ) VALUES (
        ${userId},
        ${runId},
        ${presetKey},
        ${prompt},
        ${sourceAssetId || null},
        'pending',
        ${JSON.stringify(meta)},
        ${inputHash},
        NOW(),
        NOW()
      ) RETURNING id, user_id, run_id, preset_key, prompt, status, input_hash, created_at
    `;

    if (!result || result.length === 0) {
      throw new Error('Failed to insert glitch record');
    }

    const newRecord = result[0];
    console.log('✅ [NeoGlitch] Record created successfully:', {
      id: newRecord.id,
      status: newRecord.status,
      inputHash: newRecord.input_hash.substring(0, 16) + '...'
    });

    return json({
      id: newRecord.id,
      userId: newRecord.user_id,
      runId: newRecord.run_id,
      presetKey: newRecord.preset_key,
      prompt: newRecord.prompt,
      status: newRecord.status,
      inputHash: newRecord.input_hash,
      createdAt: newRecord.created_at,
      message: 'Neo Tokyo Glitch record created successfully'
    });

  } catch (error: any) {
    console.error('💥 [NeoGlitch] Create error:', error);
    
    if (error.message === 'NO_BEARER') {
      return json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    return json({ 
      error: 'CREATE_FAILED',
      message: error.message 
    }, { status: 500 });
  }
};
