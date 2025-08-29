// netlify/functions/poll-glitch-job.ts
// NeoGlitch Job Status Poller
// 
// 🎯 PURPOSE: Check the status of NeoGlitch generation jobs
// This allows the frontend to poll for results without blocking
// 
// 🔄 FLOW: Frontend polls → Check DB status → Return current state
import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';



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

  console.log('[poll-glitch-job] Checking job status...');
  console.log('[poll-glitch-job] Method:', event.httpMethod);

  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ok: false, error: 'Method not allowed' })
      };
    }

    // Extract job ID from query parameters
    const jobId = event.queryStringParameters?.jobId;
    
    if (!jobId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: false, 
          error: 'Missing jobId parameter' 
        })
      };
    }

    console.log('[poll-glitch-job] Checking status for job:', jobId);

    // Check if user is authenticated
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: false, 
          error: 'Missing authorization header' 
        })
      };
    }

    // Find the job record
    const jobRecord = await qOne(`
      SELECT id, user_id, source_url, prompt, preset, status, image_url, created_at, updated_at
      FROM neo_glitch_media 
      WHERE id = $1
    `, [jobId]);

    if (!jobRecord) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: false, 
          error: 'Job not found' 
        })
      };
    }

    console.log('[poll-glitch-job] Job found, status:', jobRecord.status);

    // Return job status and details
    const response = {
      ok: true,
      jobId: jobRecord.id,
      status: jobRecord.status,
      createdAt: jobRecord.created_at,
      updatedAt: jobRecord.updated_at,
      sourceUrl: jobRecord.source_url,
      prompt: jobRecord.prompt,
      presetKey: jobRecord.preset,
      userId: jobRecord.user_id
    };

    // Add status-specific data
    switch (jobRecord.status) {
      case 'completed':
        response.imageUrl = jobRecord.image_url;
        break;

      case 'failed':
        // No errorMessage field in schema, use metadata if available
        break;

      case 'processing':
        // No progress field in schema
        break;
    }

    console.log('[poll-glitch-job] Returning job status:', response.status);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(response)
    };

  } catch (error: any) {
    console.error('[poll-glitch-job] Unexpected error:', error);
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
