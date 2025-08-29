// netlify/functions/status.ts
// Unified Status Endpoint
//
// 🎯 PURPOSE: Single entry point to check status of any generation job
// Smart routing based on job type with unified status response
//
// 🔄 FLOW: Receive Job ID → Find Job → Return Current Status

import { Handler } from '@netlify/functions';
import { requireAuth } from './_lib/auth';
import { Client as PgClient } from 'pg';

interface StatusRequest {
  jobId: string;
  type?: 'neo-glitch' | 'emotion-mask' | 'presets' | 'ghibli-reaction' | 'custom-prompt';
}

interface StatusResponse {
  success: boolean;
  jobId: string;
  status: 'processing' | 'completed' | 'failed' | 'not_found';
  type?: string;
  imageUrl?: string;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
  progress?: number;
}

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

  if (!['GET', 'POST'].includes(event.httpMethod || '')) {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check database URL
  const url = process.env.DATABASE_URL || '';
  if (!url) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Database configuration error',
        message: 'DATABASE_URL missing'
      })
    };
  }

  const client = new PgClient({ connectionString: url });

  try {
    await client.connect();

    // Authenticate user (optional for testing)
    let userId: string = 'test-user-status';

    if (event.headers.authorization) {
      try {
        const authResult = requireAuth(event.headers.authorization);
        userId = authResult.userId;
        console.log('📊 [Status] User authenticated:', userId);
      } catch (authError) {
        console.log('📊 [Status] Auth failed, using test user:', userId);
      }
    } else {
      console.log('📊 [Status] No auth header, using test user:', userId);
    }

    // Get job ID from query params or body
    let jobId: string;
    let type: string | undefined;

    if (event.httpMethod === 'GET') {
      jobId = event.queryStringParameters?.jobId || '';
      type = event.queryStringParameters?.type;
    } else {
      const body: StatusRequest = JSON.parse(event.body || '{}');
      jobId = body.jobId || '';
      type = body.type;
    }

    if (!jobId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Missing jobId parameter',
          success: false
        })
      };
    }

    console.log('📊 [Status] Checking job status:', { jobId, type });

    // If type is specified, search that specific table
    if (type) {
      const status = await getJobStatusByType(client, jobId, type, userId);
      if (status.status !== 'not_found') {
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(status)
        };
      }
    }

    // If no type specified or not found in specific table, search all tables
    const status = await getJobStatusFromAnyTable(client, jobId, userId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(status)
    };

  } catch (error) {
    console.error('❌ [Status] Error:', error);

    // Check if it's a database table error
    if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Database not initialized',
          message: 'Media tables not found. Please run database migrations.',
          details: error.message
        })
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  } finally {
    await client.end();
  }
}

// Get job status from a specific table
async function getJobStatusByType(client: PgClient, jobId: string, type: string, userId: string): Promise<StatusResponse> {
  let tableName: string;
  let typeLabel: string;

  switch (type) {
    case 'neo-glitch':
      tableName = 'neo_glitch_media';
      typeLabel = 'neo-glitch';
      break;
    case 'emotion-mask':
      tableName = 'emotion_mask_media';
      typeLabel = 'emotion-mask';
      break;
    case 'presets':
      tableName = 'presets_media';
      typeLabel = 'presets';
      break;
    case 'ghibli-reaction':
      tableName = 'ghibli_reaction_media';
      typeLabel = 'ghibli-reaction';
      break;
    case 'custom-prompt':
      tableName = 'custom_prompt_media';
      typeLabel = 'custom-prompt';
      break;
    default:
      return { success: false, jobId, status: 'not_found' };
  }

  const result = await client.query(`
    SELECT id, status, image_url, created_at, updated_at, user_id
    FROM ${tableName}
    WHERE id = $1 AND user_id = $2
  `, [jobId, userId]);

  if (result.rows.length === 0) {
    return { success: false, jobId, status: 'not_found' };
  }

  const job = result.rows[0];
  return {
    success: true,
    jobId: job.id,
    status: job.status as 'processing' | 'completed' | 'failed',
    type: typeLabel,
    imageUrl: job.image_url,
    createdAt: job.created_at,
    updatedAt: job.updated_at
  };
}

// Search for job across all tables
async function getJobStatusFromAnyTable(client: PgClient, jobId: string, userId: string): Promise<StatusResponse> {
  const tables = [
    { name: 'neo_glitch_media', type: 'neo-glitch' },
    { name: 'emotion_mask_media', type: 'emotion-mask' },
    { name: 'presets_media', type: 'presets' },
    { name: 'ghibli_reaction_media', type: 'ghibli-reaction' },
    { name: 'custom_prompt_media', type: 'custom-prompt' }
  ];

  for (const table of tables) {
    const result = await client.query(`
      SELECT id, status, image_url, created_at, updated_at
      FROM ${table.name}
      WHERE id = $1 AND user_id = $2
    `, [jobId, userId]);

    if (result.rows.length > 0) {
      const job = result.rows[0];
      return {
        success: true,
        jobId: job.id,
        status: job.status as 'processing' | 'completed' | 'failed',
        type: table.type,
        imageUrl: job.image_url,
        createdAt: job.created_at,
        updatedAt: job.updated_at
      };
    }
  }

  return { success: false, jobId, status: 'not_found' };
}
