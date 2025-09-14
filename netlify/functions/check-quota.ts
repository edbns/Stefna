import type { Handler } from '@netlify/functions';
import { q, qOne } from './_db';
import { json } from './_lib/http';

// ============================================================================
// VERSION: 7.0 - RAW SQL MIGRATION
// ============================================================================
// This function uses raw SQL queries through the _db helper
// - Replaced Prisma with direct SQL queries
// - Uses q, qOne for database operations
// - Checks if beta quota is reached
// ============================================================================

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

  try {
    if (event.httpMethod === 'GET') {
      // Get quota status
      const quotaStatus = await qOne(`
        SELECT * FROM get_quota_status()
      `);

      if (!quotaStatus) {
        throw new Error('Failed to get quota status');
      }

      return json({
        success: true,
        quota: quotaStatus
      });
    }

    if (event.httpMethod === 'POST') {
      // Check if specific email can sign up (for auth flow)
      const body = JSON.parse(event.body || '{}');
      const { email } = body;

      if (!email) {
        return json({ error: 'Email is required' }, { status: 400 });
      }

      // Check if user already exists
      const existingUser = await qOne(`
        SELECT id FROM users WHERE email = $1
      `, [email.toLowerCase()]);

      // If user exists, they can always sign in
      if (existingUser) {
        return json({
          success: true,
          canSignUp: true,
          reason: 'existing_user'
        });
      }

      // Check quota for new users
      const quotaReached = await qOne(`
        SELECT is_quota_reached() as quota_reached
      `);

      if (quotaReached?.quota_reached) {
        return json({
          success: true,
          canSignUp: false,
          reason: 'quota_reached'
        });
      }

      return json({
        success: true,
        canSignUp: true,
        reason: 'quota_available'
      });
    }

    return json({ error: 'Method not allowed' }, { status: 405 });

  } catch (error: any) {
    console.error('❌ [Check Quota] Error:', error);
    return json({ 
      error: 'Failed to check quota',
      message: error?.message || 'Unknown error occurred'
    }, { status: 500 });
  }
};
