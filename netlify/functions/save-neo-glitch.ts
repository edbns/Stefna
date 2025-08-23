// Dedicated Neo Tokyo Glitch Save Function
// Handles complete workflow: Replicate → Cloudinary → Database → Profile linking
// Uses Prisma for type-safe database operations

import type { Handler } from '@netlify/functions';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SaveNeoGlitchRequest {
  userId: string;
  presetKey: string;
  sourceUrl: string;
  replicateUrl: string;
  replicateJobId: string;
  generationMeta: {
    prompt: string;
    strength?: number;
    guidanceScale?: number;
    [key: string]: any;
  };
}

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
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Authenticate user
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const { userId } = requireAuth(authHeader);
    console.log('🎭 [SaveNeoGlitch] User authenticated:', userId);

    const body: SaveNeoGlitchRequest = JSON.parse(event.body || '{}');
    const {
      presetKey,
      sourceUrl,
      replicateUrl,
      replicateJobId,
      generationMeta
    } = body;

    // Validate required fields
    if (!presetKey || !sourceUrl || !replicateUrl || !replicateJobId) {
      return json({ 
        error: 'Missing required fields: presetKey, sourceUrl, replicateUrl, and replicateJobId are required' 
      }, { status: 400 });
    }

    console.log('🎭 [SaveNeoGlitch] Processing Neo Tokyo Glitch save:', {
      userId,
      presetKey,
      sourceUrl: sourceUrl.substring(0, 50) + '...',
      replicateUrl: replicateUrl.substring(0, 50) + '...',
      replicateJobId
    });

    // Step 1: Check if this generation already exists using Prisma
    const existingRecord = await prisma.neoGlitchMedia.findUnique({
      where: { runId: replicateJobId }
    });

    if (existingRecord) {
      console.log('⚠️ [SaveNeoGlitch] Generation already exists:', existingRecord.id, existingRecord.status);
      
      if (existingRecord.status === 'completed') {
        return json({
          success: true,
          message: 'Generation already completed',
          mediaId: existingRecord.id,
          status: 'completed'
        });
      }
    }

    // Step 2: Backup Replicate URL to Cloudinary using existing function
    console.log('🔄 [SaveNeoGlitch] Backing up Replicate URL to Cloudinary...');
    
    const backupResponse = await fetch(`${process.env.URL}/.netlify/functions/backup-replicate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        replicateUrl,
        mediaId: `neo-glitch-${replicateJobId}`, // Temporary ID for backup
        userId
      })
    });

    if (!backupResponse.ok) {
      const backupError = await backupResponse.text();
      console.error('❌ [SaveNeoGlitch] Cloudinary backup failed:', backupError);
      
      // Insert record with failed status using Prisma
      const failedRecord = await prisma.neoGlitchMedia.create({
        data: {
          userId,
          preset: presetKey,
          sourceUrl,
          imageUrl: '', // Empty for failed generations
          prompt: generationMeta.prompt || 'Generation failed',
          runId: replicateJobId,
          status: 'failed'
        }
      });

      return json({ 
        error: 'Cloudinary backup failed',
        details: backupError,
        mediaId: failedRecord.id
      }, { status: 500 });
    }

    const backupResult = await backupResponse.json();
    console.log('✅ [SaveNeoGlitch] Cloudinary backup successful:', backupResult.permanentUrl);

    // Step 3: Insert or update record using Prisma
    let mediaId: string;
    
    if (existingRecord) {
      // Update existing record
      const updateResult = await prisma.neoGlitchMedia.update({
        where: { id: existingRecord.id },
        data: {
          imageUrl: backupResult.permanentUrl,
          status: 'completed',
          prompt: generationMeta.prompt || 'Neo Tokyo Glitch generation'
        }
      });
      mediaId = updateResult.id;
      console.log('✅ [SaveNeoGlitch] Updated existing record:', mediaId);
    } else {
      // Insert new record
      const insertResult = await prisma.neoGlitchMedia.create({
        data: {
          userId,
          preset: presetKey,
          sourceUrl,
          imageUrl: backupResult.permanentUrl,
          prompt: generationMeta.prompt || 'Neo Tokyo Glitch generation',
          runId: replicateJobId,
          status: 'completed'
        }
      });
      mediaId = insertResult.id;
      console.log('✅ [SaveNeoGlitch] Created new record:', mediaId);
    }

    // Step 4: Return success response
    return json({
      success: true,
      message: 'Neo Tokyo Glitch media saved successfully',
      mediaId,
      cloudinaryUrl: backupResult.permanentUrl,
      status: 'completed'
    });

  } catch (error: any) {
    console.error('💥 [SaveNeoGlitch] Save error:', error);
    console.error('💥 [SaveNeoGlitch] Error stack:', error.stack);
    
    if (error.message === 'NO_BEARER') {
      return json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    return json({ 
      error: 'SAVE_FAILED',
      message: error.message,
      status: 'failed'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
