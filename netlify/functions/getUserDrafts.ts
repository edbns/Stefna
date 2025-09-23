// netlify/functions/getUserDrafts.ts
// Get user drafts from the database

import type { Handler } from '@netlify/functions';
import { json } from './_lib/http';
import { q } from './_db';
import { requireAuth } from './_lib/auth';

// Helper function to create consistent response headers
function createResponseHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };
}

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return json('', { 
      status: 200,
      headers: createResponseHeaders()
    });
  }

  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, { 
      status: 405,
      headers: createResponseHeaders()
    });
  }

  try {
    // Extract userId from JWT token
    const auth = requireAuth(event.headers?.authorization || event.headers?.Authorization);
    const userId = auth.userId;
    
    console.log('🔐 [getUserDrafts] Authenticated request:', {
      userId,
      platform: auth.platform,
      permissions: auth.permissions
    });

    // Get drafts from database
    const drafts = await q(`
      SELECT id, user_id, media_url, prompt, media_type, aspect_ratio, width, height, metadata, created_at, updated_at
      FROM user_drafts 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);

    console.log('✅ [getUserDrafts] Retrieved drafts:', {
      userId,
      totalDrafts: drafts.length
    });

    // Transform drafts to match UserMedia format
    const transformedDrafts = drafts.map((draft: any) => ({
      id: draft.id,
      userId: draft.user_id,
      type: draft.media_type || 'photo',
      url: draft.media_url,
      prompt: draft.prompt || 'Untitled draft',
      aspectRatio: draft.aspect_ratio || 4/3,
      width: draft.width || 800,
      height: draft.height || 600,
      timestamp: draft.created_at,
      tokensUsed: 0, // Drafts don't use tokens
      likes: 0,
      remixCount: 0,
      isPublic: false,
      tags: [],
      metadata: {
        quality: 'high',
        generationTime: 0,
        modelVersion: 'draft',
        ...(draft.metadata ? JSON.parse(draft.metadata) : {})
      },
      // Mark as draft for UI handling
      isDraft: true,
      createdAt: draft.created_at,
      updatedAt: draft.updated_at
    }));

    return json({
      success: true,
      drafts: transformedDrafts
    });

  } catch (error: any) {
    console.error('💥 [getUserDrafts] Error:', error);
    
    // Handle authentication errors specially
    if (error.statusCode === 401 || error.message?.includes('Authorization') || error.message?.includes('JWT')) {
      return {
        statusCode: 401,
        headers: createResponseHeaders(),
        body: JSON.stringify({
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Valid JWT token required in Authorization header'
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: createResponseHeaders(),
      body: JSON.stringify({
        error: 'DRAFTS_FETCH_FAILED',
        message: error.message,
        status: 'failed'
      })
    };
  }
};
