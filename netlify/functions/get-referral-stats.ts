import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";

// ============================================================================
// VERSION: 7.0 - RAW SQL MIGRATION
// ============================================================================
// This function uses raw SQL queries through the _db helper
// - Replaced neon client with _db helper
// - Uses q, qOne, qCount for database operations
// - Gets referral statistics for users
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { userId } = requireAuth(event.headers.authorization);
    
    console.log('📊 [Referral Stats] Getting stats for user:', userId);

    // Check if user exists (referral system was removed during cleanup)
    const user = await qOne(`
      SELECT id FROM users WHERE id = $1
    `, [userId]);

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Referral system was removed during cleanup - return empty stats
    const stats = {
      referralCode: null,
      totalReferrals: 0,
      totalCreditsEarned: 0,
      recentReferrals: [],
      timestamp: new Date().toISOString(),
      note: 'Referral system has been removed'
    };

    console.log('✅ [Referral Stats] Retrieved stats:', stats);

    return json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('💥 [Referral Stats] Error:', error);
    return json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
