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
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client inside handler to avoid bundling issues
let db: PrismaClient;

export const handler: Handler = async (event) => {
  // Initialize Prisma client inside handler to avoid bundling issues
  db = new PrismaClient();
  
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

    console.log('🔍 [EmotionMask] Checking status:', { aimlJobId, runId });

    let mediaRecord;

    if (aimlJobId) {
      // Find by AIML job ID
      mediaRecord = await db.emotionMaskMedia.findFirst({
        where: { aimlJobId }
      });
    } else if (runId) {
      // Find by run ID
      mediaRecord = await db.emotionMaskMedia.findUnique({
        where: { runId: runId.toString() }
      });
    }

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
        imageUrl: mediaRecord.imageUrl,
        aimlJobId: mediaRecord.aimlJobId,
        createdAt: mediaRecord.createdAt,
        preset: mediaRecord.preset,
        prompt: mediaRecord.prompt,
        sourceUrl: mediaRecord.sourceUrl,
        userId: mediaRecord.userId
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
