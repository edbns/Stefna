import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';

// ============================================================================
// VERSION: 7.0 - COMPLETE VALIDATION OVERHAUL
// ============================================================================
// This function has been completely rewritten to fix 422 validation errors
// - Proper field normalization and validation
// - Clear debugging logs
// - Handles frontend payload structure correctly
// ============================================================================

const prisma = new PrismaClient();

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
    // Parse and log the raw incoming payload
    const body = JSON.parse(event.body || '{}');
    console.log('🔍 [NeoGlitch] RAW INCOMING PAYLOAD:', JSON.stringify(body, null, 2));

    // Normalize and extract all possible field names
    const prompt = body.prompt?.trim();
    const userId = body.userId;
    const presetKey = body.presetKey || body.preset;
    const runId = String(body.runId || crypto.randomUUID());
    const sourceUrl = body.sourceAssetId || body.sourceUrl || body.sourceAssetUrl;
    const generationMeta = body.generationMeta;

    // Log normalized fields for debugging
    console.log('🔍 [NeoGlitch] NORMALIZED FIELDS:', {
      prompt: prompt ? `${prompt.substring(0, 50)}...` : 'MISSING',
      userId: userId || 'MISSING',
      presetKey: presetKey || 'MISSING',
      runId: runId || 'MISSING',
      sourceUrl: sourceUrl || 'MISSING',
      hasGenerationMeta: !!generationMeta
    });

    // Validate required fields with clear error messages
    const missingFields = [];
    if (!prompt) missingFields.push('prompt');
    if (!userId) missingFields.push('userId');
    if (!presetKey) missingFields.push('presetKey');
    if (!runId) missingFields.push('runId');
    if (!sourceUrl) missingFields.push('sourceUrl (or sourceAssetId)');

    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
      console.error('❌ [NeoGlitch] Validation failed:', errorMessage);
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'VALIDATION_FAILED',
          message: errorMessage,
          missingFields,
          receivedPayload: body
        })
      };
    }

    // Validate prompt length
    if (prompt.length < 10) {
      const errorMessage = `Prompt too short: ${prompt.length} characters (minimum 10)`;
      console.error('❌ [NeoGlitch] Prompt validation failed:', errorMessage);
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'PROMPT_TOO_SHORT',
          message: errorMessage,
          promptLength: prompt.length,
          minimumRequired: 10
        })
      };
    }

    // Validate source URL format
    if (!sourceUrl.startsWith('http')) {
      const errorMessage = `Invalid source URL: must start with http/https`;
      console.error('❌ [NeoGlitch] URL validation failed:', errorMessage);
      return {
        statusCode: 422,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'INVALID_SOURCE_URL',
          message: errorMessage,
          receivedUrl: sourceUrl
        })
      };
    }

    console.log('✅ [NeoGlitch] All validation passed successfully');

    // Check if we have Replicate API token
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      console.error('❌ [NeoGlitch] REPLICATE_API_TOKEN not configured');
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'REPLICATE_NOT_CONFIGURED',
          message: 'Replicate API token not configured'
        })
      };
    }

    // For now, return success to test the validation
    // TODO: Implement actual Replicate API call
    console.log('🚀 [NeoGlitch] Ready to start Replicate generation with:', {
      prompt: prompt.substring(0, 50) + '...',
      presetKey,
      runId,
      sourceUrl,
      hasToken: !!REPLICATE_API_TOKEN
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Validation passed - ready for Replicate generation',
        validatedFields: {
          prompt: prompt.substring(0, 50) + '...',
          presetKey,
          runId,
          sourceUrl,
          userId
        }
      })
    };

  } catch (error: any) {
    console.error('💥 [NeoGlitch] Fatal error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'INTERNAL_ERROR',
        message: error.message || 'Unknown error occurred',
        stack: error.stack
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};
