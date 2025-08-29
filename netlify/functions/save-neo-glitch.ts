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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const existingRecord = await qOne(`
      SELECT id, status FROM neo_glitch_media WHERE run_id = $1
    `, [stabilityJobId]);

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
      
      const updatedRecord = await qOne(`
        UPDATE neo_glitch_media 
        SET status = $1, image_url = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, image_url
      `, ['completed', cloudinaryUrl, existingRecord.id]);

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
    
    const newRecord = await qOne(`
      INSERT INTO neo_glitch_media (run_id, user_id, source_url, image_url, prompt, preset, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `, [stabilityJobId, userId, sourceUrl, cloudinaryUrl, generationMeta.prompt || '', presetKey, 'completed']);

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
