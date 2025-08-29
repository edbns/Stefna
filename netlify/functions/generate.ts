// netlify/functions/generate.ts
// Unified Generation Endpoint
//
// 🎯 PURPOSE: Single entry point for all AI generation types
// Smart routing based on generation type with unified job management
//
// 🔄 FLOW: Receive Request → Route to Service → Return Job ID → Background Processing

import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';
import { v4 as uuidv4 } from 'uuid';
import { GenerationOrchestrator } from './_generationService';

interface GenerateRequest {
  type: 'neo-glitch' | 'emotion-mask' | 'presets' | 'ghibli-reaction' | 'custom-prompt';
  prompt: string;
  presetKey: string;
  sourceAssetId: string;
  userId?: string; // Optional, will use auth if not provided
  runId?: string;  // Optional, will generate if not provided
  meta?: any;
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
    // Authenticate user (optional for testing)
    let userId: string = 'test-user-' + uuidv4().substring(0, 8);

    if (event.headers.authorization) {
      try {
        const authResult = requireAuth(event.headers.authorization);
        userId = authResult.userId;
        console.log('🎨 [Generate] User authenticated:', userId);
      } catch (authError) {
        console.log('🎨 [Generate] Auth failed, using test user:', userId);
      }
    } else {
      console.log('🎨 [Generate] No auth header, using test user:', userId);
    }

    const body: GenerateRequest = JSON.parse(event.body || '{}');
    const {
      type,
      prompt,
      presetKey,
      sourceAssetId,
      runId = uuidv4(),
      meta = {}
    } = body;

    // Validate required fields
    if (!type || !prompt || !presetKey || !sourceAssetId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Missing required fields: type, prompt, presetKey, and sourceAssetId are required'
        })
      };
    }

    console.log('🎨 [Generate] Processing request:', { type, prompt: prompt.substring(0, 50), presetKey, runId });

    // Route to appropriate generation service based on type
    let jobId: string;
    let tableName: string;

    switch (type) {
      case 'neo-glitch':
        jobId = await handleNeoGlitchGeneration(userId, prompt, presetKey, sourceAssetId, runId, meta);
        tableName = 'neo_glitch_media';
        break;

      case 'emotion-mask':
        jobId = await handleEmotionMaskGeneration(userId, prompt, presetKey, sourceAssetId, runId, meta);
        tableName = 'emotion_mask_media';
        break;

      case 'presets':
        jobId = await handlePresetsGeneration(userId, prompt, presetKey, sourceAssetId, runId, meta);
        tableName = 'presets_media';
        break;

      case 'ghibli-reaction':
        jobId = await handleGhibliReactionGeneration(userId, prompt, presetKey, sourceAssetId, runId, meta);
        tableName = 'ghibli_reaction_media';
        break;

      case 'custom-prompt':
        jobId = await handleCustomPromptGeneration(userId, prompt, presetKey, sourceAssetId, runId, meta);
        tableName = 'custom_prompt_media';
        break;

      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: `Unsupported generation type: ${type}`,
            supportedTypes: ['neo-glitch', 'emotion-mask', 'presets', 'ghibli-reaction', 'custom-prompt']
          })
        };
    }

    console.log('✅ [Generate] Job created successfully:', { jobId, type, tableName });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        jobId,
        runId,
        type,
        status: 'processing',
        message: 'Generation job started successfully'
      })
    };

  } catch (error) {
    console.error('❌ [Generate] Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// Handler functions for each generation type
async function handleNeoGlitchGeneration(userId: string, prompt: string, presetKey: string, sourceAssetId: string, runId: string, meta: any): Promise<string> {
  // Create initial record in neo_glitch_media table
  const jobId = uuidv4();

  await q(`
    INSERT INTO neo_glitch_media (
      id, user_id, run_id, preset, prompt, source_url, status, created_at, updated_at, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8)
  `, [jobId, userId, runId, presetKey, prompt, sourceAssetId, 'processing', JSON.stringify(meta)]);

  // Start background processing using the shared generation service
  // Use setTimeout instead of setImmediate for Netlify compatibility
  setTimeout(async () => {
    try {
      console.log('🎯 [Generate] Starting background neo-glitch generation for job:', jobId);

      // Use the unified generation orchestrator
      const result = await GenerationOrchestrator.processGeneration(
        'neo-glitch',
        jobId,
        sourceAssetId,
        prompt,
        presetKey,
        userId,
        runId
      );

      console.log('✅ [Generate] Background neo-glitch generation completed:', result);
    } catch (error) {
      console.error('❌ [Generate] Background neo-glitch generation failed:', error);

      // Update job status to failed
      try {
        await q(`
          UPDATE neo_glitch_media
          SET status = $1, updated_at = NOW()
          WHERE id = $2
        `, ['failed', jobId]);
      } catch (dbError) {
        console.error('❌ [Generate] Failed to update job status:', dbError);
      }
    }
  }, 100); // Small delay to ensure response is sent first

  return jobId;
}

async function handleEmotionMaskGeneration(userId: string, prompt: string, presetKey: string, sourceAssetId: string, runId: string, meta: any): Promise<string> {
  const jobId = uuidv4();

  await q(`
    INSERT INTO emotion_mask_media (
      id, user_id, run_id, preset, prompt, source_url, status, created_at, updated_at, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8)
  `, [jobId, userId, runId, presetKey, prompt, sourceAssetId, 'processing', JSON.stringify(meta)]);

  // Start background processing
  setTimeout(async () => {
    try {
      await GenerationOrchestrator.processGeneration('emotion-mask', jobId, sourceAssetId, prompt, presetKey, userId, runId);
    } catch (error) {
      console.error('❌ [Generate] Background emotion-mask generation failed:', error);
      try {
        await q(`UPDATE emotion_mask_media SET status = $1, updated_at = NOW() WHERE id = $2`, ['failed', jobId]);
      } catch (dbError) {
        console.error('❌ [Generate] Failed to update emotion-mask job status:', dbError);
      }
    }
  }, 100);

  return jobId;
}

async function handlePresetsGeneration(userId: string, prompt: string, presetKey: string, sourceAssetId: string, runId: string, meta: any): Promise<string> {
  const jobId = uuidv4();

  await q(`
    INSERT INTO presets_media (
      id, user_id, run_id, preset, prompt, source_url, status, created_at, updated_at, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8)
  `, [jobId, userId, runId, presetKey, prompt, sourceAssetId, 'processing', JSON.stringify(meta)]);

  // Start background processing
  setTimeout(async () => {
    try {
      await GenerationOrchestrator.processGeneration('presets', jobId, sourceAssetId, prompt, presetKey, userId, runId);
    } catch (error) {
      console.error('❌ [Generate] Background presets generation failed:', error);
      try {
        await q(`UPDATE presets_media SET status = $1, updated_at = NOW() WHERE id = $2`, ['failed', jobId]);
      } catch (dbError) {
        console.error('❌ [Generate] Failed to update presets job status:', dbError);
      }
    }
  }, 100);

  return jobId;
}

async function handleGhibliReactionGeneration(userId: string, prompt: string, presetKey: string, sourceAssetId: string, runId: string, meta: any): Promise<string> {
  const jobId = uuidv4();

  await q(`
    INSERT INTO ghibli_reaction_media (
      id, user_id, run_id, preset, prompt, source_url, status, created_at, updated_at, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8)
  `, [jobId, userId, runId, presetKey, prompt, sourceAssetId, 'processing', JSON.stringify(meta)]);

  // Start background processing
  setTimeout(async () => {
    try {
      await GenerationOrchestrator.processGeneration('ghibli-reaction', jobId, sourceAssetId, prompt, presetKey, userId, runId);
    } catch (error) {
      console.error('❌ [Generate] Background ghibli-reaction generation failed:', error);
      try {
        await q(`UPDATE ghibli_reaction_media SET status = $1, updated_at = NOW() WHERE id = $2`, ['failed', jobId]);
      } catch (dbError) {
        console.error('❌ [Generate] Failed to update ghibli-reaction job status:', dbError);
      }
    }
  }, 100);

  return jobId;
}

async function handleCustomPromptGeneration(userId: string, prompt: string, presetKey: string, sourceAssetId: string, runId: string, meta: any): Promise<string> {
  const jobId = uuidv4();

  await q(`
    INSERT INTO custom_prompt_media (
      id, user_id, run_id, preset, prompt, source_url, status, created_at, updated_at, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8)
  `, [jobId, userId, runId, presetKey, prompt, sourceAssetId, 'processing', JSON.stringify(meta)]);

  // Start background processing
  setTimeout(async () => {
    try {
      await GenerationOrchestrator.processGeneration('custom-prompt', jobId, sourceAssetId, prompt, presetKey, userId, runId);
    } catch (error) {
      console.error('❌ [Generate] Background custom-prompt generation failed:', error);
      try {
        await q(`UPDATE custom_prompt_media SET status = $1, updated_at = NOW() WHERE id = $2`, ['failed', jobId]);
      } catch (dbError) {
        console.error('❌ [Generate] Failed to update custom-prompt job status:', dbError);
      }
    }
  }, 100);

  return jobId;
}
