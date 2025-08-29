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

    // Get user's referral code
    const user = await qOne(`
      SELECT referral_code FROM users WHERE id = $1
    `, [userId]);

    if (!user || !user.referral_code) {
      return json({ error: 'User not found or no referral code' }, { status: 404 });
    }

    // Count referrals by this user
    const referralCount = await qCount(`
      SELECT COUNT(*) FROM credits_ledger 
      WHERE reason = 'referral_signup' AND action = 'referral'
      AND user_id IN (
        SELECT id FROM users WHERE referred_by = $1
      )
    `, [user.referral_code]);

    // Get total credits earned from referrals
    const referralCredits = await qOne(`
      SELECT COALESCE(SUM(amount), 0) as total_credits 
      FROM credits_ledger 
      WHERE user_id = $1 AND reason = 'referral_signup' AND action = 'referral'
    `, [userId]);

    // Get recent referrals
    const recentReferrals = await q(`
      SELECT u.email, cl.created_at, cl.amount
      FROM credits_ledger cl
      JOIN users u ON cl.user_id = u.id
      WHERE cl.reason = 'referral_signup' AND cl.action = 'referral'
      AND u.referred_by = $1
      ORDER BY cl.created_at DESC
      LIMIT 10
    `, [user.referral_code]);

    const stats = {
      referralCode: user.referral_code,
      totalReferrals: referralCount,
      totalCreditsEarned: referralCredits?.total_credits || 0,
      recentReferrals: recentReferrals.map(ref => ({
        email: ref.email,
        date: ref.created_at,
        creditsEarned: ref.amount
      })),
      timestamp: new Date().toISOString()
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
