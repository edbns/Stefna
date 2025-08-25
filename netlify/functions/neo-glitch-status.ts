// Neo Tokyo Glitch Status Function
// Checks the status of a Stability.ai generation using dedicated architecture
// Direct Stability.ai API polling - no intermediate table lookup needed

import type { Handler } from '@netlify/functions';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';
import { PrismaClient } from '@prisma/client';

// Stability.ai API configuration
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';

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
    console.log('🎭 [NeoGlitch] User authenticated for status check:', userId);

    const body = JSON.parse(event.body || '{}');
    console.log('🔍 [NeoGlitch] Received request body:', JSON.stringify(body, null, 2));
    console.log('🔍 [NeoGlitch] Body keys:', Object.keys(body));
    console.log('🔍 [NeoGlitch] stabilityJobId value:', body.stabilityJobId);
    console.log('🔍 [NeoGlitch] stabilityJobId type:', typeof body.stabilityJobId);
    
    const { stabilityJobId } = body;

    // Validate required fields for new architecture
    if (!stabilityJobId) {
      console.error('❌ [NeoGlitch] Missing stabilityJobId in request body');
      console.error('❌ [NeoGlitch] Full body received:', JSON.stringify(body, null, 2));
      return json({ 
        error: 'Missing required field: stabilityJobId is required',
        receivedBody: body,
        receivedKeys: Object.keys(body)
      }, { status: 400 });
    }

    // Check if the stabilityJobId looks like a database ID (cuid format) vs Stability.ai job ID
    const isLikelyDatabaseId = stabilityJobId.length > 20 && stabilityJobId.includes('-');
    if (isLikelyDatabaseId) {
      console.warn('⚠️ [NeoGlitch] Frontend sent what appears to be a database ID instead of Stability.ai job ID');
      console.warn('⚠️ [NeoGlitch] This suggests the frontend is using the wrong ID for polling');
    }

    // Validate Stability.ai API key
    if (!STABILITY_API_KEY) {
      console.error('❌ [NeoGlitch] STABILITY_API_KEY not configured');
      return json({ 
        error: 'STABILITY_API_KEY not configured' 
      }, { status: 500 });
    }

    console.log('🔍 [NeoGlitch] Checking status for Stability.ai job:', stabilityJobId);

    // 🔍 ACTUALLY CHECK THE DATABASE for real job status
    const prisma = new PrismaClient();
    
    try {
      // Find the job in the database
      const jobRecord = await prisma.neoGlitchMedia.findFirst({
        where: {
          OR: [
            { id: stabilityJobId },
            { stabilityJobId: stabilityJobId }
          ]
        },
        select: {
          id: true,
          status: true,
          imageUrl: true,
          stabilityJobId: true,
          createdAt: true
        }
      });

      if (!jobRecord) {
        console.warn('⚠️ [NeoGlitch] Job not found in database:', stabilityJobId);
        return json({
          id: stabilityJobId,
          status: 'not_found',
          message: 'Job not found in database'
        });
      }

      console.log('✅ [NeoGlitch] Found job in database:', {
        id: jobRecord.id,
        status: jobRecord.status,
        hasImage: !!jobRecord.imageUrl,
        stabilityJobId: jobRecord.stabilityJobId
      });

      // Return the actual status from the database
      if (jobRecord.status === 'completed' && jobRecord.imageUrl) {
        return json({
          id: jobRecord.id,
          status: 'completed',
          message: 'Generation completed successfully',
          imageUrl: jobRecord.imageUrl,
          stabilityJobId: jobRecord.stabilityJobId
        });
      } else if (jobRecord.status === 'failed') {
        return json({
          id: jobRecord.id,
          status: 'failed',
          message: 'Generation failed',
          stabilityJobId: jobRecord.stabilityJobId
        });
      } else if (jobRecord.status === 'processing' && !jobRecord.stabilityJobId) {
        // Check if job has been stuck too long (more than 5 minutes)
        const jobAge = Date.now() - new Date(jobRecord.createdAt).getTime();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        if (jobAge > maxAge) {
          // Job is stuck - mark as failed
          await prisma.neoGlitchMedia.update({
            where: { id: jobRecord.id },
            data: { 
              status: 'failed',
              imageUrl: null
            }
          });
          
          return json({
            id: jobRecord.id,
            status: 'failed',
            message: 'Job failed due to timeout - Stability.ai never started processing',
            stabilityJobId: null,
            error: 'TIMEOUT_ERROR',
            details: 'Job was stuck in initialization for more than 5 minutes'
          });
        }
        
        // Special case: Job is processing but no Stability.ai ID yet
        return json({
          id: jobRecord.id,
          status: 'processing',
          message: 'Job is being initialized - waiting for Stability.ai to start',
          stabilityJobId: null,
          warning: 'This job may be stuck in initialization. Consider retrying the generation.',
          jobAge: Math.round(jobAge / 1000) + 's'
        });
      } else {
        // Still processing with Stability.ai
        return json({
          id: jobRecord.id,
          status: 'processing',
          message: 'Job is being processed by Stability.ai',
          stabilityJobId: jobRecord.stabilityJobId
        });
      }

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('❌ [NeoGlitch] Status check failed:', error);
    return json({ 
      error: 'Failed to check job status',
      details: error instanceof Error ? error.message : 'Unknown error',
      status: 'failed'
    }, { status: 500 });
  }
};
