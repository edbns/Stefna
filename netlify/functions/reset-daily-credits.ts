import type { Handler } from "@netlify/functions";
import { q } from './_db';
import { json } from './_lib/http';

// ============================================================================
// DAILY CREDIT RESET FUNCTION
// ============================================================================
// This function resets all user credits to 30 daily credits
// Should be called by Netlify scheduled function daily at midnight UTC
// ============================================================================

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
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('🔄 [Daily Reset] Starting daily credit reset...');
    
    // Get the daily cap from app_config
    const dailyCapResult = await qOne(`SELECT value FROM app_config WHERE key = 'daily_cap'`);
    const dailyCap = parseInt(dailyCapResult?.value || '30');
    
    console.log(`📊 [Daily Reset] Using daily cap: ${dailyCap} credits`);
    
    // Reset all user credits to the configured daily cap
    const result = await q(`
      UPDATE user_credits 
      SET credits = $1, updated_at = NOW()
      WHERE user_id IS NOT NULL
      RETURNING user_id, credits
    `, [dailyCap]);
    
    console.log(`✅ [Daily Reset] Reset ${result.length} user credits to ${dailyCap} daily credits`);
    
    return json({
      ok: true,
      message: `Successfully reset ${result.length} user credits to ${dailyCap} daily credits`,
      timestamp: new Date().toISOString(),
      resetCount: result.length,
      dailyCap: dailyCap
    });

  } catch (error) {
    console.error('💥 [Daily Reset] Error:', error);
    return json({ 
      ok: false,
      error: 'RESET_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
