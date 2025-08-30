import { Handler } from '@netlify/functions';
import { q, qOne } from './_db';

export const handler: Handler = async (event) => {
  // Handle CORS
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
    console.log('🔄 [ResetCredits] Starting daily credit reset...');

    // Check current state
    const currentState = await q(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN credits = 30 THEN 1 END) as users_with_30_credits,
        COUNT(CASE WHEN credits < 30 THEN 1 END) as users_needing_reset,
        COUNT(CASE WHEN credits IS NULL THEN 1 END) as users_with_null_credits
      FROM user_credits
    `);

    console.log('📊 [ResetCredits] Current state:', currentState[0]);

    // Reset all users' daily credits to 30
    const resetResult = await q(`
      UPDATE user_credits 
      SET credits = 30, updated_at = NOW()
      WHERE credits < 30 OR credits IS NULL
    `);

    console.log('✅ [ResetCredits] Reset completed for users with insufficient credits');

    // Fix any users with NULL balance
    const balanceFixResult = await q(`
      UPDATE user_credits 
      SET balance = COALESCE(balance, 0), updated_at = NOW()
      WHERE balance IS NULL
    `);

    console.log('✅ [ResetCredits] Balance fixes completed');

    // Log the reset in credits_ledger
    const ledgerResult = await q(`
      INSERT INTO credits_ledger (id, user_id, action, status, reason, amount, env, created_at, updated_at)
      SELECT 
        gen_random_uuid()::text,
        user_id,
        'daily_reset',
        'completed',
        'Daily credit reset to 30',
        30,
        'system',
        NOW(),
        NOW()
      FROM user_credits 
      WHERE credits = 30 AND updated_at::date = CURRENT_DATE
    `);

    console.log('📝 [ResetCredits] Reset logged in credits_ledger');

    // Get final state
    const finalState = await q(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN credits = 30 THEN 1 END) as users_with_30_credits,
        COUNT(CASE WHEN credits < 30 THEN 1 END) as users_still_low,
        COUNT(CASE WHEN balance = 0 THEN 1 END) as users_with_0_balance
      FROM user_credits
    `);

    console.log('📊 [ResetCredits] Final state:', finalState[0]);

    // Show sample users
    const sampleUsers = await q(`
      SELECT user_id, credits, balance, updated_at 
      FROM user_credits 
      ORDER BY updated_at DESC 
      LIMIT 5
    `);

    console.log('👥 [ResetCredits] Sample users after reset:', sampleUsers);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        message: 'Daily credits reset successfully',
        before: currentState[0],
        after: finalState[0],
        sampleUsers,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ [ResetCredits] Reset failed:', error);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'RESET_FAILED',
        message: 'Failed to reset daily credits',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
