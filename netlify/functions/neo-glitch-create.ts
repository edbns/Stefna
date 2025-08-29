// Neo Tokyo Glitch Creation Function
// Creates the initial record in neoGlitchMedia table
// Handles deduplication and user validation

import type { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
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
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Authenticate user
    const { userId } = requireAuth(event.headers?.authorization || event.headers?.Authorization);
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

    // Check for existing record with same runId (deduplication)
    const existingRecord = await qOne(`
      SELECT id, status, image_url
      FROM neo_glitch_media
      WHERE user_id = $1 AND run_id = $2
      LIMIT 1
    `, [userId, runId]);

    if (existingRecord) {
      console.log('🎭 [NeoGlitch] Duplicate detected:', {
        existingId: existingRecord.id,
        status: existingRecord.status,
        hasImage: !!existingRecord.image_url
      });

      // If already completed, return the existing record
      if (existingRecord.status === 'completed' && existingRecord.image_url) {
        return json({
          id: existingRecord.id,
          status: 'completed',
          duplicate: true,
          message: 'Generation already completed with same input'
        });
      }

      // If pending/processing, return the existing record
      if (existingRecord.status === 'pending' || existingRecord.status === 'processing') {
        return json({
          id: existingRecord.id,
          status: existingRecord.status,
          duplicate: true,
          message: 'Generation already in progress with same input'
        });
      }

      // If failed, allow retry by creating new record
      console.log('🎭 [NeoGlitch] Previous generation failed, allowing retry');
    }

    // Create new glitch record
    const insertRows = await q(`
      INSERT INTO neo_glitch_media (
        user_id, run_id, preset, prompt, source_url, image_url, status, metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      )
      RETURNING id, user_id, run_id, preset, prompt, status, created_at
    `, [
      userId,
      runId,
      presetKey,
      prompt,
      sourceAssetId || '',
      '', // image_url placeholder
      'pending',
      meta
    ]);

    if (!insertRows || insertRows.length === 0) {
      throw new Error('Failed to insert glitch record');
    }

    const row = insertRows[0];
    console.log('✅ [NeoGlitch] Record created successfully:', {
      id: row.id,
      status: row.status,
      runId: row.run_id ? row.run_id.substring(0, 16) + '...' : 'no-run-id'
    });

    return json({
      id: row.id,
      userId: row.user_id,
      runId: row.run_id,
      presetKey: row.preset,
      prompt: row.prompt,
      status: row.status,
      createdAt: row.created_at,
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
