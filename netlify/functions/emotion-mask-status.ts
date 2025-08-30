// netlify/functions/emotion-mask-status.ts
// Emotion Mask Status Checker
// 
// 🎯 STATUS STRATEGY:
// 1. Query emotion_mask_media table directly
// 2. Return current status and media info
// 3. Follow exact NeoGlitch pattern for consistency
// 
// ⚠️ IMPORTANT: This follows the exact NeoGlitch pattern that works perfectly

import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { runId } = body;

    if (!runId) {
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'MISSING_IDENTIFIER',
          message: 'runId must be provided'
        })
      };
    }

    console.log('🔍 [EmotionMask] Checking status:', { runId });

    // Find by run ID
    const mediaRecord = await qOne(`
      SELECT id, status, image_url, created_at, preset, prompt, source_url, user_id
      FROM emotion_mask_media 
      WHERE run_id = $1
    `, [runId.toString()]);

    if (!mediaRecord) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Emotion Mask media record not found'
        })
      };
    }

    console.log('✅ [EmotionMask] Status found:', {
      id: mediaRecord.id,
      status: mediaRecord.status,
      hasImageUrl: !!mediaRecord.imageUrl,
      createdAt: mediaRecord.createdAt
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        id: mediaRecord.id,
        status: mediaRecord.status,
        imageUrl: mediaRecord.image_url,
        createdAt: mediaRecord.created_at,
        presetKey: mediaRecord.preset,
        prompt: mediaRecord.prompt,
        sourceUrl: mediaRecord.source_url,
        userId: mediaRecord.user_id
      })
    };

  } catch (error) {
    console.error('❌ [EmotionMask] Status check failed:', error);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Status check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
