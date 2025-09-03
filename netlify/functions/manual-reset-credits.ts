import type { Handler } from "@netlify/functions";
import { q, qOne } from './_db';
import { json } from './_lib/http';
import { requireAuth } from './_lib/auth';

// ============================================================================
// MANUAL CREDIT RESET FUNCTION (Admin/Testing)
// ============================================================================
// This function allows manual credit reset for testing or admin purposes
// Requires authentication and can reset specific user or all users
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
    // Require authentication
    const { userId } = requireAuth(event.headers.authorization);
    
    const body = event.body ? JSON.parse(event.body) : {};
    const targetUserId = body.userId; // Optional: reset specific user
    const credits = body.credits || null; // Use null to get from config
    
    console.log('🔄 [Manual Reset] Manual credit reset requested:', { 
      adminUserId: userId, 
      targetUserId, 
      credits 
    });
    
    // Get the daily cap from app_config if credits not specified
    let resetCredits = credits;
    if (resetCredits === null) {
      const dailyCapResult = await qOne(`SELECT value FROM app_config WHERE key = 'daily_cap'`);
      resetCredits = parseInt(dailyCapResult?.value || '30');
      console.log(`📊 [Manual Reset] Using daily cap from config: ${resetCredits} credits`);
    }
    
    let result;
    
    if (targetUserId) {
      // Reset specific user
      result = await q(`
        UPDATE user_credits 
        SET credits = $1, updated_at = NOW()
        WHERE user_id = $2
        RETURNING user_id, credits
      `, [resetCredits, targetUserId]);
      
      console.log(`✅ [Manual Reset] Reset user ${targetUserId} to ${resetCredits} credits`);
    } else {
      // Reset all users
      result = await q(`
        UPDATE user_credits 
        SET credits = $1, updated_at = NOW()
        WHERE user_id IS NOT NULL
        RETURNING user_id, credits
      `, [resetCredits]);
      
      console.log(`✅ [Manual Reset] Reset ${result.length} users to ${resetCredits} credits`);
    }
    
    return json({
      ok: true,
      message: targetUserId 
        ? `Successfully reset user ${targetUserId} to ${resetCredits} credits`
        : `Successfully reset ${result.length} users to ${resetCredits} credits`,
      timestamp: new Date().toISOString(),
      resetCount: result.length,
      targetUserId,
      credits: resetCredits
    });

  } catch (error) {
    console.error('💥 [Manual Reset] Error:', error);
    return json({ 
      ok: false,
      error: 'RESET_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
