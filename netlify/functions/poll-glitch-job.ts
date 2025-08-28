// netlify/functions/poll-glitch-job.ts
// NeoGlitch Job Status Poller
// 
// 🎯 PURPOSE: Check the status of NeoGlitch generation jobs
// This allows the frontend to poll for results without blocking
// 
// 🔄 FLOW: Frontend polls → Check DB status → Return current state
import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  console.log('[poll-glitch-job] Checking job status...');
  console.log('[poll-glitch-job] Method:', event.httpMethod);

  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: { 'Access-Control-Allow-Origin': '*' },
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
    const jobRecord = await prisma.neoGlitchMedia.findUnique({
      where: { id: jobId },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

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
      createdAt: jobRecord.createdAt,
      updatedAt: jobRecord.updatedAt,
      sourceUrl: jobRecord.sourceUrl,
      prompt: jobRecord.prompt,
      presetKey: jobRecord.presetKey,
      userId: jobRecord.userId
    };

    // Add status-specific data
    switch (jobRecord.status) {
      case 'completed':
        response.imageUrl = jobRecord.imageUrl;
        response.stabilityJobId = jobRecord.stabilityJobId;
        response.model = jobRecord.model;
        response.strategy = jobRecord.strategy;
        response.provider = jobRecord.provider;
        break;

      case 'failed':
        response.errorMessage = jobRecord.errorMessage;
        break;

      case 'processing':
        // Add any progress information if available
        response.progress = jobRecord.progress || 0;
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
  } finally {
    await prisma.$disconnect();
  }
};
