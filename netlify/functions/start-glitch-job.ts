// netlify/functions/start-glitch-job.ts
// NeoGlitch Async Job Starter
// 
// 🎯 PURPOSE: Start NeoGlitch generation job and respond instantly
// This avoids Netlify timeout issues by separating job start from execution
// 
// 🔄 FLOW: Start Job → Immediate Response → Background Processing → Poll for Results
import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import { getFreshToken, isTokenExpiredError } from './utils/tokenRefresh';

// 🚀 BACKGROUND MODE: Allow function to run for up to 15 minutes
export const config = {
  type: "background",
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  console.log('[start-glitch-job] Starting NeoGlitch job...');
  console.log('[start-glitch-job] Method:', event.httpMethod);
  console.log('[start-glitch-job] Authorization header present:', !!event.headers.authorization);

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: 'Method not allowed' })
      };
    }

    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    console.log('[start-glitch-job] Request body:', body);

    const { sourceUrl, prompt, presetKey } = body;

    // Validate required fields
    if (!sourceUrl || !prompt || !presetKey) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: false, 
          error: 'Missing required fields: sourceUrl, prompt, presetKey' 
        })
      };
    }

    // Extract user ID from authorization header
    let userId: string;
    try {
      const authResult = getFreshToken(event.headers.authorization);
      userId = authResult.userId;
      console.log('[start-glitch-job] User authenticated:', userId);
    } catch (authError: any) {
      console.error('[start-glitch-job] Authentication failed:', authError.message);
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: false, 
          error: 'AUTHENTICATION_FAILED',
          message: authError.message || 'Invalid or missing authentication token'
        })
      };
    }

    // Generate unique job ID
    const jobId = uuidv4();
    console.log('[start-glitch-job] Generated job ID:', jobId);

    // Create initial job record in database
    try {
      const jobRecord = await qOne(`
        INSERT INTO neo_glitch_media (id, user_id, source_url, prompt, preset, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id
      `, [jobId, userId, sourceUrl, prompt, presetKey, 'processing']);
      console.log('[start-glitch-job] Job record created:', jobRecord.id);
    } catch (dbError: any) {
      console.error('[start-glitch-job] Failed to create job record:', dbError);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: false, 
          error: 'JOB_CREATION_FAILED',
          message: 'Failed to create job record in database'
        })
      };
    }

    // Reserve credits immediately
    try {
      const creditReservation = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/credits-reserve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': event.headers.authorization || ''
        },
        body: JSON.stringify({
          cost: 2,
          action: 'neo_glitch_generation',
          request_id: jobId
        })
      });

      if (!creditReservation.ok) {
        const errorText = await creditReservation.text();
        console.error('[start-glitch-job] Credit reservation failed:', errorText);
        
        // Update job status to failed
        await q(`
          UPDATE neo_glitch_media 
          SET status = $1, metadata = jsonb_set(COALESCE(metadata, '{}'), '{error_message}', $2), updated_at = NOW()
          WHERE id = $3
        `, ['failed', `Credit reservation failed: ${errorText}`, jobId]);

        return {
          statusCode: 402,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ 
            ok: false, 
            error: 'CREDIT_RESERVATION_FAILED',
            message: 'Insufficient credits or credit reservation failed'
          })
        };
      }

      const creditResult = await creditReservation.json();
      console.log('[start-glitch-job] Credits reserved successfully:', creditResult);
    } catch (creditError: any) {
      console.error('[start-glitch-job] Credit reservation error:', creditError);
      
      // Update job status to failed
      await q(`
        UPDATE neo_glitch_media 
        SET status = $1, metadata = jsonb_set(COALESCE(metadata, '{}'), '{error_message}', $2), updated_at = NOW()
        WHERE id = $3
      `, ['failed', `Credit reservation error: ${creditError.message}`, jobId]);

      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: false, 
          error: 'CREDIT_RESERVATION_ERROR',
          message: 'Credit reservation system error'
        })
      };
    }

    // Start background generation process
    console.log('[start-glitch-job] Starting background generation for job:', jobId);
    
    // Fire and forget - the background process will update the database
    // We don't wait for it to complete, just start it
    setTimeout(async () => {
      try {
        console.log('[start-glitch-job] Background generation started for job:', jobId);
        
        // Import and start the generation process
        const { startBackgroundGeneration } = await import('./neo-glitch-generate');
        await startBackgroundGeneration(jobId, sourceUrl, prompt, presetKey, userId);
        
        console.log('[start-glitch-job] Background generation completed for job:', jobId);
      } catch (error: any) {
        console.error('[start-glitch-job] Background generation failed for job:', jobId, error);
        
        // Update job status to failed
        await q(`
          UPDATE neo_glitch_media 
          SET status = $1, metadata = jsonb_set(COALESCE(metadata, '{}'), '{error_message}', $2), updated_at = NOW()
          WHERE id = $3
        `, ['failed', `Generation failed: ${error.message}`, jobId]);
      }
    }, 100); // Small delay to ensure response is sent first

    // Respond immediately with job ID
    console.log('[start-glitch-job] Job started successfully, responding with job ID:', jobId);
    
    return {
      statusCode: 202, // Accepted - job started
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: true,
        jobId: jobId,
        message: 'NeoGlitch generation job started successfully',
        status: 'processing'
      })
    };

  } catch (error: any) {
    console.error('[start-glitch-job] Unexpected error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: error.message
      })
    };
  }
};
