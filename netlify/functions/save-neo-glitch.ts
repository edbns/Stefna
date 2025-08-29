// Dedicated Neo Tokyo Glitch Save Function
// Handles complete workflow: Stability.ai → Cloudinary → Database → Profile linking
// Uses Prisma for type-safe database operations

import type { Handler } from '@netlify/functions';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';
import { q, qOne, qCount } from './_db';



interface SaveNeoGlitchRequest {
  userId: string;
  presetKey: string;
  sourceUrl: string;
  cloudinaryUrl: string;
  stabilityJobId: string;
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
        'Access-Control-Allow-Origin': '*'
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
      cloudinaryUrl,
      stabilityJobId,
      generationMeta
    } = body;

    // Validate required fields
    if (!presetKey || !sourceUrl || !cloudinaryUrl || !stabilityJobId) {
      return json({ 
        error: 'Missing required fields: presetKey, sourceUrl, cloudinaryUrl, and stabilityJobId are required' 
      }, { status: 400 });
    }

    console.log('🎭 [SaveNeoGlitch] Processing Neo Tokyo Glitch save:', {
      userId,
      presetKey,
      sourceUrl: sourceUrl.substring(0, 50) + '...',
      cloudinaryUrl: cloudinaryUrl.substring(0, 50) + '...',
      stabilityJobId
    });

    // Step 1: Check if this generation already exists using Prisma
    const existingRecord = await q(neoGlitchMedia.findUnique({
      where: { runId: stabilityJobId }
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

    // Step 2: Update the existing record with completed status
    if (existingRecord) {
      console.log('🔄 [SaveNeoGlitch] Updating existing record...');
      
      const updatedRecord = await q(neoGlitchMedia.update({
        where: { id: existingRecord.id },
        data: {
          status: 'completed',
          imageUrl: cloudinaryUrl
        }
      });

      console.log('✅ [SaveNeoGlitch] Record updated successfully:', updatedRecord.id);
      
      return json({
        success: true,
        message: 'Generation completed and saved',
        mediaId: updatedRecord.id,
        cloudinaryUrl: updatedRecord.imageUrl,
        status: 'completed'
      });
    }

    // Step 3: Create new record if none exists
    console.log('🆕 [SaveNeoGlitch] Creating new record...');
    
    const newRecord = await q(neoGlitchMedia.create({
      data: {
        runId: stabilityJobId,
        userId: userId,
        sourceUrl: sourceUrl,
        imageUrl: cloudinaryUrl,
        prompt: generationMeta.prompt || '',
        preset: presetKey,
        status: 'completed',
        createdAt: new Date()
      }
    });

    console.log('✅ [SaveNeoGlitch] New record created successfully:', newRecord.id);

    return json({
      success: true,
      message: 'Neo Tokyo Glitch generation saved successfully',
      mediaId: newRecord.id,
      cloudinaryUrl: newRecord.imageUrl,
      status: 'completed'
    });

  } catch (error) {
    console.error('❌ [SaveNeoGlitch] Error:', error);
    return json({
      error: 'Failed to save Neo Tokyo Glitch generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
