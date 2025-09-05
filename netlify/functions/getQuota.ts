import type { Handler } from "@netlify/functions";
import { requireAuth } from './_lib/auth';
import { qOne, q } from './_db';
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
    const { userId } = requireAuth(event.headers.authorization);
    
    console.log('📊 [Quota] Getting quota for user:', userId);

    // Check if daily reset is needed and perform it
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get last reset date from app_config
    const lastResetResult = await qOne(`
      SELECT value FROM app_config WHERE key = 'last_credit_reset'
    `);
    
    const lastResetDate = lastResetResult?.value || '1970-01-01';
    
    // If it's a new day, reset credits
    if (currentDate > lastResetDate) {
      console.log(`🔄 [Quota] Daily reset needed: ${lastResetDate} -> ${currentDate}`);
      
      // Get daily cap from app_config
      const dailyCapResult = await qOne(`
        SELECT value FROM app_config WHERE key = 'daily_cap'
      `);
      const dailyCap = parseInt(dailyCapResult?.value || '30');
      
      // Reset all user credits
      const resetResult = await q(`
        UPDATE user_credits 
        SET credits = $1, updated_at = NOW()
        WHERE user_id IS NOT NULL
        RETURNING user_id
      `, [dailyCap]);
      
      // Update last reset date
      await q(`
        INSERT INTO app_config (key, value)
        VALUES ('last_credit_reset', $1)
        ON CONFLICT (key) DO UPDATE SET 
          value = $1
      `, [currentDate]);
      
      console.log(`✅ [Quota] Daily reset completed: ${resetResult.length} users reset to ${dailyCap} credits`);
    }

    // Get user's current credit balance
    const userCredits = await qOne(`
      SELECT credits, balance FROM user_credits WHERE user_id = $1
    `, [userId]);

    if (!userCredits) {
      // User doesn't have credits record, return default quota
      return json({
        ok: true,
        dailyCredits: 30,
        usedCredits: 0,
        remainingCredits: 30,
        dailyReset: new Date().toISOString().split('T')[0], // Today's date
        message: 'New user - starting with 30 daily credits'
      });
    }

    const currentCredits = userCredits.credits || 0;
    const dailyCredits = 30; // Daily credit limit
    const usedCredits = dailyCredits - currentCredits;
    const remainingCredits = currentCredits;

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
      currentBalance: currentCredits, // This should show the actual credits (28), not the limit (30)
      timestamp: now.toISOString()
    };

    console.log('✅ [Quota] Retrieved quota:', quota);

    return json({
      ok: true,
      ...quota
    });

  } catch (error) {
    console.error('💥 [Quota] Error:', error);
    return json({ 
      ok: false,
      error: 'QUOTA_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
