import type { Handler } from "@netlify/functions";
import { requireAuth } from './_lib/auth';
import { qOne } from './_db';
import { json } from './_lib/http';

// ============================================================================
// VERSION: 7.0 - RAW SQL MIGRATION
// ============================================================================
// This function uses raw SQL queries through the _db helper
// - Replaced neon client with _db helper
// - Uses q, qOne, qCount for database operations
// - Gets user quota and usage information
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Handle missing authorization header gracefully
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    
    if (!authHeader) {
      console.warn('⚠️ [Quota] No Authorization header provided');
      return json({ 
        ok: false, 
        error: 'Authentication required',
        daily_limit: 14,
        daily_used: 0,
        remaining: 0,
        currentBalance: 0
      }, { status: 401 });
    }
    
    const { userId } = requireAuth(authHeader);
    
    console.log('📊 [Quota] Getting quota for user:', userId);

    // Get user's current credit balance
    let userCredits = await qOne<{
      credits: number;
      balance: number;
      updated_at: string;
    }>(`
      SELECT credits, balance, updated_at FROM user_credits WHERE user_id = $1
    `, [userId]);

    if (!userCredits) {
      // Get daily cap from database for new users too
      const dailyCapResult = await qOne(`SELECT value FROM app_config WHERE key = 'daily_cap'`);
      const dailyCredits = parseInt(dailyCapResult?.value || '14');
      
      // User doesn't have credits record, return default quota
      return json({
        ok: true,
        dailyCredits: dailyCredits,
        usedCredits: 0,
        remainingCredits: dailyCredits,
        dailyReset: new Date().toISOString().split('T')[0], // Today's date
        message: `New user - starting with ${dailyCredits} daily credits`
      });
    }

    // Get daily cap from database
    const dailyCapResult = await qOne(`SELECT value FROM app_config WHERE key = 'daily_cap'`);
    const dailyCredits = parseInt(dailyCapResult?.value || '14');
    const currentCredits = userCredits.credits || 0;
    const usedCredits = Math.max(0, dailyCredits - currentCredits);
    const remainingCredits = Math.max(0, currentCredits);

    // Calculate next daily reset (assuming reset at midnight UTC)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const quota = {
      daily_limit: dailyCredits,
      daily_used: Math.max(0, usedCredits),
      remaining: Math.max(0, remainingCredits),
      weekly_used: 0, // For compatibility with TokenService
      dailyReset: tomorrow.toISOString(),
      currentBalance: currentCredits, // This should show the actual credits, not the limit (14)
      timestamp: now.toISOString()
    };


    console.log('✅ [Quota] Retrieved quota:', quota);

    return json({
      ok: true,
      ...quota
    });

  } catch (error) {
    console.error('💥 [Quota] Error:', error);
    
    // Handle authentication errors specifically
    if (error instanceof Error && error.message.includes('Missing/invalid Authorization')) {
      return json({ 
        ok: false,
        error: 'Authentication required',
        daily_limit: 14,
        daily_used: 0,
        remaining: 0,
        currentBalance: 0
      }, { status: 401 });
    }
    
    return json({ 
      ok: false,
      error: 'QUOTA_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      daily_limit: 14,
      daily_used: 0,
      remaining: 0,
      currentBalance: 0
    }, { status: 500 });
  }
};
