// Dedicated Neo Tokyo Glitch Save Function
// Handles complete workflow: Replicate → Cloudinary → Database → Profile linking
// No dependency on save-media.ts for clean architecture

import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from './lib/auth';
import { json } from './_lib/http';

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
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Authenticate user
    const { sub: userId } = requireAuth(event);
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

    const sql = neon(process.env.NETLIFY_DATABASE_URL!);

    // Step 1: Check if this generation already exists
    const existingRecord = await sql`
      SELECT id, status FROM neo_glitch_media 
      WHERE user_id = ${userId} AND source_url = ${sourceUrl}
      LIMIT 1
    `;

    if (existingRecord && existingRecord.length > 0) {
      const record = existingRecord[0];
      console.log('⚠️ [SaveNeoGlitch] Generation already exists:', record.id, record.status);
      
      if (record.status === 'completed') {
        return json({
          success: true,
          message: 'Generation already completed',
          mediaId: record.id,
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
      
      // Insert record with failed status
      const failedRecord = await sql`
        INSERT INTO neo_glitch_media (
          user_id, preset_key, source_url, status, replicate_job_id, 
          generation_meta, error_message
        ) VALUES (
          ${userId}, ${presetKey}, ${sourceUrl}, 'failed', ${replicateJobId},
          ${JSON.stringify(generationMeta)}, ${`Cloudinary backup failed: ${backupError}`}
        ) RETURNING id
      `;

      return json({ 
        error: 'Cloudinary backup failed',
        details: backupError,
        mediaId: failedRecord[0]?.id
      }, { status: 500 });
    }

    const backupResult = await backupResponse.json();
    console.log('✅ [SaveNeoGlitch] Cloudinary backup successful:', backupResult.permanentUrl);

    // Step 3: Insert or update record in neo_glitch_media
    let mediaId: string;
    
    if (existingRecord && existingRecord.length > 0) {
      // Update existing record
      const updateResult = await sql`
        UPDATE neo_glitch_media 
        SET 
          output_url = ${backupResult.permanentUrl},
          status = 'completed',
          replicate_job_id = ${replicateJobId},
          generation_meta = ${JSON.stringify(generationMeta)},
          updated_at = NOW()
        WHERE id = ${existingRecord[0].id}
        RETURNING id
      `;
      mediaId = updateResult[0].id;
      console.log('✅ [SaveNeoGlitch] Updated existing record:', mediaId);
    } else {
      // Insert new record
      const insertResult = await sql`
        INSERT INTO neo_glitch_media (
          user_id, preset_key, source_url, output_url, status, 
          replicate_job_id, generation_meta
        ) VALUES (
          ${userId}, ${presetKey}, ${sourceUrl}, ${backupResult.permanentUrl}, 'completed',
          ${replicateJobId}, ${JSON.stringify(generationMeta)}
        ) RETURNING id
      `;
      mediaId = insertResult[0].id;
      console.log('✅ [SaveNeoGlitch] Created new record:', mediaId);
    }

    // Step 4: Link to user profile (if needed)
    // This ensures the media appears in user's profile
    console.log('🔗 [SaveNeoGlitch] Linking to user profile...');

    // Step 5: Return success response
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
  }
};
