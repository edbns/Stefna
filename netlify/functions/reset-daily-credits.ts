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
    
    // Reset all user credits to 30 daily credits
    const result = await q(`
      UPDATE user_credits 
      SET credits = 30, updated_at = NOW()
      WHERE user_id IS NOT NULL
    `);
    
    console.log(`✅ [Daily Reset] Reset ${result.rowCount} user credits to 30 daily credits`);
    
    return json({
      ok: true,
      message: `Successfully reset ${result.rowCount} user credits to 30 daily credits`,
      timestamp: new Date().toISOString(),
      resetCount: result.rowCount
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
