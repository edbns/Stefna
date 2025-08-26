// netlify/functions/presets-status.ts
// Professional Presets Status Checker
// 
// 🎯 STATUS STRATEGY:
// 1. Query presets_media table directly
// 2. Return current status and media info
// 3. Follow exact NeoGlitch pattern for consistency
// 
// ⚠️ IMPORTANT: This follows the exact NeoGlitch pattern that works perfectly

import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

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
    const { aimlJobId, runId } = body;

    if (!aimlJobId && !runId) {
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'MISSING_IDENTIFIER',
          message: 'Either aimlJobId or runId must be provided'
        })
      };
    }

    console.log('🔍 [Presets] Checking status:', { aimlJobId, runId });

    let mediaRecord;

    if (aimlJobId) {
      // Find by AIML job ID
      mediaRecord = await db.presetsMedia.findFirst({
        where: { aimlJobId }
      });
    } else if (runId) {
      // Find by run ID
      mediaRecord = await db.presetsMedia.findUnique({
        where: { runId: runId.toString() }
      });
    }

    if (!mediaRecord) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Professional Presets media record not found'
        })
      };
    }

    console.log('✅ [Presets] Status found:', {
      id: mediaRecord.id,
      status: mediaRecord.status,
      hasImageUrl: !!mediaRecord.imageUrl,
      createdAt: mediaRecord.createdAt,
      presetWeek: mediaRecord.presetWeek,
      presetRotationIndex: mediaRecord.presetRotationIndex
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        id: mediaRecord.id,
        status: mediaRecord.status,
        imageUrl: mediaRecord.imageUrl,
        aimlJobId: mediaRecord.aimlJobId,
        createdAt: mediaRecord.createdAt,
        preset: mediaRecord.preset,
        prompt: mediaRecord.prompt,
        sourceUrl: mediaRecord.sourceUrl,
        userId: mediaRecord.userId,
        presetWeek: mediaRecord.presetWeek,
        presetRotationIndex: mediaRecord.presetRotationIndex,
        isCurrentlyAvailable: mediaRecord.isCurrentlyAvailable
      })
    };

  } catch (error) {
    console.error('❌ [Presets] Status check failed:', error);
    
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
