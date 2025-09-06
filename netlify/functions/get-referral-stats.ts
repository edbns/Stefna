import type { Handler } from "@netlify/functions";
// CACHE BUSTER: 2025-01-20 - Force function cache invalidation
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

    // Get user's referral statistics from referral_attempts table only
    const [referralAttempts, userEmail] = await Promise.all([
      // Count referral attempts (emails sent)
      qOne(`
        SELECT COUNT(*) as total_attempts
        FROM referral_attempts 
        WHERE referrer_id = $1 AND attempt_type = 'email_sent'
      `, [userId]),
      
      // Get user's email for referral identifier
      qOne(`
        SELECT email FROM users WHERE id = $1
      `, [userId])
    ]);

    console.log('📊 [Referral Stats] Raw query results:', {
      userId,
      referralAttempts,
      userEmail
    });

    // Handle potential null/undefined results
    const totalAttempts = referralAttempts?.total_attempts ? parseInt(referralAttempts.total_attempts) : 0;
    const userEmailValue = userEmail?.email || '';

    console.log('📊 [Referral Stats] Processed values:', {
      totalAttempts,
      userEmailValue
    });

    // For now, credits earned = 0 since we don't track successful signups separately
    // This can be updated when we implement proper referral tracking
    const creditsEarned = 0;

    const stats = {
      referralCode: userEmailValue,
      totalReferrals: totalAttempts, // Friends invited (emails sent)
      totalCreditsEarned: creditsEarned, // Credits earned (successful signups)
      recentReferrals: [],
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
