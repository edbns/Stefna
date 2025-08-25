// Neo Tokyo Glitch Status Function
// Checks the status of a Stability.ai generation using dedicated architecture
// Direct Stability.ai API polling - no intermediate table lookup needed

import type { Handler } from '@netlify/functions';
import { requireAuth } from './lib/auth';
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
          createdAt: true,
          updatedAt: true
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
      } else {
        // Still processing
        return json({
          id: jobRecord.id,
          status: 'processing',
          message: 'Job is still being processed',
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
