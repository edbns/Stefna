// Neo Tokyo Glitch Creation Function
// Creates the initial record in neoGlitchMedia table
// Handles deduplication and user validation

import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
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

    const prisma = new PrismaClient();

    // Check for existing record with same runId (deduplication)
    const existingRecord = await prisma.neoGlitchMedia.findFirst({
      where: { 
        userId: userId,
        runId: runId
      },
      select: {
        id: true,
        status: true,
        imageUrl: true
      }
    });

    if (existingRecord) {
      console.log('🎭 [NeoGlitch] Duplicate detected:', {
        existingId: existingRecord.id,
        status: existingRecord.status,
        hasImage: !!existingRecord.imageUrl
      });

      // If already completed, return the existing record
      if (existingRecord.status === 'completed' && existingRecord.imageUrl) {
        await prisma.$disconnect();
        return json({
          id: existingRecord.id,
          status: 'completed',
          duplicate: true,
          message: 'Generation already completed with same input'
        });
      }

      // If pending/processing, return the existing record
      if (existingRecord.status === 'pending' || existingRecord.status === 'processing') {
        await prisma.$disconnect();
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
     const result = await prisma.neoGlitchMedia.create({
       data: {
         userId: userId,
         runId: runId,
         preset: presetKey,
         prompt: prompt,
         sourceUrl: sourceAssetId || '',
         imageUrl: '', // Will be updated when generation completes
         status: 'pending',
         metadata: meta,
       },
       select: {
         id: true,
         userId: true,
         runId: true,
         preset: true,
         prompt: true,
         status: true,
         createdAt: true,
       }
     });

    if (!result) {
      throw new Error('Failed to insert glitch record');
    }

    const newRecord = result;
         console.log('✅ [NeoGlitch] Record created successfully:', {
       id: newRecord.id,
       status: newRecord.status,
       runId: newRecord.runId.substring(0, 16) + '...'
     });

     await prisma.$disconnect();

     return json({
       id: newRecord.id,
       userId: newRecord.userId,
       runId: newRecord.runId,
       presetKey: newRecord.preset,
       prompt: newRecord.prompt,
       status: newRecord.status,
       createdAt: newRecord.createdAt,
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
